document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!checkAuth(true)) return;
    
    // Initialize dashboard
    loadDashboardData();
    setupEventListeners();
    updateUserInfo();
    setupRoleBasedContent();
});

function loadDashboardData() {
    // Load user profile
    loadUserProfile();
    
    // Load role-specific data
    if (auth.isAdmin()) {
        loadAdminData();
    } else if (auth.isDriver()) {
        loadDriverData();
    } else if (auth.isOwner()) {
        loadOwnerData();
    }
    
    // Load activity feed
    loadActivityFeed();
}

function loadUserProfile() {
    auth.getProfile().then(profile => {
        document.getElementById('userEmail').textContent = profile.email;
    }).catch(error => {
        console.error('Failed to load profile:', error);
        document.getElementById('userEmail').textContent = `User #${auth.user.id}`;
        
        if (error.message.includes('Session expired')) {
            showAlert('Your session has expired. Please login again.', 'error', 'dashboardAlert');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    });
}

function loadAdminData() {
    // Mock data for admin
    document.getElementById('totalDeliveries').textContent = '156';
    document.getElementById('completedToday').textContent = '24';
    document.getElementById('activeVehicles').textContent = '8';
    document.getElementById('totalRevenue').textContent = '$4,850';
}

function loadDriverData() {
    // Mock data for driver
    document.getElementById('totalDeliveries').textContent = '42';
    document.getElementById('completedToday').textContent = '5';
    document.getElementById('activeVehicles').textContent = '1';
    document.getElementById('totalRevenue').textContent = '$850';
}

function loadOwnerData() {
    // Mock data for owner
    document.getElementById('totalDeliveries').textContent = '89';
    document.getElementById('completedToday').textContent = '12';
    document.getElementById('activeVehicles').textContent = '3';
    document.getElementById('totalRevenue').textContent = '$2,150';
}

function loadActivityFeed() {
    const activityList = document.getElementById('activityList');
    const activities = [
        { icon: 'fa-sign-in-alt', text: 'Logged in to the system', time: 'Just now' },
        { icon: 'fa-user-check', text: 'Profile updated successfully', time: '2 hours ago' },
        { icon: 'fa-truck', text: 'Started new delivery route', time: '4 hours ago' },
        { icon: 'fa-check-circle', text: 'Completed delivery #DH-4231', time: '6 hours ago' },
        { icon: 'fa-map-marker-alt', text: 'Updated current location', time: 'Yesterday' }
    ];
    
    // Add more role-specific activities
    if (auth.isAdmin()) {
        activities.push(
            { icon: 'fa-users', text: 'Reviewed driver performance reports', time: '2 days ago' },
            { icon: 'fa-cog', text: 'Updated system settings', time: '3 days ago' }
        );
    } else if (auth.isDriver()) {
        activities.push(
            { icon: 'fa-route', text: 'Optimized delivery route for efficiency', time: '2 days ago' },
            { icon: 'fa-gas-pump', text: 'Recorded fuel consumption', time: '3 days ago' }
        );
    } else if (auth.isOwner()) {
        activities.push(
            { icon: 'fa-chart-line', text: 'Viewed monthly revenue report', time: '2 days ago' },
            { icon: 'fa-truck-loading', text: 'Added new vehicle to fleet', time: '4 days ago' }
        );
    }
    
    // Clear loading activity
    activityList.innerHTML = '';
    
    // Add activities
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas ${activity.icon}"></i>
            </div>
            <div class="activity-details">
                <p>${activity.text}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
}

function updateUserInfo() {
    const userRole = document.getElementById('userRole');
    userRole.textContent = auth.user.role;
    userRole.className = `role-badge ${auth.user.role}`;
}

function setupRoleBasedContent() {
    // Hide all sections first
    document.getElementById('adminSection').style.display = 'none';
    document.getElementById('driverSection').style.display = 'none';
    document.getElementById('ownerSection').style.display = 'none';
    
    // Show role-specific section
    if (auth.isAdmin()) {
        document.getElementById('adminSection').style.display = 'block';
    } else if (auth.isDriver()) {
        document.getElementById('driverSection').style.display = 'block';
    } else if (auth.isOwner()) {
        document.getElementById('ownerSection').style.display = 'block';
    }
}

function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        auth.logout();
        window.location.href = 'index.html';
    });
    
    // Refresh dashboard data every 5 minutes
    setInterval(() => {
        console.log('Refreshing dashboard data...');
        loadDashboardData();
    }, 5 * 60 * 1000);
}

// Action handlers
function adminAction(action) {
    switch(action) {
        case 'users':
            showAlert('Opening user management panel...', 'info', 'dashboardAlert');
            break;
        case 'reports':
            showAlert('Loading system reports...', 'info', 'dashboardAlert');
            break;
        case 'settings':
            showAlert('Opening system settings...', 'info', 'dashboardAlert');
            break;
    }
}

function driverAction(action) {
    switch(action) {
        case 'start':
            showAlert('Starting your shift...', 'success', 'dashboardAlert');
            break;
        case 'route':
            showAlert('Loading today\'s route...', 'info', 'dashboardAlert');
            break;
        case 'deliveries':
            showAlert('Opening delivery list...', 'info', 'dashboardAlert');
            break;
    }
}

function ownerAction(action) {
    switch(action) {
        case 'vehicles':
            showAlert('Opening fleet management...', 'info', 'dashboardAlert');
            break;
        case 'drivers':
            showAlert('Loading driver management...', 'info', 'dashboardAlert');
            break;
        case 'analytics':
            showAlert('Opening analytics dashboard...', 'info', 'dashboardAlert');
            break;
    }
}

function quickAction(action) {
    switch(action) {
        case 'profile':
            showAlert('Opening profile editor...', 'info', 'dashboardAlert');
            break;
        case 'settings':
            showAlert('Opening account settings...', 'info', 'dashboardAlert');
            break;
        case 'help':
            showAlert('Opening help center...', 'info', 'dashboardAlert');
            break;
        case 'notifications':
            showAlert('Showing notifications...', 'info', 'dashboardAlert');
            break;
    }
}