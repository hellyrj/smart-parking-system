const container = document.getElementById("parkingList");
loadMyParkings();


async function loadMyParkings() {
    try {
        const parkings = await API.getMyParkings();
        container.innerHTML = "";

        if (!parkings || parkings.length === 0) {
            container.innerHTML = "<p>You have no parking spaces.</p>";
            return;
        }

        parkings.forEach((p) => {
            const div = document.createElement("div");
            div.className = `parking-card${p.is_active ? '' : ' inactive'}`;

            const approvalStatus = p.approval_status ? `(${p.approval_status})` : '';

            const locationObj = p.parkingLocation || p.parkingLocations?.[0] || p.ParkingLocations?.[0] || null;
            const locationAddress = locationObj?.address
                || (locationObj?.latitude && locationObj?.longitude ? `${locationObj.latitude}, ${locationObj.longitude}` : null)
                || 'N/A';

            const statusLabel = p.is_active ? 'Active' : 'Inactive';
            const statusClass = p.is_active ? 'status-available' : 'status-inactive';

            div.innerHTML = `
                <div class="parking-header">
                    <h3 class="parking-name">${p.name}</h3>
                    <span class="parking-status ${statusClass}">
                        <i class="fas fa-circle"></i>
                        ${statusLabel} ${approvalStatus}
                    </span>
                </div>

                <div class="parking-details">
                    <div class="detail-item">
                        <span class="detail-label">Available</span>
                        <span class="detail-value">${p.available_spots}/${p.total_spots}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Price / hour</span>
                        <span class="detail-value price">Br ${p.price_per_hour}</span>
                    </div>
                </div>

                <div class="parking-location">
                    <i class="fas fa-location-dot"></i>
                    <span>${locationAddress}</span>
                </div>

                <div class="parking-actions">
                    <button class="action-btn btn-edit" onclick="editParking(${p.id})">
                        <i class="fas fa-pen"></i>
                        Edit
                    </button>

                    ${p.is_active ?
                        `<button class="action-btn btn-toggle" onclick="deactivateParking(${p.id})">
                            <i class=\"fas fa-ban\"></i>
                            Deactivate
                        </button>` :
                        p.total_spots === 0 ?
                            `<button class="action-btn btn-toggle" disabled title="Add spots before activating">
                                <i class=\"fas fa-triangle-exclamation\"></i>
                                Cannot Activate
                            </button>` :
                            `<button class="action-btn btn-toggle" onclick="activateParking(${p.id})">
                                <i class=\"fas fa-check\"></i>
                                Activate
                            </button>`
                    }

                    <button class="action-btn btn-delete" onclick="deleteParking(${p.id})">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            `;

            container.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading parkings:", error);
        container.innerHTML = "<p>Error loading your parking spaces. Please try again.</p>";
    }
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
