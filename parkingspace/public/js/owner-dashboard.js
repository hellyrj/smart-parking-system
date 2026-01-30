 // Global logout function
        function logout() {
            if (window.auth && window.auth.logout) {
                window.auth.logout();
            } else {
                localStorage.removeItem("token");
                localStorage.removeItem("userEmail");
                localStorage.removeItem("userRole");
                window.location.href = "/home.html";
            }
        }
        
        // Show notification
        function showNotification(message, type = 'info') {
            const notification = document.getElementById('notification');
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            `;
            notification.className = `notification ${type} show`;
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
        
        // Format currency
        function formatCurrency(amount) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount);
        }
        
        // Format date/time
        function formatDateTime(dateString) {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        // Calculate time difference
        function timeSince(startTime) {
            const start = new Date(startTime);
            const now = new Date();
            const diffMs = now - start;
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            
            if (diffHours > 0) {
                return `${diffHours}h ${diffMins % 60}m`;
            }
            return `${diffMins}m`;
        }
        
        // Load dashboard data
        async function loadDashboard() {
            try {
                document.getElementById('loading').style.display = 'block';
                document.getElementById('dashboardContent').style.display = 'none';
                
                // Load all data in parallel
                const [parkings, activeSessions, reservations, earnings] = await Promise.all([
                    API.getMyParkings(),
                    API.getOwnerActiveSessions(),
                    API.getOwnerReservations(),
                    API.getOwnerEarnings()
                ]);
                
                // Update stats
                document.getElementById('totalParkings').textContent = Array.isArray(parkings) ? parkings.length : 0;
                document.getElementById('activeSessions').textContent = Array.isArray(activeSessions) ? activeSessions.length : 0;
                document.getElementById('pendingReservations').textContent = Array.isArray(reservations) ? reservations.length : 0;
                document.getElementById('todayEarnings').textContent = earnings.today_earnings || '$0.00';
                
                // Render data
                renderParkings(parkings);
                renderActiveSessions(activeSessions);
                renderReservations(reservations);
                
                // Show content
                document.getElementById('loading').style.display = 'none';
                document.getElementById('dashboardContent').style.display = 'block';
                
            } catch (error) {
                console.error('Error loading dashboard:', error);
                showNotification('Failed to load dashboard data', 'error');
                document.getElementById('loading').style.display = 'none';
            }
        }
        
        // Render parking spaces
        function renderParkings(parkings) {
            const container = document.getElementById('parkingsList');
            
            if (!parkings || !Array.isArray(parkings) || parkings.length === 0) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-parking"></i>
                        <p>No parking spaces found</p>
                        <button onclick="window.location.href='/add-parking.html'" class="refresh-btn" style="margin-top: 10px;">
                            Add Parking Space
                        </button>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = parkings.map(parking => `
                <div class="parking-item">
                    <div class="parking-header">
                        <div class="parking-title">${parking.name}</div>
                        <div class="parking-status ${parking.is_active ? 'status-active' : 'status-inactive'}">
                            ${parking.is_active ? 'Active' : 'Inactive'}
                        </div>
                    </div>
                    <div class="parking-details">
                        <div class="parking-detail">
                            <strong>Location:</strong> ${parking.parkingLocation?.address || 'N/A'}, ${parking.parkingLocation?.city || ''}
                        </div>
                        <div class="parking-detail">
                            <strong>Spots:</strong> ${parking.available_spots || 0}/${parking.total_spots} available
                        </div>
                        <div class="parking-detail">
                            <strong>Price:</strong> $${parking.price_per_hour}/hour
                        </div>
                    </div>
                    <div class="parking-sessions">
                        <div class="sessions-count">
                            <i class="fas fa-users"></i>
                            <span>View sessions for this parking</span>
                        </div>
                        <div class="session-actions" style="margin-top: 10px;">
                            <button class="action-btn btn-view" onclick="viewParkingSessions(${parking.id})">
                                <i class="fas fa-eye"></i> View Sessions
                            </button>
                            <button class="action-btn" onclick="window.location.href='/add-parking.html?edit=${parking.id}'" style="background: #ffc107; color: #856404;">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        // Render active sessions
        function renderActiveSessions(sessions) {
            const container = document.getElementById('activeSessionsList');
            
            if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-play-circle"></i>
                        <p>No active sessions</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = sessions.map(session => `
                <div class="session-item ${session.session_type}">
                    <div class="session-header">
                        <div class="session-title">${session.parking_name || 'Unknown Parking'}</div>
                        <div class="session-badge ${session.session_type === 'active' ? 'badge-active' : 'badge-reserved'}">
                            ${session.session_type === 'active' ? 'ACTIVE' : 'RESERVED'}
                        </div>
                    </div>
                    <div class="session-details">
                        <div class="detail-item">
                            <span class="detail-label">User</span>
                            <span class="detail-value">${session.user_email || 'Unknown User'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Start Time</span>
                            <span class="detail-value">${formatDateTime(session.start_time)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Duration</span>
                            <span class="detail-value">${timeSince(session.start_time)}</span>
                        </div>
                        ${session.current_cost ? `
                            <div class="detail-item">
                                <span class="detail-label">Current Cost</span>
                                <span class="detail-value">$${session.current_cost}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="session-actions">
                        ${session.session_type === 'reserved' ? `
                            <button class="action-btn btn-confirm" onclick="confirmArrival(${session.id})">
                                <i class="fas fa-check"></i> Confirm Arrival
                            </button>
                        ` : ''}
                        <button class="action-btn btn-view" onclick="viewSessionDetails(${session.id})">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        <button class="action-btn btn-cancel" onclick="cancelSession(${session.id})">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        // Render reservations
        function renderReservations(reservations) {
            const container = document.getElementById('reservationsList');
            
            if (!reservations || !Array.isArray(reservations) || reservations.length === 0) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-clock"></i>
                        <p>No pending reservations</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = reservations.map(reservation => `
                <div class="reservation-item">
                    <div class="reservation-header">
                        <div class="reservation-title">${reservation.parking_name || 'Unknown Parking'}</div>
                        <div class="reservation-badge badge-reserved">
                            RESERVED
                        </div>
                    </div>
                    <div class="reservation-details">
                        <div class="detail-item">
                            <span class="detail-label">User</span>
                            <span class="detail-value">${reservation.user_email || 'Unknown User'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Vehicle</span>
                            <span class="detail-value">${reservation.vehicle_plate || 'N/A'} - ${reservation.vehicle_model || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Reserved Until</span>
                            <span class="detail-value">${formatDateTime(reservation.reserved_until)}</span>
                        </div>
                        ${reservation.expires_in_minutes ? `
                            <div class="detail-item">
                                <span class="detail-label">Expires In</span>
                                <span class="detail-value">${reservation.expires_in_minutes} minutes</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="reservation-actions">
                        <button class="action-btn btn-confirm" onclick="confirmArrival(${reservation.id})">
                            <i class="fas fa-check"></i> Confirm Arrival
                        </button>
                        <button class="action-btn btn-cancel" onclick="cancelReservation(${reservation.id})">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        // Action functions
        async function confirmArrival(sessionId) {
            if (!confirm('Confirm user arrival? This will convert reservation to active session.')) return;
            
            try {
                const result = await API.confirmUserArrival(sessionId);
                showNotification(result.message || 'Arrival confirmed successfully', 'success');
                loadDashboard(); // Refresh all data
            } catch (error) {
                console.error('Error confirming arrival:', error);
                showNotification('Failed to confirm arrival: ' + error.message, 'error');
            }
        }
        
        async function cancelSession(sessionId) {
            if (!confirm('Cancel this session? The user will be notified.')) return;
            
            try {
                const result = await API.cancelOwnerReservation(sessionId);
                showNotification(result.message || 'Session cancelled successfully', 'success');
                loadDashboard(); // Refresh all data
            } catch (error) {
                console.error('Error cancelling session:', error);
                showNotification('Failed to cancel session: ' + error.message, 'error');
            }
        }
        
        async function cancelReservation(reservationId) {
            if (!confirm('Cancel this reservation? The parking spot will be released.')) return;
            
            try {
                const result = await API.cancelOwnerReservation(reservationId);
                showNotification(result.message || 'Reservation cancelled successfully', 'success');
                loadDashboard(); // Refresh all data
            } catch (error) {
                console.error('Error cancelling reservation:', error);
                showNotification('Failed to cancel reservation: ' + error.message, 'error');
            }
        }
        
        function viewSessionDetails(sessionId) {
            // You can implement a modal or separate page for detailed view
            alert(`Viewing session details for ID: ${sessionId}\n\nThis would show complete session history, payments, etc.`);
        }
        
        function viewParkingSessions(parkingId) {
            alert(`Viewing all sessions for parking ID: ${parkingId}\n\nThis would filter and show sessions only for this parking space.`);
        }
        
        // Individual refresh functions
        async function loadActiveSessions() {
            try {
                const sessions = await API.getOwnerActiveSessions();
                renderActiveSessions(sessions);
                showNotification('Active sessions refreshed', 'success');
            } catch (error) {
                console.error('Error refreshing active sessions:', error);
                showNotification('Failed to refresh active sessions', 'error');
            }
        }
        
        async function loadReservations() {
            try {
                const reservations = await API.getOwnerReservations();
                renderReservations(reservations);
                showNotification('Reservations refreshed', 'success');
            } catch (error) {
                console.error('Error refreshing reservations:', error);
                showNotification('Failed to refresh reservations', 'error');
            }
        }
        
        async function loadMyParkings() {
            try {
                const parkings = await API.getMyParkings();
                renderParkings(parkings);
                showNotification('Parking spaces refreshed', 'success');
            } catch (error) {
                console.error('Error refreshing parking spaces:', error);
                showNotification('Failed to refresh parking spaces', 'error');
            }
        }
        
        // Initialize dashboard on page load
        document.addEventListener('DOMContentLoaded', function() {
            // Check if user is logged in and is an owner
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }
            
            // Decode token to check role
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.role !== 'owner') {
                    alert('You need to be an owner to access this dashboard');
                    window.location.href = '/home.html';
                    return;
                }
            } catch (e) {
                console.error('Error decoding token:', e);
                window.location.href = '/login.html';
                return;
            }
            
            // Load dashboard data
            loadDashboard();
            
            // Set up auto-refresh every 30 seconds
            setInterval(() => {
                loadDashboard();
            }, 30000);
        });