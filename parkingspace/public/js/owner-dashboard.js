class OwnerDashboard {
  constructor() {
    this.activeSessions = [];
    this.reservations = [];
    this.notifications = [];
    this.setupEventListeners();
    this.loadData();
    this.setupWebSocket();
  }

  setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar li').forEach(item => {
      item.addEventListener('click', () => {
        const section = item.dataset.section;
        this.showSection(section);
        
        document.querySelectorAll('.sidebar li').forEach(li => {
          li.classList.remove('active');
        });
        item.classList.add('active');
      });
    });

    // Session action buttons
    document.getElementById('confirmArrival')?.addEventListener('click', () => {
      this.confirmUserArrival();
    });

    document.getElementById('cancelReservation')?.addEventListener('click', () => {
      this.cancelReservation();
    });

    document.getElementById('closeModal')?.addEventListener('click', () => {
      this.closeModal();
    });
  }

  async loadData() {
    try {
      await Promise.all([
        this.loadActiveSessions(),
        this.loadReservations(),
        this.loadParkings(),
        this.loadEarnings(),
        this.loadNotifications()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

 async loadActiveSessions() {
  try {
    this.activeSessions = await API.getOwnerActiveSessions();
    this.renderActiveSessions();
  } catch (error) {
    console.error('Error loading active sessions:', error);
    showNotification('Failed to load active sessions', 'error');
  }
}

  renderActiveSessions() {
    const grid = document.getElementById('activeSessionsGrid');
    
    if (!this.activeSessions.length) {
      grid.innerHTML = '<p class="no-data">No active sessions</p>';
      return;
    }

    grid.innerHTML = this.activeSessions.map(session => `
      <div class="session-card ${session.session_type}">
        <div class="session-header">
          <h3>${session.parking_name}</h3>
          <span class="status-badge ${session.session_type === 'reserved' ? 'status-reserved' : 'status-active'}">
            ${session.session_type === 'reserved' ? 'Reserved' : 'Active'}
          </span>
        </div>
        <div class="session-info">
          <p><i class="fas fa-user"></i> ${session.user_email}</p>
          <p><i class="fas fa-clock"></i> ${session.start_time}</p>
          ${session.session_type === 'reserved' ? 
            `<p><i class="fas fa-hourglass-end"></i> Expires in: <span id="timer-${session.id}">${session.expires_in}</span></p>` :
            `<p><i class="fas fa-dollar-sign"></i> Current cost: $${session.current_cost}</p>`
          }
        </div>
        <div class="session-actions">
          ${session.session_type === 'reserved' ? `
            <button class="btn-confirm" onclick="ownerDashboard.confirmArrival(${session.id})">
              <i class="fas fa-check"></i> Confirm Arrival
            </button>
            <button class="btn-cancel" onclick="ownerDashboard.cancelReservation(${session.id})">
              <i class="fas fa-times"></i> Cancel
            </button>
          ` : `
            <button class="btn-view" onclick="ownerDashboard.viewSession(${session.id})">
              <i class="fas fa-eye"></i> View Details
            </button>
          `}
        </div>
      </div>
    `).join('');

    // Start countdown timers for reservations
    this.activeSessions.forEach(session => {
      if (session.session_type === 'reserved') {
        this.startReservationTimer(session.id, session.expires_in_minutes);
      }
    });
  }

  async loadReservations() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${window.API_BASE}/owner/reservations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to load reservations');
      
      this.reservations = await response.json();
      this.renderReservations();
    } catch (error) {
      console.error('Error loading reservations:', error);
    }
  }

  renderReservations() {
    const container = document.getElementById('reservationList');
    
    if (!this.reservations.length) {
      container.innerHTML = '<p class="no-data">No reservations</p>';
      return;
    }

    container.innerHTML = this.reservations.map(reservation => `
      <div class="reservation-item">
        <div class="reservation-header">
          <h4>${reservation.parking_name}</h4>
          <span class="reservation-time">${new Date(reservation.reserved_until).toLocaleString()}</span>
        </div>
        <div class="reservation-details">
          <p><i class="fas fa-user"></i> ${reservation.user_email}</p>
          <p><i class="fas fa-phone"></i> ${reservation.user_phone || 'Not provided'}</p>
          <p><i class="fas fa-car"></i> ${reservation.vehicle_plate || 'Not provided'}</p>
        </div>
        <div class="reservation-actions">
          <button class="btn-confirm" onclick="ownerDashboard.confirmArrival(${reservation.id})">
            <i class="fas fa-check"></i> Confirm
          </button>
          <button class="btn-cancel" onclick="ownerDashboard.cancelReservation(${reservation.id})">
            <i class="fas fa-times"></i> Cancel
          </button>
        </div>
      </div>
    `).join('');
  }

  async confirmArrival(sessionId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${window.API_BASE}/owner/sessions/${sessionId}/confirm-arrival`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to confirm arrival');
      
      const result = await response.json();
      alert(result.message);
      this.loadData(); // Reload data
    } catch (error) {
      console.error('Error confirming arrival:', error);
      alert('Failed to confirm arrival');
    }
  }

  async cancelReservation(sessionId) {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${window.API_BASE}/owner/sessions/${sessionId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to cancel reservation');
      
      const result = await response.json();
      alert(result.message);
      this.loadData(); // Reload data
    } catch (error) {
      console.error('Error canceling reservation:', error);
      alert('Failed to cancel reservation');
    }
  }

  startReservationTimer(sessionId, minutes) {
    let timeLeft = minutes * 60; // Convert to seconds
    
    const timerElement = document.getElementById(`timer-${sessionId}`);
    if (!timerElement) return;
    
    const timer = setInterval(() => {
      timeLeft--;
      
      if (timeLeft <= 0) {
        clearInterval(timer);
        timerElement.textContent = 'Expired';
        timerElement.style.color = 'red';
        
        // Auto-cancel expired reservation
        this.autoCancelExpiredReservation(sessionId);
        return;
      }
      
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      timerElement.textContent = `${mins}m ${secs}s`;
      
      // Change color when less than 5 minutes
      if (timeLeft < 300) {
        timerElement.style.color = 'orange';
      }
    }, 1000);
  }

  async autoCancelExpiredReservation(sessionId) {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${window.API_BASE}/owner/sessions/${sessionId}/auto-cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Send notification to user
      this.sendNotification(sessionId, 'reservation_expired');
      this.loadData(); // Reload data
    } catch (error) {
      console.error('Error auto-canceling reservation:', error);
    }
  }

  setupWebSocket() {
    // Set up WebSocket connection for real-time updates
    const token = localStorage.getItem('token');
    const ws = new WebSocket(`ws://localhost:3000/ws?token=${token}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleRealTimeUpdate(data);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleRealTimeUpdate(data) {
    switch(data.type) {
      case 'new_session':
        this.showNotification(`New ${data.session_type} at ${data.parking_name}`);
        this.loadData();
        break;
      case 'reservation_expiring':
        this.showNotification(`Reservation expiring soon at ${data.parking_name}`);
        break;
      case 'payment_received':
        this.showNotification(`Payment received: $${data.amount}`);
        this.loadEarnings();
        break;
    }
  }

  showNotification(message) {
    const notification = {
      id: Date.now(),
      message: message,
      time: new Date().toLocaleTimeString(),
      read: false
    };
    
    this.notifications.unshift(notification);
    this.renderNotifications();
    
    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification('Parking Alert', {
        body: message,
        icon: '/icon.png'
      });
    }
  }

  renderNotifications() {
    const container = document.getElementById('notificationsList');
    
    if (!this.notifications.length) {
      container.innerHTML = '<p class="no-data">No notifications</p>';
      return;
    }

    container.innerHTML = this.notifications.map(notification => `
      <div class="notification-item ${notification.read ? 'read' : 'unread'}">
        <div class="notification-content">
          <p>${notification.message}</p>
          <small>${notification.time}</small>
        </div>
        ${!notification.read ? 
          `<button onclick="ownerDashboard.markAsRead(${notification.id})" class="btn-mark-read">
            <i class="fas fa-check"></i>
          </button>` : ''
        }
      </div>
    `).join('');
  }

  showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
      section.classList.add('active');
    }
  }

  closeModal() {
    document.getElementById('sessionModal').style.display = 'none';
  }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  window.ownerDashboard = new OwnerDashboard();
  
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
});