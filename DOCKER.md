# 🐳 Docker Deployment Guide

## Быстрый старт

### 1. Запустите Docker Desktop
Убедитесь, что Docker Desktop запущен и работает.

### 2. Запустите проект
```powershell
.\start-docker.ps1
```

Скрипт автоматически:
- ✅ Проверит Docker
- ✅ Попытается запустить Docker Desktop (если не запущен)
- ✅ Соберет образы
- ✅ Запустит контейнеры
- ✅ Покажет статус

### 3. Откройте приложение
- **Веб-приложение**: http://localhost:3000
- **API**: http://localhost:5000

---

## Управление контейнерами

### Просмотр логов
```powershell
# Все сервисы
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только frontend
docker-compose logs -f frontend
```

### Остановка
```powershell
# Используйте скрипт
.\stop-docker.ps1

# Или вручную
docker-compose down
```

### Перезапуск
```powershell
# Быстрый перезапуск
docker-compose restart

# Полный перезапуск с пересборкой
.\start-docker.ps1
```

### Проверка статуса
```powershell
docker-compose ps
```

---

## Структура Docker

### Сервисы
- **backend** - Express сервер на порту 5000
- **frontend** - React приложение с Nginx на порту 3000

### Образы
- `Dockerfile.backend` - Node.js 18 Alpine + Prisma
- `Dockerfile.frontend` - Multi-stage build (Node.js → Nginx)

### Volumes
- `backend-data` - Хранение базы данных SQLite

### Сеть
- `app-network` - Bridge сеть для связи между контейнерами

---

## Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# MAX Bot Configuration
BOT_TOKEN=your_max_bot_token_here
MINI_APP_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Admin User
ADMIN_EMAIL=admin@university.edu
ADMIN_NAME=System Administrator
ADMIN_PASSWORD=admin123
```

---

## Решение проблем

### Docker не запускается
```powershell
# Проверьте статус Docker
docker --version
docker ps

# Запустите Docker Desktop вручную
# Пуск → Docker Desktop
```

### Ошибка сборки
```powershell
# Очистите кэш и пересоберите
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Порты заняты
```powershell
# Проверьте, какие процессы используют порты
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Остановите процессы или измените порты в docker-compose.yml
```

### Просмотр детальных логов
```powershell
# Backend логи
docker-compose logs backend --tail=100

# Frontend логи
docker-compose logs frontend --tail=100

# Логи сборки
docker-compose build backend 2>&1 | Tee-Object -FilePath build.log
```

---

## Production Deployment

### Изменения для production:

1. **Обновите .env файл**
   - Смените `JWT_SECRET` на случайную строку
   - Смените `ADMIN_PASSWORD`
   - Установите реальный `BOT_TOKEN`

2. **Настройте домен**
   ```yaml
   # docker-compose.yml
   environment:
     - MINI_APP_URL=https://yourdomain.com
   ```

3. **Добавьте SSL/TLS**
   - Используйте reverse proxy (Nginx, Traefik)
   - Настройте Let's Encrypt для HTTPS

4. **Увеличьте ресурсы**
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2'
         memory: 2G
   ```

5. **Настройте мониторинг**
   - Добавьте Prometheus + Grafana
   - Настройте алерты

---

## Дополнительные команды

### Очистка
```powershell
# Удалить все контейнеры, образы, volumes
docker-compose down -v
docker system prune -a
```

### Обновление
```powershell
# Пересобрать и перезапустить
docker-compose up -d --build
```

### Вход в контейнер
```powershell
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh
```

### Экспорт/Импорт базы данных
```powershell
# Экспорт
docker-compose exec backend sh -c "cat /app/server/prisma/dev.db" > backup.db

# Импорт
cat backup.db | docker-compose exec -T backend sh -c "cat > /app/server/prisma/dev.db"
```
