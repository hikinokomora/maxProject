# Миграция на PostgreSQL и JWT аутентификацию

## Обзор изменений

Система была обновлена для использования:
- **PostgreSQL** вместо SQLite для production-ready базы данных
- **JWT токены** для полноценной аутентификации
- **Привязка заявлений к пользователям** с реальными именами
- **Разграничение доступа** для студентов и преподавателей

---

## 🔄 Шаги миграции

### 1. Установка PostgreSQL

**Windows:**
```powershell
# Скачайте установщик с https://www.postgresql.org/download/windows/
# Или используйте Chocolatey:
choco install postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Создание базы данных

```bash
# Войдите в PostgreSQL
psql -U postgres

# Создайте базу данных
CREATE DATABASE maxchatbot;

# Создайте пользователя (опционально)
CREATE USER maxbot WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE maxchatbot TO maxbot;

# Выйдите
\q
```

### 3. Настройка переменных окружения

Обновите файл `server/.env`:

```env
# PostgreSQL подключение
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/maxchatbot

# JWT настройки
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Админ пользователь (создается автоматически при первом запуске)
ADMIN_EMAIL=admin@university.edu
ADMIN_NAME=System Administrator
ADMIN_PASSWORD=changeme123
```

### 4. Установка зависимостей

```bash
cd server
npm install
```

Новые зависимости:
- `pg` - PostgreSQL драйвер
- `bcrypt` - Хеширование паролей
- `jsonwebtoken` - JWT токены

### 5. Применение миграций

```bash
# Генерация Prisma Client
npx prisma generate

# Применение схемы к базе данных
npx prisma db push

# Просмотр данных (опционально)
npx prisma studio
```

### 6. Запуск сервера

```bash
npm start
# или для разработки
npm run dev
```

При первом запуске автоматически создастся admin пользователь из `.env`.

---

## 📋 Изменения в API

### Новые эндпоинты аутентификации

#### POST `/api/auth/register`
Регистрация нового пользователя.

**Body:**
```json
{
  "email": "student@university.edu",
  "password": "securepassword",
  "name": "Иван Иванов",
  "role": "STUDENT"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "student@university.edu",
    "name": "Иван Иванов",
    "role": "STUDENT"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST `/api/auth/login`
Вход в систему.

**Body:**
```json
{
  "email": "student@university.edu",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "student@university.edu",
    "name": "Иван Иванов",
    "role": "STUDENT"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET `/api/auth/me`
Получение профиля текущего пользователя.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "student@university.edu",
    "name": "Иван Иванов",
    "role": "STUDENT"
  }
}
```

### Обновленные эндпоинты заявлений

Теперь **требуют аутентификации** через JWT токен.

#### POST `/api/applications`
Создание заявления (требует аутентификации).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "type": "справка_об_обучении",
  "studentName": "Иван Иванов",
  "studentId": "2021-12345",
  "department": "Факультет информатики",
  "email": "student@university.edu",
  "description": "Справка для визы"
}
```

`userId` автоматически берется из токена.

#### GET `/api/applications`
Список всех заявлений (только для TEACHER, STAFF, ADMIN).

**Headers:**
```
Authorization: Bearer <token>
```

**Query parameters:**
```
?status=pending&department=Факультет информатики
```

**Response:** Список заявлений с реальными именами студентов из профилей:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "typeName": "Справка об обучении",
      "studentName": "Иван Иванов",
      "studentId": "2021-12345",
      "status": "pending",
      "user": {
        "name": "Иван Иванов",
        "email": "student@university.edu",
        "role": "STUDENT"
      }
    }
  ]
}
```

#### PATCH `/api/applications/:id/status`
Обновление статуса заявления (только для TEACHER, STAFF, ADMIN).

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "status": "approved"
}
```

---

## 🤖 Интеграция с ботом

Бот автоматически создает или находит пользователя по MAX user ID при подаче заявления:

1. При первой подаче заявления через бота создается профиль пользователя
2. MAX user ID привязывается к профилю
3. Все последующие заявления связываются с этим пользователем
4. Преподаватели видят реальное имя студента, указанное при первой подаче

**Временный пароль:** Для пользователей, созданных через бота, генерируется случайный пароль. Они могут войти через веб-интерфейс и сменить пароль.

---

## 🔐 Роли и доступ

### STUDENT
- Создание своих заявлений
- Просмотр только своих заявлений
- Проверка статуса по ID

### TEACHER / STAFF
- Все права студента
- Просмотр всех заявлений
- Обновление статусов заявлений
- Фильтрация по подразделениям

### ADMIN
- Все права преподавателя
- Доступ к статистике БД (`/api/admin/db-stats`)
- Управление пользователями

---

## 🧪 Тестирование

### Пример регистрации и входа (PowerShell)

```powershell
# Регистрация
$body = @{
    email = "test@university.edu"
    password = "testpass123"
    name = "Test User"
    role = "STUDENT"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

$token = $response.token

# Использование токена для создания заявления
$appBody = @{
    type = "справка_об_обучении"
    studentName = "Test User"
    studentId = "2024-00001"
    department = "IT"
    email = "test@university.edu"
    description = "Test application"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/applications" `
    -Method POST `
    -Headers @{ Authorization = "Bearer $token" } `
    -Body $appBody `
    -ContentType "application/json"
```

### Пример для преподавателя

```powershell
# Вход как админ
$loginBody = @{
    email = "admin@university.edu"
    password = "changeme123"
} | ConvertTo-Json

$adminResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json"

$adminToken = $adminResponse.token

# Просмотр всех заявлений
Invoke-RestMethod -Uri "http://localhost:5000/api/applications" `
    -Headers @{ Authorization = "Bearer $adminToken" }

# Обновление статуса
$statusBody = @{ status = "approved" } | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/applications/1/status" `
    -Method PATCH `
    -Headers @{ Authorization = "Bearer $adminToken" } `
    -Body $statusBody `
    -ContentType "application/json"
```

---

## 🔄 Обратная совместимость

Временно поддерживается legacy режим с заголовками `X-User-Role` и `X-User-Id` для плавного перехода. **Рекомендуется мигрировать на JWT токены.**

---

## ⚠️ Безопасность

1. **Измените JWT_SECRET** в production на сложный случайный ключ
2. **Смените пароль admin** после первого входа
3. **Используйте HTTPS** в production
4. **Настройте CORS** для продакшена
5. **Включите rate limiting** (уже настроен)
6. **Регулярно обновляйте** зависимости

---

## 📚 Дополнительные ресурсы

- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [JWT Best Practices](https://jwt.io/introduction)
- [bcrypt Security](https://github.com/kelektiv/node.bcrypt.js#security-issues-and-concerns)
