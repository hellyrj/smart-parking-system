let map;
let markers = [];

const findBtn = document.getElementById("findParkingBtn");
const parkingList = document.getElementById("parking-list");

// Update your findBtn click handler:
findBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
    }

    // Show precise location request
    alert("Please allow HIGH ACCURACY location when prompted by your browser");

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            
            console.log("📍 GPS Accuracy:", accuracy + " meters");
            
            // Warn if accuracy is poor
            if (accuracy > 100) { // More than 100 meters is poor
                alert(`⚠️ Low GPS accuracy: ${accuracy}m\n\nTry moving to a window or outdoors for better signal.`);
            }
            
            initMap(lat, lng);
            searchNearby(lat, lng);
            searchByLocation(lat, lng, "gps");
        },
        (error) => {
            console.error("Geolocation error:", error);
            
            // Try fallback with less accuracy
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    initMap(lat, lng);
                    searchNearby(lat, lng);
                },
                () => {
                    alert(`Location error: ${error.message}\n\nTry these fixes:\n1. Allow location in browser settings\n2. Try incognito mode\n3. Check Chromebook location settings`);
                },
                {
                    enableHighAccuracy: false, // Try without high accuracy
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        },
        {
            enableHighAccuracy: true, // CRITICAL: Force GPS
            timeout: 15000, // Give it more time
            maximumAge: 0 // Don't use cached location
        }
    );
});

function initMap(lat, lng) {
    if (!map) {
        map = L.map("map").setView([lat, lng], 14);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap",
        }).addTo(map);
    }

    // User location marker
    L.marker([lat, lng])
        .addTo(map)
        .bindPopup("📍 You are here")
        .openPopup();
}

async function searchNearby(lat, lng) {
    parkingList.innerHTML = "Searching parking...";
    clearMarkers();

    const parkings = await API.searchParking(lat, lng);
    renderParkings(parkings);
    renderMarkers(parkings);
}

function moveMapToLocation(lat, lng, name) {
    map.setView([lat, lng], 15);

    L.marker([lat, lng])
        .addTo(map)
        .bindPopup(name)
        .openPopup();
}

function renderMarkers(parkings) {
    parkings.forEach((p) => {
        const loc = p.parkingLocations[0];

        // Create custom icon based on availability
        const iconColor = p.available_spots > 0 ? 'green' : 'red';
        const parkingIcon = L.divIcon({
            html: `<div style="
                background-color: ${iconColor};
                color: white;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            ">
                <span style="font-size: 12px;">$${p.price_per_hour}</span>
            </div>`,
            className: 'parking-marker',
            iconSize: [30, 30]
        });

        const marker = L.marker([loc.latitude, loc.longitude], { icon: parkingIcon })
            .addTo(map)
            .bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="margin: 0 0 10px 0; color: #2563eb;">${p.name}</h4>
                    <p style="margin: 5px 0;"><strong>Price:</strong> $${p.price_per_hour}/hour</p>
                    <p style="margin: 5px 0;"><strong>Available:</strong> ${p.available_spots} spots</p>
                    <p style="margin: 5px 0;"><strong>Address:</strong> ${loc.address || 'N/A'}</p>
                    <button onclick="startParking(${p.id})" 
                            style="
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                border: none;
                                padding: 10px 15px;
                                border-radius: 8px;
                                cursor: pointer;
                                width: 100%;
                                margin-top: 10px;
                                font-weight: bold;
                            ">
                        🅿️ Park Here
                    </button>
                </div>
            `);

        // Store parking data on marker
        marker.parkingData = p;
        
        markers.push(marker);
    });
}

function renderParkings(parkings) {
    parkingList.innerHTML = "";

    if (parkings.length === 0) {
        parkingList.innerHTML = "<p style='text-align: center; color: #666;'>No parking spots available in this area</p>";
        return;
    }

    parkings.forEach((p) => {
        const div = document.createElement("div");
        div.className = "parking-card";
        
        // Add badge for availability
        const availabilityBadge = p.available_spots > 0 
            ? `<span class="badge badge-success">${p.available_spots} spots</span>`
            : `<span class="badge badge-danger">Full</span>`;

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3>${p.name}</h3>
                    <p style="color: #666; margin: 5px 0;">
                        <i class="fas fa-location-dot"></i> ${p.parkingLocations?.[0]?.address || 'N/A'}
                    </p>
                    <p style="font-size: 14px; color: #4b5563;">
                        <i class="fas fa-clock"></i> ${p.operating_hours || '24/7'}
                    </p>
                </div>
                ${availabilityBadge}
            </div>
            
            <div style="display: flex; justify-content: space-between; margin: 15px 0;">
                <div>
                    <div style="font-size: 24px; font-weight: bold; color: #059669;">
                        $${p.price_per_hour}<span style="font-size: 14px; color: #6b7280;">/hour</span>
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">Rate</div>
                </div>
                
                <div style="text-align: right;">
                    <div style="font-size: 16px; font-weight: bold; color: #2563eb;">
                        ${p.total_spots} total spots
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">Capacity</div>
                </div>
            </div>
            
            <button onclick="startParking(${p.id})" 
                    class="btn-park" 
                    ${p.available_spots === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                <i class="fas fa-car"></i> ${p.available_spots > 0 ? 'Park Here' : 'No Spots Available'}
            </button>
        `;

        parkingList.appendChild(div);
    });
}

function clearMarkers() {
    markers.forEach((m) => map.removeLayer(m));
    markers = [];
}

async function searchByLocation(lat, lng, source = "manual") {
    console.log(`Searching from ${source}: ${lat}, ${lng}`);
    
    if (!map) {
        initMap(lat, lng);
    } else {
        map.setView([lat, lng], 14);
    }
    
    // Clear existing user marker if exists
    if (window.userMarker) {
        map.removeLayer(window.userMarker);
    }
    
    // Add marker at search location
    window.userMarker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`📍 ${source === "gps" ? "You are here" : "Search location"}`)
        .openPopup();
    
    // Search for parking
    searchNearby(lat, lng);
}