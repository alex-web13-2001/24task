# Task24 Backend API

Backend API для Task Manager на стеке MERN.

## Технологии

- **Node.js** - серверная платформа
- **Express.js** - веб-фреймворк
- **MongoDB** - база данных
- **Mongoose** - ODM для MongoDB
- **Socket.IO** - real-time коммуникация
- **JWT** - аутентификация
- **Nodemailer** - отправка email
- **Multer** - загрузка файлов

## Установка

```bash
# Установка зависимостей
npm install

# Копирование .env.example в .env
cp .env.example .env

# Настройка переменных окружения в .env
```

## Переменные окружения

Настройте следующие переменные в файле `.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/task24

# JWT
JWT_ACCESS_SECRET=your_secret
JWT_REFRESH_SECRET=your_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=Task24 <your_email@gmail.com>

# Frontend
FRONTEND_URL=http://localhost:3000
```

## Запуск

```bash
# Development режим с hot reload
npm run dev

# Production режим
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/verify-email` - Подтверждение email
- `POST /api/auth/login` - Вход
- `POST /api/auth/refresh-token` - Обновление токена
- `POST /api/auth/forgot-password` - Восстановление пароля
- `POST /api/auth/reset-password` - Сброс пароля
- `POST /api/auth/logout` - Выход

### Users
- `GET /api/users/profile` - Получение профиля
- `PUT /api/users/profile` - Обновление профиля
- `POST /api/users/avatar` - Загрузка аватара
- `DELETE /api/users/avatar` - Удаление аватара
- `PUT /api/users/change-password` - Смена пароля

### Projects
- `GET /api/projects` - Список проектов
- `GET /api/projects/:id` - Проект по ID
- `POST /api/projects` - Создание проекта
- `PUT /api/projects/:id` - Обновление проекта
- `POST /api/projects/:id/archive` - Архивирование
- `POST /api/projects/:id/restore` - Восстановление
- `DELETE /api/projects/:id` - Удаление
- `POST /api/projects/:id/leave` - Выход из проекта
- `PUT /api/projects/:id/columns` - Обновление колонок

### Tasks
- `GET /api/tasks` - Список задач
- `GET /api/tasks/archived` - Архивные задачи
- `GET /api/tasks/:id` - Задача по ID
- `POST /api/tasks` - Создание задачи
- `PUT /api/tasks/:id` - Обновление задачи
- `POST /api/tasks/:id/archive` - Архивирование
- `POST /api/tasks/:id/restore` - Восстановление
- `DELETE /api/tasks/:id` - Удаление
- `POST /api/tasks/reorder` - Изменение порядка

### Categories
- `GET /api/categories` - Список категорий
- `GET /api/categories/stats` - Статистика
- `GET /api/categories/:id` - Категория по ID
- `POST /api/categories` - Создание категории
- `PUT /api/categories/:id` - Обновление категории
- `DELETE /api/categories/:id` - Удаление категории

### Invitations
- `GET /api/invitations/token/:token` - Информация о приглашении
- `POST /api/invitations` - Создание приглашения
- `POST /api/invitations/accept` - Принятие приглашения
- `DELETE /api/invitations/projects/:projectId/members/:memberId` - Удаление участника
- `PUT /api/invitations/projects/:projectId/members/:memberId/role` - Изменение роли

## Socket.IO Events

### Client → Server
- `join-project` - Присоединение к комнате проекта
- `leave-project` - Выход из комнаты проекта
- `task-updated` - Задача обновлена
- `task-created` - Задача создана
- `task-deleted` - Задача удалена
- `project-updated` - Проект обновлен

### Server → Client
- `task-updated` - Уведомление об обновлении задачи
- `task-created` - Уведомление о создании задачи
- `task-deleted` - Уведомление об удалении задачи
- `project-updated` - Уведомление об обновлении проекта

## Структура проекта

```
backend/
├── src/
│   ├── config/          # Конфигурация (БД)
│   ├── controllers/     # Контроллеры
│   ├── middleware/      # Middleware (auth)
│   ├── models/          # Mongoose модели
│   ├── routes/          # Express маршруты
│   ├── utils/           # Утилиты (jwt, email, upload)
│   ├── uploads/         # Загруженные файлы
│   └── server.js        # Главный файл сервера
├── .env                 # Переменные окружения
├── .env.example         # Пример .env
├── .gitignore
├── package.json
└── README.md
```

## Деплой

### Требования
- Node.js 18+
- MongoDB 5+
- PM2 (для production)

### Установка на сервере

```bash
# Клонирование репозитория
git clone <repo-url>
cd backend

# Установка зависимостей
npm install

# Настройка .env

# Запуск с PM2
pm2 start src/server.js --name task24-api
pm2 save
pm2 startup
```

## Лицензия

ISC
