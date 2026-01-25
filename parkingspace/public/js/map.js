let map;
let userMarker;
let parkingMarkers = [];
let userLatitude = 40.7128; // Default: New York
let userLongitude = -74.0060;

// Initialize map
function initMap() {
    map = L.map('map').setView([userLatitude, userLongitude], 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Try to get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                userLatitude = position.coords.latitude;
                userLongitude = position.coords.longitude;
                
                map.setView([userLatitude, userLongitude], 15);
                addUserMarker();
                searchParkings();
            },
            error => {
                console.error('Geolocation error:', error);
                addUserMarker();
                searchParkings();
            }
        );
    } else {
        addUserMarker();
        searchParkings();
    }

    // Update radius display
    const radiusSlider = document.getElementById('radius');
    const radiusValue = document.getElementById('radius-value');
    
    if (radiusSlider) {
        radiusSlider.addEventListener('input', function() {
            radiusValue.textContent = `${this.value} km`;
        });
    }
}

// Add user marker to map
function addUserMarker() {
    if (userMarker) {
        map.removeLayer(userMarker);
    }
    
    userMarker = L.marker([userLatitude, userLongitude])
        .addTo(map)
        .bindPopup('Your Location')
        .openPopup();
}

// Search for nearby parkings
async function searchParkings() {
    const token = localStorage.getItem('token');
    const radius = document.getElementById('radius')?.value || 3;
    
    clearParkingMarkers();

    try {
        const response = await fetch(`${API_BASE_URL}/parkings/search?latNum=${userLatitude}&lngNum=${userLongitude}&radiusNUM=${radius}`);
        const parkings = await response.json();

        if (response.ok) {
            displayParkingsOnMap(parkings);
        }
    } catch (error) {
        console.error('Error searching parkings:', error);
    }
}

// Display parkings on map
function displayParkingsOnMap(parkings) {
    parkings.forEach(parking => {
        if (parking.parkingLocation) {
            const marker = L.marker([
                parking.parkingLocation.latitude,
                parking.parkingLocation.longitude
            ])
            .addTo(map)
            .bindPopup(`
                <div class="parking-popup">
                    <h4>${parking.name}</h4>
                    <p>${parking.description || 'No description'}</p>
                    <p><strong>Price:</strong> $${parking.price_per_hour}/hour</p>
                    <p><strong>Available:</strong> ${parking.available_spots}/${parking.total_spots} spots</p>
                    <button onclick="startParkingSession(${parking.id})" class="btn-primary">
                        <i class="fas fa-play"></i> Start Parking
                    </button>
                </div>
            `);

            parkingMarkers.push(marker);
        }
    });
}

// Clear all parking markers
function clearParkingMarkers() {
    parkingMarkers.forEach(marker => map.removeLayer(marker));
    parkingMarkers = [];
}

// Start parking session
async function startParkingSession(parkingId) {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!confirm('Start parking session at this location?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/sessions/start`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ parking_id: parkingId })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Parking session started!');
            checkActiveSession();
            showSection('active-session');
        } else {
            alert(data.message || 'Failed to start session');
        }
    } catch (error) {
        console.error('Error starting session:', error);
        alert('An error occurred');
    }
}

// Locate user on map
function locateOnMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                userLatitude = position.coords.latitude;
                userLongitude = position.coords.longitude;
                
                map.setView([userLatitude, userLongitude], 15);
                addUserMarker();
            },
            error => {
                alert('Unable to get your location. Please enable location services.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

// Handle radius change
document.getElementById('radius')?.addEventListener('change', searchParkings);