// api.js - UPDATED VERSION

// Only declare API_BASE if it doesn't already exist
if (typeof window.API_BASE === 'undefined') {
    window.API_BASE = "http://localhost:3000/api";
}

const API = {
    async searchParking(lat, lng) {
        const res = await fetch(
            `${window.API_BASE}/parking/search?latNum=${lat}&lngNum=${lng}&radiusNUM=3`
        );
        return res.json();
    },
    
    async getMyActiveSession() {
        const res = await fetch(`${window.API_BASE}/sessions/active`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return await res.json();
    },

    async startSession(parkingId) {
        const res = await fetch(`${window.API_BASE}/sessions/start`, {
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
        const res = await fetch(`${window.API_BASE}/sessions/end`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return res.json();
    },

    async createParking(data) {
        const res = await fetch(`${window.API_BASE}/parking`, {
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
        const res = await fetch(`${window.API_BASE}/parking/mine`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return res.json();
    },

    async deleteParking(id) {
        const res = await fetch(`${window.API_BASE}/parking/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return res.json();
    },

    async updateParking(id, data) {
        const res = await fetch(`${window.API_BASE}/parking/${id}`, {
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
        const res = await fetch(`${window.API_BASE}/parking/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return res.json();
    },

    async deactivateParking(id) {
        const res = await fetch(`${window.API_BASE}/parking/${id}/deactivate`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return res.json();
    },

    async activateParking(id) {
        const res = await fetch(`${window.API_BASE}/parking/${id}/activate`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return res.json();
    },

    // Admin API endpoints
    async getDashboardStats() {
        const res = await fetch(`${window.API_BASE}/admin/dashboard`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return res.json();
    },

    async getAdminUsers() {
        const res = await fetch(`${window.API_BASE}/admin/users`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return res.json();
    },

    async getAdminOwners() {
        const res = await fetch(`${window.API_BASE}/admin/owners`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return res.json();
    },

    async verifyOwner(userId) {
        const res = await fetch(`${window.API_BASE}/admin/owners/${userId}/verify`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return res.json();
    },

    async rejectOwner(userId, reason) {
        const res = await fetch(`${window.API_BASE}/admin/owners/${userId}/reject`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ reason }),
        });
        return res.json();
    },

    async getAdminParkings() {
        const res = await fetch(`${window.API_BASE}/admin/parkings`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return res.json();
    },

    async approveParking(parkingId) {
        const res = await fetch(`${window.API_BASE}/admin/parkings/${parkingId}/approve`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return res.json();
    },

    async rejectParking(parkingId, reason) {
        const res = await fetch(`${window.API_BASE}/admin/parkings/${parkingId}/reject`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ reason }),
        });
        return res.json();
    },

    async approveDocument(docId) {
        const res = await fetch(`${window.API_BASE}/admin/documents/${docId}/approve`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return res.json();
    },

    async rejectDocument(docId, reason) {
        const res = await fetch(`${window.API_BASE}/admin/documents/${docId}/reject`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ reason }),
        });
        return res.json();
    },

    async deleteUser(userId) {
        const res = await fetch(`${window.API_BASE}/admin/users/${userId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return res.json();
    },

    async updateUserStatus(userId, status) {
        const res = await fetch(`${window.API_BASE}/admin/users/${userId}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ status }),
        });
        return res.json();
    },
};

// Make API globally available
window.API = API;