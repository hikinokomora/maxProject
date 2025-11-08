# API Testing Examples

Примеры запросов для тестирования API с JWT аутентификацией.

## Предварительные требования

- Сервер запущен на `http://localhost:5000`
- PostgreSQL настроен и работает
- Admin пользователь создан из `.env`

---

## PowerShell Examples

### 1. Регистрация нового студента

```powershell
$studentData = @{
    email = "student@university.edu"
    password = "student123"
    name = "Иван Петрович Иванов"
    role = "STUDENT"
} | ConvertTo-Json

$student = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
    -Method POST `
    -Body $studentData `
    -ContentType "application/json"

Write-Host "Student registered:"
Write-Host "ID: $($student.data.id)"
Write-Host "Email: $($student.data.email)"
Write-Host "Token: $($student.token)"

# Сохраните токен
$studentToken = $student.token
```

### 2. Вход как admin

```powershell
$adminLogin = @{
    email = "admin@university.edu"
    password = "changeme123"
} | ConvertTo-Json

$admin = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -Body $adminLogin `
    -ContentType "application/json"

Write-Host "Admin logged in:"
Write-Host "Name: $($admin.data.name)"
Write-Host "Role: $($admin.data.role)"

$adminToken = $admin.token
```

### 3. Создание заявления (от студента)

```powershell
$applicationData = @{
    type = "справка_об_обучении"
    studentName = "Иван Петрович Иванов"
    studentId = "2021-12345"
    department = "Факультет информатики и вычислительной техники"
    email = "student@university.edu"
    description = "Справка требуется для визового центра"
} | ConvertTo-Json

$app = Invoke-RestMethod -Uri "http://localhost:5000/api/applications" `
    -Method POST `
    -Headers @{ Authorization = "Bearer $studentToken" } `
    -Body $applicationData `
    -ContentType "application/json"

Write-Host "Application created:"
Write-Host "ID: $($app.data.id)"
Write-Host "Type: $($app.data.typeName)"
Write-Host "Status: $($app.data.status)"

$applicationId = $app.data.id
```

### 4. Просмотр заявления

```powershell
$appDetails = Invoke-RestMethod -Uri "http://localhost:5000/api/applications/$applicationId" `
    -Headers @{ Authorization = "Bearer $studentToken" }

Write-Host "Application details:"
$appDetails.data | Format-List
```

### 5. Просмотр всех заявлений (admin/teacher)

```powershell
$allApps = Invoke-RestMethod -Uri "http://localhost:5000/api/applications" `
    -Headers @{ Authorization = "Bearer $adminToken" }

Write-Host "All applications:"
$allApps.data | ForEach-Object {
    Write-Host "ID: $($_.id) | Student: $($_.user.name) | Type: $($_.typeName) | Status: $($_.status)"
}
```

### 6. Обновление статуса заявления (admin/teacher)

```powershell
$statusUpdate = @{
    status = "approved"
} | ConvertTo-Json

$updated = Invoke-RestMethod -Uri "http://localhost:5000/api/applications/$applicationId/status" `
    -Method PATCH `
    -Headers @{ Authorization = "Bearer $adminToken" } `
    -Body $statusUpdate `
    -ContentType "application/json"

Write-Host "Status updated to: $($updated.data.status)"
```

### 7. Фильтрация заявлений

```powershell
# По статусу
$pending = Invoke-RestMethod -Uri "http://localhost:5000/api/applications?status=pending" `
    -Headers @{ Authorization = "Bearer $adminToken" }

# По подразделению
$itDept = Invoke-RestMethod -Uri "http://localhost:5000/api/applications?department=Факультет информатики и вычислительной техники" `
    -Headers @{ Authorization = "Bearer $adminToken" }

Write-Host "Pending applications: $($pending.data.Count)"
Write-Host "IT Dept applications: $($itDept.data.Count)"
```

### 8. Получение профиля текущего пользователя

```powershell
$profile = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" `
    -Headers @{ Authorization = "Bearer $studentToken" }

Write-Host "Current user profile:"
$profile.data | Format-List
```

### 9. Регистрация преподавателя

```powershell
$teacherData = @{
    email = "teacher@university.edu"
    password = "teacher123"
    name = "Петр Сидорович Петров"
    role = "TEACHER"
} | ConvertTo-Json

$teacher = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
    -Method POST `
    -Body $teacherData `
    -ContentType "application/json"

$teacherToken = $teacher.token
```

### 10. Попытка доступа студента к списку всех заявлений (должна быть ошибка 403)

```powershell
try {
    $forbidden = Invoke-RestMethod -Uri "http://localhost:5000/api/applications" `
        -Headers @{ Authorization = "Bearer $studentToken" }
} catch {
    Write-Host "Access denied (as expected): $($_.Exception.Message)"
}
```

---

## Bash / cURL Examples

### 1. Регистрация студента

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@university.edu",
    "password": "student123",
    "name": "Иван Петрович Иванов",
    "role": "STUDENT"
  }' | jq

# Сохранить токен
STUDENT_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student2@university.edu",
    "password": "student123",
    "name": "Мария Ивановна Петрова",
    "role": "STUDENT"
  }' | jq -r '.token')
```

### 2. Вход admin

```bash
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@university.edu",
    "password": "changeme123"
  }' | jq -r '.token')

echo "Admin token: $ADMIN_TOKEN"
```

### 3. Создание заявления

```bash
curl -X POST http://localhost:5000/api/applications \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "справка_об_обучении",
    "studentName": "Мария Ивановна Петрова",
    "studentId": "2021-54321",
    "department": "Экономический факультет",
    "email": "student2@university.edu",
    "description": "Справка для работы"
  }' | jq
```

### 4. Просмотр всех заявлений

```bash
curl -X GET http://localhost:5000/api/applications \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

### 5. Обновление статуса

```bash
APPLICATION_ID=1

curl -X PATCH http://localhost:5000/api/applications/$APPLICATION_ID/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}' | jq
```

### 6. Получение профиля

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq
```

---

## JavaScript / Node.js Examples

### Использование в Node.js приложении

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Регистрация
async function register(email, password, name, role = 'STUDENT') {
  const response = await axios.post(`${API_URL}/auth/register`, {
    email, password, name, role
  });
  return response.data;
}

// Вход
async function login(email, password) {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email, password
  });
  return response.data;
}

// Создание заявления
async function createApplication(token, applicationData) {
  const response = await axios.post(`${API_URL}/applications`, applicationData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

// Получение заявлений
async function getApplications(token, filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await axios.get(`${API_URL}/applications?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

// Пример использования
(async () => {
  try {
    // Вход
    const adminAuth = await login('admin@university.edu', 'changeme123');
    console.log('Admin token:', adminAuth.token);

    // Получение заявлений
    const apps = await getApplications(adminAuth.token, { status: 'pending' });
    console.log('Pending applications:', apps.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
})();
```

---

## Полный тестовый сценарий (PowerShell)

```powershell
# Полный workflow от регистрации до обновления статуса

# 1. Регистрация студента
$student = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
    -Method POST `
    -Body (@{email="test.student@edu.ru"; password="pass123"; name="Тест Студентов"; role="STUDENT"} | ConvertTo-Json) `
    -ContentType "application/json"

$studentToken = $student.token

# 2. Студент создает заявление
$app = Invoke-RestMethod -Uri "http://localhost:5000/api/applications" `
    -Method POST `
    -Headers @{Authorization="Bearer $studentToken"} `
    -Body (@{type="справка_об_обучении"; studentName="Тест Студентов"; studentId="2024-99999"; department="IT"; email="test.student@edu.ru"; description="Тест"} | ConvertTo-Json) `
    -ContentType "application/json"

$appId = $app.data.id
Write-Host "Created application ID: $appId"

# 3. Вход как admin
$admin = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -Body (@{email="admin@university.edu"; password="changeme123"} | ConvertTo-Json) `
    -ContentType "application/json"

$adminToken = $admin.token

# 4. Admin просматривает заявление
$appDetails = Invoke-RestMethod -Uri "http://localhost:5000/api/applications/$appId" `
    -Headers @{Authorization="Bearer $adminToken"}

Write-Host "Application by: $($appDetails.data.user.name)"

# 5. Admin обновляет статус
$updated = Invoke-RestMethod -Uri "http://localhost:5000/api/applications/$appId/status" `
    -Method PATCH `
    -Headers @{Authorization="Bearer $adminToken"} `
    -Body (@{status="approved"} | ConvertTo-Json) `
    -ContentType "application/json"

Write-Host "Status updated to: $($updated.data.status)"

# 6. Студент проверяет обновленный статус
$studentApp = Invoke-RestMethod -Uri "http://localhost:5000/api/applications/$appId" `
    -Headers @{Authorization="Bearer $studentToken"}

Write-Host "Student sees status: $($studentApp.data.status)"
```

---

## Тестирование ошибок

### Невалидный токен

```powershell
try {
    Invoke-RestMethod -Uri "http://localhost:5000/api/applications" `
        -Headers @{Authorization="Bearer invalid_token_here"}
} catch {
    Write-Host "Error (expected): $($_.Exception.Response.StatusCode)"
}
```

### Доступ студента к админским функциям

```powershell
try {
    Invoke-RestMethod -Uri "http://localhost:5000/api/applications" `
        -Headers @{Authorization="Bearer $studentToken"}
} catch {
    Write-Host "Forbidden (expected): $($_.Exception.Response.StatusCode)"
}
```

### Неверные креды при логине

```powershell
try {
    Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -Body (@{email="admin@university.edu"; password="wrongpass"} | ConvertTo-Json) `
        -ContentType "application/json"
} catch {
    Write-Host "Unauthorized (expected): $($_.Exception.Response.StatusCode)"
}
```

---

## Сохранение результатов

```powershell
# Экспорт всех заявлений в JSON
$allApps = Invoke-RestMethod -Uri "http://localhost:5000/api/applications" `
    -Headers @{Authorization="Bearer $adminToken"}

$allApps.data | ConvertTo-Json -Depth 10 | Out-File -FilePath "applications_export.json"

Write-Host "Exported $($allApps.data.Count) applications to applications_export.json"
```
