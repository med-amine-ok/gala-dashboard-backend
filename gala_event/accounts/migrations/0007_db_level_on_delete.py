"""
Make the database itself follow each foreign key's on_delete.

Django runs CASCADE / SET_NULL in Python, so the PostgreSQL constraints it
creates have no ON DELETE rule: deleting through Django removes a user's
participant profile, ticket, etc., but a plain SQL `DELETE FROM
accounts_customuser ...` (pgAdmin, DBeaver, Neon/Supabase console...) fails
with a foreign key violation.

This migration recreates every foreign key constraint with the rule its model
declares (CASCADE -> ON DELETE CASCADE, SET_NULL -> ON DELETE SET NULL), so a
row deleted in SQL takes everything that depends on it along, exactly as in the
admin. PROTECT / RESTRICT / DO_NOTHING keys are left as they are.
SQLite (local dev) is untouched.

Note: if a later migration alters one of these fields, Django recreates its
constraint without the ON DELETE rule; run `python manage.py migrate accounts
0006` then `migrate` again (or add a similar migration) to restore it.
"""

from django.db import migrations, models

RULES = {
    models.CASCADE: "CASCADE",
    models.SET_NULL: "SET NULL",
}


def _foreign_keys(apps):
    for model in apps.get_models(include_auto_created=True):
        meta = model._meta
        if not meta.managed or meta.proxy:
            continue
        for field in meta.local_fields:
            if not field.is_relation or not (field.many_to_one or field.one_to_one):
                continue
            if not field.remote_field or not field.db_constraint:
                continue
            yield model, field


def _apply(apps, schema_editor, restore=False):
    if schema_editor.connection.vendor != "postgresql":
        return
    qn = schema_editor.quote_name
    with schema_editor.connection.cursor() as cursor:
        for model, field in _foreign_keys(apps):
            rule = RULES.get(field.remote_field.on_delete)
            if rule is None:
                continue
            table = model._meta.db_table
            column = field.column
            target = field.remote_field.model._meta.db_table
            target_column = field.target_field.column
            cursor.execute(
                """
                SELECT c.conname
                FROM pg_constraint c
                JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
                WHERE c.contype = 'f'
                  AND c.conrelid = to_regclass(%s)
                  AND array_length(c.conkey, 1) = 1
                  AND a.attname = %s
                """,
                [qn(table), column],
            )
            for (name,) in cursor.fetchall():
                on_delete = "" if restore else f" ON DELETE {rule}"
                cursor.execute(
                    f"ALTER TABLE {qn(table)} DROP CONSTRAINT {qn(name)}, "
                    f"ADD CONSTRAINT {qn(name)} FOREIGN KEY ({qn(column)}) "
                    f"REFERENCES {qn(target)} ({qn(target_column)}){on_delete} "
                    f"DEFERRABLE INITIALLY DEFERRED"
                )


def forwards(apps, schema_editor):
    _apply(apps, schema_editor)


def backwards(apps, schema_editor):
    _apply(apps, schema_editor, restore=True)


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0006_alter_customuser_managers_activationcode"),
        ("agenda", "0005_agendaregistration_participant"),
        ("companies", "0005_alter_company_logo"),
        ("notifications", "0003_alter_emailtemplate_template_type"),
        ("participants", "0017_participant_current_year_participant_public_token_and_more"),
        ("tickets", "0007_payments_chargily_checkout_id"),
        ("admin", "__latest__"),
        ("auth", "__latest__"),
        ("token_blacklist", "__latest__"),
    ]

    operations = [migrations.RunPython(forwards, backwards)]
