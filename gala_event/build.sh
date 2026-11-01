#!/usr/bin/env bash
# Exit on error
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
# Fail the deploy if a model change was committed without its migration
python manage.py makemigrations --check --dry-run
python manage.py migrate
