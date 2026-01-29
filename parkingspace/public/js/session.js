async function startParking(parkingId, vehiclePlate = '', vehicleModel = '') {
    try {
        console.log("Starting parking for parkingId:", parkingId);
        
        // 1. Get vehicle info
        if (!vehiclePlate || !vehicleModel) {
            const plate = prompt("Enter your vehicle license plate:");
            if (!plate) return;
            
            const model = prompt("Enter your vehicle model:", "Car");
            vehiclePlate = plate;
            vehicleModel = model || "Car";
        }
        
        // 2. Reserve spot
        console.log("Reserving spot...");
        const reservation = await API.reserveParkingSpot(parkingId, vehiclePlate, vehicleModel);
        
        if (!reservation.reservation_id) {
            alert(reservation.message || "Reservation failed");
            return false;
        }
        
        console.log("Reservation ID:", reservation.reservation_id);
        
        // 3. Ask to start immediately
        const startNow = confirm("Reservation created! Start session now?");
        
        if (startNow) {
            // ✅ CORRECT: Pass reservationId directly
            const session = await API.startParkingSession(reservation.reservation_id);
            
            if (session.message?.includes("started") || session.session_id) {
                alert("✅ Session started!");
                
                // Store session info
                localStorage.setItem('activeSessionId', session.id || session.session_id);
                
                // Redirect to active session page
                window.location.href = "active-session.html";
                return true;
            } else {
                alert(session.message || "Failed to start");
                return false;
            }
        } else {
            alert("Reservation created! Start later.");
            return true;
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error: " + error.message);
        return false;
    }
}

// Update the map.js click handler to use this function
// In map.js, replace the marker click handler with:
marker.on('click', async function() {
    const parkingId = this.parkingId;
    
    // Show confirmation dialog
    const confirmed = confirm(`Do you want to park at "${this.parkingName}"?\n\nPrice: $${this.hourlyRate}/hour`);
    
    if (confirmed) {
        // Start the parking process
        await startParking(parkingId);
    }
});