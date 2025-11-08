# Docker запуск MAX Chatbot приложения
# Запуск: .\docker-start.ps1

Write-Host "🚀 Запуск MAX Chatbot приложения в Docker..." -ForegroundColor Cyan

# Проверяем наличие .env файла
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Файл .env не найден. Создаем из примера..." -ForegroundColor Yellow
    
    @"
# MAX Bot Configuration
BOT_TOKEN=your_bot_token_here

# Server Configuration
PORT=5000
NODE_ENV=production

# Frontend URL
MINI_APP_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Admin User (создается автоматически)
ADMIN_EMAIL=admin@university.edu
ADMIN_NAME=System Administrator
ADMIN_PASSWORD=changeme123
"@ | Out-File -FilePath ".env" -Encoding UTF8
    
    Write-Host "✅ Файл .env создан. Пожалуйста, укажите ваш BOT_TOKEN!" -ForegroundColor Green
    Write-Host ""
    notepad .env
    exit
}

Write-Host ""
Write-Host "📦 Остановка существующих контейнеров..." -ForegroundColor Yellow
docker-compose down

Write-Host ""
Write-Host "🔨 Сборка образов (это может занять несколько минут)..." -ForegroundColor Yellow
docker-compose build

Write-Host ""
Write-Host "🚀 Запуск контейнеров..." -ForegroundColor Yellow
docker-compose up -d

Write-Host ""
Write-Host "✅ Приложение запущено!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Доступ к приложению:" -ForegroundColor Cyan
Write-Host "   Frontend (React): http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API:      http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "📊 Просмотр логов:" -ForegroundColor Cyan
Write-Host "   docker-compose logs -f" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Остановка приложения:" -ForegroundColor Cyan
Write-Host "   docker-compose down" -ForegroundColor White
Write-Host ""

# Показываем логи
Write-Host "📋 Показываем логи (Ctrl+C для выхода)..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
docker-compose logs -f
