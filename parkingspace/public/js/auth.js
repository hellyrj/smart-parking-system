const API_BASE_URL = '/auth';

class AuthService {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = null;
        
        if (this.token) {
            this.decodeToken();
        }
    }

    decodeToken() {
        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            this.user = {
                id: payload.id,
                role: payload.role
            };
            return this.user;
        } catch (e) {
            console.error('Invalid token:', e);
            this.logout();
            return null;
        }
    }

    async register(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            return { 
                success: true, 
                message: data.message,
                status: response.status
            };
        } catch (error) {
            console.error('Registration error:', error);
            return { 
                success: false, 
                message: error.message || 'Registration failed. Please try again.'
            };
        }
    }

    async login(email, password, role = 'driver') {
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, role })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Store token
            this.token = data.token;
            localStorage.setItem('token', data.token);
            this.decodeToken();

            return { 
                success: true, 
                role: this.user.role,
                message: 'Login successful'
            };
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                message: error.message || 'Login failed. Please check your credentials.'
            };
        }
    }

    async getProfile() {
        if (!this.token) {
            throw new Error('Not authenticated');
        }

        try {
            const response = await fetch(`${API_BASE_URL}/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                // If unauthorized, clear token and redirect
                if (response.status === 401) {
                    this.logout();
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error('Failed to fetch profile');
            }

            return await response.json();
        } catch (error) {
            console.error('Profile fetch error:', error);
            throw error;
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
    }

    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    hasRole(role) {
        return this.user && this.user.role === role;
    }

    isAdmin() {
        return this.hasRole('admin');
    }

    isDriver() {
        return this.hasRole('driver');
    }

    isOwner() {
        return this.hasRole('owner');
    }

    getToken() {
        return this.token;
    }

    getUser() {
        return this.user;
    }
}

// Global auth instance
const auth = new AuthService();

// Utility functions
function showAlert(message, type = 'error', containerId = 'alertContainer') {
    const container = document.getElementById(containerId);
    if (!container) {
        // Create alert container if it doesn't exist
        const newContainer = document.createElement('div');
        newContainer.id = containerId;
        newContainer.className = 'alert-container';
        document.querySelector('main, .auth-card')?.prepend(newContainer);
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
    
    // Add close button styles
    const style = document.createElement('style');
    style.textContent = `
        .alert {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            position: relative;
        }
        .alert i:first-child {
            font-size: 1.2rem;
        }
        .alert-close {
            margin-left: auto;
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            opacity: 0.7;
            padding: 0.25rem;
        }
        .alert-close:hover {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
    
    container.innerHTML = '';
    container.appendChild(alertDiv);
    
    // Auto-remove success/info alerts after 5 seconds
    if (type !== 'error') {
        setTimeout(() => {
            if (alertDiv.parentElement === container) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

function redirectToDashboard() {
    window.location.href = 'dashboard.html';
}

function redirectToLogin() {
    window.location.href = 'login.html';
}

function redirectToHome() {
    window.location.href = 'index.html';
}

// Check authentication on page load for protected pages
function checkAuth(requireAuth = false) {
    const isAuthPage = window.location.pathname.includes('login.html') || 
                       window.location.pathname.includes('register.html');
    
    if (!auth.isAuthenticated() && requireAuth) {
        redirectToLogin();
        return false;
    }
    
    if (auth.isAuthenticated() && isAuthPage) {
        redirectToDashboard();
        return false;
    }
    
    return true;
}

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength;
}