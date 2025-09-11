# Prime Arabia CRM

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git

### Setup & Run

#### Option 1: Automated Setup (Recommended)

**Linux/Mac:**
```bash
git clone <repository-url>
cd prime
chmod +x setup.sh
./setup.sh
```

**Windows:**
```bash
git clone <repository-url>
cd prime
setup.bat
```

#### Option 2: Manual Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd prime
```

2. **Create environment files:**
```bash
# Copy and configure backend environment
cp backend/.env.example backend/.env

# Dashboard .env is already configured
```

3. **Start Docker containers:**
```bash
docker-compose up -d --build
```

## 📌 Access URLs

- **Frontend:** http://localhost:6371
- **Backend API:** http://localhost:6370
- **Admin Panel:** http://localhost:6370/admin/

## 🔐 Default Credentials

- **Username:** admin
- **Password:** admin123

## 🛠️ Common Commands

```bash
# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Restart containers
docker-compose restart

# Rebuild and restart
docker-compose up -d --build

# Access backend shell
docker exec -it prime_backend bash

# Access MySQL
docker exec -it mysql_primedb mysql -u root -prootpassword
```

## 🌐 Production Deployment

For production deployment:

1. Update `backend/.env`:
   - Set `DEBUG=False`
   - Change `SECRET_KEY`
   - Update database credentials
   - Configure email settings

2. Use `dashboard/.env.production` for frontend

3. Update CORS and ALLOWED_HOSTS in backend settings

## 📦 Services

- **Backend:** Django REST API (Port 6370)
- **Frontend:** React/Vite Dashboard (Port 6371)
- **Database:** MySQL 8.0

## 🔧 Troubleshooting

**If containers don't start:**
```bash
docker-compose down
docker-compose up -d --build
```

**If MySQL keeps restarting:**
Check if the password in `docker-compose.yaml` matches `backend/.env`

**If static files don't load:**
Backend container will automatically collect static files on startup

## 📝 Environment Variables

See `backend/.env.example` for all available configuration options.