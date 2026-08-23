# 🎉 GALA Event Management System & Dashboard

Welcome to the GALA Event Management Control Panel. This repository contains a production-grade admin dashboard client and its backing Django REST Framework service.

---

## 🏗️ Project Architecture
- **Backend**: Django REST Framework (DRF) + SQLite database + SimpleJWT Auth. Exposes CRUD APIs, check-in stations, and participant approval flows.
- **Frontend**: Next.js App Router (React 19) + Tailwind CSS v4 + TanStack Query + Toasts. Refined visual system styled for high-end hospitality.

---

## 🚀 Quick Start Instructions

### Phase 1: Run the Backend (Django REST Framework)
1. Navigate to the backend directory:
   ```bash
   cd gala_event
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations and create the first HR Admin user account:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```
   *Note: Ensure the superuser has role `HR` assigned or created as an HR admin.*
5. Boot up the Django server:
   ```bash
   python manage.py runserver
   ```
   The backend API will be available at `http://localhost:8000`.

---

### Phase 2: Run the Frontend (Next.js Control Panel)
1. Navigate to the frontend directory:
   ```bash
   cd gala-dashboard
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Set up the local environment variables. Create a `.env.local` file containing:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```
4. Boot up the local Next.js development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser. You will be redirected to the control panel login screen.
5. Sign in using the HR Admin credentials created in the step above.
