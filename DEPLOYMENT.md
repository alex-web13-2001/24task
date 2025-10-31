# Руководство по деплою Task24 на Timeweb Cloud

## Подготовка сервера

### 1. Подключение к серверу

```bash
ssh root@your-server-ip
```

### 2. Установка необходимого ПО

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Установка MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org

# Запуск MongoDB
systemctl start mongod
systemctl enable mongod

# Установка PM2
npm install -g pm2

# Установка Nginx
apt install -y nginx

# Установка Certbot для SSL
apt install -y certbot python3-certbot-nginx
```

### 3. Создание пользователя для приложения

```bash
adduser task24
usermod -aG sudo task24
su - task24
```

## Деплой Backend

### 1. Клонирование репозитория

```bash
cd ~
git clone https://github.com/alex-web13-2001/24task.git
cd 24task/backend
```

### 2. Установка зависимостей

```bash
npm install --production
```

### 3. Настройка .env

```bash
cp .env.example .env
nano .env
```

Настройте переменные:
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/task24
JWT_ACCESS_SECRET=ваш_сложный_секрет_для_access_токена
JWT_REFRESH_SECRET=ваш_сложный_секрет_для_refresh_токена
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=ваш_email@gmail.com
EMAIL_PASSWORD=ваш_app_password
EMAIL_FROM=Task24 <ваш_email@gmail.com>
FRONTEND_URL=https://ваш-домен.ru
```

**Важно:** Для Gmail нужно создать App Password:
1. Перейдите в настройки Google Account
2. Security → 2-Step Verification
3. App passwords → создайте пароль для приложения

### 4. Создание директорий для загрузок

```bash
mkdir -p src/uploads/{projects,tasks,avatars}
```

### 5. Запуск с PM2

```bash
pm2 start src/server.js --name task24-api
pm2 save
pm2 startup
```

## Деплой Frontend

### 1. Сборка фронтенда

```bash
cd ~/24task/frontend
npm install
```

### 2. Настройка .env для production

```bash
nano .env
```

```env
VITE_API_URL=https://ваш-домен.ru/api
VITE_SOCKET_URL=https://ваш-домен.ru
```

### 3. Сборка

```bash
npm run build
```

## Настройка Nginx

### 1. Создание конфигурации

```bash
sudo nano /etc/nginx/sites-available/task24
```

```nginx
server {
    listen 80;
    server_name ваш-домен.ru www.ваш-домен.ru;

    # Frontend
    root /home/task24/24task/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploaded files
    location /uploads/ {
        alias /home/task24/24task/backend/src/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 2. Активация конфигурации

```bash
sudo ln -s /etc/nginx/sites-available/task24 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Настройка SSL (HTTPS)

```bash
sudo certbot --nginx -d ваш-домен.ru -d www.ваш-домен.ru
```

Certbot автоматически настроит SSL и обновит конфигурацию Nginx.

## Проверка работы

### 1. Проверка backend

```bash
pm2 status
pm2 logs task24-api
```

### 2. Проверка MongoDB

```bash
sudo systemctl status mongod
```

### 3. Проверка Nginx

```bash
sudo systemctl status nginx
```

### 4. Открытие в браузере

Перейдите на `https://ваш-домен.ru`

## Обновление приложения

### 1. Обновление кода

```bash
cd ~/24task
git pull origin main
```

### 2. Обновление backend

```bash
cd backend
npm install --production
pm2 restart task24-api
```

### 3. Обновление frontend

```bash
cd ../frontend
npm install
npm run build
```

## Мониторинг и логи

### PM2 логи

```bash
pm2 logs task24-api
pm2 logs task24-api --lines 100
```

### Nginx логи

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### MongoDB логи

```bash
sudo tail -f /var/log/mongodb/mongod.log
```

## Резервное копирование

### Backup MongoDB

```bash
mongodump --db task24 --out ~/backups/$(date +%Y%m%d)
```

### Автоматический backup (cron)

```bash
crontab -e
```

Добавьте:
```
0 2 * * * mongodump --db task24 --out ~/backups/$(date +\%Y\%m\%d)
```

## Безопасность

### 1. Firewall (UFW)

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Fail2ban

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Регулярные обновления

```bash
sudo apt update && sudo apt upgrade -y
```

## Troubleshooting

### Backend не запускается

```bash
pm2 logs task24-api --err
```

Проверьте:
- MongoDB запущена: `sudo systemctl status mongod`
- Правильные переменные в .env
- Порт 5000 свободен: `sudo netstat -tlnp | grep 5000`

### Frontend показывает ошибки API

Проверьте:
- Backend работает: `pm2 status`
- Nginx проксирует запросы: `sudo nginx -t`
- CORS настроен правильно в backend

### Socket.IO не работает

Проверьте:
- WebSocket проксирование в Nginx
- Firewall не блокирует соединения
- SSL сертификат валиден

## Полезные команды

```bash
# PM2
pm2 list
pm2 restart task24-api
pm2 stop task24-api
pm2 delete task24-api
pm2 monit

# Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl reload nginx

# MongoDB
sudo systemctl restart mongod
mongosh # подключение к MongoDB

# Логи
pm2 logs
sudo tail -f /var/log/nginx/error.log
```

## Контакты поддержки

При возникновении проблем с деплоем:
- Проверьте логи: `pm2 logs task24-api`
- Проверьте статус сервисов: `pm2 status`, `sudo systemctl status nginx mongod`
- Убедитесь, что все переменные окружения настроены правильно
