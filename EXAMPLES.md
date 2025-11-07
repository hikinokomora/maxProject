# Примеры расширения функциональности

## Добавление новой команды

### 1. Добавьте обработчик в chatService.js

```javascript
// В server/services/chatService.js
if (lowerMessage.includes('библиотека')) {
  return {
    text: 'Информация о библиотеке:\n📚 Режим работы: пн-пт 8:00-20:00\n📖 Онлайн каталог: library.university.edu',
    suggestions: this.getSuggestions()
  };
}
```

### 2. Добавьте команду в конфигурацию

```json
// В server/config/university.json
{
  "command": "библиотека",
  "description": "Узнать о работе библиотеки"
}
```

## Добавление нового типа заявления

### 1. Добавьте тип в конфигурацию

```json
// В server/config/university.json, в массив applicationTypes
{
  "id": "stipend",
  "name": "Стипендия",
  "description": "Заявление на назначение стипендии"
}
```

### 2. Добавьте специфичную валидацию (опционально)

```javascript
// В server/services/applicationsService.js, метод createApplication
if (type === 'stipend') {
  if (!data.gpa || data.gpa < 4.0) {
    return {
      success: false,
      message: 'Для подачи на стипендию требуется средний балл не ниже 4.0'
    };
  }
}
```

## Добавление интеграции с внешним API

### Пример: Получение погоды

```javascript
// server/services/weatherService.js
const axios = require('axios');

class WeatherService {
  async getWeather(city) {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}`
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Не удалось получить данные о погоде'
      };
    }
  }
}

module.exports = new WeatherService();
```

```javascript
// В chatService.js
const weatherService = require('./weatherService');

if (lowerMessage.includes('погода')) {
  const weather = await weatherService.getWeather('Moscow');
  return {
    text: `Погода: ${weather.data.main.temp}°C`,
    suggestions: this.getSuggestions()
  };
}
```

## Добавление компонента в UI

### Создание карточки студента

```jsx
// client/src/components/StudentCard.jsx
import React from 'react';
import '../styles/StudentCard.css';

function StudentCard({ student }) {
  return (
    <div className="student-card">
      <h3>{student.name}</h3>
      <p>Группа: {student.group}</p>
      <p>Email: {student.email}</p>
    </div>
  );
}

export default StudentCard;
```

## Интеграция с базой данных

### Пример использования MongoDB

```javascript
// server/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB подключена');
  } catch (error) {
    console.error('Ошибка подключения к БД:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

```javascript
// server/models/Application.js
const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  type: { type: String, required: true },
  studentName: { type: String, required: true },
  studentId: { type: String, required: true },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Application', ApplicationSchema);
```

```javascript
// В server/services/applicationsService.js
const Application = require('../models/Application');

async createApplication(data) {
  try {
    const application = new Application(data);
    await application.save();
    return {
      success: true,
      message: 'Заявление создано',
      data: application
    };
  } catch (error) {
    return {
      success: false,
      message: 'Ошибка при создании заявления'
    };
  }
}
```

## Добавление аутентификации

### Простая JWT аутентификация

```javascript
// server/middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Требуется аутентификация' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Неверный токен' });
  }
};

module.exports = auth;
```

```javascript
// Использование в routes
const auth = require('../middleware/auth');

router.post('/applications', auth, (req, res) => {
  // Только авторизованные пользователи могут создавать заявления
});
```
