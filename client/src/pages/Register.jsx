import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/Login.css';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    studentId: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Валидация
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        studentId: formData.studentId
      });

      if (result.success) {
        // Успешная регистрация - перенаправляем на вход
        navigate('/login', { 
          state: { message: 'Регистрация успешна! Войдите в систему.' }
        });
      } else {
        setError(result.message || 'Ошибка регистрации');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка регистрации. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <img src="/logo.svg" alt="Университет" className="login-logo" />
          <h1>Регистрация</h1>
          <p>Создайте аккаунт для доступа к личному кабинету</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

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
            <label htmlFor="studentId">Студенческий билет</label>
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
            <label htmlFor="email">Электронная почта</label>
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
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Минимум 6 символов"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Подтвердите пароль</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Повторите пароль"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>

          <div className="login-divider">
            <span>Уже есть аккаунт?</span>
          </div>

          <Link to="/login" className="btn-secondary">
            Войти
          </Link>
        </form>

        <footer className="login-footer">
          <p>© 2025 Университет. Все права защищены.</p>
        </footer>
      </div>
    </div>
  );
}

export default Register;
