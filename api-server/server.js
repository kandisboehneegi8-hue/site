/**
 * RobBob Launcher API Server
 * 
 * Управление новостями для лаунчера
 * Используется админ-панелью сайта и лаунчером
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// API ключ для авторизации админки
// ВАЖНО: Измените на свой безопасный ключ!
const API_KEY = process.env.ADMIN_API_KEY || 'robbob-admin-key-change-me';

// Путь к файлу с данными
const DATA_DIR = path.join(__dirname, 'data');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');

// Создаем директорию для данных если её нет
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Middleware
app.use(cors({
  origin: '*', // Разрешаем запросы отовсюду (для лаунчера и админки)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key']
}));
app.use(express.json());

// Логирование запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Middleware для проверки API ключа
 */
function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    console.log('Unauthorized request - invalid API key');
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing API key' });
  }
  next();
}

/**
 * Чтение новостей из файла
 */
function readNews() {
  try {
    if (fs.existsSync(NEWS_FILE)) {
      const data = fs.readFileSync(NEWS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading news file:', e);
  }
  // Возвращаем структуру по умолчанию
  return { 
    news: getDefaultNews(), 
    lastUpdated: new Date().toISOString() 
  };
}

/**
 * Запись новостей в файл
 */
function writeNews(data) {
  try {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(NEWS_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error writing news file:', e);
    return false;
  }
}

/**
 * Новости по умолчанию
 */
function getDefaultNews() {
  return [
    {
      id: '1',
      title: 'Добро пожаловать в RobBob!',
      content: 'Первый релиз RobBob Launcher с улучшенным сетевым режимом!',
      emoji: 'rocket',
      pinned: true,
      link: null,
      date: new Date().toISOString().split('T')[0]
    },
    {
      id: '2',
      title: 'Безопасное подключение',
      content: 'Сетевой режим активируется автоматически вместе с лаунчером.',
      emoji: 'shield',
      pinned: false,
      link: null,
      date: new Date().toISOString().split('T')[0]
    }
  ];
}

/**
 * Генерация уникального ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * GET /api/news
 * Получить все новости (публичный endpoint для лаунчера)
 */
app.get('/api/news', (req, res) => {
  const data = readNews();
  res.json(data);
});

/**
 * POST /api/news
 * Добавить новость (требуется API ключ)
 */
app.post('/api/news', authMiddleware, (req, res) => {
  const { title, content, emoji, pinned, link } = req.body;
  
  // Валидация
  if (!title || !content) {
    return res.status(400).json({ 
      error: 'Validation error', 
      message: 'Title and content are required' 
    });
  }
  
  const data = readNews();
  
  const newNews = {
    id: generateId(),
    title: title.trim(),
    content: content.trim(),
    emoji: emoji || 'rocket',
    pinned: pinned || false,
    link: link || null,
    date: new Date().toISOString().split('T')[0]
  };
  
  // Добавляем в начало списка
  data.news.unshift(newNews);
  
  if (writeNews(data)) {
    console.log('News added:', newNews.id, newNews.title);
    res.status(201).json({ success: true, news: newNews });
  } else {
    res.status(500).json({ error: 'Server error', message: 'Failed to save news' });
  }
});

/**
 * PUT /api/news/:id
 * Обновить новость (требуется API ключ)
 */
app.put('/api/news/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, content, emoji, pinned, link } = req.body;
  
  const data = readNews();
  const index = data.news.findIndex(n => n.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Not found', message: 'News not found' });
  }
  
  // Обновляем поля
  if (title !== undefined) data.news[index].title = title.trim();
  if (content !== undefined) data.news[index].content = content.trim();
  if (emoji !== undefined) data.news[index].emoji = emoji;
  if (pinned !== undefined) data.news[index].pinned = pinned;
  if (link !== undefined) data.news[index].link = link;
  
  if (writeNews(data)) {
    console.log('News updated:', id);
    res.json({ success: true, news: data.news[index] });
  } else {
    res.status(500).json({ error: 'Server error', message: 'Failed to update news' });
  }
});

/**
 * DELETE /api/news/:id
 * Удалить новость (требуется API ключ)
 */
app.delete('/api/news/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  
  const data = readNews();
  const originalLength = data.news.length;
  data.news = data.news.filter(n => n.id !== id);
  
  if (data.news.length === originalLength) {
    return res.status(404).json({ error: 'Not found', message: 'News not found' });
  }
  
  if (writeNews(data)) {
    console.log('News deleted:', id);
    res.json({ success: true, message: 'News deleted' });
  } else {
    res.status(500).json({ error: 'Server error', message: 'Failed to delete news' });
  }
});

/**
 * POST /api/auth/verify
 * Проверка API ключа (для админки)
 */
app.post('/api/auth/verify', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey === API_KEY) {
    res.json({ success: true, message: 'API key is valid' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid API key' });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * GET /
 * Главная страница API
 */
app.get('/', (req, res) => {
  res.json({
    name: 'RobBob Launcher API',
    version: '1.0.0',
    endpoints: {
      'GET /api/news': 'Get all news (public)',
      'POST /api/news': 'Add news (requires API key)',
      'PUT /api/news/:id': 'Update news (requires API key)',
      'DELETE /api/news/:id': 'Delete news (requires API key)',
      'POST /api/auth/verify': 'Verify API key',
      'GET /api/health': 'Health check'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Server error', message: 'Internal server error' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║       RobBob Launcher API Server          ║
╠═══════════════════════════════════════════╣
║  Port: ${PORT}                               ║
║  API Key: ${API_KEY.substring(0, 10)}...                    ║
╚═══════════════════════════════════════════╝
  `);
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop');
});
