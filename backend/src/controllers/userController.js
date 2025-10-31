import User from '../models/User.js';
import { deleteFile } from '../utils/upload.js';
import path from 'path';

// Получение профиля текущего пользователя
export const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toPublicJSON()
      }
    });
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении профиля'
    });
  }
};

// Обновление профиля
export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    if (name) {
      if (name.length < 2 || name.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Имя должно содержать от 2 до 50 символов'
        });
      }
      user.name = name;
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Профиль успешно обновлен',
      data: {
        user: user.toPublicJSON()
      }
    });
    
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении профиля'
    });
  }
};

// Загрузка аватара
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Файл не загружен'
      });
    }
    
    const user = await User.findById(req.user._id);
    
    // Удаление старого аватара
    if (user.avatar) {
      const oldAvatarPath = path.join(process.cwd(), user.avatar);
      deleteFile(oldAvatarPath);
    }
    
    // Сохранение пути к новому аватару
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();
    
    res.json({
      success: true,
      message: 'Аватар успешно загружен',
      data: {
        avatar: user.avatar
      }
    });
    
  } catch (error) {
    console.error('Ошибка загрузки аватара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при загрузке аватара'
    });
  }
};

// Удаление аватара
export const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.avatar) {
      const avatarPath = path.join(process.cwd(), user.avatar);
      deleteFile(avatarPath);
      user.avatar = null;
      await user.save();
    }
    
    res.json({
      success: true,
      message: 'Аватар успешно удален'
    });
    
  } catch (error) {
    console.error('Ошибка удаления аватара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении аватара'
    });
  }
};

// Смена пароля
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Все поля обязательны'
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Новые пароли не совпадают'
      });
    }
    
    // Проверка формата пароля
    const passwordRegex = /^(?=.*[A-Za-zА-Яа-я])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Пароль должен содержать минимум 8 символов, хотя бы 1 цифру и 1 букву'
      });
    }
    
    const user = await User.findById(req.user._id);
    
    // Проверка текущего пароля
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Неверный текущий пароль'
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Пароль успешно изменен'
    });
    
  } catch (error) {
    console.error('Ошибка смены пароля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при смене пароля'
    });
  }
};
