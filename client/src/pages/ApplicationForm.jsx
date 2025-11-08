import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import axios from 'axios';
import '../styles/ApplicationForm.css';

const APPLICATION_TYPES = [
  { value: 'certificate', label: 'Справка об обучении', description: 'Для предоставления по месту требования' },
  { value: 'scholarship', label: 'Справка о стипендии', description: 'Информация о размере стипендии' },
  { value: 'transcript', label: 'Выписка из зачётной книжки', description: 'Академическая справка' },
  { value: 'academic_leave', label: 'Академический отпуск', description: 'Заявление на академический отпуск' },
  { value: 'dorm', label: 'Общежитие', description: 'Заявление на поселение в общежитие' },
  { value: 'transfer', label: 'Перевод на другую специальность', description: 'Заявление о переводе' },
  { value: 'other', label: 'Другое', description: 'Иное заявление' }
];

function ApplicationForm() {
  const navigate = useNavigate();
  const user = authService.getUser();
  
  const [formData, setFormData] = useState({
    type: '',
    typeName: '',
    studentName: user?.name || '',
    studentId: '',
    department: '',
    email: user?.email || '',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleTypeChange = (e) => {
    const selectedType = APPLICATION_TYPES.find(t => t.value === e.target.value);
    setFormData({
      ...formData,
      type: e.target.value,
      typeName: selectedType ? selectedType.label : ''
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = authService.getToken();
      const response = await axios.post(
        '/api/applications',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/applications');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при подаче заявления');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (success) {
    return (
      <div className="application-form-page">
        <div className="success-message-container">
          <div className="success-icon">✅</div>
          <h2>Заявление успешно подано!</h2>
          <p>Вы будете перенаправлены на страницу заявлений...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="application-form-page">
      <div className="application-nav">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Назад в личный кабинет
        </button>
      </div>

      <div className="application-form-container">
        <div className="form-header">
          <h1>Подача заявления</h1>
          <p>Заполните форму для подачи нового заявления</p>
        </div>

        <form onSubmit={handleSubmit} className="application-form">
          {error && (
            <div className="error-message">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {/* Тип заявления */}
          <div className="form-section">
            <h3>Тип документа</h3>
            <div className="form-group">
              <label htmlFor="type">Выберите тип заявления *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleTypeChange}
                required
              >
                <option value="">-- Выберите тип --</option>
                {APPLICATION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {formData.type && (
                <p className="field-description">
                  {APPLICATION_TYPES.find(t => t.value === formData.type)?.description}
                </p>
              )}
            </div>
          </div>

          {/* Личные данные */}
          <div className="form-section">
            <h3>Личные данные</h3>
            
            <div className="form-group">
              <label htmlFor="studentName">ФИО *</label>
              <input
                type="text"
                id="studentName"
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                placeholder="Иванов Иван Иванович"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="studentId">Номер студенческого билета *</label>
              <input
                type="text"
                id="studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                placeholder="20221234"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="department">Факультет/Кафедра</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Факультет информационных технологий"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email для связи *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="student@university.edu"
                required
              />
            </div>
          </div>

          {/* Дополнительная информация */}
          <div className="form-section">
            <h3>Дополнительная информация</h3>
            
            <div className="form-group">
              <label htmlFor="description">Комментарий или обоснование</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Укажите причину подачи заявления, дополнительную информацию..."
                rows="5"
              />
            </div>
          </div>

          {/* Кнопки */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-cancel"
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading || !formData.type}
            >
              {loading ? 'Отправка...' : 'Подать заявление'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApplicationForm;
