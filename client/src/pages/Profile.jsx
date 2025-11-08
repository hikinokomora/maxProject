import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/Profile.css';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    department: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    const userData = authService.getUser();
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(userData);
    setFormData({
      name: userData.name || '',
      email: userData.email || '',
      studentId: userData.studentId || '',
      department: userData.department || '',
      phone: userData.phone || ''
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
    setSuccess('');
    setLoading(true);

    try {
      // TODO: Реальный API запрос
      // const token = authService.getToken();
      // await axios.put('/api/auth/profile', formData, {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });

      // Временно обновляем локально
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setSuccess('Профиль успешно обновлен');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Ошибка при обновлении профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadUserData();
    setError('');
  };

  if (!user) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="profile-page">
      {/* Навигация */}
      <nav className="profile-nav">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Назад в личный кабинет
        </button>
      </nav>

      <div className="profile-container">
        {/* Заголовок */}
        <div className="profile-header">
          <div className="profile-avatar">
            <span>{user.name?.charAt(0)?.toUpperCase() || '?'}</span>
          </div>
          <div className="profile-title">
            <h1>{user.name}</h1>
            <p>{user.email}</p>
            <span className="role-badge">
              {user.role === 'STUDENT' ? '👨‍🎓 Студент' :
               user.role === 'TEACHER' ? '👨‍🏫 Преподаватель' :
               user.role === 'ADMIN' ? '⚙️ Администратор' : user.role}
            </span>
          </div>
        </div>

        {/* Сообщения */}
        {success && (
          <div className="success-message">
            <span>✅</span>
            <p>{success}</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* Информация о профиле */}
        <div className="profile-content">
          {!isEditing ? (
            <div className="profile-view">
              <div className="profile-section">
                <h3>Личная информация</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">ФИО</span>
                    <span className="info-value">{user.name || 'Не указано'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email</span>
                    <span className="info-value">{user.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Студенческий билет</span>
                    <span className="info-value">{formData.studentId || 'Не указано'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Факультет/Кафедра</span>
                    <span className="info-value">{formData.department || 'Не указано'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Телефон</span>
                    <span className="info-value">{formData.phone || 'Не указано'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Роль</span>
                    <span className="info-value">
                      {user.role === 'STUDENT' ? 'Студент' :
                       user.role === 'TEACHER' ? 'Преподаватель' :
                       user.role === 'ADMIN' ? 'Администратор' : user.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h3>Статистика</h3>
                <div className="stats-grid">
                  <div className="stat-box">
                    <span className="stat-icon">📝</span>
                    <span className="stat-number">5</span>
                    <span className="stat-label">Заявлений подано</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-icon">✅</span>
                    <span className="stat-number">2</span>
                    <span className="stat-label">Одобрено</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-icon">⏳</span>
                    <span className="stat-number">2</span>
                    <span className="stat-label">На рассмотрении</span>
                  </div>
                </div>
              </div>

              <button onClick={() => setIsEditing(true)} className="btn-edit">
                ✏️ Редактировать профиль
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="profile-edit">
              <div className="profile-section">
                <h3>Редактирование профиля</h3>
                
                <div className="form-group">
                  <label htmlFor="name">ФИО</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Иванов Иван Иванович"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
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

                <div className="form-group">
                  <label htmlFor="studentId">Студенческий билет</label>
                  <input
                    type="text"
                    id="studentId"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    placeholder="20221234"
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
                  <label htmlFor="phone">Телефон</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn-cancel"
                    disabled={loading}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading}
                  >
                    {loading ? 'Сохранение...' : 'Сохранить изменения'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
