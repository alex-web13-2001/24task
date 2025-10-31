import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Загрузка переменных окружения
dotenv.config();

// Импорт конфигурации БД
import connectDB from './config/database.js';

// Импорт маршрутов
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Инициализация Express
const app = express();
const httpServer = createServer(app);

// Инициализация Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Статические файлы (загруженные файлы)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Подключение к БД
connectDB();

// API маршруты
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/invitations', invitationRoutes);

// Базовый маршрут
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Task24 API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      projects: '/api/projects',
      tasks: '/api/tasks',
      categories: '/api/categories',
      invitations: '/api/invitations'
    }
  });
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Маршрут не найден'
  });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Внутренняя ошибка сервера'
  });
});

// Socket.IO обработчики
io.on('connection', (socket) => {
  console.log('✅ Клиент подключен:', socket.id);
  
  // Присоединение к комнате проекта
  socket.on('join-project', (projectId) => {
    socket.join(`project:${projectId}`);
    console.log(`Пользователь ${socket.id} присоединился к проекту ${projectId}`);
  });
  
  // Выход из комнаты проекта
  socket.on('leave-project', (projectId) => {
    socket.leave(`project:${projectId}`);
    console.log(`Пользователь ${socket.id} покинул проект ${projectId}`);
  });
  
  // Обновление задачи (broadcast другим пользователям)
  socket.on('task-updated', (data) => {
    socket.to(`project:${data.projectId}`).emit('task-updated', data.task);
  });
  
  // Создание задачи
  socket.on('task-created', (data) => {
    socket.to(`project:${data.projectId}`).emit('task-created', data.task);
  });
  
  // Удаление задачи
  socket.on('task-deleted', (data) => {
    socket.to(`project:${data.projectId}`).emit('task-deleted', data.taskId);
  });
  
  // Обновление проекта
  socket.on('project-updated', (data) => {
    socket.to(`project:${data.projectId}`).emit('project-updated', data.project);
  });
  
  // Отключение
  socket.on('disconnect', () => {
    console.log('❌ Клиент отключен:', socket.id);
  });
});

// Экспорт io для использования в контроллерах (опционально)
export { io };

// Запуск сервера
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📡 Режим: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO: ws://localhost:${PORT}\n`);
});
