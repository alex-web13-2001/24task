import express from 'express';
import {
  getProfile,
  updateProfile,
  uploadAvatar as uploadAvatarController,
  deleteAvatar,
  changePassword
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadAvatar } from '../utils/upload.js';

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/avatar', (req, res, next) => {
  uploadAvatar(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
}, uploadAvatarController);
router.delete('/avatar', deleteAvatar);
router.put('/change-password', changePassword);

export default router;
