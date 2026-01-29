// admin.js - Admin Dashboard Functionality

class AdminDashboard {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.setupEventListeners();
        this.checkAdminAuth();
        this.loadDashboard();
    }

    checkAdminAuth() {
        const token = localStorage.getItem("token");
        const userRole = localStorage.getItem("userRole");
        if (!token) {
            window.location.href = "/login.html";
            return;
        }

            // Check if user is admin
    if (userRole !== "admin") {
        this.showAlert("Access denied. Admin privileges required.", "error");
        setTimeout(() => {
            window.location.href = "/home.html";
        }, 2000);
        return;
    }

        
        // Verify admin role (you might want to decode JWT to check role)
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail) {
            document.getElementById("adminEmail").textContent = userEmail;
        }
    }

    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll(".sidebar-menu li").forEach(item => {
            item.addEventListener("click", () => {
                const section = item.dataset.section;
                this.showSection(section);
                
                // Update active state
                document.querySelectorAll(".sidebar-menu li").forEach(li => {
                    li.classList.remove("active");
                });
                item.classList.add("active");
            });
        });

        // Search and filter
        document.getElementById("userSearch")?.addEventListener("input", (e) => {
            this.filterUsers(e.target.value);
        });

        document.getElementById("userFilter")?.addEventListener("change", (e) => {
            this.filterUsersByRole(e.target.value);
        });

        document.getElementById("documentFilter")?.addEventListener("change", (e) => {
            this.loadDocuments(e.target.value);
        });

        // Modal close buttons
        document.querySelectorAll(".close-modal").forEach(btn => {
            btn.addEventListener("click", () => {
                this.closeModal("userModal");
            });
        });

        document.getElementById("confirmCancel")?.addEventListener("click", () => {
            this.closeModal("confirmModal");
        });

        // Close modal when clicking outside
        window.addEventListener("click", (e) => {
            if (e.target.classList.contains("modal")) {
                this.closeModal(e.target.id);
            }
        });
    }

    async loadDashboard() {
        try {
            this.showLoading(true);
            const stats = await this.fetchDashboardStats();
            this.renderDashboardStats(stats);
            this.loadRecentActivity();
        } catch (error) {
            this.showAlert("Failed to load dashboard", "error");
        } finally {
            this.showLoading(false);
        }
    }

    async fetchDashboardStats() {
        try {
            const data = await API.getDashboardStats();
            return data;
        } catch (error) {
            throw new Error("Failed to fetch stats: " + error.message);
        }
    }


    renderDashboardStats(data) {
        const stats = data.stats;
        const statsGrid = document.getElementById("dashboardStats");
        
        const statCards = [
            {
                title: "Total Users",
                value: stats.totalUsers,
                icon: "fas fa-users",
                color: "#667eea",
                description: "All registered users"
            },
            {
                title: "Total Owners",
                value: stats.totalOwners,
                icon: "fas fa-user-tie",
                color: "#764ba2",
                description: "Verified parking owners"
            },
            {
                title: "Parking Spaces",
                value: stats.totalParkings,
                icon: "fas fa-car",
                color: "#f093fb",
                description: "Available parkings"
            },
            {
                title: "Active Sessions",
                value: stats.activeSessions,
                icon: "fas fa-play-circle",
                color: "#4facfe",
                description: "Currently active"
            },
            {
                title: "Pending Verifications",
                value: stats.pendingVerifications,
                icon: "fas fa-clock",
                color: "#ffd166",
                description: "Awaiting approval"
            },
            {
                title: "Pending Payments",
                value: stats.pendingPayments,
                icon: "fas fa-money-bill-wave",
                color: "#06d6a0",
                description: "To be verified"
            }
        ];

        statsGrid.innerHTML = statCards.map(stat => `
            <div class="stat-card">
                <div class="stat-icon" style="background: ${stat.color}">
                    <i class="${stat.icon}"></i>
                </div>
                <div class="stat-info">
                    <h3>${stat.value}</h3>
                    <p>${stat.title}</p>
                    <small style="color: #888;">${stat.description}</small>
                </div>
            </div>
        `).join("");
    }

    async loadRecentActivity() {
        try {
            const data = await API.getDashboardStats();
            this.renderRecentActivity(data.recentActivity);
        } catch (error) {
            console.error("Failed to load activity:", error);
        }
    }

    renderRecentActivity(activities) {
        const container = document.getElementById("recentActivity");
        
        if (!activities || activities.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">No recent activity</p>';
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-history"></i>
                </div>
                <div class="activity-details">
                    <h4>${activity.User?.email || 'System'}</h4>
                    <p>${activity.action}</p>
                    <small>${new Date(activity.createdAt).toLocaleString()}</small>
                </div>
            </div>
        `).join("");
    }

    // In admin.js - ADD payment proof methods:
async loadPayments() {
  try {
    this.showLoading(true);
    const token = localStorage.getItem("token");
    const response = await fetch(`${window.API_BASE}/admin/payment-proofs`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) throw new Error("Failed to load payment proofs");
    
    const paymentProofs = await response.json();
    this.renderPaymentsTable(paymentProofs);
  } catch (error) {
    this.showAlert("Failed to load payments: " + error.message, "error");
    this.renderPaymentsTable([]);
  } finally {
    this.showLoading(false);
  }
}

renderPaymentsTable(paymentProofs) {
  const tbody = document.getElementById("paymentsTable");
  
  if (!paymentProofs || paymentProofs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No pending payments</td></tr>';
    return;
  }

  tbody.innerHTML = paymentProofs.map(payment => `
    <tr>
      <td>${payment.id}</td>
      <td>${payment.user?.email || 'N/A'}</td>
      <td>$${payment.amount}</td>
      <td>
        <span class="status-badge ${payment.payment_type === 'subscription' ? 'status-info' : 'status-warning'}">
          ${payment.payment_type}
        </span>
      </td>
      <td>
        <span class="status-badge ${payment.status === 'pending' ? 'status-pending' : 
          payment.status === 'verified' ? 'status-verified' : 'status-suspended'}">
          ${payment.status}
        </span>
      </td>
      <td>${new Date(payment.createdAt).toLocaleDateString()}</td>
      <td>
        <button class="btn-action btn-view" onclick="admin.viewPaymentProof(${payment.id})">
          <i class="fas fa-eye"></i> View Screenshot
        </button>
      </td>
      <td>
        ${payment.status === 'pending' ? `
          <button class="btn-action btn-approve" onclick="admin.verifyPaymentProof(${payment.id})">
            <i class="fas fa-check"></i> Verify
          </button>
          <button class="btn-action btn-reject" onclick="admin.rejectPaymentProof(${payment.id})">
            <i class="fas fa-times"></i> Reject
          </button>
        ` : ''}
      </td>
    </tr>
  `).join("");
}

async viewPaymentProof(paymentId) {
  try {
    // Get payment proof details
    const token = localStorage.getItem("token");
    const response = await fetch(`${window.API_BASE}/admin/payment-proofs`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) throw new Error("Failed to load payment proof");
    
    const paymentProofs = await response.json();
    const payment = paymentProofs.find(p => p.id == paymentId);
    
    if (payment) {
      // Open payment proof in new tab
      window.open(payment.file_url, '_blank');
    }
  } catch (error) {
    this.showAlert("Failed to view payment proof: " + error.message, "error");
  }
}

async verifyPaymentProof(paymentId) {
  const notes = prompt("Enter verification notes (optional):");
  
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${window.API_BASE}/admin/payment-proofs/${paymentId}/verify`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ notes })
    });
    
    if (!response.ok) throw new Error("Failed to verify payment");
    
    const result = await response.json();
    this.showAlert(result.message || "Payment verified successfully", "success");
    this.loadPayments();
    this.loadDashboard(); // Refresh stats
  } catch (error) {
    this.showAlert("Failed to verify payment: " + error.message, "error");
  }
}

async rejectPaymentProof(paymentId) {
  const reason = prompt("Enter rejection reason:");
  if (!reason) return;
  
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${window.API_BASE}/admin/payment-proofs/${paymentId}/reject`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ reason })
    });
    
    if (!response.ok) throw new Error("Failed to reject payment");
    
    const result = await response.json();
    this.showAlert(result.message || "Payment rejected", "success");
    this.loadPayments();
  } catch (error) {
    this.showAlert("Failed to reject payment: " + error.message, "error");
  }
}

renderPaymentsTable(paymentProofs) {
  const tbody = document.getElementById("paymentsTable");
  
  if (!paymentProofs || paymentProofs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No pending payments</td></tr>';
    return;
  }

  tbody.innerHTML = paymentProofs.map(payment => `
    <tr>
      <td>${payment.id}</td>
      <td>${payment.user?.email || 'N/A'}</td>
      <td>$${payment.amount}</td>
      <td>
        <span class="status-badge ${payment.payment_type === 'subscription' ? 'status-info' : 'status-warning'}">
          ${payment.payment_type}
        </span>
      </td>
      <td>
        <span class="status-badge ${payment.status === 'pending' ? 'status-pending' : 
          payment.status === 'verified' ? 'status-verified' : 'status-suspended'}">
          ${payment.status}
        </span>
      </td>
      <td>${new Date(payment.createdAt).toLocaleDateString()}</td>
      <td>
        <button class="btn-action btn-view" onclick="admin.viewPaymentProof(${payment.id})">
          <i class="fas fa-eye"></i> View Screenshot
        </button>
      </td>
      <td>
        ${payment.status === 'pending' ? `
          <button class="btn-action btn-approve" onclick="admin.verifyPaymentProof(${payment.id})">
            <i class="fas fa-check"></i> Verify
          </button>
          <button class="btn-action btn-reject" onclick="admin.rejectPaymentProof(${payment.id})">
            <i class="fas fa-times"></i> Reject
          </button>
        ` : ''}
      </td>
    </tr>
  `).join("");
}

async viewPaymentProof(paymentId) {
  try {
    // Get payment proof details
    const token = localStorage.getItem("token");
    const response = await fetch(`${window.API_BASE}/admin/payment-proofs`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) throw new Error("Failed to load payment proof");
    
    const paymentProofs = await response.json();
    const payment = paymentProofs.find(p => p.id == paymentId);
    
    if (payment) {
      // Open payment proof in new tab
      window.open(payment.file_url, '_blank');
    }
  } catch (error) {
    this.showAlert("Failed to view payment proof: " + error.message, "error");
  }
}

async verifyPaymentProof(paymentId) {
  const notes = prompt("Enter verification notes (optional):");
  
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${window.API_BASE}/admin/payment-proofs/${paymentId}/verify`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ notes })
    });
    
    if (!response.ok) throw new Error("Failed to verify payment");
    
    const result = await response.json();
    this.showAlert(result.message || "Payment verified successfully", "success");
    this.loadPayments();
    this.loadDashboard(); // Refresh stats
  } catch (error) {
    this.showAlert("Failed to verify payment: " + error.message, "error");
  }
}

async rejectPaymentProof(paymentId) {
  const reason = prompt("Enter rejection reason:");
  if (!reason) return;
  
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${window.API_BASE}/admin/payment-proofs/${paymentId}/reject`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ reason })
    });
    
    if (!response.ok) throw new Error("Failed to reject payment");
    
    const result = await response.json();
    this.showAlert(result.message || "Payment rejected", "success");
    this.loadPayments();
  } catch (error) {
    this.showAlert("Failed to reject payment: " + error.message, "error");
  }
}

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll(".content-section").forEach(section => {
            section.classList.remove("active");
        });
        
        // Show selected section
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add("active");
            
            // Load section data
            switch(sectionId) {
                case "users":
                    this.loadUsers();
                    break;
                case "owners":
                    this.loadOwners();
                    break;
                case "documents":
                    this.loadDocuments("pending");
                    break;
                case "parkings":
                    this.loadParkings();
                    break;
                case "payments":
                    this.loadPayments();
                    break;
                case "activity":
                    this.loadActivityLog();
                    break;
            }
        }
    }

    async loadUsers() {
        try {
            this.showLoading(true);
            const users = await API.getAdminUsers();
            this.renderUsersTable(users);
        } catch (error) {
            this.showAlert("Failed to load users: " + error.message, "error");
        } finally {
            this.showLoading(false);
        }
    }


    renderUsersTable(users) {
        const tbody = document.getElementById("usersTable");
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td>
                    <span class="status-badge ${user.role === 'admin' ? 'status-verified' : 
                        user.role === 'owner' ? 'status-pending' : ''}">
                        ${user.role}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${user.verification_status === 'verified' ? 'status-verified' : 
                        user.verification_status === 'pending' ? 'status-pending' : 
                        'status-suspended'}">
                        ${user.verification_status || 'N/A'}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${user.subscription_status === 'active' ? 'status-active' : 'status-inactive'}">
                        ${user.subscription_status || 'inactive'}
                    </span>
                </td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn-action btn-view" onclick="admin.showUserDetails(${user.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn-action btn-edit" onclick="admin.editUser(${user.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-action btn-delete" onclick="admin.confirmDeleteUser(${user.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join("");
    }

     async loadOwners() {
        try {
            this.showLoading(true);
            const owners = await API.getAdminOwners();
            this.renderOwnersTable(owners);
        } catch (error) {
            this.showAlert("Failed to load owners: " + error.message, "error");
        } finally {
            this.showLoading(false);
        }
    }


    renderOwnersTable(owners) {
        const tbody = document.getElementById("ownersTable");
        
        if (!owners || owners.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No owners found</td></tr>';
            return;
        }

        tbody.innerHTML = owners.map(owner => `
            <tr>
                <td>${owner.id}</td>
                <td>${owner.email}</td>
                <td>
                    <span class="status-badge ${owner.verification_status === 'verified' ? 'status-verified' : 
                        owner.verification_status === 'pending' ? 'status-pending' : 
                        'status-suspended'}">
                        ${owner.verification_status}
                    </span>
                </td>
                <td>${owner.ownedParkings?.length || 0}</td>
                <td>${owner.documents?.filter(d => d.status === 'approved').length || 0} / ${owner.documents?.length || 0}</td>
                <td>
                    ${owner.verification_status === 'pending' ? `
                        <button class="btn-action btn-approve" onclick="admin.verifyOwner(${owner.id})">
                            <i class="fas fa-check"></i> Verify
                        </button>
                        <button class="btn-action btn-reject" onclick="admin.rejectOwner(${owner.id})">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : `
                        <button class="btn-action btn-view" onclick="admin.showUserDetails(${owner.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                    `}
                </td>
            </tr>
        `).join("");
    }

async loadDocuments(filter = "pending") {
  try {
    this.showLoading(true);
    // First, get all users to filter by owners
    const users = await API.getAdminUsers();
    
    // Filter to get only owner users
    const ownerUsers = users.filter(user => user.role === 'owner' || user.verification_status === 'pending');
    
    // Collect all documents from owner users
    let allDocuments = [];
    for (const user of ownerUsers) {
      const documents = await API.getUserDocuments(user.id);
      if (documents && documents.length > 0) {
        documents.forEach(doc => {
          allDocuments.push({
            ...doc,
            userEmail: user.email,
            userId: user.id
          });
        });
      }
    }

    // Filter documents
    if (filter !== "all") {
      allDocuments = allDocuments.filter(doc => doc.status === filter);
    }

    this.renderDocumentsGrid(allDocuments, filter);
  } catch (error) {
    this.showAlert("Failed to load documents: " + error.message, "error");
  } finally {
    this.showLoading(false);
  }
}

    renderDocumentsGrid(users, filter) {
        const grid = document.getElementById("documentsGrid");
        
        // Collect all documents from all users
        let allDocuments = [];
        users.forEach(user => {
            if (user.documents && user.documents.length > 0) {
                user.documents.forEach(doc => {
                    allDocuments.push({
                        ...doc,
                        userEmail: user.email,
                        userId: user.id
                    });
                });
            }
        });

        // Filter documents
        if (filter !== "all") {
            allDocuments = allDocuments.filter(doc => doc.status === filter);
        }

        if (allDocuments.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">No documents found</p>';
            return;
        }

        grid.innerHTML = allDocuments.map(doc => `
            <div class="document-card">
                <div class="document-header">
                    <div>
                        <strong>${doc.document_type}</strong>
                        <div style="font-size: 0.9em; color: #666;">${doc.userEmail}</div>
                    </div>
                    <span class="status-badge ${doc.status === 'approved' ? 'status-verified' : 
                        doc.status === 'pending' ? 'status-pending' : 
                        'status-suspended'}">
                        ${doc.status}
                    </span>
                </div>
                <div class="document-preview">
                    ${doc.file_url.match(/\.(jpg|jpeg|png|gif)$/i) ? 
                        `<img src="${doc.file_url}" alt="Document">` : 
                        `<i class="fas fa-file-pdf" style="font-size: 4rem; color: #667eea;"></i>`
                    }
                </div>
                <div class="document-actions">
                    <a href="${doc.file_url}" target="_blank" class="btn-action btn-view" style="flex: 1;">
                        <i class="fas fa-external-link-alt"></i> View
                    </a>
                    ${doc.status === 'pending' ? `
                        <button class="btn-action btn-approve" style="flex: 1;" onclick="admin.approveDocument(${doc.id})">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn-action btn-reject" style="flex: 1;" onclick="admin.rejectDocument(${doc.id})">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join("");
    }

      async loadParkings() {
        try {
            this.showLoading(true);
            const parkings = await API.getAdminParkings();
            this.renderParkingsTable(parkings);
        } catch (error) {
            this.showAlert("Failed to load parking spaces: " + error.message, "error");
        } finally {
            this.showLoading(false);
        }
    }


    renderParkingsTable(parkings) {
        const tbody = document.getElementById("parkingsTable");
        
        if (!parkings || parkings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No parking spaces found</td></tr>';
            return;
        }

        tbody.innerHTML = parkings.map(parking => `
            <tr>
                <td>${parking.id}</td>
                <td>${parking.name}</td>
                <td>${parking.owner?.email || 'N/A'}</td>
                <td>${parking.location || 'N/A'}</td>
                <td>$${parking.price_per_hour || '0'}/hr</td>
                <td>
                    <span class="status-badge ${parking.is_active ? 'status-active' : 'status-inactive'}">
                        ${parking.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${parking.approval_status === 'approved' ? 'status-verified' : 
                        parking.approval_status === 'pending' ? 'status-pending' : 
                        'status-suspended'}">
                        ${parking.approval_status}
                    </span>
                </td>
                <td>
                    ${parking.approval_status === 'pending' ? `
                        <button class="btn-action btn-approve" onclick="admin.approveParking(${parking.id})">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn-action btn-reject" onclick="admin.rejectParking(${parking.id})">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : `
                        <button class="btn-action btn-view" onclick="admin.viewParking(${parking.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                    `}
                </td>
            </tr>
        `).join("");
    }

    async loadPayments() {
        // This would require a payments endpoint
        // For now, we'll show a message
        const tbody = document.getElementById("paymentsTable");
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Payment feature coming soon</td></tr>';
    }

    async loadActivityLog() {
        try {
            this.showLoading(true);
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE}/admin/dashboard`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            
            if (!response.ok) throw new Error("Failed to fetch activity log");
            
            const data = await response.json();
            this.renderActivityLog(data.recentActivity);
        } catch (error) {
            this.showAlert("Failed to load activity log", "error");
        } finally {
            this.showLoading(false);
        }
    }

    renderActivityLog(activities) {
        const container = document.getElementById("activityLog");
        
        if (!activities || activities.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">No activity found</p>';
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="activity-item" style="margin-bottom: 15px;">
                <div class="activity-icon">
                    <i class="fas fa-${this.getActivityIcon(activity.action)}"></i>
                </div>
                <div class="activity-details">
                    <h4>${activity.User?.email || 'System'}</h4>
                    <p>${activity.action}</p>
                    <small>${new Date(activity.createdAt).toLocaleString()}</small>
                </div>
            </div>
        `).join("");
    }

    getActivityIcon(action) {
        if (action.includes('login')) return 'sign-in-alt';
        if (action.includes('logout')) return 'sign-out-alt';
        if (action.includes('create') || action.includes('register')) return 'plus-circle';
        if (action.includes('update') || action.includes('edit')) return 'edit';
        if (action.includes('delete')) return 'trash';
        if (action.includes('approve') || action.includes('verify')) return 'check-circle';
        if (action.includes('reject')) return 'times-circle';
        return 'history';
    }

    // Action Methods
     async showUserDetails(userId) {
        try {
            this.showLoading(true);
            const users = await API.getAdminUsers();
            const user = users.find(u => u.id == userId);
            
            if (user) {
                this.showUserModal(user);
            }
        } catch (error) {
            this.showAlert("Failed to load user details: " + error.message, "error");
        } finally {
            this.showLoading(false);
        }
    }

    showUserModal(user) {
        document.getElementById("modalTitle").textContent = `User Details: ${user.email}`;
        
        const modalBody = document.getElementById("modalBody");
        modalBody.innerHTML = `
            <div class="user-details">
                <div class="detail-item">
                    <span class="detail-label">ID:</span>
                    <span class="detail-value">${user.id}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${user.email}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Role:</span>
                    <span class="detail-value">
                        <span class="status-badge ${user.role === 'admin' ? 'status-verified' : 
                            user.role === 'owner' ? 'status-pending' : ''}">
                            ${user.role}
                        </span>
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Verification Status:</span>
                    <span class="detail-value">
                        <span class="status-badge ${user.verification_status === 'verified' ? 'status-verified' : 
                            user.verification_status === 'pending' ? 'status-pending' : 
                            'status-suspended'}">
                            ${user.verification_status}
                        </span>
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Subscription:</span>
                    <span class="detail-value">
                        <span class="status-badge ${user.subscription_status === 'active' ? 'status-active' : 'status-inactive'}">
                            ${user.subscription_status || 'inactive'}
                        </span>
                        ${user.subscription_expiry ? `(Expires: ${new Date(user.subscription_expiry).toLocaleDateString()})` : ''}
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Joined:</span>
                    <span class="detail-value">${new Date(user.createdAt).toLocaleString()}</span>
                </div>
                ${user.documents && user.documents.length > 0 ? `
                    <div class="detail-item">
                        <span class="detail-label">Documents:</span>
                        <span class="detail-value">${user.documents.length} uploaded</span>
                    </div>
                ` : ''}
            </div>
        `;
        
        this.openModal("userModal");
    }

    async verifyOwner(userId) {
        try {
            const result = await API.verifyOwner(userId);
            this.showAlert(result.message || "Owner verified successfully", "success");
            this.loadOwners();
            this.loadDashboard(); // Refresh stats
        } catch (error) {
            this.showAlert("Failed to verify owner: " + error.message, "error");
        }
    }

    async rejectOwner(userId) {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;
        
        try {
            const result = await API.rejectOwner(userId, reason);
            this.showAlert(result.message || "Owner verification rejected", "success");
            this.loadOwners();
        } catch (error) {
            this.showAlert("Failed to reject owner: " + error.message, "error");
        }
    }


    async approveDocument(docId) {
        try {
            const result = await API.approveDocument(docId);
            this.showAlert(result.message || "Document approved successfully", "success");
            this.loadDocuments("pending");
            this.loadDashboard(); // Refresh stats
        } catch (error) {
            this.showAlert("Failed to approve document: " + error.message, "error");
        }
    }

    async rejectDocument(docId) {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;
        
        try {
            const result = await API.rejectDocument(docId, reason);
            this.showAlert(result.message || "Document rejected", "success");
            this.loadDocuments("pending");
        } catch (error) {
            this.showAlert("Failed to reject document: " + error.message, "error");
        }
    }


    async approveParking(parkingId) {
        try {
            const result = await API.approveParking(parkingId);
            this.showAlert(result.message || "Parking space approved successfully", "success");
            this.loadParkings();
            this.loadDashboard(); // Refresh stats
        } catch (error) {
            this.showAlert("Failed to approve parking space: " + error.message, "error");
        }
    }

   async rejectParking(parkingId) {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;
        
        try {
            const result = await API.rejectParking(parkingId, reason);
            this.showAlert(result.message || "Parking space rejected", "success");
            this.loadParkings();
        } catch (error) {
            this.showAlert("Failed to reject parking space: " + error.message, "error");
        }
    }

    confirmDeleteUser(userId) {
        this.currentAction = { type: "deleteUser", id: userId };
        document.getElementById("confirmTitle").textContent = "Delete User";
        document.getElementById("confirmMessage").textContent = 
            "Are you sure you want to delete this user? This action cannot be undone.";
        this.openModal("confirmModal");
    }

    async deleteUser(userId) {
        try {
            const result = await API.deleteUser(userId);
            this.showAlert(result.message || "User deleted successfully", "success");
            this.loadUsers();
            this.loadDashboard(); // Refresh stats
        } catch (error) {
            this.showAlert("Failed to delete user: " + error.message, "error");
        }
    }

    // Modal Methods
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = "flex";
            setTimeout(() => modal.classList.add("active"), 10);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove("active");
            setTimeout(() => modal.style.display = "none", 300);
        }
    }

    // Utility Methods
    showLoading(show) {
        const loading = document.getElementById("adminLoading");
        if (loading) {
            loading.style.display = show ? "flex" : "none";
        }
    }

    showAlert(message, type = "error") {
        const container = document.getElementById("adminAlertContainer") || 
                         document.getElementById("alertContainer");
        
        if (!container) {
            const newContainer = document.createElement("div");
            newContainer.id = "adminAlertContainer";
            newContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 2000;
            `;
            document.body.appendChild(newContainer);
        }
        
        const alertDiv = document.createElement("div");
        alertDiv.className = `alert alert-${type}`;
        alertDiv.style.cssText = `
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            color: ${type === "success" ? "#155724" : "#721c24"};
            background: ${type === "success" ? "#d4edda" : "#f8d7da"};
            border: 1px solid ${type === "success" ? "#c3e6cb" : "#f5c6cb"};
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease;
        `;

        alertDiv.innerHTML = `
            ${type === "success" ? "✅" : "❌"} ${message}
            <button style="margin-left: 15px; background: none; border: none; cursor: pointer; float: right;">
                ✕
            </button>
        `;

        container.appendChild(alertDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.style.opacity = "0";
                alertDiv.style.transition = "opacity 0.3s";
                setTimeout(() => alertDiv.remove(), 300);
            }
        }, 5000);

        // Close button functionality
        alertDiv.querySelector("button").addEventListener("click", () => {
            alertDiv.remove();
        });
    }

    filterUsers(searchTerm) {
        const rows = document.querySelectorAll("#usersTable tr");
        rows.forEach(row => {
            const email = row.cells[1]?.textContent.toLowerCase() || '';
            const role = row.cells[2]?.textContent.toLowerCase() || '';
            const text = email + ' ' + role;
            
            if (text.includes(searchTerm.toLowerCase())) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    filterUsersByRole(role) {
        const rows = document.querySelectorAll("#usersTable tr");
        rows.forEach(row => {
            const userRole = row.cells[2]?.textContent.toLowerCase() || '';
            if (role === 'all' || userRole === role) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
}

// Handle confirm action
document.getElementById("confirmAction")?.addEventListener("click", () => {
    if (window.admin?.currentAction) {
        const { type, id } = window.admin.currentAction;
        
        switch(type) {
            case "deleteUser":
                window.admin.deleteUser(id);
                break;
            // Add more cases as needed
        }
        
        window.admin.closeModal("confirmModal");
        window.admin.currentAction = null;
    }
});

// Initialize admin dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    window.admin = new AdminDashboard();
});