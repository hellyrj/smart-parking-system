(function () {
    const token = localStorage.getItem("token");
    
    // If no token, redirect to login
    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Check if token is expired
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            localStorage.removeItem("token");
            localStorage.removeItem("userEmail");
            window.location.href = "/login.html?error=Session expired";
            return;
        }
        
        // Check if user is verified (for owner routes)
        const currentPath = window.location.pathname;
        if (currentPath.includes('owner') && payload.role === 'owner' && payload.verification_status !== 'verified') {
            window.location.href = "/home.html?error=Owner verification required";
            return;
        }
        
        // Check if user is admin (for admin routes)
        if (currentPath.includes('admin') && payload.role !== 'admin') {
            window.location.href = "/home.html?error=Admin access required";
            return;
        }
        
        window.user = {
            id: payload.id,
            email: payload.email,
            role: payload.role,
            verification_status: payload.verification_status
        };
        
    } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
        window.location.href = "/login.html?error=Invalid session";
    }
})();