async function startParking(parkingId, vehiclePlate = '', vehicleModel = '') {
    try {
        console.log("Starting parking for parkingId:", parkingId);
        
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
        
        // 2. Ask user if they want to reserve or start immediately
        const userChoice = confirm(
            `📍 ${parkingDetails.name}\n\n` +
            `Location: ${locationAddress}\n` +
            `Price: $${parkingDetails.price_per_hour}/hour\n` +
            `Available spots: ${parkingDetails.available_spots}\n\n` +
            `Do you want to:\n\n` +
            `• Click OK to Reserve Now (30 min hold)\n` +
            `• Click Cancel to Start Session Immediately`
        );
        
        // 3. Get vehicle info
        if (!vehiclePlate || !vehicleModel) {
            const plate = prompt("Enter your vehicle license plate:");
            if (!plate) {
                alert("License plate is required");
                return false;
            }
            
            const model = prompt("Enter your vehicle model:", "Car");
            vehiclePlate = plate.trim();
            vehicleModel = model?.trim() || "Car";
        }
        
        if (userChoice) {
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
            
            const reserveSuccess = confirm(
                `✅ Reservation Successful!\n\n` +
                `Location: ${parkingDetails.name}\n` +
                `Address: ${locationAddress}\n` +
                `Your spot is reserved until: ${timeString}\n` +
                `(30 minutes from now)\n\n` +
                `Do you want to:\n\n` +
                `• Click OK: Go to My Reservations\n` +
                `• Click Cancel: Stay on this page`
            );
            
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
        // Show enhanced confirmation dialog with price
        const confirmed = confirm(
            `📍 ${parking.name}\n\n` +
            `Price: $${parking.price_per_hour}/hour\n` +
            `Available spots: ${parking.available_spots}\n` +
            `Address: ${parking.parkingLocations?.[0]?.address || 'N/A'}\n\n` +
            `Do you want to park here?`
        );
        
        if (confirmed) {
            // Start the parking process
            await startParking(parking.id);
        }
    });
}