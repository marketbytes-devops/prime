#!/bin/bash

echo "🚀 Setting up Prime Arabia CRM..."

# Check if backend/.env exists
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env from example..."
    cp backend/.env.example backend/.env
    echo "✅ backend/.env created. Please update it with your settings if needed."
else
    echo "✅ backend/.env already exists"
fi

# Check if dashboard/.env exists
if [ ! -f dashboard/.env ]; then
    echo "📝 Creating dashboard/.env..."
    cat > dashboard/.env << EOF
# Development
VITE_API_URL=http://localhost:6370
VITE_API_BASE_URL=http://localhost:6370/api

# App Configuration
VITE_APP_NAME=Prime Arabia CRM
VITE_APP_ENV=development
EOF
    echo "✅ dashboard/.env created"
else
    echo "✅ dashboard/.env already exists"
fi

echo ""
echo "🐳 Starting Docker containers..."
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "✅ Setup complete!"
echo ""
echo "📌 Access URLs:"
echo "   Frontend: http://localhost:6371"
echo "   Backend API: http://localhost:6370"
echo "   Admin Panel: http://localhost:6370/admin/"
echo ""
echo "🔐 Default Admin Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📝 To view logs: docker-compose logs -f"