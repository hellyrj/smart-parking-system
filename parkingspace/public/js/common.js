// common.js - Shared functionality across pages

// Initialize common functionality
function initCommon() {
  // Mobile Menu Toggle
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  const navOverlay = document.getElementById('navOverlay');
  
  if (menuToggle && mainNav && navOverlay) {
    menuToggle.addEventListener('click', function() {
      menuToggle.classList.toggle('active');
      mainNav.classList.toggle('active');
      navOverlay.classList.toggle('active');
      document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
    });
    
    navOverlay.addEventListener('click', function() {
      menuToggle.classList.remove('active');
      mainNav.classList.remove('active');
      navOverlay.classList.remove('active');
      document.body.style.overflow = '';
    });
    
    // Close menu when clicking on links (mobile)
    document.querySelectorAll('.nav a').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        mainNav.classList.remove('active');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }
  
  // Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      // Add animation effect
      themeToggle.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        themeToggle.style.transform = '';
      }, 300);
    });
  }
  
  // Check login status on protected pages
  const token = localStorage.getItem("token");
  const currentPage = window.location.pathname;
  
  // List of protected pages (excluding login/register)
  const protectedPages = ['home.html', 'add-parking.html', 'my-parking.html', 'active-session.html'];
  const isProtectedPage = protectedPages.some(page => currentPage.includes(page));
  
  if (isProtectedPage && !token) {
    window.location.href = "login.html";
    return;
  }
  
  // Display user info if element exists
  const userInfoElement = document.getElementById("userEmail");
  if (userInfoElement) {
    const userEmail = localStorage.getItem("userEmail");
    if (userEmail) {
      userInfoElement.textContent = userEmail.split('@')[0];
    }
  }
}

// Common logout function
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.clear();
    window.location.href = "login.html";
  }
}

// Attach logout to window object
window.logout = logout;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initCommon);

// Optional: Export functions if using modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initCommon, logout };
}