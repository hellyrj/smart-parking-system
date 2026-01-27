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

    const marker = L.marker([loc.latitude, loc.longitude])
      .addTo(map)
      .bindPopup(`
        <b>${p.name}</b><br/>
        Available: ${p.available_spots}<br/>
        <button onclick="startParking(${p.id})">
          Start Parking
        </button>
      `);

    markers.push(marker);
  });
}

function renderParkings(parkings) {
  parkingList.innerHTML = "";

  if (parkings.length === 0) {
    parkingList.innerHTML = "<p>No parking available</p>";
    return;
  }

  parkings.forEach((p) => {
    const div = document.createElement("div");
    div.className = "parking-card";

    div.innerHTML = `
      <h3>${p.name}</h3>
      <p>Available spots: ${p.available_spots}</p>
      <p>Price/hour: ${p.price_per_hour}</p>
      <button onclick="startParking(${p.id})">
        Start Parking
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
