import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/User.js';

// Middleware для проверки аутентификации
export const authenticate = async (req, res, next) => {
  try {
    // Получение токена из заголовка Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Токен не предоставлен'
      });
    }
    
    const token = authHeader.substring(7); // Убираем "Bearer "
    
    // Верификация токена
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Недействительный или истекший токен'
      });
    }
    
    // Получение пользователя из базы
    const user = await User.findById(decoded.userId).select('-password -refreshToken');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    // Проверка подтверждения email
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email не подтвержден. Пожалуйста, подтвердите ваш email'
      });
    }
    
    // Добавление пользователя в request
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Ошибка аутентификации:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при аутентификации'
    });
  }
};

// Middleware для проверки прав доступа к проекту
export const checkProjectAccess = (requiredRole = null) => {
  return async (req, res, next) => {
    try {
      const project = req.project; // Должен быть установлен предыдущим middleware
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Проект не найден'
        });
      }
      
      const hasAccess = project.hasAccess(req.user._id, requiredRole);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Недостаточно прав для выполнения этого действия'
        });
      }
      
      // Добавление роли пользователя в request
      req.userRole = project.getUserRole(req.user._id);
      next();
      
    } catch (error) {
      console.error('Ошибка проверки доступа:', error);
      return res.status(500).json({
        success: false,
        message: 'Ошибка сервера при проверке доступа'
      });
    }
  };
};
