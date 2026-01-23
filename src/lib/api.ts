
import axios from 'axios';

// Get API URL from environment or use default
let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Client-side: Adjust API URL to match the current subdomain
if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = '8000'; // Assume backend runs on 8000 locally
    const protocol = window.location.protocol;

    // If we are on a subdomain (and it's not localhost directly), point to that subdomain's backend
    // BUT only for local development where ports match.
    // In production, we trust NEXT_PUBLIC_API_URL or separate logic.
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost');

    if (isLocal && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        API_URL = `${protocol}//${hostname}:${port}/api`;
    }
}

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Required for cookies/sessions across subdomains
});

// Request interceptor to add the Tenant Domain header
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        // Don't send for localhost (backend handles logic, or expects standard Host header for public)
        // We mainly need it when on deployment (e.g. tenant.vercel.app)
        config.headers['X-Tenant-Domain'] = hostname;
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

