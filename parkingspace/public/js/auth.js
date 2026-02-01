// auth.js - Clean Authentication Handler
const API_BASE = "/api";

class Auth {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login Form
        const loginForm = document.getElementById("loginForm");
        if (loginForm) {
            loginForm.addEventListener("submit", (e) => this.handleLogin(e));
        }

        // Register Form
        const registerForm = document.getElementById("registerForm");
        if (registerForm) {
            registerForm.addEventListener("submit", (e) => this.handleRegister(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!this.validateEmail(email)) {
            this.showAlert("Please enter a valid email address", "error");
            return;
        }

        if (!password) {
            this.showAlert("Please enter your password", "error");
            return;
        }

        this.showLoading(true);

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("userEmail", email);
                localStorage.setItem("userRole", data.user.role);
                localStorage.setItem("userId", data.user.id);
                this.showAlert("Login successful!", "success");
                setTimeout(() => {

                    if (data.user.role === "admin") {
                        window.location.href = "/admin.html";
                    } else {
                        window.location.href = "/home.html";
                    }

                }, 1000);
            } else {
                this.showAlert(data.message || "Login failed", "error");
            }
        } catch (error) {
            console.error("Login error:", error);
            this.showAlert("Network error. Please try again.", "error");
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword")?.value;

        if (!this.validateEmail(email)) {
            this.showAlert("Please enter a valid email address", "error");
            return;
        }

        if (password.length < 8) {
            this.showAlert("Password must be at least 8 characters long", "error");
            return;
        }

        if (confirmPassword && password !== confirmPassword) {
            this.showAlert("Passwords do not match", "error");
            return;
        }

        this.showLoading(true);

        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                this.showAlert("Registration successful! Please login.", "success");
                setTimeout(() => {
                    window.location.href = "/login.html";
                }, 1500);
            } else {
                this.showAlert(data.message || "Registration failed", "error");
            }
        } catch (error) {
            console.error("Registration error:", error);
            this.showAlert("Network error. Please try again.", "error");
        } finally {
            this.showLoading(false);
        }
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    showAlert(message, type = "error") {
        // Create or get alert container
        let alertContainer = document.getElementById("alertContainer");
        if (!alertContainer) {
            alertContainer = document.createElement("div");
            alertContainer.id = "alertContainer";
            alertContainer.style.position = "fixed";
            alertContainer.style.top = "20px";
            alertContainer.style.right = "20px";
            alertContainer.style.zIndex = "1000";
            document.body.appendChild(alertContainer);
        }

        const alertDiv = document.createElement("div");
        alertDiv.className = `alert alert-${type}`;
        alertDiv.style.cssText = `
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            color: ${type === "success" ? "#155724" : "#721c24"};
            background: ${type === "success" ? "#d4edda" : "#f8d7da"};
            border: 1px solid ${type === "success" ? "#c3e6cb" : "#f5c6cb"};
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease;
        `;

        alertDiv.innerHTML = `
            ${type === "success" ? "✅" : "❌"} ${message}
            <button style="margin-left: 15px; background: none; border: none; cursor: pointer; float: right;">
                ✕
            </button>
        `;

        alertContainer.appendChild(alertDiv);

        // Auto-remove success messages after 5 seconds
        if (type === "success") {
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.style.opacity = "0";
                    alertDiv.style.transition = "opacity 0.3s";
                    setTimeout(() => alertDiv.remove(), 300);
                }
            }, 5000);
        }

        // Close button functionality
        alertDiv.querySelector("button").addEventListener("click", () => {
            alertDiv.remove();
        });
    }

    showLoading(show) {
        let loadingDiv = document.getElementById("loadingOverlay");
        
        if (show) {
            if (!loadingDiv) {
                loadingDiv = document.createElement("div");
                loadingDiv.id = "loadingOverlay";
                loadingDiv.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                `;
                
                loadingDiv.innerHTML = `
                    <div style="
                        background: white;
                        padding: 30px;
                        border-radius: 10px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 15px;
                    ">
                        <div class="spinner"></div>
                        <p>Loading...</p>
                    </div>
                `;
                
                document.body.appendChild(loadingDiv);
            }
        } else {
            if (loadingDiv) {
                loadingDiv.remove();
            }
        }
    }

    logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
        window.location.href = "/index.html";
    }
}

// Initialize auth when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    window.auth = new Auth();
});

// Global logout function
window.logout = function() {
    if (window.auth) {
        window.auth.logout();
    } else {
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
        window.location.href = "/home.html";
    }
};