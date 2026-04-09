
import axios from 'axios';

// Get API URL from environment or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false,
});


// Request interceptor to add the Tenant Domain header
api.interceptors.request.use((config) => {
    // Read tenant from storage to allow single-domain multi-tenancy
    if (typeof window !== 'undefined') {
        // Exclude endpoints that MUST hit the public schema
        const publicEndpoints = ['/tenants/register/', '/users/tenant-lookup/'];
        const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));

        if (!isPublicEndpoint) {
            const storedTenant = localStorage.getItem('tenant_domain');
            if (storedTenant) {
                config.headers['X-Tenant-Domain'] = storedTenant;
            }
        }
    }
    return config;
});


export const setAuthToken = (token: string) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('token', token);
    } else {
        delete api.defaults.headers.common['Authorization'];
        localStorage.removeItem('token');
    }
};

// Initialize token from storage if available
if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
        setAuthToken(token);
    }
}

// Track if we're showing the "server waking up" message
let wakingUpToastShown = false;

// Response interceptor to handle server waking up (cold start) scenarios
api.interceptors.response.use(
    (response) => {
        wakingUpToastShown = false;
        return response;
    },
    async (error) => {
        // Handle network errors, timeouts, or 503 (service unavailable)
        const isServerWakingUp =
            error.code === 'ECONNABORTED' ||
            error.code === 'ERR_NETWORK' ||
            error.response?.status === 503 ||
            error.response?.status === 502;

        if (isServerWakingUp && !wakingUpToastShown) {
            wakingUpToastShown = true;

            // Dispatch custom event for UI components to show loading message
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('server-waking-up', {
                    detail: {
                        message: 'Server is waking up, please wait...',
                        isRetrying: true
                    }
                }));
            }

            // Retry the request after a delay (for cold starts)
            const config = error.config;
            if (config && !config._retry) {
                config._retry = true;
                await new Promise(resolve => setTimeout(resolve, 3000));
                return api.request(config);
            }
        }

        return Promise.reject(error);
    }
);

// Helper to check if server is available (useful for cold start scenarios)
export const checkServerHealth = async (): Promise<boolean> => {
    try {
        await api.get('/health/', { timeout: 5000 });
        return true;
    } catch {
        return false;
    }
};

export default api;

