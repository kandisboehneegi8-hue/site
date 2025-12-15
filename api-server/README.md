# RobBob Launcher API Server

API сервер для управления новостями лаунчера RobBob.

## Требования

- Node.js 16+
- npm или yarn

## Установка

```bash
# Клонируйте или скопируйте папку api-server на ваш VDS
cd api-server

# Установите зависимости
npm install

# Запустите сервер
npm start

# Или для разработки с auto-reload
npm run dev
```

## Настройка

### Переменные окружения

Создайте файл `.env` или установите переменные окружения:

```bash
# Порт сервера (по умолчанию 3001)
PORT=3001

# API ключ для авторизации админки
# ВАЖНО: Измените на свой безопасный ключ!
ADMIN_API_KEY=your-secure-api-key-here
```

### Запуск через systemd (рекомендуется для продакшена)

Создайте файл `/etc/systemd/system/robbob-api.service`:

```ini
[Unit]
Description=RobBob Launcher API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/api-server
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=PORT=3001
Environment=ADMIN_API_KEY=your-secure-api-key

[Install]
WantedBy=multi-user.target
```

Затем:

```bash
sudo systemctl daemon-reload
sudo systemctl enable robbob-api
sudo systemctl start robbob-api
```

### Настройка Nginx (рекомендуется)

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Для HTTPS используйте certbot:

```bash
sudo certbot --nginx -d api.your-domain.com
```

## API Endpoints

### Публичные (для лаунчера)

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/news` | Получить все новости |
| GET | `/api/health` | Health check |
| GET | `/` | Информация об API |

### Защищённые (требуется X-API-Key header)

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/news` | Добавить новость |
| PUT | `/api/news/:id` | Обновить новость |
| DELETE | `/api/news/:id` | Удалить новость |
| POST | `/api/auth/verify` | Проверить API ключ |

## Формат данных

### Новость

```json
{
  "id": "unique-id",
  "title": "Заголовок новости",
  "content": "Текст новости",
  "emoji": "rocket",
  "pinned": false,
  "link": "https://example.com",
  "date": "2025-12-15"
}
```

### Доступные emoji

- `rocket` - 🚀
- `shield` - 🛡️
- `zap` - ⚡
- `star` - ⭐
- `fire` - 🔥
- `gift` - 🎁
- `warning` - ⚠️
- `info` - ℹ️
- `check` - ✅
- `new` - 🆕
- `update` - 📦
- `bug` - 🐛
- `fix` - 🔧
- `sparkles` - ✨
- `game` - 🎮
- `network` - 🌐

## Примеры запросов

### Получить новости

```bash
curl http://localhost:3001/api/news
```

### Добавить новость

```bash
curl -X POST http://localhost:3001/api/news \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "title": "Новое обновление",
    "content": "Описание обновления",
    "emoji": "rocket",
    "pinned": false
  }'
```

### Удалить новость

```bash
curl -X DELETE http://localhost:3001/api/news/news-id \
  -H "X-API-Key: your-api-key"
```

## Хранение данных

Новости хранятся в файле `data/news.json`. Файл создаётся автоматически при первом запуске.

## Безопасность

1. **Обязательно** измените API_KEY на свой уникальный ключ
2. Используйте HTTPS в продакшене
3. Ограничьте доступ через firewall если нужно
