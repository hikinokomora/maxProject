# Быстрый старт с PostgreSQL и JWT

## 1. Установка PostgreSQL

### Windows (Scoop/Chocolatey)
```powershell
scoop install postgresql
# или
choco install postgresql
```

### Или скачайте установщик
https://www.postgresql.org/download/windows/

## 2. Запуск PostgreSQL

```powershell
# Проверка статуса
pg_ctl status

# Если не запущен:
pg_ctl start
```

## 3. Создание базы данных

```powershell
# Подключитесь к PostgreSQL
psql -U postgres

# В psql консоли:
CREATE DATABASE maxchatbot;
\q
```

## 4. Настройка .env

Обновите `server/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/maxchatbot

JWT_SECRET=my-super-secret-key-change-this
JWT_EXPIRES_IN=7d

ADMIN_EMAIL=admin@university.edu
ADMIN_NAME=Admin User
ADMIN_PASSWORD=admin123
```

**⚠️ Важно:** Измените пароль PostgreSQL если необходимо!

## 5. Установка зависимостей

```powershell
cd server
npm install
```

## 6. Применение схемы БД

```powershell
npx prisma generate
npx prisma db push
```

## 7. Запуск сервера

```powershell
npm start
```

При первом запуске автоматически создастся admin пользователь.

## 8. Тест API

### Вход как admin

```powershell
$body = @{
    email = "admin@university.edu"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

$token = $response.token
Write-Host "Token: $token"
```

### Создание студента

```powershell
$studentBody = @{
    email = "student@university.edu"
    password = "student123"
    name = "Иван Иванов"
    role = "STUDENT"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
    -Method POST `
    -Body $studentBody `
    -ContentType "application/json"
```

### Просмотр всех заявлений (от имени admin)

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/applications" `
    -Headers @{ Authorization = "Bearer $token" }
```

## ✅ Готово!

Теперь система использует:
- ✅ PostgreSQL для хранения данных
- ✅ JWT токены для аутентификации
- ✅ Реальные имена студентов в заявлениях
- ✅ Разграничение доступа по ролям

**Следующие шаги:**
1. Смените пароль admin через API
2. Зарегистрируйте тестовых пользователей
3. Проверьте бота в MAX мессенджере
4. Настройте фронтенд для работы с новым API

**Документация:**
- Полная инструкция: `MIGRATION_GUIDE.md`
- API примеры: см. раздел "Тестирование" в MIGRATION_GUIDE.md
