# MAX Chatbot

Веб-приложение для университета: личный кабинет студента, подача заявлений, интеграция с MAX мессенджером.

##  Быстрый старт

### Docker

```powershell
# 1. Запустите Docker Desktop
# 2. Запустите проект:
.\start-docker.ps1

# 3. Откройте http://localhost:3000
# Логин: admin@university.edu  
# Пароль: admin123
```

### Локальная разработка

```powershell
npm run install:all      # Установка зависимостей
# Создайте server/.env (см. ниже)
npm run dev              # Запуск (порты 3000 и 5000)
```

##  Настройка

Создайте server/.env:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
ADMIN_EMAIL="admin@university.edu"
ADMIN_PASSWORD="admin123"
```

##  Структура

- client/ - React приложение (порт 3000)
- server/ - Express API (порт 5000)

##  Технологии

**Frontend:** React 18, React Router  
**Backend:** Node.js, Express, Prisma  
**Auth:** JWT + bcrypt  
**Deploy:** Docker

##  Основные команды

```powershell
# Разработка
npm run dev              # Frontend + Backend
npm run dev:client       # Только frontend
npm run dev:server       # Только backend

# Docker
.\start-docker.ps1       # Запуск
.\stop-docker.ps1        # Остановка  
docker-compose logs -f   # Просмотр логов

# База данных
cd server
npx prisma studio        # GUI для БД
npx prisma db push       # Применить схему
```

##  Лицензия

MIT

---

 Разработано для цифровизации образования
