import express from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  archiveTask,
  restoreTask,
  deleteTask,
  updateTasksOrder,
  getArchivedTasks
} from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

router.get('/', getTasks);
router.get('/archived', getArchivedTasks);
router.get('/:id', getTaskById);
router.post('/', createTask);
router.put('/:id', updateTask);
router.post('/:id/archive', archiveTask);
router.post('/:id/restore', restoreTask);
router.delete('/:id', deleteTask);
router.post('/reorder', updateTasksOrder);

export default router;
