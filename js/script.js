/* ========================================
   RobBob Launcher Website - JavaScript
   ======================================== */

// Navigation
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetPage = button.getAttribute('data-page');
        
        // Update active nav button
        navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update active page
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(targetPage).classList.add('active');
    });
});

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Check for saved theme preference or default to dark
const savedTheme = localStorage.getItem('robbob_theme') || 'dark';
if (savedTheme === 'light') {
    body.classList.add('light');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('light');
    
    // Save theme preference
    const currentTheme = body.classList.contains('light') ? 'light' : 'dark';
    localStorage.setItem('robbob_theme', currentTheme);
});

// Download Button
const downloadBtn = document.getElementById('downloadBtn');
const toast = document.getElementById('toast');

downloadBtn.addEventListener('click', (e) => {
    // Show toast notification
    showToast('Загрузка началась!');
    
    // Track download event (you can add analytics here)
    console.log('Download initiated at:', new Date().toISOString());
});

// Toast notification function
function showToast(message) {
    const toastText = toast.querySelector('.toast-text');
    toastText.textContent = message;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    // Alt+1 for News, Alt+2 for Launcher
    if (e.altKey) {
        if (e.key === '1') {
            navButtons[0].click();
        } else if (e.key === '2') {
            navButtons[1].click();
        }
    }
});

// Add parallax effect to background gradient (optional)
let ticking = false;

document.addEventListener('mousemove', (e) => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            updateGradient(e);
            ticking = false;
        });
        ticking = true;
    }
});

function updateGradient(e) {
    const bgGradient = document.querySelector('.bg-gradient');
    if (!bgGradient) return;
    
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    bgGradient.style.transform = `translate(${x * 20 - 10}px, ${y * 20 - 10}px)`;
}

// Intersection Observer for animations on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all feature cards and news items
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.feature-card, .news-item');
    animatedElements.forEach(el => observer.observe(el));
    
    // Load and display recommended games
    loadRecommendedGames();
});

// ========================================
// Recommended Games
// ========================================

// Load games from localStorage and display them
function loadRecommendedGames() {
    const gamesData = localStorage.getItem('robbob_roblox_games');
    
    if (!gamesData) {
        return; // No games to display
    }
    
    try {
        const games = JSON.parse(gamesData);
        
        if (!games || games.length === 0) {
            return; // No games to display
        }
        
        displayGames(games);
    } catch (error) {
        console.error('Error loading games:', error);
    }
}

// Display games on the page
function displayGames(games) {
    const gamesGrid = document.getElementById('gamesGrid');
    const recommendedGamesSection = document.getElementById('recommendedGames');
    
    if (!gamesGrid || !recommendedGamesSection) {
        return;
    }
    
    // Show the section
    recommendedGamesSection.style.display = 'block';
    
    // Clear existing content
    gamesGrid.innerHTML = '';
    
    // Create game cards
    games.forEach(game => {
        // Create card container
        const cardContainer = document.createElement('div');
        cardContainer.className = 'game-card-container';
        
        // Create game card link
        const gameCard = document.createElement('a');
        gameCard.href = game.url;
        gameCard.target = '_blank';
        gameCard.rel = 'noopener noreferrer';
        gameCard.className = 'game-card glass-panel';
        gameCard.title = game.name;
        
        // Add image
        const img = document.createElement('img');
        img.className = 'game-card-image';
        img.alt = game.name;
        img.loading = 'lazy';
        
        if (game.thumbnailUrl) {
            img.src = game.thumbnailUrl;
        } else {
            // Fallback if no thumbnail
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%2312131a" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-family="sans-serif" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
        }
        
        // Handle image loading errors
        img.onerror = function() {
            this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%2312131a" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-family="sans-serif" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
        };
        
        // Add overlay with game name
        const overlay = document.createElement('div');
        overlay.className = 'game-card-overlay';
        
        const gameName = document.createElement('div');
        gameName.className = 'game-card-name';
        gameName.textContent = game.name;
        
        overlay.appendChild(gameName);
        
        // Assemble game card
        gameCard.appendChild(img);
        gameCard.appendChild(overlay);
        
        // Add game card to container
        cardContainer.appendChild(gameCard);
        
        // Add admin comment if description exists
        if (game.description) {
            const adminComment = document.createElement('div');
            adminComment.className = 'admin-comment';
            
            // Admin avatar (site logo)
            const avatar = document.createElement('img');
            avatar.className = 'admin-avatar';
            avatar.src = 'img/icon.png';
            avatar.alt = 'Админ';
            avatar.onerror = function() {
                // Fallback to gradient circle if no image
                this.style.display = 'none';
                this.parentElement.querySelector('.admin-avatar-fallback').style.display = 'block';
            };
            
            const avatarFallback = document.createElement('div');
            avatarFallback.className = 'admin-avatar admin-avatar-fallback';
            avatarFallback.style.display = 'none';
            
            // Comment content
            const commentContent = document.createElement('div');
            commentContent.className = 'admin-comment-content';
            
            const adminName = document.createElement('div');
            adminName.className = 'admin-name';
            adminName.textContent = game.adminName || 'Админ';
            
            const commentText = document.createElement('div');
            commentText.className = 'admin-comment-text';
            commentText.textContent = game.description;
            
            commentContent.appendChild(adminName);
            commentContent.appendChild(commentText);
            
            adminComment.appendChild(avatar);
            adminComment.appendChild(avatarFallback);
            adminComment.appendChild(commentContent);
            
            cardContainer.appendChild(adminComment);
        }
        
        // Add to grid
        gamesGrid.appendChild(cardContainer);
    });
}

// Console Easter Egg
console.log('%cRobBob Launcher', 'font-size: 20px; font-weight: bold; background: linear-gradient(135deg, #a855f7, #22c55e); -webkit-background-clip: text; color: transparent;');
console.log('%cВерсия: 1.0.0', 'font-size: 12px; color: #64748b;');
