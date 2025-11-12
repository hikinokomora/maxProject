# MAX Chatbot (Bot-only)

Чат-бот для университета в MAX мессенджере: расписание, мероприятия, подача заявлений, профиль и аутентификация (JWT). Мини‑приложение и веб‑интерфейс удалены — проект полностью сосредоточен на боте и API.

## Быстрый старт

### Docker (с PostgreSQL)

```powershell
# 1) Запустите Docker Desktop
# 2) Запустите проект:
.\start-docker.ps1

# Сервисы работают ТОЛЬКО внутри docker-сети (порты наружу не публикуются)
# Обращайтесь к API изнутри сети Docker, например:
#   docker run --rm --network maxproject_app-network curlimages/curl:8.11.0 -s http://backend:5000/health
# Бот подключится автоматически при наличии BOT_TOKEN
```

### Локальная разработка (PostgreSQL)

```powershell
npm run install:all   # Установка зависимостей (только server)
# Создайте server/.env (см. ниже) с Postgres DSN
npm run dev           # Запуск backend с hot-reload (порт 5000)
```

## Настройка

Создайте `server/.env`:

```env
PORT=5000
BOT_TOKEN=your-max-bot-token
DATABASE_URL="postgresql://postgres:postgres@db:5432/maxchatbot?schema=public"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN=7d
ADMIN_EMAIL="admin@university.edu"
ADMIN_PASSWORD="admin123"
```

## Структура

- server/ — Express API + MAX Bot (порт 5000)

## Технологии

Backend: Node.js, Express, Prisma
Auth: JWT + bcrypt
Deploy: Docker (backend-only)

## Полезные команды

```powershell
# Разработка
npm run dev:server       # backend с hot-reload

# Docker
.\start-docker.ps1       # запуск
.\stop-docker.ps1        # остановка
docker-compose logs -f   # логи

# Взаимодействие с API внутри сети Docker
docker-compose exec backend wget -qO- http://localhost:5000/health
docker run --rm --network maxproject_app-network curlimages/curl:8.11.0 -s http://backend:5000/api/events

# База данных
cd server
npx prisma studio        # GUI для БД
npx prisma db push       # Применить схему
```

## Лицензия

MIT

---

См. также: SECURITY.md — роли и уровни доступа (RBAC)
