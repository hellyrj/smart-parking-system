// API Base URL
const API_BASE_URL = '/auth';

// Utility Functions
function showAlert(message, type = 'error', containerId = 'alertContainer') {
    const container = document.getElementById(containerId);
    if (!container) {
        const newContainer = document.createElement('div');
        newContainer.id = containerId;
        newContainer.className = 'alert-container';
        document.querySelector('main')?.prepend(newContainer);
        return showAlert(message, type, containerId);
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
        <button class="alert-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.innerHTML = '';
    container.appendChild(alertDiv);
    
    if (type !== 'error') {
        setTimeout(() => {
            if (alertDiv.parentElement === container) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Check if user is logged in
function isLoggedIn() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return !!payload.id;
    } catch (e) {
        localStorage.removeItem('token');
        return false;
    }
}

// Get user info from token
function getUserInfo() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            id: payload.id,
            role: payload.role
        };
    } catch (e) {
        localStorage.removeItem('token');
        return null;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    window.location.href = 'index.html';
}

// Update navigation based on login status
function updateNavigation() {
    const navLinks = document.querySelector('.nav-links');
    const userMenu = document.querySelector('.user-menu');
    const userEmail = document.getElementById('userEmail');
    const userRole = document.getElementById('userRole');
    
    if (isLoggedIn()) {
        const userInfo = getUserInfo();
        
        // Hide login/register links
        if (navLinks) navLinks.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';
        
        // Set user info
        if (userEmail) {
            const savedEmail = localStorage.getItem('userEmail');
            userEmail.textContent = savedEmail || `User #${userInfo?.id || 'Unknown'}`;
        }
        
        // Set role badge
        if (userRole && userInfo) {
            userRole.textContent = userInfo.role;
            userRole.className = `role-badge ${userInfo.role}`;
        }
    } else {
        if (navLinks) navLinks.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// Setup logout button
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

// Feature cards animation on scroll
function setupAnimations() {
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

    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });
}

// Add smooth scrolling for anchor links
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Main initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('Home page loaded');
    updateNavigation();
    setupLogoutButton();
    setupSmoothScrolling();
    setupAnimations();
});