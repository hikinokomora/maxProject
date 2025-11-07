# Структура проекта MAX Chatbot

```
maxProject/
│
├── 📄 README.md                    # Основная документация
├── 📄 QUICKSTART.md                # Руководство быстрого старта
├── 📄 SETUP.md                     # Детальная инструкция настройки
├── 📄 EXAMPLES.md                  # Примеры расширения
├── 📄 FEATURES.md                  # Описание возможностей
├── 📄 ARCHITECTURE.md              # Архитектура системы
│
├── 🐳 Dockerfile                   # Docker конфигурация
├── 🐳 docker-compose.yml           # Docker Compose
├── 📄 .dockerignore                # Исключения для Docker
├── 📄 .gitignore                   # Исключения для Git
├── 📄 package.json                 # Root пакет (dev dependencies)
├── 🎬 demo.sh                      # Демо-скрипт
│
├── .github/
│   └── workflows/
│       └── build.yml               # CI/CD workflow
│
├── 📁 client/                      # React Frontend
│   ├── package.json                # Зависимости клиента
│   ├── package-lock.json
│   │
│   ├── public/
│   │   └── index.html              # HTML шаблон
│   │
│   └── src/
│       ├── index.js                # Точка входа React
│       ├── index.css               # Глобальные стили
│       ├── App.js                  # Корневой компонент
│       ├── App.css                 # Стили App
│       │
│       ├── components/             # React компоненты
│       │   └── ChatBot.jsx         # Основной компонент чата
│       │
│       ├── services/               # API сервисы
│       │   └── chatService.js      # API клиент
│       │
│       └── styles/                 # CSS файлы
│           └── ChatBot.css         # Стили чата
│
└── 📁 server/                      # Node.js Backend
    ├── package.json                # Зависимости сервера
    ├── package-lock.json
    ├── index.js                    # Точка входа сервера
    │
    ├── config/                     # Конфигурация
    │   └── university.json         # Настройки университета
    │
    ├── routes/                     # API маршруты
    │   ├── chat.js                 # /api/chat
    │   ├── schedule.js             # /api/schedule
    │   ├── events.js               # /api/events
    │   └── applications.js         # /api/applications
    │
    └── services/                   # Бизнес-логика
        ├── chatService.js          # Обработка диалогов
        ├── scheduleService.js      # Управление расписанием
        ├── eventsService.js        # Управление мероприятиями
        └── applicationsService.js  # Обработка заявлений
```

## Описание основных директорий

### 📁 client/ (Frontend)

**Назначение:** React приложение для пользовательского интерфейса

**Технологии:**
- React 18
- Axios для HTTP запросов
- CSS3 для стилей

**Ключевые файлы:**
- `components/ChatBot.jsx` - главный компонент чата с логикой UI
- `services/chatService.js` - взаимодействие с backend API
- `styles/ChatBot.css` - современные стили с анимациями

### 📁 server/ (Backend)

**Назначение:** Express сервер для обработки запросов

**Технологии:**
- Node.js
- Express
- CORS, Body-parser

**Ключевые файлы:**
- `index.js` - настройка сервера и middleware
- `routes/` - REST API endpoints
- `services/` - бизнес-логика и обработка данных
- `config/university.json` - конфигурация для разных вузов

## Потоки данных

```
┌─────────────┐
│   Browser   │
│  (Client)   │
└──────┬──────┘
       │
       │ HTTP Request
       │
       ▼
┌─────────────────────────────────┐
│     React App (Port 3000)       │
│  ┌──────────────────────────┐   │
│  │  ChatBot Component       │   │
│  └────────┬─────────────────┘   │
│           │                      │
│  ┌────────▼─────────────────┐   │
│  │  chatService.js          │   │
│  │  (Axios HTTP Client)     │   │
│  └────────┬─────────────────┘   │
└───────────┼─────────────────────┘
            │
            │ API Call
            │
            ▼
┌─────────────────────────────────┐
│  Express Server (Port 5000)     │
│  ┌──────────────────────────┐   │
│  │  Routes Layer            │   │
│  │  - /api/chat             │   │
│  │  - /api/schedule         │   │
│  │  - /api/events           │   │
│  │  - /api/applications     │   │
│  └────────┬─────────────────┘   │
│           │                      │
│  ┌────────▼─────────────────┐   │
│  │  Services Layer          │   │
│  │  - chatService           │   │
│  │  - scheduleService       │   │
│  │  - eventsService         │   │
│  │  - applicationsService   │   │
│  └────────┬─────────────────┘   │
│           │                      │
│  ┌────────▼─────────────────┐   │
│  │  Configuration           │   │
│  │  - university.json       │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

## Файлы конфигурации

### package.json (root)
- Используется для dev скриптов
- Запуск одновременно клиента и сервера

### client/package.json
- React и зависимости UI
- Скрипты для build и dev сервера

### server/package.json
- Express и backend зависимости
- Nodemon для разработки

### university.json
- Настройки конкретного университета
- Типы заявлений
- Команды чата
- Контактная информация

## Расширение проекта

### Добавить новую страницу
1. Создать компонент в `client/src/components/`
2. Импортировать в `App.js`
3. Добавить стили в `client/src/styles/`

### Добавить новый API endpoint
1. Создать маршрут в `server/routes/`
2. Создать сервис в `server/services/`
3. Подключить в `server/index.js`

### Изменить конфигурацию
1. Отредактировать `server/config/university.json`
2. Перезапустить сервер

## Зависимости

### Frontend (client/package.json)
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-scripts": "5.0.1",
  "axios": "^1.6.0"
}
```

### Backend (server/package.json)
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "body-parser": "^1.20.2",
  "nodemon": "^3.0.1"
}
```

## Порты

- **3000** - React Development Server
- **5000** - Express Backend Server
- **Production** - Только 5000 (статика + API)

## Переменные окружения

```env
NODE_ENV=production          # Режим работы
PORT=5000                    # Порт сервера
REACT_APP_API_URL=/api       # URL API для клиента
```

## Команды для работы

```bash
# Разработка
npm run dev                  # Запуск клиента и сервера

# Production
npm run build               # Сборка клиента
npm start                   # Запуск production сервера

# Docker
docker build -t max-chatbot .
docker run -p 5000:5000 max-chatbot

# Тестирование
./demo.sh                   # Запуск демо-скрипта
```

---

📚 Для детальной информации см. другие `.md` файлы в корне проекта
