async function startParking(parkingId, vehiclePlate = '', vehicleModel = '') {
    try {
        console.log("Starting parking for parkingId:", parkingId);

        try {
            const sessionsData = await API.getDriverSessions();
            const sessionsArray = Array.isArray(sessionsData)
                ? sessionsData
                : (sessionsData ? [sessionsData] : []);

            const activeSession = sessionsArray.find(s => s && !s.end_time && String(s.status || '').toLowerCase() !== 'reserved');
            if (activeSession) {
                localStorage.setItem('activeSessionId', String(activeSession.id || activeSession.session_id || ''));
                if (window.showAppConfirm) {
                    await window.showAppConfirm({
                        title: 'Already Active',
                        message: 'You already have an active parking session. Please end it before starting a new one.',
                        confirmText: 'OK',
                        cancelText: 'Close'
                    });
                } else {
                    alert('You already have an active parking session. Please end it before starting a new one.');
                }
                return false;
            } else {
                localStorage.removeItem('activeSessionId');
            }

            const reservedSession = sessionsArray.find(s => s && String(s.status || '').toLowerCase() === 'reserved');
            if (reservedSession) {
                if (reservedSession.id != null) {
                    localStorage.setItem('lastReservationId', String(reservedSession.id));
                }

                if (window.showAppConfirm) {
                    await window.showAppConfirm({
                        title: 'Already Reserved',
                        message: 'You already have an active reservation. Please use My Reservations or wait until it expires.',
                        confirmText: 'OK',
                        cancelText: 'Close'
                    });
                } else {
                    alert('You already have an active reservation.');
                }
                return false;
            }

            const reservationsData = await API.getDriverReservations();
            const reservations = Array.isArray(reservationsData?.reservations)
                ? reservationsData.reservations
                : [];

            const activeReservation = reservations.find(r => {
                const status = String(r?.reservation_status || r?.status || '').toLowerCase();
                return status === 'active' || status === 'waiting' || status === 'reserved' || status === 'pending';
            });

            if (activeReservation) {
                if (activeReservation.id != null) {
                    localStorage.setItem('lastReservationId', String(activeReservation.id));
                }

                const timeString = activeReservation.reserved_until
                    ? new Date(activeReservation.reserved_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : null;

                if (window.showAppConfirm) {
                    await window.showAppConfirm({
                        title: 'Already Reserved',
                        message: timeString
                            ? `You already have an active reservation until <strong>${timeString}</strong>.\n\nPlease use My Reservations or wait until it expires.`
                            : 'You already have an active reservation. Please use My Reservations.',
                        confirmText: 'OK',
                        cancelText: 'Close'
                    });
                } else {
                    alert(timeString
                        ? `You already have an active reservation until ${timeString}.`
                        : 'You already have an active reservation.');
                }
                return false;
            }
        } catch (e) {
            console.warn('Unable to validate server state. Falling back to local checks.', e);
        }

        const activeSessionId = localStorage.getItem('activeSessionId');
        if (activeSessionId) {
            if (window.showAppConfirm) {
                await window.showAppConfirm({
                    title: 'Already Active',
                    message: 'You already have an active parking session. Please end it before starting a new one.',
                    confirmText: 'OK',
                    cancelText: 'Close'
                });
            } else {
                alert('You already have an active parking session. Please end it before starting a new one.');
            }
            return false;
        }

        const lastReservationId = localStorage.getItem('lastReservationId');
        const reservedUntil = localStorage.getItem('reservedUntil');
        if (lastReservationId && reservedUntil) {
            let shouldBlock = false;
            let serverStatus = null;

            try {
                serverStatus = await API.checkReservationStatus(lastReservationId);
            } catch (e) {
                serverStatus = null;
            }

            const statusString = String(serverStatus?.reservation_status || serverStatus?.status || '').toLowerCase();
            const serverExpired = serverStatus?.expired === true || statusString === 'expired' || statusString === 'cancelled' || statusString === 'canceled';
            const serverActive = statusString === 'active' || statusString === 'waiting';

            if (serverStatus) {
                shouldBlock = serverActive && !serverExpired;
            } else {
                const remaining = Date.parse(reservedUntil) - Date.now();
                shouldBlock = !Number.isNaN(remaining) && remaining > 0;
            }

            if (shouldBlock) {
                const timeString = new Date(reservedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                if (window.showAppConfirm) {
                    await window.showAppConfirm({
                        title: 'Already Reserved',
                        message: `You already have an active reservation until <strong>${timeString}</strong>.\n\nPlease use My Reservations or wait until it expires.`,
                        confirmText: 'OK',
                        cancelText: 'Close'
                    });
                } else {
                    alert(`You already have an active reservation until ${timeString}.`);
                }
                return false;
            }

            // Stale/expired/cancelled reservation in localStorage
            localStorage.removeItem('lastReservationId');
            localStorage.removeItem('reservedUntil');
            localStorage.removeItem('reservedParkingId');
        }
        
        // 1. Get parking details first to show price
        const parkingResponse = await API.getParkingDetails(parkingId);
        if (!parkingResponse || !parkingResponse.success) {
            alert("Failed to get parking details");
            return false;
        }
        
        // Extract parking data from response
        const parkingDetails = parkingResponse.data;
        if (!parkingDetails) {
            alert("Parking details not found");
            return false;
        }
        
        // Get location for the popup message
        const location = parkingDetails.parkingLocations?.[0];
        const locationAddress = location ? (location.address || `${location.latitude}, ${location.longitude}`) : "Unknown location";

        if (!window.showReservationModal) {
            alert('UI modal not loaded. Please refresh the page.');
            return false;
        }

        const modalResult = await window.showReservationModal({
            parkingName: parkingDetails.name,
            locationAddress,
            pricePerHour: parkingDetails.price_per_hour,
            availableSpots: parkingDetails.available_spots,
            vehiclePlate,
            vehicleModel
        });

        if (!modalResult) return false;

        vehiclePlate = modalResult.vehiclePlate;
        vehicleModel = modalResult.vehicleModel;

        if (modalResult.action === 'reserve') {
            // RESERVE FLOW
            console.log("Reserving spot for 30 minutes...");
            const reservation = await API.reserveParkingSpot(parkingId, vehiclePlate, vehicleModel);
            
            if (!reservation.reservation_id) {
                alert(reservation.message || "Reservation failed");
                return false;
            }
            
            console.log("Reservation ID:", reservation.reservation_id);
            
            // Store reservation info
            localStorage.setItem('lastReservationId', reservation.reservation_id);
            localStorage.setItem('reservedUntil', reservation.reserved_until);
            localStorage.setItem('reservedParkingId', parkingId);
            
            // Show success with reservation details
            const reservedUntil = new Date(reservation.reserved_until);
            const timeString = reservedUntil.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const reserveSuccess = window.showAppConfirm
                ? await window.showAppConfirm({
                    title: 'Reservation Successful',
                    message: `Your spot at <strong>${parkingDetails.name}</strong> is reserved until <strong>${timeString}</strong>.\n\nGo to My Reservations now?`,
                    confirmText: 'Go to My Reservations',
                    cancelText: 'Stay Here'
                })
                : confirm('Reservation successful. Go to My Reservations now?');

            if (reserveSuccess) {
                // Redirect to reservations page
                window.location.href = "reservations.html";
                return true;
            } else {
                // Show reminder notification
                setTimeout(() => {
                    alert(`⏰ Reminder: Your reservation at ${parkingDetails.name} expires at ${timeString}`);
                }, 1000);
                return true;
            }
            
        } else {
            // START IMMEDIATELY FLOW
            console.log("Starting session immediately...");
            
            // First reserve, then immediately start
            const reservation = await API.reserveParkingSpot(parkingId, vehiclePlate, vehicleModel);
            
            if (!reservation.reservation_id) {
                alert(reservation.message || "Reservation failed");
                return false;
            }
            
            // ✅ CORRECT: Pass reservationId directly
            const session = await API.startParkingSession(reservation.reservation_id);
            
            if (session.message?.includes("started") || session.session_id) {
                alert("✅ Parking session started!");
                
                // Store session info
                localStorage.setItem('activeSessionId', session.id || session.session_id);
                localStorage.removeItem('lastReservationId'); // Clear reservation if exists
                
                // Redirect to active session page
                window.location.href = "active-session.html";
                return true;
            } else {
                alert(session.message || "Failed to start session");
                return false;
            }
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error: " + (error.message || "Something went wrong"));
        return false;
    }
}

// Function to check and handle expired reservations
async function checkReservationStatus(reservationId) {
    try {
        const response = await API.checkReservationStatus(reservationId);
        return response;
    } catch (error) {
        console.error("Error checking reservation:", error);
        return { expired: true };
    }
}

// Function to activate a reserved spot
async function activateReservation(reservationId) {
    try {
        const session = await API.startParkingSession(reservationId);
        
        if (session.message?.includes("started") || session.session_id) {
            // Clear reservation from localStorage
            localStorage.removeItem('lastReservationId');
            localStorage.removeItem('reservedUntil');
            localStorage.removeItem('reservedParkingId');
            
            // Set active session
            localStorage.setItem('activeSessionId', session.id || session.session_id);
            
            return { success: true, sessionId: session.id || session.session_id };
        } else {
            return { success: false, message: session.message || "Failed to activate" };
        }
    } catch (error) {
        console.error("Error activating reservation:", error);
        return { success: false, message: error.message };
    }
}

// Update map marker click handler
// In map.js, replace marker click handler with:
function setupMarkerClickHandler(marker, parking) {
    marker.on('click', async function() {
        // Start the parking process (themed modal will collect plate/model and action)
        await startParking(parking.id);
    });
}