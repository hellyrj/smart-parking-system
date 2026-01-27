const endBtn = document.getElementById("endParkingBtn");

async function startParking(parkingId) {
  const res = await API.startSession(parkingId);

  if (res.message?.includes("started")) {
    alert("Parking started 🚗");
    endBtn.style.display = "block";
  } else {
    alert(res.message);
  }
}

