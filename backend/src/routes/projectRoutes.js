import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  archiveProject,
  restoreProject,
  deleteProject,
  leaveProject,
  updateColumns
} from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', createProject);
router.put('/:id', updateProject);
router.post('/:id/archive', archiveProject);
router.post('/:id/restore', restoreProject);
router.delete('/:id', deleteProject);
router.post('/:id/leave', leaveProject);
router.put('/:id/columns', updateColumns);

export default router;
