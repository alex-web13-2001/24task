import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AuthPages.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || 'Ошибка входа');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left side - Branding */}
        <div className="auth-branding">
          <div className="auth-logo">
            <div className="logo-icon-large">T24</div>
            <h1 className="brand-title">Task24</h1>
          </div>
          <p className="brand-description">
            Современный менеджер задач для эффективной работы команды
          </p>
        </div>

        {/* Right side - Form */}
        <div className="auth-form-wrapper">
          <div className="auth-form-container">
            <div className="auth-header">
              <h2>Вход в систему</h2>
              <p>Введите свои данные для входа</p>
            </div>

            {error && (
              <div className="auth-error">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
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
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              <div className="form-footer">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Запомнить меня</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Забыли пароль?
                </Link>
              </div>

              <button
                type="submit"
                className="btn-primary btn-large"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Вход...</span>
                  </>
                ) : (
                  'Войти'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Нет аккаунта?{' '}
                <Link to="/register" className="auth-link">
                  Зарегистрироваться
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
