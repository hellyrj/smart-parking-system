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

function showAppConfirm({
  title = 'Confirm',
  message = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel'
} = {}) {
  return new Promise((resolve) => {
    const formattedMessage = String(message).replace(/\n/g, '<br>');
    const overlay = document.createElement('div');
    overlay.className = 'ep-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'ep-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="ep-modal-header">
        <div class="ep-modal-title">${title}</div>
        <button class="ep-modal-close" type="button" aria-label="Close">&times;</button>
      </div>
      <div class="ep-modal-body">
        <div class="ep-modal-text">${formattedMessage}</div>
      </div>
      <div class="ep-modal-actions">
        <button class="ep-btn ep-btn-secondary" type="button" data-action="cancel">${cancelText}</button>
        <button class="ep-btn ep-btn-primary" type="button" data-action="confirm">${confirmText}</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const cleanup = (value) => {
      document.removeEventListener('keydown', onKeyDown, true);
      overlay.remove();
      resolve(value);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') cleanup(false);
    };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(false);
    });

    modal.querySelector('.ep-modal-close')?.addEventListener('click', () => cleanup(false));
    modal.querySelector('[data-action="cancel"]')?.addEventListener('click', () => cleanup(false));
    modal.querySelector('[data-action="confirm"]')?.addEventListener('click', () => cleanup(true));
    document.addEventListener('keydown', onKeyDown, true);

    setTimeout(() => {
      modal.querySelector('[data-action="confirm"]')?.focus();
    }, 0);
  });
}

function showReservationModal({
  parkingName = '',
  locationAddress = '',
  pricePerHour = '',
  availableSpots = '',
  vehiclePlate = '',
  vehicleModel = 'Car'
} = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'ep-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'ep-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="ep-modal-header">
        <div class="ep-modal-title">Reserve / Start Parking</div>
        <button class="ep-modal-close" type="button" aria-label="Close">&times;</button>
      </div>
      <div class="ep-modal-body">
        <div class="ep-modal-summary">
          <div class="ep-summary-title">${parkingName}</div>
          <div class="ep-summary-grid">
            <div class="ep-summary-item">
              <span class="ep-summary-label">Location</span>
              <span class="ep-summary-value">${locationAddress}</span>
            </div>
            <div class="ep-summary-item">
              <span class="ep-summary-label">Price</span>
              <span class="ep-summary-value">Br ${pricePerHour}/hour</span>
            </div>
            <div class="ep-summary-item">
              <span class="ep-summary-label">Available</span>
              <span class="ep-summary-value">${availableSpots}</span>
            </div>
          </div>
        </div>

        <div class="ep-form">
          <label class="ep-field">
            <span class="ep-field-label">Vehicle plate number</span>
            <input class="ep-input" type="text" name="plate" placeholder="e.g. AA-12345" value="${String(vehiclePlate || '').replace(/"/g, '&quot;')}" />
            <span class="ep-field-error" style="display:none;">Plate number is required</span>
          </label>

          <label class="ep-field">
            <span class="ep-field-label">Vehicle model</span>
            <input class="ep-input" type="text" name="model" placeholder="e.g. Corolla" value="${String(vehicleModel || '').replace(/"/g, '&quot;')}" />
          </label>
        </div>
      </div>
      <div class="ep-modal-actions">
        <button class="ep-btn ep-btn-secondary" type="button" data-action="cancel">Cancel</button>
        <button class="ep-btn ep-btn-ghost" type="button" data-action="start">Start Session</button>
        <button class="ep-btn ep-btn-primary" type="button" data-action="reserve">Reserve Now</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const plateInput = modal.querySelector('input[name="plate"]');
    const modelInput = modal.querySelector('input[name="model"]');
    const plateError = modal.querySelector('.ep-field-error');

    const cleanup = (value) => {
      document.removeEventListener('keydown', onKeyDown, true);
      overlay.remove();
      resolve(value);
    };

    const validate = () => {
      const plate = String(plateInput?.value || '').trim();
      if (!plate) {
        plateInput?.classList.add('ep-input-error');
        if (plateError) plateError.style.display = 'block';
        plateInput?.focus();
        return null;
      }
      plateInput?.classList.remove('ep-input-error');
      if (plateError) plateError.style.display = 'none';
      return {
        vehiclePlate: plate,
        vehicleModel: String(modelInput?.value || 'Car').trim() || 'Car'
      };
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') cleanup(null);
      if (e.key === 'Enter') {
        const payload = validate();
        if (payload) cleanup({ action: 'reserve', ...payload });
      }
    };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(null);
    });

    modal.querySelector('.ep-modal-close')?.addEventListener('click', () => cleanup(null));
    modal.querySelector('[data-action="cancel"]')?.addEventListener('click', () => cleanup(null));
    modal.querySelector('[data-action="reserve"]')?.addEventListener('click', () => {
      const payload = validate();
      if (payload) cleanup({ action: 'reserve', ...payload });
    });
    modal.querySelector('[data-action="start"]')?.addEventListener('click', () => {
      const payload = validate();
      if (payload) cleanup({ action: 'start', ...payload });
    });

    document.addEventListener('keydown', onKeyDown, true);
    plateInput?.addEventListener('input', () => {
      if (plateInput.value.trim()) {
        plateInput.classList.remove('ep-input-error');
        if (plateError) plateError.style.display = 'none';
      }
    });

    setTimeout(() => {
      plateInput?.focus();
      if (plateInput && plateInput.value) plateInput.select();
    }, 0);
  });
}

// Attach logout to window object
window.logout = logout;
window.showReservationModal = showReservationModal;
window.showAppConfirm = showAppConfirm;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initCommon);

// Optional: Export functions if using modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initCommon, logout, showReservationModal, showAppConfirm };
}