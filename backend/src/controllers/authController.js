import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken, generateEmailToken, verifyRefreshToken } from '../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';
import crypto from 'crypto';

// Регистрация нового пользователя
export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    
    // Валидация
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Все поля обязательны для заполнения'
      });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Пароли не совпадают'
      });
    }
    
    // Проверка формата пароля (минимум 8 символов, 1 цифра, 1 буква)
    const passwordRegex = /^(?=.*[A-Za-zА-Яа-я])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Пароль должен содержать минимум 8 символов, хотя бы 1 цифру и 1 букву'
      });
    }
    
    // Проверка существования пользователя
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким email уже существует'
      });
    }
    
    // Создание токена для подтверждения email
    const emailToken = generateEmailToken();
    
    // Создание пользователя
    const user = await User.create({
      name,
      email,
      password,
      emailVerificationToken: emailToken,
      emailVerificationExpires: new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 часа
    });
    
    // Отправка email для подтверждения
    try {
      await sendVerificationEmail(email, name, emailToken);
    } catch (emailError) {
      console.error('Ошибка отправки email:', emailError);
      // Продолжаем, даже если email не отправлен
    }
    
    res.status(201).json({
      success: true,
      message: 'Регистрация успешна! Пожалуйста, проверьте ваш email для подтверждения',
      data: {
        user: user.toPublicJSON()
      }
    });
    
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при регистрации'
    });
  }
};

// Подтверждение email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Токен не предоставлен'
      });
    }
    
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Недействительный или истекший токен'
      });
    }
    
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();
    
    res.json({
      success: true,
      message: 'Email успешно подтвержден. Теперь вы можете войти в систему'
    });
    
  } catch (error) {
    console.error('Ошибка подтверждения email:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при подтверждении email'
    });
  }
};

// Вход в систему
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email и пароль обязательны'
      });
    }
    
    // Поиск пользователя
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }
    
    // Проверка пароля
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }
    
    // Проверка подтверждения email
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Пожалуйста, подтвердите ваш email перед входом'
      });
    }
    
    // Генерация токенов
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    // Сохранение refresh токена
    user.refreshToken = refreshToken;
    await user.save();
    
    res.json({
      success: true,
      message: 'Вход выполнен успешно',
      data: {
        user: user.toPublicJSON(),
        accessToken,
        refreshToken
      }
    });
    
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при входе'
    });
  }
};

// Обновление access токена
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh токен не предоставлен'
      });
    }
    
    // Верификация refresh токена
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Недействительный refresh токен'
      });
    }
    
    // Поиск пользователя и проверка токена
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Недействительный refresh токен'
      });
    }
    
    // Генерация новых токенов
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    
    user.refreshToken = newRefreshToken;
    await user.save();
    
    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
    
  } catch (error) {
    console.error('Ошибка обновления токена:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении токена'
    });
  }
};

// Запрос на восстановление пароля
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email обязателен'
      });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      // Не раскрываем, существует ли пользователь
      return res.json({
        success: true,
        message: 'Если пользователь с таким email существует, письмо с инструкциями отправлено'
      });
    }
    
    // Генерация токена для сброса пароля
    const resetToken = generateEmailToken();
    
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 часа
    await user.save();
    
    // Отправка email
    try {
      await sendPasswordResetEmail(email, user.name, resetToken);
    } catch (emailError) {
      console.error('Ошибка отправки email:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Если пользователь с таким email существует, письмо с инструкциями отправлено'
    });
    
  } catch (error) {
    console.error('Ошибка восстановления пароля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при восстановлении пароля'
    });
  }
};

// Сброс пароля
export const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Все поля обязательны'
      });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Пароли не совпадают'
      });
    }
    
    // Проверка формата пароля
    const passwordRegex = /^(?=.*[A-Za-zА-Яа-я])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Пароль должен содержать минимум 8 символов, хотя бы 1 цифру и 1 букву'
      });
    }
    
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Недействительный или истекший токен'
      });
    }
    
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
    
    res.json({
      success: true,
      message: 'Пароль успешно обновлен'
    });
    
  } catch (error) {
    console.error('Ошибка сброса пароля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при сбросе пароля'
    });
  }
};

// Выход из системы
export const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.refreshToken = null;
    await user.save();
    
    res.json({
      success: true,
      message: 'Выход выполнен успешно'
    });
    
  } catch (error) {
    console.error('Ошибка выхода:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при выходе'
    });
  }
};
