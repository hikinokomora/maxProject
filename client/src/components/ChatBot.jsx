import React, { useState, useEffect, useRef } from 'react';
import chatService from '../services/chatService';
import '../styles/ChatBot.css';

const MAX_EVENTS_TO_SHOW = 5;

function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [universityInfo, setUniversityInfo] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load university info
    loadUniversityInfo();
    // Send initial greeting
    addBotMessage({
      text: 'Здравствуйте! Я ваш виртуальный помощник. Чем могу помочь?',
      suggestions: ['Расписание', 'Мероприятия', 'Подать заявление', 'Помощь']
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUniversityInfo = async () => {
    try {
      const response = await chatService.getUniversityInfo();
      if (response.success) {
        setUniversityInfo(response.data);
      }
    } catch (error) {
      console.error('Error loading university info:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { type: 'user', text, timestamp: new Date() }]);
  };

  const addBotMessage = (data) => {
    setMessages(prev => [...prev, { type: 'bot', ...data, timestamp: new Date() }]);
  };

  const handleSendMessage = async (message = inputValue) => {
    if (!message.trim()) return;

    addUserMessage(message);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(message);
      if (response.success) {
        addBotMessage(response.data);

        // Handle specific actions
        if (response.data.action === 'events') {
          const eventsResponse = await chatService.getEvents(null, MAX_EVENTS_TO_SHOW);
          if (eventsResponse.success && eventsResponse.data.length > 0) {
            addBotMessage({
              text: 'Предстоящие мероприятия:',
              events: eventsResponse.data
            });
          }
        }
      }
    } catch (error) {
      addBotMessage({
        text: 'Извините, произошла ошибка. Пожалуйста, попробуйте позже.',
        suggestions: ['Помощь']
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="header-content">
          <h1>🤖 MAX Chatbot</h1>
          {universityInfo && (
            <p className="university-name">{universityInfo.name}</p>
          )}
        </div>
      </div>

      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            <div className="message-content">
              <p className="message-text">{message.text}</p>
              
              {message.commands && (
                <div className="commands-list">
                  {message.commands.map((cmd, i) => (
                    <div key={i} className="command-item">
                      <strong>{cmd.command}</strong> - {cmd.description}
                    </div>
                  ))}
                </div>
              )}

              {message.applicationTypes && (
                <div className="application-types">
                  {message.applicationTypes.map((type, i) => (
                    <div key={i} className="application-type-card">
                      <strong>{type.name}</strong>
                      <p>{type.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {message.events && (
                <div className="events-list">
                  {message.events.map((event, i) => (
                    <div key={i} className="event-card">
                      <h4>{event.title}</h4>
                      <p>{event.description}</p>
                      <div className="event-details">
                        <span>📅 {event.date}</span>
                        <span>🕐 {event.time}</span>
                        <span>📍 {event.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {message.suggestions && (
                <div className="suggestions">
                  {message.suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      className="suggestion-button"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              
              <span className="message-time">{formatTime(message.timestamp)}</span>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message bot">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbot-input">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Введите сообщение..."
          rows="1"
          disabled={isLoading}
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={isLoading || !inputValue.trim()}
          className="send-button"
        >
          ➤
        </button>
      </div>
    </div>
  );
}

export default ChatBot;
