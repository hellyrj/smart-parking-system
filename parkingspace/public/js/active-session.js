
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
            
            // Check if user is logged in
            const token = localStorage.getItem('token');
            console.log("Token exists:", !!token);
            
            if (!token) {
                console.log("No token found, redirecting to login");
                window.location.href = 'login.html';
                return;
            }

            // Fetch active session from API
            console.log("Calling API.getMyActiveSession()...");
            const sessionData = await API.getMyActiveSession();
            console.log("API Response:", sessionData);
            
            // Debug: Check response type and structure
            if (sessionData === null || sessionData === undefined) {
                console.log("Session data is null/undefined");
                showNoSession();
                return;
            }
            
            if (typeof sessionData === 'object') {
                // Check various possible response structures
                let actualSession = null;
                
                if (sessionData.id && sessionData.start_time) {
                    // Direct session object
                    actualSession = sessionData;
                } else if (sessionData.session && sessionData.session.id) {
                    // Wrapped in {session: ...}
                    actualSession = sessionData.session;
                } else if (sessionData.data && sessionData.data.id) {
                    // Wrapped in {data: ...}
                    actualSession = sessionData.data;
                } else if (sessionData.message) {
                    // Error message response
                    console.error("API returned error:", sessionData.message);
                    showNotification(sessionData.message, 'error');
                    showNoSession();
                    return;
                }
                
                if (actualSession) {
                    console.log("Found active session:", actualSession);
                    activeSession = actualSession;
                    displayActiveSession(actualSession);
                    startSessionTimer(actualSession.start_time);
                } else {
                    console.log("No valid session data found in response");
                    showNoSession();
                }
            } else {
                console.log("Unexpected response type:", typeof sessionData);
                showNoSession();
            }
            
        } catch (error) {
            console.error('Error fetching active session:', error);
            console.error('Error details:', error.message);
            
            // Check for specific fetch errors
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                showNotification('Network error. Please check your connection.', 'error');
            } else if (error.message.includes('401') || error.message.includes('403')) {
                showNotification('Authentication failed. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showNotification('Error loading session data', 'error');
            }
            
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
        
        // Extract parking data (handle different possible property names)
        const parkingData = session.parkingSpace || session.parking_space || 
                           session.ParkingSpace || session.parking || {};
        
        console.log("Parking data:", parkingData);
        
        // Update UI with session data - use only existing fields
        document.getElementById('parkingName').textContent = 
            parkingData.name || 'Unknown Parking Spot'; // Remove 'title' reference
        
        document.getElementById('startTime').textContent = 
            formatDateTime(sessionStartTime);
        
        // Use actual price from data or default - only use price_per_hour
        const hourlyRate = parseFloat(parkingData.price_per_hour || 5.00); // Remove 'price' reference
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
            
            // Update estimated cost every minute instead of every second for performance
            const now = new Date();
            const seconds = Math.floor((now - start) / 1000);
            if (seconds % 60 === 0) {
                const parkingData = activeSession?.parkingSpace || activeSession?.parking_space || {};
                const hourlyRate = parseFloat(parkingData.price_per_hour || parkingData.price || 5.00);
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
                // Session started in the future? Use current time as start
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
    if (!activeSession) {
        showNotification('No active session to end', 'error');
        return;
    }
    
    console.log("Attempting to end session with ID:", activeSession.id);
    console.log("Session data:", activeSession);
    
    const confirmed = await showConfirmation(
        'End Parking Session',
        'Are you sure you want to end this parking session? The payment will be processed automatically.',
        'End Session',
        'Cancel'
    );
    
    if (!confirmed) {
        return;
    }

    try {
        // Disable the button and show loading
        const endBtn = document.getElementById('endBtn');
        endBtn.disabled = true;
        endBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ending Session...';
        endBtn.style.opacity = '0.7';

        // Call API to end session
        console.log("Calling API.endSession()...");
        
        const result = await API.endSession();
        console.log("End session API response:", result);
        
        // Check if API returned an error
        if (result && result.message && (result.message.includes("Error") || result.message.includes("Failed"))) {
            throw new Error(result.message);
        }
        
        // Stop the timer
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        // Show success message
        showNotification('Parking session ended successfully!', 'success');
        
        // Display payment details if available
        if (result && result.payment) {
            console.log("Payment data received:", result.payment);
            document.getElementById('totalHours').textContent = 
                `${result.duration_hours || 1} hour${(result.duration_hours || 1) > 1 ? 's' : ''}`;
            document.getElementById('totalAmount').textContent = 
                `$${parseFloat(result.payment.amount || result.total_amount || 0).toFixed(2)}`;
            
            // Show payment details
            document.getElementById('paymentDetails').classList.add('show');
        } else {
            // If no payment details, still show estimated receipt
            const parkingData = activeSession.parkingSpace || {};
            const hourlyRate = parseFloat(parkingData.price_per_hour || 5.00);
            const diffMs = new Date() - new Date(activeSession.start_time);
            const hours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
            const totalAmount = hours * hourlyRate;
            
            document.getElementById('totalHours').textContent = `${hours} hour${hours > 1 ? 's' : ''}`;
            document.getElementById('totalAmount').textContent = `$${totalAmount.toFixed(2)}`;
            document.getElementById('paymentStatus').textContent = 'Paid';
            
            // Show payment details
            document.getElementById('paymentDetails').classList.add('show');
        }
        
        // Update UI
        endBtn.style.display = 'none';
        
        // Mark session as ended locally
        activeSession = null;
        
    } catch (error) {
        console.error('Error ending session:', error);
        console.error('Error details:', error);
        
        let errorMessage = 'Failed to end session';
        if (error.message) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        
        showNotification(errorMessage, 'error');
        
        // Re-enable button
        const endBtn = document.getElementById('endBtn');
        endBtn.disabled = false;
        endBtn.innerHTML = '<i class="fas fa-stop-circle"></i> End Parking Session';
        endBtn.style.opacity = '1';
    }
}

    function goToDashboard() {
        console.log("Redirecting to dashboard");
        window.location.href = 'dashboard.html';
    }

    function showLoading(show) {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = show ? 'block' : 'none';
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
