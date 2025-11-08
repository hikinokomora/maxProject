import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import axios from 'axios';
import '../styles/ApplicationsList.css';

function ApplicationsList() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const token = authService.getToken();
      // TODO: Замените на реальный API endpoint когда будет готов
      // const response = await axios.get('/api/applications/my', {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      
      // Временные тестовые данные
      const mockApplications = [
        {
          id: 1,
          type: 'certificate',
          typeName: 'Справка об обучении',
          studentName: authService.getUser()?.name || 'Студент',
          studentId: '20221234',
          department: 'Факультет информационных технологий',
          email: authService.getUser()?.email || 'student@edu',
          status: 'pending',
          description: 'Для предоставления в банк',
          createdAt: '2025-11-05T10:30:00Z',
          updatedAt: '2025-11-05T10:30:00Z'
        },
        {
          id: 2,
          type: 'scholarship',
          typeName: 'Справка о стипендии',
          studentName: authService.getUser()?.name || 'Студент',
          studentId: '20221234',
          department: 'Факультет информационных технологий',
          email: authService.getUser()?.email || 'student@edu',
          status: 'approved',
          description: 'Для налоговой',
          createdAt: '2025-11-01T14:20:00Z',
          updatedAt: '2025-11-02T09:15:00Z'
        },
        {
          id: 3,
          type: 'transcript',
          typeName: 'Выписка из зачётной книжки',
          studentName: authService.getUser()?.name || 'Студент',
          studentId: '20221234',
          department: 'Факультет информационных технологий',
          email: authService.getUser()?.email || 'student@edu',
          status: 'pending',
          description: '',
          createdAt: '2025-10-28T16:45:00Z',
          updatedAt: '2025-10-28T16:45:00Z'
        },
        {
          id: 4,
          type: 'dorm',
          typeName: 'Общежитие',
          studentName: authService.getUser()?.name || 'Студент',
          studentId: '20221234',
          department: 'Факультет информационных технологий',
          email: authService.getUser()?.email || 'student@edu',
          status: 'rejected',
          description: 'Заявление на поселение в общежитие',
          createdAt: '2025-10-15T11:00:00Z',
          updatedAt: '2025-10-20T13:30:00Z'
        },
        {
          id: 5,
          type: 'certificate',
          typeName: 'Справка об обучении',
          studentName: authService.getUser()?.name || 'Студент',
          studentId: '20221234',
          department: 'Факультет информационных технологий',
          email: authService.getUser()?.email || 'student@edu',
          status: 'approved',
          description: 'Для военкомата',
          createdAt: '2025-10-10T09:15:00Z',
          updatedAt: '2025-10-11T10:20:00Z'
        }
      ];
      
      setApplications(mockApplications);
      setLoading(false);
    } catch (err) {
      setError('Ошибка загрузки заявлений');
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'На рассмотрении',
      approved: 'Одобрено',
      rejected: 'Отклонено'
    };
    return labels[status] || status;
  };

  const getStatusClass = (status) => {
    return `status-badge status-${status}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  if (!authService.isAuthenticated()) {
    navigate('/login');
    return null;
  }

  return (
    <div className="applications-list-page">
      {/* Навигация */}
      <nav className="applications-nav">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Назад в личный кабинет
        </button>
        <button onClick={() => navigate('/applications/new')} className="new-application-button">
          + Подать новое заявление
        </button>
      </nav>

      <div className="applications-container">
        {/* Заголовок */}
        <div className="applications-header">
          <h1>Мои заявления</h1>
          <p>История всех поданных заявлений</p>
        </div>

        {/* Статистика */}
        <div className="applications-stats">
          <div className="stat-item">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Всего</span>
          </div>
          <div className="stat-item stat-pending">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">На рассмотрении</span>
          </div>
          <div className="stat-item stat-approved">
            <span className="stat-number">{stats.approved}</span>
            <span className="stat-label">Одобрено</span>
          </div>
          <div className="stat-item stat-rejected">
            <span className="stat-number">{stats.rejected}</span>
            <span className="stat-label">Отклонено</span>
          </div>
        </div>

        {/* Фильтры */}
        <div className="applications-filters">
          <button
            className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('all')}
          >
            Все ({stats.total})
          </button>
          <button
            className={filter === 'pending' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('pending')}
          >
            На рассмотрении ({stats.pending})
          </button>
          <button
            className={filter === 'approved' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('approved')}
          >
            Одобрено ({stats.approved})
          </button>
          <button
            className={filter === 'rejected' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('rejected')}
          >
            Отклонено ({stats.rejected})
          </button>
        </div>

        {/* Список заявлений */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Загрузка заявлений...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="empty-state">
            <span>📋</span>
            <h3>Заявлений не найдено</h3>
            <p>
              {filter === 'all' 
                ? 'Вы еще не подавали заявлений'
                : `Нет заявлений со статусом "${getStatusLabel(filter)}"`
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={() => navigate('/applications/new')}
                className="btn-primary"
              >
                Подать первое заявление
              </button>
            )}
          </div>
        ) : (
          <div className="applications-grid">
            {filteredApplications.map(app => (
              <div key={app.id} className="application-card">
                <div className="card-header">
                  <h3>{app.typeName}</h3>
                  <span className={getStatusClass(app.status)}>
                    {getStatusLabel(app.status)}
                  </span>
                </div>
                
                <div className="card-body">
                  {app.description && (
                    <p className="application-description">{app.description}</p>
                  )}
                  
                  <div className="application-details">
                    <div className="detail-item">
                      <span className="detail-label">Студенческий билет:</span>
                      <span className="detail-value">{app.studentId}</span>
                    </div>
                    {app.department && (
                      <div className="detail-item">
                        <span className="detail-label">Факультет:</span>
                        <span className="detail-value">{app.department}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="card-footer">
                  <span className="application-date">
                    📅 Подано: {formatDate(app.createdAt)}
                  </span>
                  {app.createdAt !== app.updatedAt && (
                    <span className="application-date">
                      🔄 Обновлено: {formatDate(app.updatedAt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ApplicationsList;
