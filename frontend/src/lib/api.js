import axios from 'axios';

// In dev: requests go to /api/v1 → Vite proxy → http://localhost:8080 (no CORS)
// In prod: set VITE_API_URL to deployed backend URL e.g. https://api.tailorcraft.in/api/v1
const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    timeout: 15000,
});

// Attach access token from localStorage on every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            try {
                const res = await axios.post(
                    `${BASE_URL}/auth/refresh-token`,
                    {},
                    { withCredentials: true }
                );
                const newToken = res.data?.data?.accessToken;
                if (newToken) {
                    localStorage.setItem('accessToken', newToken);
                    original.headers.Authorization = `Bearer ${newToken}`;
                    return api(original);
                }
            } catch {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
