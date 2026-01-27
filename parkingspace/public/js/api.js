const API_BASE = "http://localhost:3000/api";

const API = {
async searchParking(lat, lng) {
  const res = await fetch(
    `${API_BASE}/parking/search?latNum=${lat}&lngNum=${lng}&radiusNUM=3`
  );
  return res.json();
},
async getMyActiveSession() {
  const res = await fetch(`${API_BASE}/sessions/active`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return await res.json();
},

  async startSession(parkingId) {
    const res = await fetch(`${API_BASE}/sessions/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ parking_id: parkingId }),
    });
    return res.json();
  },

  async endSession() {
    const res = await fetch(`${API_BASE}/sessions/end`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return res.json();
  },

  async createParking(data) {
  const res = await fetch(`${API_BASE}/parking`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(data),
  });

  return res.json();
}, 

async getMyParkings() {
  const res = await fetch(`${API_BASE}/parking/mine`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.json();
},

async deleteParking(id) {
  const res = await fetch(`${API_BASE}/parking/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.json();
},

async updateParking(id, data) {
  const res = await fetch(`${API_BASE}/parking/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
},

async getParkingById(id) {
  const res = await fetch(`${API_BASE}/parking/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.json();
},

async deactivateParking(id) {
  const res = await fetch(`${API_BASE}/parking/${id}/deactivate`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.json();
},

async activateParking(id) {
  const res = await fetch(`${API_BASE}/parking/${id}/activate`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.json();
},



};
