import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.login(email, password);
      if (result.success) {
        // Успешный вход - перенаправляем в личный кабинет
        navigate('/dashboard');
      } else {
        setError(result.message || 'Ошибка входа');
      }
    } catch (err) {
      setError('Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <img src="/logo.svg" alt="Университет" className="login-logo" />
          <h1>Личный кабинет студента</h1>
          <p>Войдите в систему для доступа к сервисам</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Адрес электронной почты</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="form-actions">
            <Link to="/forgot-password" className="forgot-link">
              Забыли пароль?
            </Link>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>

          <div className="login-divider">
            <span>Или</span>
          </div>

          <div className="alternative-auth">
            <Link to="/register" className="btn-secondary">
              Зарегистрироваться
            </Link>
          </div>

          <div className="other-logins">
            <p>Другие способы входа:</p>
            <Link to="/max-login" className="link-secondary">
              Вход через MAX Messenger
            </Link>
          </div>
        </form>

        <footer className="login-footer">
          <p>© 2025 Университет. Все права защищены.</p>
        </footer>
      </div>
    </div>
  );
}

export default Login;
