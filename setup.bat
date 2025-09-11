@echo off
echo Setting up Prime Arabia CRM...
echo.

REM Check if backend\.env exists
if not exist backend\.env (
    echo Creating backend\.env from example...
    copy backend\.env.example backend\.env
    echo backend\.env created. Please update it with your settings if needed.
) else (
    echo backend\.env already exists
)

REM Check if dashboard\.env exists
if not exist dashboard\.env (
    echo Creating dashboard\.env...
    (
        echo # Development
        echo VITE_API_URL=http://localhost:6370
        echo VITE_API_BASE_URL=http://localhost:6370/api
        echo.
        echo # App Configuration
        echo VITE_APP_NAME=Prime Arabia CRM
        echo VITE_APP_ENV=development
    ) > dashboard\.env
    echo dashboard\.env created
) else (
    echo dashboard\.env already exists
)

echo.
echo Starting Docker containers...
docker-compose up -d --build

echo.
timeout /t 10 /nobreak > nul
echo.
echo Setup complete!
echo.
echo Access URLs:
echo    Frontend: http://localhost:6371
echo    Backend API: http://localhost:6370
echo    Admin Panel: http://localhost:6370/admin/
echo.
echo Default Admin Credentials:
echo    Username: admin
echo    Password: admin123
echo.
echo To view logs: docker-compose logs -f
pause