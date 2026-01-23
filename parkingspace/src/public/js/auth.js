// Authentication functions
async function register(email, password) {
    try {
        const response = await apiRequest('/auth/register', 'POST', {
            email,
            password
        });
        
        return {
            success: true,
            message: response.message
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || 'Registration failed'
        };
    }
}

async function login(email, password, role) {
    try {
        const response = await apiRequest('/auth/login', 'POST', {
            email,
            password,
            role
        });
        
        return {
            success: true,
            token: response.token
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || 'Login failed'
        };
    }
}

async function getProfile() {
    try {
        const response = await apiRequest('/auth/profile', 'GET', null, true);
        return {
            success: true,
            ...response
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || 'Failed to fetch profile'
        };
    }
}