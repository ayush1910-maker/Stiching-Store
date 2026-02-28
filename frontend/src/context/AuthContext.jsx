import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(false);

    const login = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            const { accessToken, user: userData } = res.data.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            return { success: true, role: userData.role };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Login failed' };
        } finally {
            setLoading(false);
        }
    }, []);

    const register = useCallback(async (name, email, password, role) => {
        setLoading(true);
        try {
            const res = await api.post('/auth/register', { name, email, password, role });
            const { accessToken, user: userData } = res.data.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            return { success: true, role: userData.role };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Registration failed' };
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout');
        } catch { /* ignore */ }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
    }, []);

    const forgotPassword = useCallback(async (email) => {
        const res = await api.post('/auth/forgot-password', { email });
        return res.data;
    }, []);

    const verifyOtp = useCallback(async (email, otp) => {
        const res = await api.post('/auth/verify-otp', { email, otp });
        return res.data;
    }, []);

    const resetPassword = useCallback(async (email, otp, newPassword) => {
        const res = await api.post('/auth/reset-password', { email, otp, newPassword });
        return res.data;
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, forgotPassword, verifyOtp, resetPassword }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
