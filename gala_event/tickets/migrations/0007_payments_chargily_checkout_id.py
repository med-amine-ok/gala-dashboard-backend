"""
The `payments` table belongs to the landing site (gala-landing, Drizzle) but
lives in this database. The landing site now stores the Chargily checkout id
so it can verify one checkout directly instead of scanning the latest ones.

Only touches the table when it exists (production); a no-op on local/test DBs.
"""
from django.db import migrations


def add_checkout_column(apps, schema_editor):
    connection = schema_editor.connection
    if connection.vendor != 'postgresql':
        return
    if 'payments' not in connection.introspection.table_names():
        return
    with connection.cursor() as cursor:
        cursor.execute(
            'ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "chargily_checkout_id" varchar(64)'
        )


class Migration(migrations.Migration):

    dependencies = [
        ("tickets", "0006_alter_ticket_serial_number_and_more"),
    ]

    operations = [
        migrations.RunPython(add_checkout_column, migrations.RunPython.noop),
    ]
