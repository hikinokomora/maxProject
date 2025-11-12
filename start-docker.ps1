# Скрипт для запуска проекта в Docker
Write-Host "🚀 Запуск MAX Chatbot в Docker..." -ForegroundColor Cyan

# Проверка Docker
Write-Host "`n📋 Проверка Docker..." -ForegroundColor Yellow
$dockerRunning = $false
try {
    docker ps *>$null
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
        Write-Host "✅ Docker запущен" -ForegroundColor Green
    }
} catch {}

if (-not $dockerRunning) {
    Write-Host "❌ Docker не запущен" -ForegroundColor Red
    Write-Host "`n🔧 Попытка запуска Docker Desktop..." -ForegroundColor Yellow
    
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process $dockerPath
        Write-Host "⏳ Ожидание запуска Docker Desktop (это может занять до 1 минуты)..." -ForegroundColor Yellow
        
        for ($i = 1; $i -le 60; $i++) {
            Start-Sleep -Seconds 1
            try {
                docker ps *>$null
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Docker успешно запущен!" -ForegroundColor Green
                    $dockerRunning = $true
                    break
                }
            } catch {}
            
            if ($i % 10 -eq 0) {
                Write-Host "   Ожидание... $i/60 секунд" -ForegroundColor Gray
            }
        }
    }
    
    if (-not $dockerRunning) {
        Write-Host "`n❌ Не удалось запустить Docker Desktop автоматически" -ForegroundColor Red
        Write-Host "Пожалуйста, запустите Docker Desktop вручную и запустите этот скрипт снова" -ForegroundColor Yellow
        exit 1
    }
}

# Остановка существующих контейнеров
Write-Host "`n🛑 Остановка существующих контейнеров..." -ForegroundColor Yellow
docker-compose down

# Сборка и запуск
Write-Host "`n🏗️  Сборка образов Docker (это может занять несколько минут)..." -ForegroundColor Yellow
docker-compose build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Ошибка при сборке образов" -ForegroundColor Red
    Write-Host "Проверьте логи выше для деталей" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🚀 Запуск контейнеров..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Ошибка при запуске контейнеров" -ForegroundColor Red
    Write-Host "Проверьте логи: docker-compose logs" -ForegroundColor Yellow
    exit 1
}

# Ожидание запуска сервисов
Write-Host "`n⏳ Ожидание запуска сервисов..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Проверка статуса
Write-Host "`n📊 Статус контейнеров:" -ForegroundColor Yellow
docker-compose ps

Write-Host "`n✅ Проект успешно запущен!" -ForegroundColor Green
Write-Host "� API доступен по адресу: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🤖 Бот подключится автоматически при наличии BOT_TOKEN" -ForegroundColor Cyan
Write-Host "`n📝 Полезные команды:" -ForegroundColor Yellow
Write-Host "   • Просмотр логов:        docker-compose logs -f" -ForegroundColor Gray
Write-Host "   • Просмотр логов backend: docker-compose logs -f backend" -ForegroundColor Gray
Write-Host "   • Остановка:             docker-compose down" -ForegroundColor Gray
Write-Host "   • Или используйте:       .\stop-docker.ps1" -ForegroundColor Gray
Write-Host "" 

