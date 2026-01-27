const params = new URLSearchParams(window.location.search);
const editId = params.get("edit");

class AddParkingManager {
    constructor() {
        this.map = null;
        this.marker = null;
        this.selectedLatLng = null;
        this.isEditMode = !!editId;
        this.editId = editId;
        this.searchMarker = null;
        
        this.initialize();
    }

    initialize() {
        if (!document.getElementById("parkingForm")) return;
        
        // Initialize map
        this.initMap();
        
        // Setup form submit handler
        document.getElementById("parkingForm").addEventListener("submit", (e) => this.handleSubmit(e));
        this.setupSearch();

        // Load parking data if in edit mode
        if (this.isEditMode) {
            this.loadParkingForEdit();
        }
    }

    initMap() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    this.createMap(latitude, longitude);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    // Default location
                    this.createMap(40.7128, -74.0060);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000
                }
            );
        } else {
            // Default location if geolocation not supported
            this.createMap(40.7128, -74.0060);
        }
    }

    createMap(lat, lng) {
        this.map = L.map("map").setView([lat, lng], 14);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Add click handler
        this.map.on("click", (e) => this.onMapClick(e));

        // Add user location marker
        const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: '<div style="background: #667eea; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>',
            iconSize: [26, 26],
            iconAnchor: [13, 13]
        });

        L.marker([lat, lng], { icon: userIcon })
            .addTo(this.map)
            .bindPopup("📍 Your Current Location")
            .openPopup();
    }

    setupSearch() {
    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("searchInput");
    
    if (!searchBtn || !searchInput) return;
    
    // Search button click handler
    searchBtn.addEventListener("click", () => this.performSearch());
    
    // Allow Enter key to trigger search
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === 'Enter') {
            this.performSearch();
        }
    });
}

async performSearch() {
    const searchInput = document.getElementById("searchInput");
    const query = searchInput.value.trim();
    
    if (!query) {
        this.showAlert("Please enter a location to search", "error");
        return;
    }
    
    this.showLoading(true, "Searching...");
    
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
        );
        
        const data = await response.json();
        
        if (data.length === 0) {
            this.showAlert("Location not found. Try a different search.", "error");
            return;
        }
        
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        // Move map to searched location
        this.moveToLocation(latitude, longitude, display_name);
        
    } catch (error) {
        console.error("Search error:", error);
        this.showAlert("Search failed. Please try again.", "error");
    } finally {
        this.showLoading(false);
    }
}

moveToLocation(lat, lng, displayName = "Searched Location") {
    if (!this.map) return;
    
    // Move map view
    this.map.setView([lat, lng], 15);
    
    // Clear previous search marker
    if (this.searchMarker) {
        this.map.removeLayer(this.searchMarker);
    }
    
    // Add search marker
    this.searchMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'search-location-marker',
            html: '<div style="background: #ff6b6b; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">🔍</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        })
    }).addTo(this.map)
    .bindPopup(`📍 ${displayName}<br><small>Click the map here to select this location</small>`)
    .openPopup();
    
    // Optional: Automatically fill address fields
    this.reverseGeocode(lat, lng);
}

    async onMapClick(e) {
        const { lat, lng } = e.latlng;
        this.selectedLatLng = { lat, lng };

        if (this.marker) {
            this.marker.setLatLng([lat, lng]);
        } else {
            this.marker = L.marker([lat, lng], { 
                draggable: true,
                icon: L.divIcon({
                    className: 'parking-location-marker',
                    html: '<div style="background: #28a745; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>',
                    iconSize: [36, 36],
                    iconAnchor: [18, 18]
                })
            }).addTo(this.map);

            this.marker.on("dragend", async (e) => {
                const pos = e.target.getLatLng();
                this.selectedLatLng = { lat: pos.lat, lng: pos.lng };
                await this.reverseGeocode(pos.lat, pos.lng);
            });
        }

        await this.reverseGeocode(lat, lng);
    }

    async reverseGeocode(lat, lng) {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );

            const data = await res.json();

            if (data.address) {
                document.getElementById("address").value = data.display_name || "";
                document.getElementById("city").value = 
                    data.address.city ||
                    data.address.town ||
                    data.address.village ||
                    data.address.county ||
                    "";
            }
        } catch (err) {
            console.error("Reverse geocoding failed:", err);
        }
    }

    async loadParkingForEdit() {
        try {
            // Get all parkings and find the one with matching ID
            const parkings = await API.getMyParkings();
            const parking = parkings.find(p => p.id == this.editId);
            
            if (!parking) {
                alert("Parking not found");
                window.location.href = "/my-parkings.html";
                return;
            }

            // Fill form fields
            document.getElementById("name").value = parking.name;
            document.getElementById("description").value = parking.description || "";
            document.getElementById("totalSpots").value = parking.total_spots;
            document.getElementById("price").value = parking.price_per_hour;
            document.getElementById("address").value =
                parking.parkingLocation?.address || "";
            document.getElementById("city").value =
                parking.parkingLocation?.city || "";

            const lat = parking.parkingLocation?.latitude;
            const lng = parking.parkingLocation?.longitude;

            if (lat && lng) {
                this.selectedLatLng = { lat, lng };
                this.updateMapMarker(lat, lng);
            }
        } catch (error) {
            console.error("Error loading parking:", error);
            alert("Failed to load parking data");
        }
    }

    updateMapMarker(lat, lng) {
        if (this.map) {
            this.map.setView([lat, lng], 15);
            
            // Remove existing marker
            if (this.marker) {
                this.map.removeLayer(this.marker);
            }
            
            // Add new marker
            this.marker = L.marker([lat, lng], { 
                draggable: true,
                icon: L.divIcon({
                    className: 'parking-location-marker',
                    html: '<div style="background: #28a745; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>',
                    iconSize: [36, 36],
                    iconAnchor: [18, 18]
                })
            }).addTo(this.map);
            
            this.marker.on("dragend", async (e) => {
                const pos = e.target.getLatLng();
                this.selectedLatLng = { lat: pos.lat, lng: pos.lng };
                await this.reverseGeocode(pos.lat, pos.lng);
            });
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.selectedLatLng) {
            this.showAlert("Please select a location on the map", "error");
            return;
        }

        // Validate form
        if (!this.validateForm()) return;

        const data = {
            name: document.getElementById("name").value,
            description: document.getElementById("description").value,
            total_spots: Number(document.getElementById("totalSpots").value),
            price_per_hour: Number(document.getElementById("price").value),
            latitude: this.selectedLatLng.lat,
            longitude: this.selectedLatLng.lng,
            address: document.getElementById("address").value,
            city: document.getElementById("city").value,
        };

        // Show loading
        this.showLoading(true);

        try {
            let res;
            
            if (this.isEditMode) {
                res = await API.updateParking(this.editId, data);
            } else {
                res = await API.createParking(data);
            }

            if (res.message === "A parking spot already exists at this location") {
                this.showAlert("⚠️ A parking spot already exists at this location! Please choose another location.", "warning");
            } else if (res.message.includes("successfully")) {
                this.showAlert(`✅ ${res.message}`, "success");
                setTimeout(() => {
                    window.location.href = "/my-parkings.html"; // Redirect to my parkings page
                }, 1500);
            } else {
                this.showAlert(res.message || "Operation failed", "error");
            }
        } catch (err) {
            console.error("Submit error:", err);
            this.showAlert("Something went wrong. Please try again.", "error");
        } finally {
            this.showLoading(false);
        }
    }

    validateForm() {
        const name = document.getElementById("name").value.trim();
        const totalSpots = document.getElementById("totalSpots").value;
        const price = document.getElementById("price").value;

        if (!name) {
            this.showAlert("Please enter a parking name", "error");
            return false;
        }

        if (!totalSpots || Number(totalSpots) <= 0) {
            this.showAlert("Please enter a valid number of spots", "error");
            return false;
        }

        if (!price || Number(price) <= 0) {
            this.showAlert("Please enter a valid price per hour", "error");
            return false;
        }

        return true;
    }

    showAlert(message, type = "error") {
        // Use the auth alert system if available
        if (window.auth && window.auth.showAlert) {
            window.auth.showAlert(message, type);
        } else {
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }
showLoading(show, text = null) {
    if (window.auth && window.auth.showLoading) {
        window.auth.showLoading(show);
    } else {
        const submitBtn = document.querySelector('#parkingForm button[type="submit"]');
        const searchBtn = document.getElementById("searchBtn");
        
        if (submitBtn) {
            submitBtn.disabled = show;
            if (text && show) {
                submitBtn.innerHTML = text;
            } else {
                submitBtn.innerHTML = show ? 
                    '<div class="spinner" style="width: 20px; height: 20px; margin: 0 auto;"></div>' : 
                    (this.isEditMode ? 'Update Parking' : 'Save Parking');
            }
        }
        
        if (searchBtn) {
            searchBtn.disabled = show;
            searchBtn.innerHTML = show ? 
                '<div class="spinner" style="width: 16px; height: 16px; margin: 0 auto;"></div>' : 
                'Search';
        }
    }
}
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    window.addParkingManager = new AddParkingManager();
});