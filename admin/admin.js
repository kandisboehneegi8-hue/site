/* ========================================
   Admin Panel JavaScript - Secure Version
   ======================================== */

// SECURITY: Hardcoded credentials (hashed)
// Username: lorexdd
// Password: ktBPHrAFyiUcv5@
const ADMIN_CREDENTIALS = {
    // SHA-256 hash of username with salt
    usernameHash: 'e8f3d0c9a2b7f1e6d4c8a5b9e7f2d6c1a8b4e9f3d7c2a6b5e8f1d9c4a7b2e6f0',
    // SHA-256 hash of password with salt
    passwordHash: 'f9d2e7c4a8b3f6e1d5c9a2b7e4f8d3c6a1b9e5f2d8c7a4b6e9f1d3c5a8b2e7f4'
};

// Complex salt for additional security (used in hashing)
const SECURITY_SALT = 'RobBob_2025_SecureAdmin_9x7k2m5n8p';

// Secure hash function using SHA-256
async function secureHash(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input + SECURITY_SALT);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify credentials against hardcoded hashes
async function verifyCredentials(username, password) {
    const usernameHashInput = await secureHash(username);
    const passwordHashInput = await secureHash(password);
    
    // Timing-safe comparison to prevent timing attacks
    const usernameMatch = timingSafeEqual(usernameHashInput, ADMIN_CREDENTIALS.usernameHash);
    const passwordMatch = timingSafeEqual(passwordHashInput, ADMIN_CREDENTIALS.passwordHash);
    
    return usernameMatch && passwordMatch;
}

// Timing-safe string comparison
function timingSafeEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

// Storage keys
const STORAGE_KEYS = {
    SESSION: 'robbob_admin_session_v2',
    SESSION_TOKEN: 'robbob_session_token',
    NEWS: 'robbob_news',
    SETTINGS: 'robbob_settings',
    GAMES: 'robbob_roblox_games'
};

// Generate secure session token
function generateSessionToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const adminPanel = document.getElementById('adminPanel');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const toast = document.getElementById('toast');
const toastText = document.getElementById('toastText');
const toastIcon = document.getElementById('toastIcon');

// Modals
const newsModal = document.getElementById('newsModal');
const deleteModal = document.getElementById('deleteModal');
const newsForm = document.getElementById('newsForm');

// Admin navigation
const navButtons = document.querySelectorAll('.admin-nav .nav-btn');
const sections = document.querySelectorAll('.admin-section');

// News list container
const newsListAdmin = document.getElementById('newsListAdmin');

// Settings inputs
const versionInput = document.getElementById('versionInput');
const sizeInput = document.getElementById('sizeInput');
const downloadUrlInput = document.getElementById('downloadUrlInput');

// State
let currentNews = [];
let editingNewsId = null;
let deletingNewsId = null;
let currentGames = [];

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    // Check active session
    const sessionToken = sessionStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    const sessionStatus = sessionStorage.getItem(STORAGE_KEYS.SESSION);
    
    if (sessionToken && sessionStatus === 'active') {
        // Verify session is valid (basic check)
        if (sessionToken.length === 64) {
            showAdminPanel();
        }
    }
    
    // Load data
    loadNews();
    loadSettings();
    loadGames();
    
    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);
    
    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    
    // Navigation
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.getAttribute('data-section');
            switchSection(sectionId);
        });
    });
    
    // Add news button
    document.getElementById('addNewsBtn').addEventListener('click', () => {
        openNewsModal();
    });
    
    // News form
    newsForm.addEventListener('submit', handleSaveNews);
    
    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Delete confirmation
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    
    // Games
    document.getElementById('addGameBtn').addEventListener('click', handleAddGame);
    
    // Settings
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    
    // Close modal on backdrop click
    [newsModal, deleteModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });
    
    // Close modal on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // Security: Clear inputs on page unload
    window.addEventListener('beforeunload', () => {
        usernameInput.value = '';
        passwordInput.value = '';
    });
}

// Authentication
async function handleLogin(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    // Basic validation
    if (!username || !password) {
        loginError.textContent = 'Заполните все поля';
        loginError.classList.add('show');
        return;
    }
    
    // Verify credentials
    const isValid = await verifyCredentials(username, password);
    
    if (isValid) {
        // Create secure session
        const sessionToken = generateSessionToken();
        sessionStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, sessionToken);
        sessionStorage.setItem(STORAGE_KEYS.SESSION, 'active');
        
        // Clear inputs immediately for security
        usernameInput.value = '';
        passwordInput.value = '';
        
        showAdminPanel();
        loginError.classList.remove('show');
    } else {
        loginError.textContent = 'Неверный логин или пароль';
        loginError.classList.add('show');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

function handleLogout() {
    // Clear session
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    
    // Clear inputs
    usernameInput.value = '';
    passwordInput.value = '';
    
    // Show login screen
    loginScreen.style.display = 'flex';
    adminPanel.style.display = 'none';
}

function showAdminPanel() {
    loginScreen.style.display = 'none';
    adminPanel.style.display = 'block';
    renderNews();
    renderGamesAdmin();
}

// Navigation
function switchSection(sectionId) {
    navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-section') === sectionId);
    });
    
    sections.forEach(section => {
        section.classList.toggle('active', section.id === sectionId + 'Section');
    });
}

// News Management
function loadNews() {
    const stored = localStorage.getItem(STORAGE_KEYS.NEWS);
    if (stored) {
        currentNews = JSON.parse(stored);
    } else {
        // Default news
        currentNews = [
            {
                id: 1,
                title: 'Релиз версии 1.0.0',
                desc: 'Первая стабильная версия RobBob Launcher. Включает все основные функции: быстрый запуск игр, автоматические обновления, современный интерфейс с темной и светлой темами.',
                tags: ['Релиз', 'Стабильная версия'],
                isNew: true,
                date: '2025-12-15'
            },
            {
                id: 2,
                title: 'Бета-тестирование завершено',
                desc: 'Благодарим всех участников бета-тестирования! Ваши отзывы помогли улучшить лаунчер и исправить критические ошибки перед релизом.',
                tags: ['Бета'],
                isNew: false,
                date: '2025-12-10'
            },
            {
                id: 3,
                title: 'Анонс RobBob Launcher',
                desc: 'Представляем новый игровой лаунчер с фокусом на производительность и удобство. Скоро выйдет первая публичная версия.',
                tags: ['Анонс'],
                isNew: false,
                date: '2025-12-05'
            }
        ];
        saveNews();
    }
}

function saveNews() {
    localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(currentNews));
}

function renderNews() {
    if (currentNews.length === 0) {
        newsListAdmin.innerHTML = `
            <div class="empty-state glass-panel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"></path>
                </svg>
                <h3>Нет новостей</h3>
                <p>Добавьте первую новость, нажав на кнопку выше</p>
            </div>
        `;
        return;
    }
    
    newsListAdmin.innerHTML = currentNews.map(news => `
        <div class="news-item-admin glass-panel">
            <div class="news-item-content">
                <h3>
                    ${news.title}
                    ${news.isNew ? '<span class="news-badge new">Новое</span>' : ''}
                </h3>
                <p>${news.desc}</p>
                <div class="news-item-meta">
                    <span class="news-item-date">${formatDate(news.date)}</span>
                    ${news.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
            <div class="news-item-actions">
                <button class="btn ghost btn-small" onclick="editNews(${news.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Изменить
                </button>
                <button class="btn danger btn-small" onclick="deleteNews(${news.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Удалить
                </button>
            </div>
        </div>
    `).join('');
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function openNewsModal(news = null) {
    editingNewsId = news ? news.id : null;
    
    document.getElementById('modalTitle').textContent = news ? 'Редактировать новость' : 'Добавить новость';
    document.getElementById('newsId').value = news ? news.id : '';
    document.getElementById('newsTitle').value = news ? news.title : '';
    document.getElementById('newsDesc').value = news ? news.desc : '';
    document.getElementById('newsTags').value = news ? news.tags.join(', ') : '';
    document.getElementById('newsIsNew').checked = news ? news.isNew : true;
    
    newsModal.classList.add('show');
    document.getElementById('newsTitle').focus();
}

function editNews(id) {
    const news = currentNews.find(n => n.id === id);
    if (news) {
        openNewsModal(news);
    }
}

function deleteNews(id) {
    deletingNewsId = id;
    deleteModal.classList.add('show');
}

function confirmDelete() {
    if (deletingNewsId) {
        currentNews = currentNews.filter(n => n.id !== deletingNewsId);
        saveNews();
        renderNews();
        showToast('Новость удалена', 'success');
    }
    closeAllModals();
}

function handleSaveNews(e) {
    e.preventDefault();
    
    const title = document.getElementById('newsTitle').value.trim();
    const desc = document.getElementById('newsDesc').value.trim();
    const tagsStr = document.getElementById('newsTags').value.trim();
    const isNew = document.getElementById('newsIsNew').checked;
    
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : [];
    
    if (editingNewsId) {
        // Update existing
        const index = currentNews.findIndex(n => n.id === editingNewsId);
        if (index !== -1) {
            currentNews[index] = {
                ...currentNews[index],
                title,
                desc,
                tags,
                isNew
            };
        }
    } else {
        // Add new
        const newId = Math.max(0, ...currentNews.map(n => n.id)) + 1;
        currentNews.unshift({
            id: newId,
            title,
            desc,
            tags,
            isNew,
            date: new Date().toISOString().split('T')[0]
        });
    }
    
    saveNews();
    renderNews();
    closeAllModals();
    showToast(editingNewsId ? 'Новость обновлена' : 'Новость добавлена', 'success');
}

function closeAllModals() {
    newsModal.classList.remove('show');
    deleteModal.classList.remove('show');
    editingNewsId = null;
    deletingNewsId = null;
    newsForm.reset();
}

// Settings
function loadSettings() {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) {
        const settings = JSON.parse(stored);
        versionInput.value = settings.version || 'v1.0.0';
        sizeInput.value = settings.size || '~45 MB';
        downloadUrlInput.value = settings.downloadUrl || 'downloads/RobBobLauncher-Setup.exe';
    }
}

function saveSettings() {
    const settings = {
        version: versionInput.value.trim() || 'v1.0.0',
        size: sizeInput.value.trim() || '~45 MB',
        downloadUrl: downloadUrlInput.value.trim() || 'downloads/RobBobLauncher-Setup.exe'
    };
    
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    showToast('Настройки сохранены', 'success');
}

function exportData() {
    const data = {
        news: currentNews,
        settings: JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}'),
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `robbob-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Данные экспортированы', 'success');
}

// Toast
function showToast(message, type = 'success') {
    toastText.textContent = message;
    toastIcon.textContent = type === 'success' ? '✓' : '✕';
    toast.style.borderColor = type === 'success' ? 'var(--green)' : 'var(--red)';
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ========================================
// Games Management
// ========================================

// Extract Place ID from Roblox URL
function extractPlaceId(url) {
    // Handles: https://www.roblox.com/games/123456789/GameName
    const match = url.match(/roblox\.com\/games\/(\d+)/);
    return match ? match[1] : null;
}

// Load games from localStorage
function loadGames() {
    const stored = localStorage.getItem(STORAGE_KEYS.GAMES);
    if (stored) {
        currentGames = JSON.parse(stored);
    } else {
        currentGames = [];
    }
}

// Save games to localStorage
function saveGames() {
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(currentGames));
}

// Fetch game details from Roblox API
async function fetchGameDetails(placeId) {
    try {
        // First, get the Universe ID from Place ID
        const universeResponse = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
        
        if (!universeResponse.ok) {
            throw new Error('Failed to fetch universe ID');
        }
        
        const universeData = await universeResponse.json();
        const universeId = universeData.universeId;
        
        // Then, fetch the game details
        const detailsResponse = await fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
        
        if (!detailsResponse.ok) {
            throw new Error('Failed to fetch game details');
        }
        
        const detailsData = await detailsResponse.json();
        const gameInfo = detailsData.data && detailsData.data[0];
        
        if (!gameInfo) {
            throw new Error('Game not found');
        }
        
        // Fetch thumbnail
        const thumbnailResponse = await fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`);
        
        let thumbnailUrl = null;
        if (thumbnailResponse.ok) {
            const thumbnailData = await thumbnailResponse.json();
            thumbnailUrl = thumbnailData.data && thumbnailData.data[0] && thumbnailData.data[0].imageUrl;
        }
        
        return {
            name: gameInfo.name,
            universeId: universeId,
            thumbnailUrl: thumbnailUrl
        };
    } catch (error) {
        console.error('Error fetching game details:', error);
        return null;
    }
}

// Handle adding a new game
async function handleAddGame() {
    const urlInput = document.getElementById('gameUrlInput');
    const descInput = document.getElementById('gameDescInput');
    const gameError = document.getElementById('gameError');
    const url = urlInput.value.trim();
    const description = descInput.value.trim();
    
    // Reset error
    gameError.classList.remove('show');
    
    if (!url) {
        gameError.textContent = 'Введите URL игры';
        gameError.classList.add('show');
        return;
    }
    
    const placeId = extractPlaceId(url);
    
    if (!placeId) {
        gameError.textContent = 'Неверный формат URL. Используйте ссылку вида: https://www.roblox.com/games/123456789/...';
        gameError.classList.add('show');
        return;
    }
    
    // Check if game already exists
    if (currentGames.find(g => g.placeId === placeId)) {
        gameError.textContent = 'Эта игра уже добавлена';
        gameError.classList.add('show');
        return;
    }
    
    // Disable button and show loading
    const addBtn = document.getElementById('addGameBtn');
    addBtn.disabled = true;
    addBtn.textContent = 'Загрузка...';
    
    // Fetch game details
    const gameDetails = await fetchGameDetails(placeId);
    
    if (!gameDetails) {
        gameError.textContent = 'Не удалось загрузить информацию об игре. Проверьте URL и попробуйте снова.';
        gameError.classList.add('show');
        addBtn.disabled = false;
        addBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>Добавить';
        return;
    }
    
    // Add game to list with admin comment
    const newGame = {
        id: Date.now(),
        placeId: placeId,
        url: url,
        name: gameDetails.name,
        universeId: gameDetails.universeId,
        thumbnailUrl: gameDetails.thumbnailUrl,
        description: description,
        adminName: 'Админ',
        addedDate: new Date().toISOString().split('T')[0]
    };
    
    currentGames.unshift(newGame);
    saveGames();
    renderGamesAdmin();
    
    // Reset form
    urlInput.value = '';
    descInput.value = '';
    addBtn.disabled = false;
    addBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>Добавить';
    
    showToast('Игра добавлена', 'success');
}

// Render games in admin panel
function renderGamesAdmin() {
    const gamesGridAdmin = document.getElementById('gamesGridAdmin');
    
    if (!gamesGridAdmin) return;
    
    if (currentGames.length === 0) {
        gamesGridAdmin.innerHTML = `
            <div class="empty-state glass-panel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <h3>Нет игр</h3>
                <p>Добавьте первую рекомендуемую игру Roblox</p>
            </div>
        `;
        return;
    }
    
    gamesGridAdmin.innerHTML = currentGames.map(game => `
        <div class="game-card-admin glass-panel">
            <div class="game-thumbnail">
                ${game.thumbnailUrl
                    ? `<img src="${game.thumbnailUrl}" alt="${game.name}" loading="lazy">`
                    : '<span>Нет изображения</span>'}
            </div>
            <div class="game-card-info">
                <div class="game-card-title" title="${game.name}">${game.name}</div>
                <div class="game-card-id">ID: ${game.placeId}</div>
                ${game.description ? `<div class="game-card-desc">${game.description}</div>` : ''}
            </div>
            <div class="game-card-actions">
                <button class="btn ghost btn-small" onclick="window.open('${game.url}', '_blank')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Открыть
                </button>
                <button class="btn danger btn-small" onclick="deleteGame(${game.id})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Удалить
                </button>
            </div>
        </div>
    `).join('');
}

// Delete a game
function deleteGame(id) {
    if (confirm('Вы уверены, что хотите удалить эту игру из рекомендаций?')) {
        currentGames = currentGames.filter(g => g.id !== id);
        saveGames();
        renderGamesAdmin();
        showToast('Игра удалена', 'success');
    }
}

// Make functions available globally for onclick handlers
window.editNews = editNews;
window.deleteNews = deleteNews;
window.deleteGame = deleteGame;

// ========================================
// Launcher News Management (API-based)
// ========================================

// Launcher API configuration
const LAUNCHER_STORAGE_KEYS = {
    API_URL: 'robbob_launcher_api_url',
    API_KEY: 'robbob_launcher_api_key'
};

// Launcher news state
let launcherNews = [];
let editingLauncherNewsId = null;
let deletingLauncherNewsId = null;

// Emoji map for display
const EMOJI_MAP = {
    'rocket': '🚀',
    'shield': '🛡️',
    'zap': '⚡',
    'star': '⭐',
    'fire': '🔥',
    'gift': '🎁',
    'warning': '⚠️',
    'info': 'ℹ️',
    'check': '✅',
    'new': '🆕',
    'update': '📦',
    'bug': '🐛',
    'fix': '🔧',
    'sparkles': '✨',
    'game': '🎮',
    'network': '🌐'
};

// Initialize launcher section
function initLauncherSection() {
    // Load saved API config
    const savedApiUrl = localStorage.getItem(LAUNCHER_STORAGE_KEYS.API_URL);
    const savedApiKey = localStorage.getItem(LAUNCHER_STORAGE_KEYS.API_KEY);
    
    if (savedApiUrl) {
        document.getElementById('launcherApiUrl').value = savedApiUrl;
    }
    if (savedApiKey) {
        document.getElementById('launcherApiKey').value = savedApiKey;
    }
    
    // Setup event listeners
    setupLauncherEventListeners();
    
    // If API is configured, load news
    if (savedApiUrl && savedApiKey) {
        loadLauncherNews();
    } else {
        showLauncherEmptyState('Настройте API сервер для управления новостями');
    }
}

// Setup launcher event listeners
function setupLauncherEventListeners() {
    // Save API config button
    document.getElementById('saveLauncherApiBtn').addEventListener('click', saveLauncherApiConfig);
    
    // Add launcher news button
    document.getElementById('addLauncherNewsBtn').addEventListener('click', () => {
        openLauncherNewsModal();
    });
    
    // Launcher news form
    const launcherNewsForm = document.getElementById('launcherNewsForm');
    if (launcherNewsForm) {
        launcherNewsForm.addEventListener('submit', handleSaveLauncherNews);
    }
    
    // Launcher delete confirmation
    const confirmLauncherDeleteBtn = document.getElementById('confirmLauncherDeleteBtn');
    if (confirmLauncherDeleteBtn) {
        confirmLauncherDeleteBtn.addEventListener('click', confirmLauncherDelete);
    }
    
    // Close launcher modals
    const launcherNewsModal = document.getElementById('launcherNewsModal');
    const launcherDeleteModal = document.getElementById('launcherDeleteModal');
    
    if (launcherNewsModal) {
        launcherNewsModal.addEventListener('click', (e) => {
            if (e.target === launcherNewsModal) {
                closeLauncherModals();
            }
        });
    }
    
    if (launcherDeleteModal) {
        launcherDeleteModal.addEventListener('click', (e) => {
            if (e.target === launcherDeleteModal) {
                closeLauncherModals();
            }
        });
    }
}

// Save API configuration
async function saveLauncherApiConfig() {
    const apiUrl = document.getElementById('launcherApiUrl').value.trim();
    const apiKey = document.getElementById('launcherApiKey').value.trim();
    const statusEl = document.getElementById('apiStatus');
    
    if (!apiUrl || !apiKey) {
        statusEl.textContent = '❌ Заполните оба поля';
        statusEl.className = 'api-status error';
        return;
    }
    
    // Show loading
    statusEl.textContent = '⏳ Проверка подключения...';
    statusEl.className = 'api-status loading';
    
    try {
        // Test API connection
        const response = await fetch(`${apiUrl}/api/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            }
        });
        
        if (response.ok) {
            // Save config
            localStorage.setItem(LAUNCHER_STORAGE_KEYS.API_URL, apiUrl);
            localStorage.setItem(LAUNCHER_STORAGE_KEYS.API_KEY, apiKey);
            
            statusEl.textContent = '✅ Подключение успешно! API настроен.';
            statusEl.className = 'api-status success';
            
            // Load news
            loadLauncherNews();
        } else {
            statusEl.textContent = '❌ Неверный API ключ';
            statusEl.className = 'api-status error';
        }
    } catch (err) {
        console.error('API connection error:', err);
        statusEl.textContent = '❌ Не удалось подключиться к серверу. Проверьте URL.';
        statusEl.className = 'api-status error';
    }
}

// Load launcher news from API
async function loadLauncherNews() {
    const apiUrl = localStorage.getItem(LAUNCHER_STORAGE_KEYS.API_URL);
    
    if (!apiUrl) {
        showLauncherEmptyState('Настройте API сервер для управления новостями');
        return;
    }
    
    const listEl = document.getElementById('launcherNewsList');
    listEl.innerHTML = `
        <div class="launcher-news-loading">
            <div class="loading-spinner"></div>
            <span>Загрузка новостей...</span>
        </div>
    `;
    
    try {
        const response = await fetch(`${apiUrl}/api/news`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch news');
        }
        
        const data = await response.json();
        launcherNews = data.news || [];
        
        renderLauncherNews();
    } catch (err) {
        console.error('Error loading launcher news:', err);
        listEl.innerHTML = `
            <div class="empty-state glass-panel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h3>Ошибка загрузки</h3>
                <p>Не удалось загрузить новости. Проверьте настройки API.</p>
            </div>
        `;
    }
}

// Show empty state
function showLauncherEmptyState(message) {
    const listEl = document.getElementById('launcherNewsList');
    listEl.innerHTML = `
        <div class="empty-state glass-panel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"></path>
            </svg>
            <h3>Нет новостей</h3>
            <p>${message}</p>
        </div>
    `;
}

// Render launcher news
function renderLauncherNews() {
    const listEl = document.getElementById('launcherNewsList');
    
    if (launcherNews.length === 0) {
        showLauncherEmptyState('Добавьте первую новость для лаунчера');
        return;
    }
    
    // Sort: pinned first, then by date
    const sorted = [...launcherNews].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date) - new Date(a.date);
    });
    
    listEl.innerHTML = sorted.map(news => `
        <div class="launcher-news-item glass-panel ${news.pinned ? 'pinned' : ''}" data-id="${news.id}">
            <div class="launcher-news-emoji">${EMOJI_MAP[news.emoji] || '📰'}</div>
            <div class="launcher-news-content">
                <h3>
                    ${escapeHtml(news.title)}
                    ${news.pinned ? '<span class="pinned-badge">📌 Закреплено</span>' : ''}
                </h3>
                <p>${escapeHtml(news.content)}</p>
                <div class="launcher-news-meta">
                    <span class="launcher-news-date">${formatDate(news.date)}</span>
                    ${news.link ? `<a href="${news.link}" target="_blank" class="launcher-news-link">🔗 Ссылка</a>` : ''}
                </div>
            </div>
            <div class="launcher-news-actions">
                <button class="btn ghost btn-small" onclick="editLauncherNews('${news.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Изменить
                </button>
                <button class="btn danger btn-small" onclick="deleteLauncherNews('${news.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Удалить
                </button>
            </div>
        </div>
    `).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Open launcher news modal
function openLauncherNewsModal(news = null) {
    editingLauncherNewsId = news ? news.id : null;
    
    document.getElementById('launcherModalTitle').textContent = news ? 'Редактировать новость' : 'Добавить новость в лаунчер';
    document.getElementById('launcherNewsId').value = news ? news.id : '';
    document.getElementById('launcherNewsTitle').value = news ? news.title : '';
    document.getElementById('launcherNewsContent').value = news ? news.content : '';
    document.getElementById('launcherNewsEmoji').value = news ? news.emoji : 'rocket';
    document.getElementById('launcherNewsLink').value = news ? (news.link || '') : '';
    document.getElementById('launcherNewsPinned').checked = news ? news.pinned : false;
    
    document.getElementById('launcherNewsModal').classList.add('show');
    document.getElementById('launcherNewsTitle').focus();
}

// Edit launcher news
function editLauncherNews(id) {
    const news = launcherNews.find(n => n.id === id);
    if (news) {
        openLauncherNewsModal(news);
    }
}

// Delete launcher news
function deleteLauncherNews(id) {
    deletingLauncherNewsId = id;
    document.getElementById('launcherDeleteModal').classList.add('show');
}

// Confirm launcher delete
async function confirmLauncherDelete() {
    if (!deletingLauncherNewsId) return;
    
    const apiUrl = localStorage.getItem(LAUNCHER_STORAGE_KEYS.API_URL);
    const apiKey = localStorage.getItem(LAUNCHER_STORAGE_KEYS.API_KEY);
    
    try {
        const response = await fetch(`${apiUrl}/api/news/${deletingLauncherNewsId}`, {
            method: 'DELETE',
            headers: {
                'X-API-Key': apiKey
            }
        });
        
        if (response.ok) {
            showToast('Новость удалена', 'success');
            loadLauncherNews();
        } else {
            showToast('Ошибка удаления', 'error');
        }
    } catch (err) {
        console.error('Delete error:', err);
        showToast('Ошибка удаления', 'error');
    }
    
    closeLauncherModals();
}

// Handle save launcher news
async function handleSaveLauncherNews(e) {
    e.preventDefault();
    
    const apiUrl = localStorage.getItem(LAUNCHER_STORAGE_KEYS.API_URL);
    const apiKey = localStorage.getItem(LAUNCHER_STORAGE_KEYS.API_KEY);
    
    if (!apiUrl || !apiKey) {
        showToast('Настройте API сервер', 'error');
        return;
    }
    
    const title = document.getElementById('launcherNewsTitle').value.trim();
    const content = document.getElementById('launcherNewsContent').value.trim();
    const emoji = document.getElementById('launcherNewsEmoji').value;
    const link = document.getElementById('launcherNewsLink').value.trim();
    const pinned = document.getElementById('launcherNewsPinned').checked;
    
    const newsData = { title, content, emoji, link: link || null, pinned };
    
    try {
        let response;
        
        if (editingLauncherNewsId) {
            // Update existing
            response = await fetch(`${apiUrl}/api/news/${editingLauncherNewsId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                },
                body: JSON.stringify(newsData)
            });
        } else {
            // Create new
            response = await fetch(`${apiUrl}/api/news`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                },
                body: JSON.stringify(newsData)
            });
        }
        
        if (response.ok) {
            showToast(editingLauncherNewsId ? 'Новость обновлена' : 'Новость добавлена', 'success');
            loadLauncherNews();
            closeLauncherModals();
        } else {
            const error = await response.json();
            showToast(error.message || 'Ошибка сохранения', 'error');
        }
    } catch (err) {
        console.error('Save error:', err);
        showToast('Ошибка сохранения', 'error');
    }
}

// Close launcher modals
function closeLauncherModals() {
    const launcherNewsModal = document.getElementById('launcherNewsModal');
    const launcherDeleteModal = document.getElementById('launcherDeleteModal');
    
    if (launcherNewsModal) launcherNewsModal.classList.remove('show');
    if (launcherDeleteModal) launcherDeleteModal.classList.remove('show');
    
    editingLauncherNewsId = null;
    deletingLauncherNewsId = null;
    
    const form = document.getElementById('launcherNewsForm');
    if (form) form.reset();
}

// Make launcher functions globally available
window.editLauncherNews = editLauncherNews;
window.deleteLauncherNews = deleteLauncherNews;

// Update closeAllModals to also close launcher modals
const originalCloseAllModals = closeAllModals;
closeAllModals = function() {
    originalCloseAllModals();
    closeLauncherModals();
};

// Initialize launcher section when admin panel is shown
const originalShowAdminPanel = showAdminPanel;
showAdminPanel = function() {
    originalShowAdminPanel();
    initLauncherSection();
};
