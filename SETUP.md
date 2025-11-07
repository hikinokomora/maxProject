# Инструкция по настройке

## Настройка для вашего университета

### 1. Конфигурация университета

Отредактируйте файл `server/config/university.json`:

```json
{
  "universityName": "Название вашего университета",
  "universityShortName": "Аббревиатура",
  "supportEmail": "support@youruni.edu",
  "supportPhone": "+7 (XXX) XXX-XX-XX",
  ...
}
```

### 2. Настройка типов заявлений

В том же файле настройте типы заявлений в разделе `applicationTypes`:

```json
"applicationTypes": [
  {
    "id": "unique_id",
    "name": "Отображаемое название",
    "description": "Описание заявления"
  }
]
```

### 3. Настройка расписания

Отредактируйте `server/services/scheduleService.js` для добавления реального расписания:

```javascript
this.scheduleData = {
  'ВАША-ГРУППА': [
    {
      day: 'Понедельник',
      lessons: [
        { time: '09:00-10:30', subject: 'Предмет', room: '101', teacher: 'Преподаватель' }
      ]
    }
  ]
};
```

### 4. Настройка мероприятий

Отредактируйте `server/services/eventsService.js` для добавления ваших мероприятий.

### 5. Интеграция с базой данных

Для production использования рекомендуется:

1. Установить MongoDB или PostgreSQL
2. Заменить mock данные в сервисах на реальные запросы к БД
3. Добавить переменные окружения для конфигурации БД

### 6. Интеграция с MAX messenger

Для интеграции с реальным MAX messenger:

1. Получите API ключи от MAX
2. Настройте webhook для приема сообщений
3. Добавьте обработку MAX-специфичных форматов сообщений

## Развертывание

### Docker

```bash
docker build -t max-chatbot .
docker run -p 5000:5000 max-chatbot
```

### Локальная разработка

```bash
# Терминал 1: Запуск сервера
cd server
npm install
npm run dev

# Терминал 2: Запуск клиента
cd client
npm install
npm start
```

## Переменные окружения

Создайте файл `.env` в корне проекта:

```
NODE_ENV=production
PORT=5000
DATABASE_URL=your_database_url
MAX_API_KEY=your_max_api_key
```

## Безопасность

⚠️ Важно:
- Не храните секретные ключи в репозитории
- Используйте переменные окружения для чувствительных данных
- Настройте CORS для production
- Добавьте аутентификацию для API
