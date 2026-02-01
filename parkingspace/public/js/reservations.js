let activeReservations = [];
let recentReservations = [];

// DOM Elements
const reservationsList = document.getElementById('reservationsList');
const noReservations = document.getElementById('noReservations');
const recentReservationsEl = document.getElementById('recentReservations');
const reservationTimer = document.getElementById('reservationTimer');
const timerMessage = document.getElementById('timerMessage');

// Load reservations on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadReservations();
    checkLocalReservation();
    setupAutoRefresh();
});

// Load reservations from API
async function loadReservations() {
    try {
        showLoading();
        
        // Get active reservations
        const response = await API.getDriverReservations();
        
        if (response.success && response.reservations) {
            activeReservations = response.reservations.filter(r => 
                r.reservation_status === 'active' || r.reservation_status === 'waiting'
            );
            
            recentReservations = response.reservations.filter(r => 
                r.reservation_status === 'expired' || r.reservation_status === 'cancelled'
            ).slice(0, 5); // Show last 5
            
            renderReservations();
        } else {
            showNoReservations();
        }
    } catch (error) {
        console.error('Error loading reservations:', error);
        showNoReservations();
    }
}

// Render reservations
function renderReservations() {
    if (activeReservations.length === 0) {
        showNoReservations();
        return;
    }
    
    reservationsList.innerHTML = '';
    recentReservationsEl.innerHTML = '';
    
    // Render active reservations
    activeReservations.forEach(reservation => {
        const reservationCard = createReservationCard(reservation);
        reservationsList.appendChild(reservationCard);
        
        // Setup countdown for each active reservation
        if (reservation.reserved_until) {
            setupCountdown(reservation.id, reservation.reserved_until);
        }
    });
    
    // Render recent reservations
    if (recentReservations.length > 0) {
        recentReservations.forEach(reservation => {
            const recentCard = createRecentReservationCard(reservation);
            recentReservationsEl.appendChild(recentCard);
        });
    }
    
    // Update reservation timer banner
    updateReservationTimer();
}

// Update the createReservationCard function:

function createReservationCard(reservation) {
    const card = document.createElement('div');
    card.className = 'reservation-card';
    card.id = `reservation-${reservation.id}`;
    
    const reservedUntil = new Date(reservation.reserved_until);
    const timeLeft = getTimeRemaining(reservedUntil);
    const progress = Math.max(0, Math.min(100, (timeLeft.minutes / 30) * 100));
    
    // Extract parking space data - it might be nested
    const parkingSpace = reservation.parkingSpace || reservation.ParkingSpace || {};
    const location = parkingSpace.parkingLocations?.[0] || {};
    
    card.innerHTML = `
        <div class="reservation-header">
            <div>
                <h3>${parkingSpace.name || 'Unknown Parking'}</h3>
                <p class="reservation-id">Reservation #${reservation.id}</p>
                <p class="location-text">
                    <i class="fas fa-map-marker-alt"></i> 
                    ${location.address || 'Location not specified'}
                </p>
            </div>
            <div class="reservation-status ${reservation.reservation_status}">
                <span>${reservation.reservation_status.toUpperCase()}</span>
            </div>
        </div>
        
        <div class="reservation-info">
            <div class="info-row">
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <div>
                        <small>Reserved Until</small>
                        <strong>${reservedUntil.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-car"></i>
                    <div>
                        <small>Vehicle</small>
                        <strong>${reservation.vehicle_plate} • ${reservation.vehicle_model}</strong>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-money-bill-wave"></i>
                    <div>
                        <small>Rate</small>
                        <strong>Br ${parkingSpace.price_per_hour || '0'}/hour</strong>
                    </div>
                </div>
            </div>
            
            <div class="time-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="time-left" id="timer-${reservation.id}">
                    <i class="fas fa-hourglass-end"></i>
                    <span>${timeLeft.minutes} min ${timeLeft.seconds} sec remaining</span>
                </div>
            </div>
        </div>
        
        <div class="reservation-actions">
            <button class="btn btn-primary" onclick="activateReservation(${reservation.id})">
                <i class="fas fa-play-circle"></i> Activate Parking
            </button>
            <button class="btn btn-outline" onclick="cancelReservation(${reservation.id})">
                <i class="fas fa-times-circle"></i> Cancel
            </button>
            <button class="btn btn-secondary" onclick="viewParkingDetails(${reservation.parking_id}, ${location.latitude ?? 'null'}, ${location.longitude ?? 'null'})">
                <i class="fas fa-map-marker-alt"></i> View Location
            </button>
        </div>
    `;
    
    return card;
}

// Create recent reservation card
function createRecentReservationCard(reservation) {
    const card = document.createElement('div');
    card.className = 'recent-card';
    
    const reservedUntil = new Date(reservation.reserved_until);
    const statusClass = reservation.reservation_status;
    
    card.innerHTML = `
        <div class="recent-header">
            <h4>${reservation.parkingSpace?.name || 'Unknown'}</h4>
            <span class="status-badge ${statusClass}">${statusClass.toUpperCase()}</span>
        </div>
        <p class="recent-details">
            <i class="fas fa-car"></i> ${reservation.vehicle_plate} • 
            <i class="fas fa-clock"></i> ${reservedUntil.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </p>
    `;
    
    return card;
}

// Activate reservation
async function activateReservation(reservationId) {
    try {
        if (!confirm('Are you sure you want to activate this reservation and start parking?')) {
            return;
        }
        
        const result = await API.startParkingSession(reservationId);
        
        if (result.success || result.message?.includes('started')) {
            alert('✅ Parking session activated successfully!');
            
            // Clear reservation from localStorage
            localStorage.removeItem('lastReservationId');
            localStorage.removeItem('reservedUntil');
            localStorage.removeItem('reservedParkingId');
            
            // Redirect to active session page
            window.location.href = 'active-session.html';
        } else {
            throw new Error(result.message || 'Failed to activate');
        }
    } catch (error) {
        console.error('Error activating reservation:', error);
        alert('Error activating reservation: ' + error.message);
    }
}

// Cancel reservation
async function cancelReservation(reservationId) {
    try {
        if (!confirm('Are you sure you want to cancel this reservation?')) {
            return;
        }
        
        const result = await API.cancelReservation(reservationId);
        
        if (result.success) {
            alert('✅ Reservation cancelled successfully');

            localStorage.removeItem('lastReservationId');
            localStorage.removeItem('reservedUntil');
            localStorage.removeItem('reservedParkingId');

            await loadReservations(); // Refresh list
        } else {
            throw new Error(result.message || 'Failed to cancel');
        }
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        alert('Error cancelling reservation: ' + error.message);
    }
}

// View parking details
function viewParkingDetails(parkingId, lat = null, lng = null) {
    // Save parking info and redirect to home with focus on this parking
    localStorage.setItem('viewParkingId', parkingId);
    if (lat !== null && lng !== null) {
        localStorage.setItem('viewParkingLat', String(lat));
        localStorage.setItem('viewParkingLng', String(lng));
    } else {
        localStorage.removeItem('viewParkingLat');
        localStorage.removeItem('viewParkingLng');
    }
    window.location.href = 'home.html';
}

// Setup countdown timer
function setupCountdown(reservationId, reservedUntil) {
    const timerElement = document.getElementById(`timer-${reservationId}`);
    if (!timerElement) return;
    
    function updateTimer() {
        const timeLeft = getTimeRemaining(new Date(reservedUntil));
        
        if (timeLeft.total <= 0) {
            timerElement.innerHTML = '<span style="color: #ef4444;"><i class="fas fa-exclamation-triangle"></i> EXPIRED</span>';
            
            // Auto-refresh after expiration
            setTimeout(() => {
                loadReservations();
            }, 5000);
            
            return;
        }
        
        timerElement.innerHTML = `
            <i class="fas fa-hourglass-end"></i>
            <span>${timeLeft.minutes} min ${timeLeft.seconds} sec remaining</span>
        `;
    }
    
    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    
    // Store interval for cleanup
    window.countdownTimers = window.countdownTimers || {};
    window.countdownTimers[reservationId] = timerInterval;
}

// Get time remaining
function getTimeRemaining(endTime) {
    const total = Date.parse(endTime) - Date.parse(new Date());
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    
    return {
        total,
        minutes,
        seconds
    };
}

// Check local storage for recent reservation
function checkLocalReservation() {
    const lastReservationId = localStorage.getItem('lastReservationId');
    const reservedUntil = localStorage.getItem('reservedUntil');
    
    if (lastReservationId && reservedUntil) {
        const timeLeft = getTimeRemaining(new Date(reservedUntil));
        
        if (timeLeft.total > 0) {
            reservationTimer.style.display = 'flex';
            timerMessage.textContent = `You have a reservation expiring in ${timeLeft.minutes} minutes`;
        } else {
            // Clear expired reservation from localStorage
            localStorage.removeItem('lastReservationId');
            localStorage.removeItem('reservedUntil');
            localStorage.removeItem('reservedParkingId');
        }
    }
}

// Update reservation timer banner
function updateReservationTimer() {
    if (activeReservations.length > 0) {
        const nearestReservation = activeReservations[0];
        const timeLeft = getTimeRemaining(new Date(nearestReservation.reserved_until));
        
        if (timeLeft.total > 0 && timeLeft.minutes < 15) {
            reservationTimer.style.display = 'flex';
            timerMessage.textContent = `Reservation at ${nearestReservation.parkingSpace?.name} expires in ${timeLeft.minutes} minutes`;
        } else {
            reservationTimer.style.display = 'none';
        }
    } else {
        reservationTimer.style.display = 'none';
    }
}

// Redirect to reservation
function goToReservation() {
    const lastReservationId = localStorage.getItem('lastReservationId');
    if (lastReservationId) {
        // Scroll to the reservation
        const element = document.getElementById(`reservation-${lastReservationId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            element.style.animation = 'pulse 2s infinite';
            setTimeout(() => {
                element.style.animation = '';
            }, 2000);
        }
    }
}

// Setup auto-refresh
function setupAutoRefresh() {
    // Refresh every 30 seconds
    setInterval(() => {
        loadReservations();
    }, 30000);
}

// Show loading state
function showLoading() {
    reservationsList.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div class="spinner"></div>
            <p style="margin-top: 20px; color: #666;">Loading reservations...</p>
        </div>
    `;
    noReservations.style.display = 'none';
}

// Show no reservations state
function showNoReservations() {
    reservationsList.innerHTML = '';
    noReservations.style.display = 'block';
}

// Clean up timers
window.addEventListener('beforeunload', () => {
    if (window.countdownTimers) {
        Object.values(window.countdownTimers).forEach(interval => {
            clearInterval(interval);
        });
    }
});