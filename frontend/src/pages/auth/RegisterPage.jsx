import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AuthPages.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    setLoading(true);

    try {
      const result = await register(formData);
      if (result.success) {
        navigate('/login');
      } else {
        setError(result.message || 'Ошибка регистрации');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка регистрации');
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
            Присоединяйтесь к тысячам команд, которые уже используют Task24
          </p>
        </div>

        {/* Right side - Form */}
        <div className="auth-form-wrapper">
          <div className="auth-form-container">
            <div className="auth-header">
              <h2>Создать аккаунт</h2>
              <p>Заполните форму для регистрации</p>
            </div>

            {error && (
              <div className="auth-error">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="name">Имя</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Иван Иванов"
                  required
                  autoComplete="name"
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
                  autoComplete="new-password"
                />
                <small className="form-hint">
                  Минимум 8 символов, 1 цифра и 1 буква
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Подтвердите пароль</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
              </div>

              <label className="checkbox-label">
                <input type="checkbox" required />
                <span>
                  Я согласен с{' '}
                  <a href="/terms" className="auth-link">
                    условиями использования
                  </a>
                </span>
              </label>

              <button
                type="submit"
                className="btn-primary btn-large"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Регистрация...</span>
                  </>
                ) : (
                  'Зарегистрироваться'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Уже есть аккаунт?{' '}
                <Link to="/login" className="auth-link">
                  Войти
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
