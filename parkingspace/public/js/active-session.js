let activeSession = null;
let timerInterval = null;
let sessionStartTime = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log("Active session page loaded");
    checkActiveSession();
});

async function checkActiveSession() {
    try {
        showLoading(true);
        
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        console.log("Calling API.getDriverSessions()...");
        const sessionsData = await API.getDriverSessions();
        console.log("Sessions data received:", sessionsData);
        
        // Handle different response formats
        let activeSession = null;
        
        if (Array.isArray(sessionsData)) {
            // Find active session (end_time is null)
            activeSession = sessionsData.find(session => 
                session && !session.end_time
            );
            
            // If no active session, check for pending reservations
            if (!activeSession) {
                const pendingReservation = sessionsData.find(session => 
                    session && session.status === 'reserved'
                );
                if (pendingReservation) {
                    console.log("Found pending reservation:", pendingReservation);
                    // Optionally show reservation info
                }
            }
        } else if (sessionsData && sessionsData.id) {
            // Single session object
            if (!sessionsData.end_time) {
                activeSession = sessionsData;
            }
        }
        
        if (activeSession) {
            console.log("Active session found:", activeSession);
            // Store globally for use in endSession()
            window.activeSession = activeSession;
            displayActiveSession(activeSession);
            
            // Parse start time
            const startTime = new Date(activeSession.start_time || activeSession.createdAt);
            if (!isNaN(startTime.getTime())) {
                startSessionTimer(startTime);
            }
        } else {
            console.log("No active session found");
            showNoSession();
        }
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error: ' + error.message, 'error');
        showNoSession();
    } finally {
        showLoading(false);
    }

}

function displayActiveSession(session) {
    console.log("Displaying session:", session);
    
    if (!session || !session.start_time) {
        console.error("Invalid session data");
        showNotification('Invalid session data received', 'error');
        showNoSession();
        return;
    }
    
    try {
        // Parse start time
        sessionStartTime = new Date(session.start_time);
        if (isNaN(sessionStartTime.getTime())) {
            throw new Error("Invalid start time format");
        }
        
        // Extract parking data
        const parkingData = session.parkingSpace || session.parking_space || 
                           session.ParkingSpace || session.parking || {};
        
        console.log("Parking data:", parkingData);
        
        // Update UI with session data
        document.getElementById('parkingName').textContent = 
            parkingData.name || 'Parking Spot';
        
        document.getElementById('startTime').textContent = 
            formatDateTime(sessionStartTime);
        
        // Get hourly rate
        const hourlyRate = parseFloat(parkingData.price_per_hour || session.price_per_hour || 5.00);
        document.getElementById('hourlyRate').textContent = 
            `$${hourlyRate.toFixed(2)}/hr`;
        
        // Calculate initial estimated cost
        updateEstimatedCost(hourlyRate);
        
        // Show the active session section
        document.getElementById('noSession').style.display = 'none';
        document.getElementById('sessionActive').style.display = 'block';
        
        console.log("Session displayed successfully");
        
    } catch (error) {
        console.error("Error displaying session:", error);
        showNotification('Error displaying session information', 'error');
        showNoSession();
    }
}

function startSessionTimer(startTime) {
    console.log("Starting timer with start time:", startTime);
    
    // Clear any existing timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    const start = new Date(startTime);
    
    // Update timer immediately
    updateTimer(start);
    
    // Update every second
    timerInterval = setInterval(() => {
        updateTimer(start);
        
        // Update estimated cost every minute for performance
        const now = new Date();
        const seconds = Math.floor((now - start) / 1000);
        if (seconds % 60 === 0) {
            const parkingData = activeSession?.parkingSpace || activeSession?.parking_space || {};
            const hourlyRate = parseFloat(parkingData.price_per_hour || 5.00);
            updateEstimatedCost(hourlyRate);
        }
    }, 1000);
}

function updateTimer(startTime) {
    try {
        const now = new Date();
        const diffMs = now - startTime;
        
        if (diffMs < 0) {
            console.warn("Timer in future, adjusting...");
            startTime = now;
        }
        
        const totalSeconds = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('durationTimer').textContent = formatted;
        
    } catch (error) {
        console.error("Error updating timer:", error);
    }
}

function updateEstimatedCost(hourlyRate = 5.00) {
    if (!sessionStartTime) {
        console.warn("No session start time available");
        return;
    }
    
    try {
        const now = new Date();
        const diffHours = (now - sessionStartTime) / (1000 * 60 * 60);
        
        // Calculate hours (minimum 1 hour, round up)
        const hours = Math.max(1, Math.ceil(diffHours));
        
        const estimatedCost = hours * hourlyRate;
        document.getElementById('estimatedCost').textContent = 
            `$${estimatedCost.toFixed(2)}`;
            
    } catch (error) {
        console.error("Error updating estimated cost:", error);
        document.getElementById('estimatedCost').textContent = "$--";
    }
}

async function endSession() {
    if (!window.activeSession || !window.activeSession.id) {
        showNotification('No active session', 'error');
        return;
    }
    
    const sessionId = window.activeSession.id;
    const confirmed = confirm("End this parking session?");
    
    if (!confirmed) return;
    
    try {
        // Disable button
        const endBtn = document.getElementById('endBtn');
        endBtn.disabled = true;
        endBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ending...';
        
        // Call API to end session
        const result = await API.endParkingSession(sessionId);
        console.log("End session result:", result);
        
        if (result.message?.toLowerCase().includes("ended") || result.session_id) {
            // Stop timer
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            
            // Show success message
            showNotification('Parking session ended successfully!', 'success');
            
            // Hide end button
            endBtn.style.display = 'none';
            
            // Show payment details
            showPaymentDetails(result);
            
            // Update the timer to show final duration
            if (result.end_time && sessionStartTime) {
                const endTime = new Date(result.end_time);
                const diffMs = endTime - sessionStartTime;
                const totalSeconds = Math.floor(diffMs / 1000);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                
                const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                document.getElementById('durationTimer').textContent = formatted;
                document.getElementById('durationTimer').style.color = "#10b981"; // Green color
            }
            
        } else {
            throw new Error(result.message || "Failed to end session");
        }
        
    } catch (error) {
        console.error("End session error:", error);
        showNotification('Error: ' + error.message, 'error');
        
        // Re-enable button
        const endBtn = document.getElementById('endBtn');
        endBtn.disabled = false;
        endBtn.innerHTML = '<i class="fas fa-stop-circle"></i> End Parking Session';
        endBtn.style.opacity = '1';
    }
}

function goToDashboard() {
    console.log("Redirecting to dashboard");
    window.location.href = 'home.html';
}

function showLoading(show) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.display = show ? 'block' : 'none';
    }
}function showPaymentDetails(result) {
    try {
        const paymentDetails = document.getElementById('paymentDetails');
        const paymentInfo = document.getElementById('paymentInfo');
        
        if (!paymentDetails || !paymentInfo) {
            console.error("Payment detail elements not found");
            return;
        }
        
        // Format payment information
        let paymentHTML = `
            <div class="payment-summary">
                <h3><i class="fas fa-receipt"></i> Payment Summary</h3>
                <div class="payment-item">
                    <span>Session ID:</span>
                    <strong>${result.session_id || result.sessionId || 'N/A'}</strong>
                </div>
                <div class="payment-item">
                    <span>Duration:</span>
                    <strong>${result.duration_hours || result.hours || '0'} hours</strong>
                </div>
                <div class="payment-item">
                    <span>Total Amount:</span>
                    <strong>$${parseFloat(result.total_amount || result.amount || 0).toFixed(2)}</strong>
                </div>
                <div class="payment-item">
                    <span>Status:</span>
                    <strong class="status-completed">Completed</strong>
                </div>
        `;
        
        // Add payment information if available
        if (result.payment) {
            paymentHTML += `
                <div class="payment-item">
                    <span>Payment ID:</span>
                    <strong>${result.payment.id || result.payment.payment_id || 'N/A'}</strong>
                </div>
                <div class="payment-item">
                    <span>Payment Method:</span>
                    <strong>${result.payment.payment_method || 'Wallet'}</strong>
                </div>
            `;
        }
        
        paymentHTML += `
                <div class="payment-timestamp">
                    <small><i class="fas fa-clock"></i> Ended at: ${formatDateTime(new Date())}</small>
                </div>
            </div>
        `;
        
        paymentInfo.innerHTML = paymentHTML;
        paymentDetails.style.display = 'block';
        
        // Add CSS styles if not already present
        if (!document.querySelector('#paymentStyles')) {
            const style = document.createElement('style');
            style.id = 'paymentStyles';
            style.textContent = `
                .payment-summary {
                    background: #f8f9fa;
                    border-radius: 10px;
                    padding: 20px;
                    margin-top: 20px;
                    border-left: 4px solid #10b981;
                }
                .payment-summary h3 {
                    margin-bottom: 15px;
                    color: #333;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .payment-summary h3 i {
                    color: #10b981;
                }
                .payment-item {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #eee;
                }
                .payment-item:last-child {
                    border-bottom: none;
                }
                .payment-item span {
                    color: #666;
                }
                .payment-item strong {
                    color: #333;
                }
                .status-completed {
                    color: #10b981;
                    font-weight: 600;
                }
                .payment-timestamp {
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid #eee;
                    text-align: center;
                    color: #888;
                }
                .payment-timestamp small i {
                    margin-right: 5px;
                }
            `;
            document.head.appendChild(style);
        }
        
        console.log("Payment details displayed");
        
    } catch (error) {
        console.error("Error showing payment details:", error);
    }
}

function showNoSession() {
    console.log("Showing no session UI");
    document.getElementById('loading').style.display = 'none';
    document.getElementById('sessionActive').style.display = 'none';
    document.getElementById('noSession').style.display = 'block';
}

function showNotification(message, type = 'info') {
    console.log(`Notification [${type}]:`, message);
    
    const notification = document.getElementById('notification');
    if (!notification) {
        console.error("Notification element not found");
        return;
    }
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

function formatDateTime(date) {
    try {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            return 'Invalid date';
        }
        
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (error) {
        console.error("Error formatting date:", error);
        return 'Date unavailable';
    }
}

function showConfirmation(title, message, confirmText, cancelText) {
    return new Promise((resolve) => {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        `;
        
        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 400px;
            width: 90%;
        `;
        
        modal.innerHTML = `
            <h3 style="margin-bottom: 15px; color: #333; font-size: 20px;">${title}</h3>
            <p style="margin-bottom: 25px; color: #666; line-height: 1.5;">${message}</p>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancelBtn" style="padding: 10px 20px; border: 1px solid #ddd; border-radius: 6px; background: #f5f5f5; cursor: pointer; color: #333;">
                    ${cancelText}
                </button>
                <button id="confirmBtn" style="padding: 10px 20px; border: none; border-radius: 6px; background: #ef4444; color: white; cursor: pointer; font-weight: 600;">
                    ${confirmText}
                </button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Add event listeners
        document.getElementById('confirmBtn').onclick = () => {
            document.body.removeChild(overlay);
            resolve(true);
        };
        
        document.getElementById('cancelBtn').onclick = () => {
            document.body.removeChild(overlay);
            resolve(false);
        };
        
        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                resolve(false);
            }
        };
    });
}

// Add refresh button functionality
document.addEventListener('DOMContentLoaded', function() {
    // Optional: Add refresh button to header
    const header = document.querySelector('.header');
    if (header) {
        const refreshBtn = document.createElement('button');
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        refreshBtn.style.cssText = `
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        `;
        refreshBtn.onclick = () => {
            refreshBtn.style.transform = 'translateY(-50%) rotate(360deg)';
            refreshBtn.style.transition = 'transform 0.5s ease';
            
            setTimeout(() => {
                refreshBtn.style.transform = 'translateY(-50%)';
                checkActiveSession();
            }, 500);
        };
        header.style.position = 'relative';
        header.appendChild(refreshBtn);
    }
});