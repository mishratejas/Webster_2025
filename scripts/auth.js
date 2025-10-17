class AuthManager {
    constructor() {
        this.BASE_URL = 'https://webster-2025.onrender.com';
        this.tokenKey = 'adminToken';
        this.userKey = 'adminData';
    }

    // Check if token is expired
    isTokenExpired(token) {
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.exp * 1000 < Date.now();
        } catch (error) {
            return true;
        }
    }

    // Handle token expiration
    handleTokenExpiration() {
        this.clearAuthData();
        this.showNotification("Your session has expired. Please login again.", "error");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 2000);
    }

    // Clear authentication data
    clearAuthData() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
    }

    // Get stored token
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    // Get stored user data
    getUserData() {
        const userData = localStorage.getItem(this.userKey);
        return userData ? JSON.parse(userData) : null;
    }

    // Store authentication data
    storeAuthData(token, userData) {
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(userData));
    }

    // Fetch with authentication
    async fetchWithAuth(url, options = {}) {
        const token = this.getToken();

        if (!token || this.isTokenExpired(token)) {
            this.handleTokenExpiration();
            throw new Error("Token expired");
        }

        const response = await fetch(url, {
            ...options,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                ...options.headers,
            },
        });

        if (response.status === 401) {
            this.handleTokenExpiration();
            throw new Error("Token expired");
        }

        return response;
    }

    // Update admin UI with user data
    updateAdminUI() {
        const userData = this.getUserData();
        const adminNameElement = document.getElementById("adminName");
        
        if (adminNameElement && userData && userData.name) {
            adminNameElement.textContent = userData.name;
        }
    }

    // Validate authentication
    validateAuth() {
        const token = this.getToken();
        const userData = this.getUserData();
        console.log('Validating auth - Token:', !!token, 'UserData:', !!userData);
        // if (!token || !userData) {
        //     window.location.href = "index.html";
        //     return false;
        // }

        if (this.isTokenExpired(token)) {
            this.handleTokenExpiration();
            return false;
        }

        return true;
    }

    // Login function
    // Login function
async login(email, password) {
    try {
        const response = await fetch(`${this.BASE_URL}/api/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        console.log('Login response:', data); // Debug log

        if (data.success && data.data && data.data.accessToken) {
            // STORE THE TOKEN AND USER DATA
            localStorage.setItem(this.tokenKey, data.data.accessToken);
            localStorage.setItem(this.userKey, JSON.stringify(data.data.user));
            
            console.log('Token stored:', !!data.data.accessToken);
            console.log('User data stored:', !!data.data.user);
            
            return { success: true, data: data.data };
        } else {
            console.log('Login failed:', data.message);
            return { 
                success: false, 
                message: data.message || 'Login failed' 
            };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { 
            success: false, 
            message: 'Network error. Please try again.' 
        };
    }
}

    // Logout function
    logout() {
        this.clearAuthData();
        window.location.href = "index.html";
    }

    // Refresh token (if implemented in your backend)
    async refreshToken() {
        try {
            const response = await fetch(`${this.BASE_URL}/api/admin/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            const data = await response.json();

            if (data.success && data.data && data.data.accessToken) {
                this.storeAuthData(data.data.accessToken, data.data.user);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Token refresh error:', error);
            return false;
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = this.getToken();
        return token && !this.isTokenExpired(token);
    }

    // Get user role (useful for role-based access)
    getUserRole() {
        const userData = this.getUserData();
        return userData ? userData.role : null;
    }

    // Check if user has specific role
    hasRole(role) {
        const userRole = this.getUserRole();
        return userRole === role;
    }

    // Show notification
    showNotification(message, type = "info") {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.auth-notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement("div");
        const bgColor = type === "success" ? "bg-green-500" : 
                       type === "error" ? "bg-red-500" : 
                       type === "warning" ? "bg-yellow-500" : "bg-blue-500";
        
        notification.className = `auth-notification fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center`;
        notification.innerHTML = `
            <i class="fas ${
                type === "success" ? "fa-check-circle" : 
                type === "error" ? "fa-exclamation-triangle" : 
                type === "warning" ? "fa-exclamation-circle" : "fa-info-circle"
            } mr-3"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // Initialize authentication (call this on page load)
    initialize() {
        if (!this.validateAuth()) {
            return false;
        }

        this.updateAdminUI();
        return true;
    }

    // Add authentication headers to any object
    addAuthHeaders(headers = {}) {
        const token = this.getToken();
        if (token) {
            return {
                ...headers,
                'Authorization': `Bearer ${token}`
            };
        }
        return headers;
    }

    // Handle API errors consistently
    handleApiError(error) {
        console.error('API Error:', error);
        
        if (error.message.includes('Token expired')) {
            this.handleTokenExpiration();
        } else if (error.message.includes('Network')) {
            this.showNotification('Network error. Please check your connection.', 'error');
        } else {
            this.showNotification('An error occurred. Please try again.', 'error');
        }
        
        throw error;
    }
}

// Utility function for making authenticated API calls
const createAuthApi = (authManager) => {
    return {
        get: async (url, options = {}) => {
            try {
                const response = await authManager.fetchWithAuth(url, {
                    method: 'GET',
                    ...options,
                    headers: authManager.addAuthHeaders(options.headers)
                });
                return await response.json();
            } catch (error) {
                authManager.handleApiError(error);
            }
        },

        post: async (url, data = {}, options = {}) => {
            try {
                const response = await authManager.fetchWithAuth(url, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    ...options,
                    headers: authManager.addAuthHeaders(options.headers)
                });
                return await response.json();
            } catch (error) {
                authManager.handleApiError(error);
            }
        },

        put: async (url, data = {}, options = {}) => {
            try {
                const response = await authManager.fetchWithAuth(url, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                    ...options,
                    headers: authManager.addAuthHeaders(options.headers)
                });
                return await response.json();
            } catch (error) {
                authManager.handleApiError(error);
            }
        },

        delete: async (url, options = {}) => {
            try {
                const response = await authManager.fetchWithAuth(url, {
                    method: 'DELETE',
                    ...options,
                    headers: authManager.addAuthHeaders(options.headers)
                });
                return await response.json();
            } catch (error) {
                authManager.handleApiError(error);
            }
        }
    };
};

// Default export
window.AuthManager = AuthManager;
window.createAuthApi = createAuthApi;