import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
    loadStats();
  }, []);

  const loadUserData = async () => {
    const userData = authService.getUser();
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(userData);
  };

  const loadStats = async () => {
    // TODO: Загрузить статистику из API
    setStats({
      totalApplications: 5,
      pendingApplications: 2,
      approvedApplications: 2,
      rejectedApplications: 1
    });
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (!user) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="dashboard">
      {/* Навигация */}
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <img src="/logo.svg" alt="Логотип" className="nav-logo" />
          <span>Личный кабинет</span>
        </div>
        <div className="nav-actions">
          <button className="nav-button" onClick={() => navigate('/profile')}>
            👤 {user.name}
          </button>
          <button className="nav-button" onClick={handleLogout}>
            Выход
          </button>
        </div>
      </nav>

      {/* Основной контент */}
      <div className="dashboard-container">
        {/* Приветствие */}
        <div className="dashboard-welcome">
          <h1>Добро пожаловать, {user.name}!</h1>
          <p>Студент • {user.email}</p>
        </div>

        {/* Статистика */}
        <div className="stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalApplications}</div>
              <div className="stat-label">Всего заявлений</div>
            </div>
          </div>

          <div className="stat-card stat-pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <div className="stat-value">{stats.pendingApplications}</div>
              <div className="stat-label">На рассмотрении</div>
            </div>
          </div>

          <div className="stat-card stat-approved">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-value">{stats.approvedApplications}</div>
              <div className="stat-label">Одобрено</div>
            </div>
          </div>

          <div className="stat-card stat-rejected">
            <div className="stat-icon">❌</div>
            <div className="stat-info">
              <div className="stat-value">{stats.rejectedApplications}</div>
              <div className="stat-label">Отклонено</div>
            </div>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="quick-actions">
          <h2>Быстрые действия</h2>
          <div className="actions-grid">
            <button 
              className="action-card"
              onClick={() => navigate('/applications/new')}
            >
              <div className="action-icon">📝</div>
              <div className="action-info">
                <h3>Подать заявление</h3>
                <p>Справка, академический отпуск и др.</p>
              </div>
            </button>

            <button 
              className="action-card"
              onClick={() => navigate('/applications')}
            >
              <div className="action-icon">📋</div>
              <div className="action-info">
                <h3>Мои заявления</h3>
                <p>История и статусы</p>
              </div>
            </button>

            <button 
              className="action-card"
              onClick={() => navigate('/schedule')}
            >
              <div className="action-icon">📅</div>
              <div className="action-info">
                <h3>Расписание</h3>
                <p>Занятия и экзамены</p>
              </div>
            </button>

            <button 
              className="action-card"
              onClick={() => navigate('/events')}
            >
              <div className="action-icon">🎉</div>
              <div className="action-info">
                <h3>Мероприятия</h3>
                <p>Университетские события</p>
              </div>
            </button>
          </div>
        </div>

        {/* Недавние заявления */}
        <div className="recent-applications">
          <h2>Последние заявления</h2>
          <div className="applications-list">
            <div className="application-item pending">
              <div className="application-header">
                <span className="application-type">Справка об обучении</span>
                <span className="application-status">На рассмотрении</span>
              </div>
              <div className="application-date">5 ноября 2025</div>
            </div>

            <div className="application-item approved">
              <div className="application-header">
                <span className="application-type">Справка о стипендии</span>
                <span className="application-status">Одобрено</span>
              </div>
              <div className="application-date">1 ноября 2025</div>
            </div>

            <div className="application-item pending">
              <div className="application-header">
                <span className="application-type">Выписка из зачётной книжки</span>
                <span className="application-status">На рассмотрении</span>
              </div>
              <div className="application-date">28 октября 2025</div>
            </div>
          </div>

          <button 
            className="view-all-btn"
            onClick={() => navigate('/applications')}
          >
            Показать все →
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
