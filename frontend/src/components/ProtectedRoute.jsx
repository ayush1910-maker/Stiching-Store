import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — guards a group of routes by role.
 *
 * Usage in App.jsx:
 *   <Route element={<ProtectedRoute allowedRole="customer" />}>
 *     <Route path="/customer" element={<CustomerHome />} />
 *   </Route>
 *
 * If no user is logged in -> redirect to /login
 * If user's role doesn't match -> redirect to their own dashboard
 */
const ROLE_HOME = {
    customer: '/customer',
    tailor: '/tailor',
    delivery: '/delivery',
    admin: '/admin',
};

export default function ProtectedRoute({ allowedRole }) {
    const { user } = useAuth();

    // Not logged in
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Wrong role — send them to their home
    if (allowedRole && user.role !== allowedRole) {
        return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
    }

    return <Outlet />;
}
