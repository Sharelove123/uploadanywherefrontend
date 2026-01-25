
import axios from 'axios';

// Get API URL from environment or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Required for cookies/sessions across subdomains
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

export default api;

