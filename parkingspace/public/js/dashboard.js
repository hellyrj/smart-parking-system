document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserInfo();
    checkActiveSession();
    loadMyParkings();
    
    // Show map section by default
    showSection('map-section');
    
    // Initialize map
    if (typeof initMap === 'function') {
        initMap();
    }
});

// Load user information
function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userEmail = document.getElementById('user-email');
    const profileEmail = document.getElementById('profile-email');
    
    if (userEmail) userEmail.textContent = user.email || 'User';
    if (profileEmail) profileEmail.textContent = user.email || 'Loading...';
    
    // Set member since (for demo)
    document.getElementById('member-since').textContent = new Date().toLocaleDateString();
}

// Check for active parking session
async function checkActiveSession() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        // This endpoint doesn't exist yet - you'll need to create it
        // For now, we'll use a dummy check
        const response = await fetch(`${API_BASE_URL}/sessions/active`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const session = await response.json();
            if (session) {
                showActiveSession(session);
            }
        }
    } catch (error) {
        console.error('Error checking session:', error);
    }
}

// Show active session
function showActiveSession(session) {
    const sessionInfo = document.getElementById('session-info');
    const sessionBadge = document.getElementById('session-badge');
    
    sessionBadge.classList.remove('hidden');
    
    sessionInfo.innerHTML = `
        <div class="active-session-card">
            <h3><i class="fas fa-car"></i> Active Parking Session</h3>
            <div class="session-details">
                <div class="detail-item">
                    <label>Started:</label>
                    <span>${new Date(session.start_time).toLocaleString()}</span>
                </div>
                <div class="detail-item">
                    <label>Location:</label>
                    <span>${session.parking_name || 'Unknown'}</span>
                </div>
                <div class="detail-item">
                    <label>Price/Hour:</label>
                    <span>$${session.price_per_hour || '0.00'}</span>
                </div>
            </div>
            <button class="btn-primary btn-danger" onclick="endParkingSession()">
                <i class="fas fa-stop-circle"></i> End Session
            </button>
        </div>
    `;
}

// End parking session
async function endParkingSession() {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!confirm('Are you sure you want to end this parking session?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/sessions/end`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            alert('Session ended successfully!');
            checkActiveSession();
            showSection('map-section');
        } else {
            alert(data.message || 'Failed to end session');
        }
    } catch (error) {
        console.error('Error ending session:', error);
        alert('An error occurred');
    }
}

// Load user's parking spaces
async function loadMyParkings() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/parkings/mine`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const parkings = await response.json();

        if (response.ok) {
            displayMyParkings(parkings);
        }
    } catch (error) {
        console.error('Error loading parkings:', error);
    }
}

// Display user's parking spaces
function displayMyParkings(parkings) {
    const container = document.getElementById('my-parkings-list');
    
    if (!parkings || parkings.length === 0) {
        container.innerHTML = `
            <div class="no-parkings">
                <i class="fas fa-warehouse"></i>
                <h3>No Parking Spaces</h3>
                <p>You haven't registered any parking spaces yet.</p>
                <button class="btn-primary" onclick="showAddParking()">
                    <i class="fas fa-plus"></i> Add Parking Space
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = parkings.map(parking => `
        <div class="parking-card">
            <h3>${parking.name}</h3>
            <p>${parking.description || 'No description'}</p>
            <div class="parking-details">
                <div class="detail">
                    <i class="fas fa-car"></i>
                    <span>${parking.available_spots}/${parking.total_spots} spots</span>
                </div>
                <div class="detail">
                    <i class="fas fa-dollar-sign"></i>
                    <span>$${parking.price_per_hour}/hour</span>
                </div>
                <div class="detail">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${parking.parkingLocation?.address || 'No address'}</span>
                </div>
            </div>
            <div class="parking-actions">
                <button class="btn-secondary" onclick="editParking(${parking.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-primary" onclick="viewParking(${parking.id})">
                    <i class="fas fa-eye"></i> View
                </button>
            </div>
        </div>
    `).join('');
}

// Show section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }

    // Update active nav item
    const navItem = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (navItem) {
        navItem.classList.add('active');
    }

    // Update page title
    const titleMap = {
        'map-section': 'Parking Map',
        'active-session': 'Active Session',
        'my-parkings': 'My Parkings',
        'history': 'Parking History',
        'profile': 'My Profile'
    };

    const pageTitle = document.getElementById('page-title');
    if (pageTitle && titleMap[sectionId]) {
        pageTitle.textContent = titleMap[sectionId];
    }
}

// Toggle sidebar (mobile)
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

// Show add parking modal
function showAddParking() {
    document.getElementById('modal-title').textContent = 'Add Parking Space';
    document.getElementById('modal-body').innerHTML = `
        <form id="addParkingForm">
            <div class="form-group">
                <label>Name:</label>
                <input type="text" id="parkingName" placeholder="Parking Space Name" required>
            </div>
            <div class="form-group">
                <label>Description:</label>
                <textarea id="parkingDescription" placeholder="Description" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label>Total Spots:</label>
                <input type="number" id="totalSpots" min="1" value="1" required>
            </div>
            <div class="form-group">
                <label>Price per Hour ($):</label>
                <input type="number" id="pricePerHour" min="0.5" step="0.5" value="5.00" required>
            </div>
            <div class="form-group">
                <label>Latitude:</label>
                <input type="number" id="latitude" step="any" placeholder="37.7749" required>
            </div>
            <div class="form-group">
                <label>Longitude:</label>
                <input type="number" id="longitude" step="any" placeholder="-122.4194" required>
            </div>
            <div class="form-group">
                <label>Address:</label>
                <input type="text" id="address" placeholder="Full address">
            </div>
            <div class="form-group">
                <label>City:</label>
                <input type="text" id="city" placeholder="City">
            </div>
            <button type="submit" class="btn-primary">Create Parking Space</button>
        </form>
    `;

    // Get current location for convenience
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            document.getElementById('latitude').value = position.coords.latitude.toFixed(6);
            document.getElementById('longitude').value = position.coords.longitude.toFixed(6);
            
            // Reverse geocode to get address
            reverseGeocode(position.coords.latitude, position.coords.longitude);
        });
    }

    document.getElementById('parking-modal').style.display = 'block';
    
    // Add form submit handler
    setTimeout(() => {
        const form = document.getElementById('addParkingForm');
        if (form) {
            form.addEventListener('submit', handleAddParking);
        }
    }, 100);
}

// Handle add parking form submission
async function handleAddParking(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) return;

    const parkingData = {
        name: document.getElementById('parkingName').value,
        description: document.getElementById('parkingDescription').value,
        total_spots: parseInt(document.getElementById('totalSpots').value),
        price_per_hour: parseFloat(document.getElementById('pricePerHour').value),
        latitude: parseFloat(document.getElementById('latitude').value),
        longitude: parseFloat(document.getElementById('longitude').value),
        address: document.getElementById('address').value,
        city: document.getElementById('city').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/parkings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(parkingData)
        });

        const data = await response.json();

        if (response.ok) {
            alert('Parking space created successfully!');
            closeModal();
            loadMyParkings();
            showSection('my-parkings');
        } else {
            alert(data.message || 'Failed to create parking space');
        }
    } catch (error) {
        console.error('Error creating parking:', error);
        alert('An error occurred');
    }
}

// Reverse geocode coordinates to address
async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await response.json();
        
        if (data.address) {
            const address = data.address;
            const fullAddress = [
                address.road,
                address.suburb,
                address.city || address.town || address.village,
                address.state,
                address.country
            ].filter(Boolean).join(', ');
            
            document.getElementById('address').value = fullAddress;
            document.getElementById('city').value = address.city || address.town || address.village || '';
        }
    } catch (error) {
        console.error('Reverse geocoding error:', error);
    }
}

// Close modal
function closeModal() {
    document.getElementById('parking-modal').style.display = 'none';
}

// View parking details
function viewParking(parkingId) {
    // Implement view parking details
    alert(`View parking ${parkingId} - This feature is coming soon!`);
}

// Edit parking
function editParking(parkingId) {
    // Implement edit parking
    alert(`Edit parking ${parkingId} - This feature is coming soon!`);
}

// Locate user on map
function locateUser() {
    if (typeof locateOnMap === 'function') {
        locateOnMap();
    }
}

// Search nearby parkings
function searchNearbyParkings() {
    if (typeof searchParkings === 'function') {
        searchParkings();
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('parking-modal');
    if (event.target === modal) {
        closeModal();
    }
};