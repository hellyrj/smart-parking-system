// api.js - UPDATED VERSION - CORRECT ENDPOINTS FOR CURRENT BACKEND

// Only declare API_BASE if it doesn't already exist
if (typeof window.API_BASE === 'undefined') {
    window.API_BASE = "http://localhost:3000/api";
}

// Helper function to get token
function getToken() {
    return localStorage.getItem("token");
}

const API = {
    // ✅ Parking Search
    async searchParking(lat, lng, radius = 3) {
        const res = await fetch(
            `${window.API_BASE}/parking/search?latNum=${lat}&lngNum=${lng}&radiusNUM=${radius}`
        );
        return res.json();
    },

    // ✅ Get parking details
    async getParkingDetails(parkingId) {
        try {
            const response = await fetch(`${window.API_BASE}/parking/${parkingId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error getting parking details:', error);
            return null;
        }
    },
    
    // ✅ Get driver reservations
    async getDriverReservations() {
        try {
            const response = await fetch(`${window.API_BASE}/driver/reservations`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error getting reservations:', error);
            return { success: false, message: error.message };
        }
    },
    
    // ✅ Check reservation status
    async checkReservationStatus(reservationId) {
        try {
            const response = await fetch(`${window.API_BASE}/reservations/${reservationId}/status`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error checking reservation status:', error);
            return { expired: true };
        }
    },
    
    // ✅ Cancel reservation
    async cancelReservation(reservationId) {
        try {
            const response = await fetch(`${window.API_BASE}/driver/reservations/${reservationId}/cancel`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error cancelling reservation:', error);
            return { success: false, message: error.message };
        }
    },

    // ✅ DRIVER: Get driver's active sessions
    async getDriverSessions() {
        const res = await fetch(`${window.API_BASE}/driver/sessions`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return await res.json();
    },

    // ✅ DRIVER: Reserve parking spot
    async reserveParkingSpot(parkingId, vehiclePlate, vehicleModel) {
        const res = await fetch(`${window.API_BASE}/driver/reserve`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({ 
                parkingId, 
                vehiclePlate, 
                vehicleModel 
            }),
        });
        return res.json();
    },

    // ✅ DRIVER: Start parking session (convert reservation to active)
    async startParkingSession(reservationId) {
        const res = await fetch(`${window.API_BASE}/driver/session/start`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({ reservationId }),
        });
        return res.json();
    },

    // ✅ DRIVER: End parking session
    async endParkingSession(sessionId) {
        const res = await fetch(`${window.API_BASE}/driver/session/end`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({ sessionId }),
        });
        return res.json();
    },

    // ✅ DRIVER: Cancel driver reservation (alternative endpoint)
    async cancelDriverReservation(reservationId) {
        const res = await fetch(`${window.API_BASE}/driver/reservation/${reservationId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ OWNER: Get my parkings
    async getMyParkings() {
        const res = await fetch(`${window.API_BASE}/owner/parkings`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ OWNER: Create parking (with file upload)
    async createParking(formData) {
        const res = await fetch(`${window.API_BASE}/owner/parkings`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
            body: formData,
        });
        return res.json();
    },

    // ✅ OWNER: Update parking
    async updateParking(id, data) {
        const res = await fetch(`${window.API_BASE}/owner/parkings/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    // ✅ OWNER: Delete parking
    async deleteParking(id) {
        const res = await fetch(`${window.API_BASE}/owner/parkings/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ OWNER: Deactivate parking
    async deactivateParking(id) {
        const res = await fetch(`${window.API_BASE}/owner/parkings/${id}/deactivate`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ OWNER: Activate parking
    async activateParking(id) {
        const res = await fetch(`${window.API_BASE}/owner/parkings/${id}/activate`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ OWNER: Get active sessions
    async getOwnerActiveSessions() {
        const res = await fetch(`${window.API_BASE}/owner/session/active`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ OWNER: Get reservations
    async getOwnerReservations() {
        const res = await fetch(`${window.API_BASE}/owner/session/reservations`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ OWNER: Confirm user arrival
    async confirmUserArrival(sessionId) {
        const res = await fetch(`${window.API_BASE}/owner/session/${sessionId}/confirm-arrival`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ OWNER: Cancel reservation (owner side)
    async cancelOwnerReservation(sessionId) {
        const res = await fetch(`${window.API_BASE}/owner/session/${sessionId}/cancel`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ OWNER: Get earnings
    async getOwnerEarnings() {
        const res = await fetch(`${window.API_BASE}/owner/earnings`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ OWNER: Get notifications
    async getOwnerNotifications() {
        const res = await fetch(`${window.API_BASE}/owner/notifications`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ Get parking by ID (for edit)
    async getParkingById(id) {
        const res = await fetch(`${window.API_BASE}/owner/parkings/${id}`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ USER: Get profile
    async getMyProfile() {
        const res = await fetch(`${window.API_BASE}/user/profile`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ USER: Update profile
    async updateProfile(data) {
        const res = await fetch(`${window.API_BASE}/user/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    // ✅ USER: Become owner
    async requestOwnerStatus() {
        const res = await fetch(`${window.API_BASE}/user/become-owner`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ USER: Upload document
    async uploadDocument(formData) {
        const res = await fetch(`${window.API_BASE}/user/documents`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
            body: formData,
        });
        return res.json();
    },

    // ✅ USER: Get my documents
    async getMyDocuments() {
        const res = await fetch(`${window.API_BASE}/user/documents`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ NOTIFICATIONS: Get notifications
    async getNotifications() {
        const res = await fetch(`${window.API_BASE}/notifications`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ NOTIFICATIONS: Mark as read
    async markNotificationAsRead(notificationId) {
        const res = await fetch(`${window.API_BASE}/notifications/${notificationId}/read`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ NOTIFICATIONS: Mark all as read
    async markAllNotificationsAsRead() {
        const res = await fetch(`${window.API_BASE}/notifications/read-all`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ ADMIN: Dashboard stats
    async getDashboardStats() {
        const res = await fetch(`${window.API_BASE}/admin/dashboard`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ ADMIN: Get all users
    async getAdminUsers() {
        const res = await fetch(`${window.API_BASE}/admin/users`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ ADMIN: Get all owners
    async getAdminOwners() {
        const res = await fetch(`${window.API_BASE}/admin/owners`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ ADMIN: Verify owner
    async verifyOwner(userId) {
        const res = await fetch(`${window.API_BASE}/admin/owners/${userId}/verify`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ ADMIN: Reject owner
    async rejectOwner(userId, reason) {
        const res = await fetch(`${window.API_BASE}/admin/owners/${userId}/reject`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({ reason }),
        });
        return res.json();
    },

    // ✅ ADMIN: Get all parking spaces
    async getAdminParkings() {
        const res = await fetch(`${window.API_BASE}/admin/parkings`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ ADMIN: Approve parking space
    async approveParking(parkingId) {
        const res = await fetch(`${window.API_BASE}/admin/parkings/${parkingId}/approve`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ ADMIN: Reject parking space
    async rejectParking(parkingId, reason) {
        const res = await fetch(`${window.API_BASE}/admin/parkings/${parkingId}/reject`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({ reason }),
        });
        return res.json();
    },

    // ✅ ADMIN: Approve document
    async approveDocument(docId) {
        const res = await fetch(`${window.API_BASE}/admin/documents/${docId}/approve`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ ADMIN: Reject document
    async rejectDocument(docId, reason) {
        const res = await fetch(`${window.API_BASE}/admin/documents/${docId}/reject`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({ reason }),
        });
        return res.json();
    },

    // ✅ ADMIN: Delete user
    async deleteUser(userId) {
        const res = await fetch(`${window.API_BASE}/admin/users/${userId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ ADMIN: Update user status
    async updateUserStatus(userId, status) {
        const res = await fetch(`${window.API_BASE}/admin/users/${userId}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({ status }),
        });
        return res.json();
    },

    // ✅ Get user documents (admin)
    async getUserDocuments(userId) {
        const res = await fetch(`${window.API_BASE}/admin/users/${userId}/documents`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    },

    // ✅ Verify payment
    async verifyPayment(paymentId) {
        const res = await fetch(`${window.API_BASE}/admin/payments/${paymentId}/verify`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return res.json();
    }
};

// Make API globally available
window.API = API;