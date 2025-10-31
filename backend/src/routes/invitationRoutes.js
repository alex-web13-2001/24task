import express from 'express';
import {
  createInvitation,
  getInvitationByToken,
  acceptInvitation,
  removeMember,
  updateMemberRole
} from '../controllers/invitationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Публичный маршрут для получения информации о приглашении
router.get('/token/:token', getInvitationByToken);

// Защищенные маршруты
router.use(authenticate);

router.post('/', createInvitation);
router.post('/accept', acceptInvitation);
router.delete('/projects/:projectId/members/:memberId', removeMember);
router.put('/projects/:projectId/members/:memberId/role', updateMemberRole);

export default router;
