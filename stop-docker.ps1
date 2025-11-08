# Скрипт для остановки Docker контейнеров
Write-Host "🛑 Остановка MAX Chatbot..." -ForegroundColor Yellow

docker-compose down

Write-Host "✅ Контейнеры остановлены" -ForegroundColor Green
