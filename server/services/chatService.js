const universityConfig = require('../config/university.json');

class ChatService {
  constructor() {
    this.config = universityConfig;
  }

  processMessage(message) {
    const lowerMessage = message.toLowerCase().trim();

    // Check for greetings
    if (this.isGreeting(lowerMessage)) {
      return {
        text: this.config.welcomeMessage,
        suggestions: this.getSuggestions()
      };
    }

    // Check for help command
    if (lowerMessage.includes('помощь') || lowerMessage.includes('help')) {
      return {
        text: 'Доступные команды:',
        commands: this.config.chatCommands,
        suggestions: this.getSuggestions()
      };
    }

    // Check for schedule
    if (lowerMessage.includes('расписание')) {
      return {
        text: 'Для получения расписания, пожалуйста, укажите:\n- Группу или курс\n- День недели (или "на неделю")',
        action: 'schedule',
        suggestions: ['Расписание на неделю', 'Расписание на завтра']
      };
    }

    // Check for events
    if (lowerMessage.includes('мероприятия') || lowerMessage.includes('события')) {
      return {
        text: 'Показываю предстоящие мероприятия...',
        action: 'events',
        suggestions: ['Все мероприятия', 'Мероприятия на этой неделе']
      };
    }

    // Check for applications
    if (lowerMessage.includes('заявление') || lowerMessage.includes('заявка')) {
      return {
        text: 'Какое заявление вы хотите подать?',
        action: 'applications',
        applicationTypes: this.config.applicationTypes,
        suggestions: this.config.applicationTypes.map(app => app.name)
      };
    }

    // Check for contact info
    if (lowerMessage.includes('контакт') || lowerMessage.includes('связь') || lowerMessage.includes('поддержка')) {
      return {
        text: `Контактная информация:\n📧 Email: ${this.config.supportEmail}\n📞 Телефон: ${this.config.supportPhone}`,
        suggestions: this.getSuggestions()
      };
    }

    // Default response
    return {
      text: 'Извините, я не совсем понял ваш вопрос. Попробуйте использовать одну из предложенных команд или напишите "помощь".',
      suggestions: this.getSuggestions()
    };
  }

  isGreeting(message) {
    const greetings = ['привет', 'здравствуй', 'добрый день', 'добрый вечер', 'доброе утро', 'hi', 'hello'];
    return greetings.some(greeting => message.includes(greeting));
  }

  getSuggestions() {
    return [
      'Расписание',
      'Мероприятия',
      'Подать заявление',
      'Помощь'
    ];
  }

  getUniversityInfo() {
    return {
      name: this.config.universityName,
      shortName: this.config.universityShortName,
      features: this.config.features
    };
  }
}

module.exports = new ChatService();
