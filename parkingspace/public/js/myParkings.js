const container = document.getElementById("parkingList");

loadMyParkings();

async function loadMyParkings() {
  const parkings = await API.getMyParkings();
  container.innerHTML = "";

  if (parkings.length === 0) {
    container.innerHTML = "<p>You have no parking spaces.</p>";
    return;
  }

parkings.forEach((p) => {
  const div = document.createElement("div");
  div.className = "parking-card";

  const status = p.is_active ? "🟢 Active" : "🔴 Inactive";

  div.innerHTML = `
    <h3>${p.name}</h3>
    <p>Status: ${status}</p>
    <p>Available: ${p.available_spots}/${p.total_spots}</p>
    <p>Price/hour: ${p.price_per_hour}</p>

    <button onclick="editParking(${p.id})">✏️ Edit</button>

    ${
  p.is_active
    ? `<button onclick="deactivateParking(${p.id})">⛔ Deactivate</button>`
    : p.total_spots === 0
      ? `<button disabled title="Add spots before activating">🚫 Cannot Activate</button>`
      : `<button onclick="activateParking(${p.id})">✅ Activate</button>`
}


    <button onclick="deleteParking(${p.id})">🗑 Delete</button>
  `;

  container.appendChild(div);
});

}

async function deactivateParking(id) {
  const ok = confirm("Deactivate this parking? It will be hidden from users.");

  if (!ok) return;

  const res = await API.deactivateParking(id);
  alert(res.message);
  loadMyParkings();
}

async function activateParking(id) {
  const res = await API.activateParking(id);
  alert(res.message);
  loadMyParkings();
}



async function deleteParking(id) {
  const confirmDelete = confirm(
    "Are you sure? This parking will be permanently deleted."
  );

  if (!confirmDelete) return;

  const res = await API.deleteParking(id);

  if (res.message) {
    alert(res.message);
    loadMyParkings();
  } else {
    alert("Delete failed");
  }
}

//not finished yet
function editParking(id) {
  window.location.href = `/add-parking.html?edit=${id}`;
}
