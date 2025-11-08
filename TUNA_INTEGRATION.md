# Интеграция Tuna SDK для MAX Mini-App

Руководство по использованию Tuna SDK для создания мини-приложения в MAX messenger.

## 📦 Что такое Tuna?

**Tuna** - это официальный SDK от MAX для создания мини-приложений, которые запускаются внутри мессенджера. Мини-приложение может:

- 🔐 Получать информацию о пользователе (ID, имя)
- 🎨 Адаптироваться под тему MAX messenger
- 💬 Взаимодействовать с ботом
- 🔔 Показывать уведомления и popup'ы
- 🔗 Открывать внешние ссылки
- 📱 Использовать нативные функции мессенджера

---

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
cd client
npm install @maxhub/tuna --save
```

### 2. Инициализация Tuna в приложении

Tuna автоматически инициализируется в `App.js`:

```javascript
import tunaService from './services/tunaService';

useEffect(() => {
  const initTuna = async () => {
    const initialized = await tunaService.init();
    if (initialized && tunaService.isInMiniApp()) {
      const user = await tunaService.getUserInfo();
      console.log('User from MAX:', user);
    }
  };
  initTuna();
}, []);
```

### 3. Автоматическая авторизация

При запуске мини-апп, пользователь автоматически аутентифицируется через MAX user ID:

```javascript
import authService from './services/authService';

const authenticateUser = async (tunaUserInfo) => {
  const result = await authService.authenticateWithTuna(tunaUserInfo);
  if (result.success) {
    console.log('Authenticated:', result.data);
  }
};
```

---

## 🛠 Использование Tuna Service

### Получение информации о пользователе

```javascript
import tunaService from './services/tunaService';

const getUserInfo = async () => {
  const user = await tunaService.getUserInfo();
  console.log('User ID:', user.id);
  console.log('Name:', user.fullName);
  console.log('Username:', user.username);
};
```

### Проверка, запущено ли в мини-аппе

```javascript
if (tunaService.isInMiniApp()) {
  console.log('Running inside MAX messenger');
} else {
  console.log('Running in web browser');
}
```

### Показ уведомлений

```javascript
// Alert
await tunaService.showAlert('Заявление успешно создано!');

// Confirmation
const confirmed = await tunaService.showConfirm('Вы уверены?');
if (confirmed) {
  // User clicked OK
}
```

### Главная кнопка

```javascript
// Показать кнопку внизу мини-аппа
tunaService.setMainButton('Создать заявление', () => {
  console.log('Main button clicked!');
  // Handle action
});

// Скрыть кнопку
tunaService.hideMainButton();
```

### Отправка данных боту

```javascript
// Отправить данные обратно в бот
await tunaService.sendDataToBot({
  action: 'application_created',
  applicationId: 123
});
```

### Открытие ссылок

```javascript
await tunaService.openLink('https://university.edu');
```

### Закрытие мини-апп

```javascript
await tunaService.close();
```

### Развернуть на весь экран

```javascript
await tunaService.expand();
```

### Получение темы

```javascript
const theme = tunaService.getThemeParams();
console.log('Background:', theme.bg_color);
console.log('Text:', theme.text_color);
console.log('Button:', theme.button_color);
```

---

## 🔐 Аутентификация через Tuna

### Backend endpoint: POST `/api/auth/tuna-login`

Автоматически создает или находит пользователя по MAX user ID.

**Request:**
```javascript
const response = await axios.post('http://localhost:5000/api/auth/tuna-login', {
  maxUserId: 123456789,
  name: 'Иван Иванов',
  firstName: 'Иван',
  lastName: 'Иванов',
  username: 'ivan_ivanov'
});

console.log('Token:', response.data.token);
console.log('User:', response.data.data);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "ivan_ivanov@max.local",
    "name": "Иван Иванов",
    "role": "STUDENT",
    "maxUserId": 123456789
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Authenticated via Tuna"
}
```

### Frontend использование

```javascript
import authService from './services/authService';
import tunaService from './services/tunaService';

const autoAuth = async () => {
  const tunaUser = await tunaService.getUserInfo();
  const result = await authService.authenticateWithTuna(tunaUser);
  
  if (result.success) {
    console.log('Authenticated!');
    // Token автоматически сохранен в authService
    
    // Теперь можно делать авторизованные запросы
    const apps = await axios.get('/api/applications', {
      headers: authService.getAuthHeader()
    });
  }
};
```

---

## 📱 Пример компонента с Tuna

```javascript
import React, { useEffect, useState } from 'react';
import tunaService from '../services/tunaService';
import authService from '../services/authService';

function ApplicationForm() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auto-auth when component mounts
    const init = async () => {
      if (tunaService.isInMiniApp()) {
        const tunaUser = await tunaService.getUserInfo();
        const auth = await authService.authenticateWithTuna(tunaUser);
        
        if (auth.success) {
          setUser(auth.data);
          
          // Setup main button
          tunaService.setMainButton('Создать заявление', handleSubmit);
        }
      }
    };
    
    init();

    return () => {
      tunaService.hideMainButton();
    };
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const response = await axios.post('/api/applications', {
        type: 'справка_об_обучении',
        studentName: user.name,
        studentId: '2024-12345',
        department: 'IT',
        email: user.email,
        description: 'Справка для визы'
      }, {
        headers: authService.getAuthHeader()
      });

      if (response.data.success) {
        await tunaService.showAlert('Заявление успешно создано!');
        
        // Send notification to bot
        await tunaService.sendDataToBot({
          action: 'application_created',
          id: response.data.data.id
        });
        
        // Close mini-app
        await tunaService.close();
      }
    } catch (error) {
      await tunaService.showAlert('Ошибка при создании заявления');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Загрузка...</div>;
  }

  return (
    <div>
      <h2>Привет, {user.name}!</h2>
      <p>Создать заявление?</p>
      {/* Form fields... */}
    </div>
  );
}
```

---

## 🎨 Адаптация под тему MAX

```javascript
import tunaService from './services/tunaService';

function ThemedComponent() {
  const theme = tunaService.getThemeParams();

  return (
    <div style={{
      backgroundColor: theme.bg_color,
      color: theme.text_color
    }}>
      <button style={{
        backgroundColor: theme.button_color,
        color: theme.button_text_color
      }}>
        Нажми меня
      </button>
      
      <a style={{ color: theme.link_color }}>
        Ссылка
      </a>
    </div>
  );
}
```

---

## 🔄 Обработка данных от бота

Когда бот открывает мини-апп, он может передать начальные данные:

```javascript
const launchParams = tunaService.getLaunchParams();

if (launchParams && launchParams.start_param) {
  // Например, бот передал ID заявления для просмотра
  const applicationId = launchParams.start_param;
  console.log('Open application:', applicationId);
}
```

В боте:

```javascript
const keyboard = Keyboard.inlineKeyboard([
  [Keyboard.button.miniApp(
    'Посмотреть заявление',
    `${MINI_APP_URL}?startapp=${applicationId}`
  )]
]);
```

---

## 🧪 Тестирование

### Локальная разработка (без MAX)

Приложение работает и в браузере, и в MAX messenger. Сервис автоматически определяет окружение:

```javascript
if (tunaService.isInMiniApp()) {
  // Код для мини-аппа
} else {
  // Код для веб-браузера
  // Показать форму логина
}
```

### Тестирование в MAX messenger

1. Зарегистрируйте мини-апп на [dev.max.ru](https://dev.max.ru)
2. Укажите URL мини-аппа (например, через ngrok)
3. Добавьте кнопку в бот:

```javascript
const keyboard = Keyboard.inlineKeyboard([
  [Keyboard.button.miniApp('Открыть приложение', MINI_APP_URL)]
]);
```

### Использование ngrok для локальной разработки

```bash
# Запустите клиент
cd client
npm start

# В другом терминале запустите ngrok
ngrok http 3000

# Скопируйте HTTPS URL и используйте его как MINI_APP_URL
```

---

## 🔧 API методы Tuna Service

| Метод | Описание | Возвращает |
|-------|----------|------------|
| `init()` | Инициализировать SDK | `Promise<boolean>` |
| `isInMiniApp()` | Проверка, запущено в мини-аппе | `boolean` |
| `getUserInfo()` | Получить инфо о пользователе | `Promise<UserInfo>` |
| `showAlert(message)` | Показать alert | `Promise<void>` |
| `showConfirm(message)` | Показать confirmation | `Promise<boolean>` |
| `close()` | Закрыть мини-апп | `Promise<void>` |
| `openLink(url)` | Открыть ссылку | `Promise<void>` |
| `sendDataToBot(data)` | Отправить данные боту | `Promise<void>` |
| `expand()` | Развернуть на весь экран | `Promise<void>` |
| `getLaunchParams()` | Параметры запуска | `Object` |
| `setMainButton(text, onClick)` | Установить главную кнопку | `void` |
| `hideMainButton()` | Скрыть главную кнопку | `void` |
| `getThemeParams()` | Получить тему | `ThemeParams` |

---

## 💡 Best Practices

### 1. Всегда проверяйте окружение

```javascript
if (tunaService.isInMiniApp()) {
  // Tuna-specific code
} else {
  // Web fallback
}
```

### 2. Обрабатывайте ошибки

```javascript
try {
  await tunaService.showAlert('Success!');
} catch (error) {
  console.error('Tuna error:', error);
  // Fallback to regular alert
  alert('Success!');
}
```

### 3. Используйте главную кнопку для основных действий

```javascript
tunaService.setMainButton('Сохранить', handleSave);
// Лучше, чем обычная кнопка в UI
```

### 4. Отправляйте результаты боту

```javascript
await tunaService.sendDataToBot({
  action: 'completed',
  result: 'success'
});
await tunaService.close();
```

### 5. Адаптируйте UI под тему

```javascript
const theme = tunaService.getThemeParams();
// Используйте theme.bg_color, theme.text_color и т.д.
```

---

## 📦 TypeScript Support

```typescript
import tunaService from './services/tunaService';

interface UserInfo {
  id: number;
  firstName: string;
  lastName: string;
  username?: string;
  fullName: string;
}

const user: UserInfo = await tunaService.getUserInfo();
```

---

## 🔗 Дополнительные ресурсы

- [Официальная документация MAX](https://dev.max.ru/docs)
- [Tuna SDK на npm](https://www.npmjs.com/package/@maxhub/tuna)
- [Примеры мини-приложений](https://dev.max.ru/examples)

---

## ⚠️ Важные замечания

1. **HTTPS обязателен** для production мини-аппов
2. **CSP headers** должны разрешать загрузку из MAX домена
3. **Размер приложения** - старайтесь минимизировать bundle
4. **Кеширование токенов** - сохраняйте по MAX user ID
5. **Graceful degradation** - всегда предоставляйте веб-версию

---

## 🎯 Готово!

Теперь ваше приложение работает как:
- ✅ Обычный веб-сайт (в браузере)
- ✅ Мини-приложение в MAX messenger (с Tuna)
- ✅ Автоматическая аутентификация через MAX
- ✅ Адаптация под тему мессенджера
- ✅ Взаимодействие с ботом

**Следующие шаги:**
1. Установите зависимости: `npm install`
2. Запустите клиент: `npm start`
3. Протестируйте в браузере
4. Настройте ngrok для тестирования в MAX
5. Зарегистрируйте мини-апп на dev.max.ru
