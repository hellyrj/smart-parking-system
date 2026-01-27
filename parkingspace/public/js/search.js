const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");

// Function to handle search (can be called from anywhere)
async function performLocationSearch(query) {
  if (!query) return null;

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json`
  );

  const data = await res.json();

  if (data.length === 0) {
    alert("Location not found");
    return null;
  }

  const { lat, lon, display_name } = data[0];
  return { lat: parseFloat(lat), lng: parseFloat(lon), name: display_name };
}

// Event listener for search button (if exists on current page)
if (searchBtn && searchInput) {
  searchBtn.addEventListener("click", async () => {
    const query = searchInput.value.trim();
    if (!query) return alert("Enter a location");

    const location = await performLocationSearch(query);
    if (location) {
      // Use the generic function
      if (typeof searchByLocation === 'function') {
        searchByLocation(location.lat, location.lng, "search");
      } else if (typeof moveMapToLocation === 'function') {
        // Fallback for backward compatibility
        moveMapToLocation(location.lat, location.lng, location.name);
        searchNearby(location.lat, location.lng);
      }
    }
  });
}