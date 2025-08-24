# GALA Event Management System

A comprehensive event management system built with Django REST Framework.

## Project Overview

GALA is a powerful event management platform designed to handle event organization, ticket management, notifications, and event analytics.

## Features

- **Agenda Management**: Schedule and manage event timelines
- **Ticket System**: Handle ticket sales, generation, and validation
- **Notifications**: Real-time updates and communication system
- **Dashboard**: Analytics and management interface

## Tech Stack

- Python 3.x
- Django 4.2.7
- Django REST Framework 3.14.0
- Celery 5.3.4
- Redis 5.0.1
- PostgreSQL (via psycopg2-binary)

## Project Structure

```
gala_event/
├── agenda/          # Event scheduling and timeline management
├── tickets/         # Ticket management system
├── notifications/   # Real-time notification system
├── dashboard/       # Analytics and admin interface
└── gala_event/     # Main project settings
```

## Setup

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv gala_env
   source gala_env/bin/activate  # On Windows: gala_env\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   - Create a `.env` file in the gala_event/gala_event directory
   - Add necessary environment variables (see `.env.example`)

5. Run migrations:
   ```bash
   python manage.py migrate
   ```

6. Start the development server:
   ```bash
   python manage.py runserver
   ```

## Environment Variables

Required environment variables:
- `DEBUG`: Set to True for development
- `SECRET_KEY`: Django secret key
- `DATABASE_URL`: Database connection URL
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts

## API Endpoints

Documentation for API endpoints coming soon...

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
