# Task24 - Task Manager

Полнофункциональный Task Manager на стеке MERN (MongoDB, Express, React, Node.js).

## Возможности

### Реализовано в Backend API:
- ✅ Регистрация и аутентификация (JWT)
- ✅ Подтверждение email
- ✅ Восстановление пароля
- ✅ Управление профилем пользователя
- ✅ CRUD операции для проектов
- ✅ CRUD операции для задач
- ✅ CRUD операции для категорий
- ✅ Система приглашений в проекты
- ✅ Роли пользователей (Owner, Collaborator, Member, Viewer)
- ✅ Архивирование проектов и задач
- ✅ Загрузка файлов (аватары, файлы проектов/задач)
- ✅ Real-time обновления через Socket.IO
- ✅ Kanban колонки с drag & drop поддержкой

### Реализовано в Frontend:
- ✅ Страницы авторизации (вход/регистрация)
- ✅ Базовый дашборд
- ✅ Роутинг и защищенные маршруты
- ✅ Контекст аутентификации
- ✅ API сервисы
- ✅ Socket.IO интеграция
- ⏳ Полный UI (в процессе разработки)

## Структура проекта

```
24task/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── config/       # Конфигурация БД
│   │   ├── controllers/  # Бизнес-логика
│   │   ├── middleware/   # Middleware (auth)
│   │   ├── models/       # Mongoose модели
│   │   ├── routes/       # API маршруты
│   │   ├── utils/        # Утилиты (jwt, email, upload)
│   │   └── server.js     # Главный файл сервера
│   └── package.json
│
└── frontend/         # React + Vite
    ├── src/
    │   ├── components/   # React компоненты
    │   ├── pages/        # Страницы приложения
    │   ├── services/     # API и Socket.IO
    │   ├── contexts/     # React Context
    │   ├── hooks/        # Custom hooks
    │   ├── utils/        # Утилиты
    │   └── styles/       # CSS стили
    └── package.json
```

## Установка и запуск

### Backend

```bash
cd backend
npm install

# Настройка .env (скопируйте .env.example)
cp .env.example .env
# Отредактируйте .env с вашими настройками

# Запуск MongoDB (локально)
# Убедитесь, что MongoDB запущена на localhost:27017

# Development режим
npm run dev

# Production режим
npm start
```

### Frontend

```bash
cd frontend
npm install

# Настройка .env
cp .env.example .env

# Development режим
npm run dev

# Build для production
npm run build
```

## Переменные окружения

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/task24
JWT_ACCESS_SECRET=your_secret
JWT_REFRESH_SECRET=your_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/logout` - Выход
- `POST /api/auth/verify-email` - Подтверждение email
- `POST /api/auth/forgot-password` - Восстановление пароля
- `POST /api/auth/reset-password` - Сброс пароля

### Projects
- `GET /api/projects` - Список проектов
- `POST /api/projects` - Создание проекта
- `GET /api/projects/:id` - Детали проекта
- `PUT /api/projects/:id` - Обновление проекта
- `DELETE /api/projects/:id` - Удаление проекта
- `POST /api/projects/:id/archive` - Архивирование
- `POST /api/projects/:id/restore` - Восстановление

### Tasks
- `GET /api/tasks` - Список задач
- `POST /api/tasks` - Создание задачи
- `GET /api/tasks/:id` - Детали задачи
- `PUT /api/tasks/:id` - Обновление задачи
- `DELETE /api/tasks/:id` - Удаление задачи
- `POST /api/tasks/reorder` - Изменение порядка (drag & drop)

### Categories
- `GET /api/categories` - Список категорий
- `POST /api/categories` - Создание категории
- `PUT /api/categories/:id` - Обновление категории
- `DELETE /api/categories/:id` - Удаление категории

### Invitations
- `POST /api/invitations` - Создание приглашения
- `POST /api/invitations/accept` - Принятие приглашения
- `DELETE /api/invitations/projects/:projectId/members/:memberId` - Удаление участника

## Технологии

### Backend
- Node.js 18+
- Express.js
- MongoDB + Mongoose
- Socket.IO
- JWT (jsonwebtoken)
- Bcrypt
- Nodemailer
- Multer

### Frontend
- React 18
- Vite
- React Router
- Axios
- Socket.IO Client
- React Query
- React Hook Form
- React Hot Toast
- Lucide React (иконки)
- DnD Kit (drag & drop)

## Деплой

### Требования
- Node.js 18+
- MongoDB 5+
- Nginx (для production)
- PM2 (для управления процессами)

### Деплой на сервер

```bash
# Backend
cd backend
npm install --production
pm2 start src/server.js --name task24-api

# Frontend
cd frontend
npm install
npm run build
# Настройте Nginx для обслуживания dist/
```

## Лицензия

ISC

## Автор

Task24 Team
