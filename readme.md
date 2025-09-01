# 🎉 GALA Event Management System

<div align="center">

![Django](https://img.shields.io/badge/Django-4.2.7-092E20?style=for-the-badge&logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/DRF-3.14.0-ff1709?style=for-the-badge&logo=django&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Celery](https://img.shields.io/badge/Celery-37B24D?style=for-the-badge&logo=celery&logoColor=white)

</div>

A comprehensive, enterprise-grade event management system built with Django REST Framework. GALA streamlines the entire event lifecycle from participant registration to post-event analytics.

---

## ✨ Features

### 🔐 **User Management & Authentication**
- **Multi-role System**: HR Admins and Participants with distinct permissions
- **JWT Authentication**: Secure token-based authentication
- **Custom User Model**: Extended user profiles with department and employee ID

### 👥 **Participant Management**
- **Registration System**: Student and Professional participant types
- **Approval Workflow**: HR Admin approval process with status tracking
- **Profile Management**: CV uploads, LinkedIn integration, university details
- **Payment Integration**: Multiple registration types (VIP, Regular, Student)

### 🏢 **Company Integration**
- **Company Profiles**: Detailed company information and branding
- **Hiring Positions**: JSON-based position listings
- **Contact Management**: Company representatives and contact details
- **Logo Management**: Company branding support

### 🎫 **Advanced Ticketing System**
- **QR Code Generation**: Automatic QR code creation for each ticket
- **Payment Tracking**: Comprehensive payment status management
- **Ticket Validation**: Check-in system with status updates
- **UUID-based Security**: Unique ticket codes for enhanced security

### 📅 **Event Agenda Management**
- **Speaker Profiles**: Detailed speaker information with photos
- **Session Scheduling**: Time-based agenda with venue management
- **Registration Tracking**: Session-specific attendance tracking
- **Multi-speaker Support**: Many-to-many speaker relationships

### 📧 **Notification System**
- **Email Templates**: Customizable email templates for different scenarios
- **Email Logging**: Complete email delivery tracking
- **In-app Notifications**: Real-time notifications for HR Admins
- **Template Variables**: Dynamic content injection

### 📊 **Dashboard & Analytics**
- **Real-time Metrics**: Participant statistics and event analytics
- **Payment Tracking**: Financial overview and payment status
- **Attendance Reports**: Session attendance and engagement metrics

---

## 🏗️ Architecture

```
gala_event/
├── 📁 accounts/         # User authentication & role management
│   ├── models.py        # CustomUser with HR/Participant roles
│   ├── views.py         # Authentication endpoints
│   └── permissions.py   # Role-based access control
├── 📁 participants/     # Participant lifecycle management
│   ├── models.py        # Participant, Company, Ticket models
│   └── views.py         # Registration & approval workflows
├── 📁 companies/        # Company management system
│   ├── models.py        # Company profiles & hiring positions
│   └── views.py         # Company CRUD operations
├── 📁 agenda/           # Event scheduling system
│   ├── models.py        # Speaker, Agenda, Registration models
│   └── views.py         # Schedule management
├── 📁 notifications/    # Communication system
│   ├── models.py        # EmailTemplate, EmailLog, Notification
│   └── views.py         # Email & notification management
├── 📁 dashboard/        # Analytics & reporting
└── 📁 tickets/          # Ticket management system
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- PostgreSQL 12+
- Redis 6+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GALA_backend
   ```

2. **Set up virtual environment**
   ```bash
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # macOS/Linux
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment configuration**
   ```bash
   # Create .env file in gala_event/gala_event/
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Database setup**
   ```bash
   cd gala_event
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. **Start services**
   ```bash
   # Terminal 1: Django server
   python manage.py runserver
   
   # Terminal 2: Celery worker (optional)
   celery -A gala_event worker --loglevel=info
   
   # Terminal 3: Redis server
   redis-server
   ```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in `gala_event/gala_event/` with:

```env
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gala_db

# Redis (for Celery)
REDIS_URL=redis://localhost:6379/0

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# File Storage
MEDIA_URL=/media/
MEDIA_ROOT=media/
```

---

## 📡 API Documentation

The API is fully documented with Swagger/OpenAPI:

- **Swagger UI**: `http://localhost:8000/swagger/`
- **ReDoc**: `http://localhost:8000/redoc/`
- **JSON Schema**: `http://localhost:8000/swagger.json`

### Key Endpoints

| Endpoint | Description | Authentication |
|----------|-------------|----------------|
| `POST /api/accounts/register/` | User registration | Public |
| `POST /api/accounts/login/` | User authentication | Public |
| `GET /api/participants/` | List participants | HR Admin |
| `POST /api/participants/approve/{id}/` | Approve participant | HR Admin |
| `GET /api/tickets/` | List tickets | Authenticated |
| `POST /api/tickets/validate/` | Validate ticket QR | HR Admin |
| `GET /api/agenda/` | Event schedule | Public |
| `GET /api/companies/` | Company listings | Public |

---

## 🛠️ Tech Stack

### Backend Framework
- **Django 4.2.7**: Robust web framework
- **Django REST Framework 3.14.0**: API development
- **Django CORS Headers**: Cross-origin resource sharing

### Authentication & Security
- **SimpleJWT 5.3.0**: JWT token authentication
- **Django Environ**: Environment variable management

### Database & Caching
- **PostgreSQL**: Primary database (via psycopg2-binary)
- **Redis 5.0.1**: Caching and message broker

### Task Processing
- **Celery 5.3.4**: Asynchronous task processing
- **Redis**: Message broker for Celery

### File Handling & QR Codes
- **Pillow**: Image processing
- **QRCode**: QR code generation for tickets

### API Documentation
- **drf-yasg**: Swagger/OpenAPI documentation

### Utilities
- **Django Filter**: Advanced filtering
- **WhiteNoise**: Static file serving

---

## 🔒 Security Features

- **Role-based Access Control**: HR Admin vs Participant permissions
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Comprehensive data validation
- **CORS Configuration**: Secure cross-origin requests
- **File Upload Security**: Secure file handling for CVs and images

---

## 📈 Performance Optimizations

- **Database Indexing**: Optimized queries with proper indexing
- **Caching Strategy**: Redis-based caching for frequent queries
- **Async Processing**: Celery for email sending and heavy tasks
- **Static File Optimization**: WhiteNoise for efficient static serving

---

## 🧪 Testing

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test accounts
python manage.py test participants

# Coverage report
coverage run --source='.' manage.py test
coverage report
```

---

## 📦 Deployment

### Production Checklist
- [ ] Set `DEBUG=False`
- [ ] Configure production database
- [ ] Set up Redis cluster
- [ ] Configure email service
- [ ] Set up file storage (AWS S3/CloudFlare)
- [ ] Configure domain and SSL
- [ ] Set up monitoring and logging

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Run migrations
docker-compose exec web python manage.py migrate
```

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow PEP 8 style guidelines
- Write comprehensive tests
- Update documentation
- Use meaningful commit messages

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Med Amine Ouldkhaoua**
- Email: ouldkhaoua.pro@gmail.com
- GitHub: [@med-amine-ok](https://github.com/med-amine-ok)

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ for the GALA community

</div>
