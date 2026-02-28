import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MobileLayout from './components/MobileLayout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Customer
import CustomerHome from './pages/customer/Home';
import CustomerShop from './pages/customer/Shop';
import CustomerOrders from './pages/customer/Orders';
import CustomerOrder from './pages/customer/Order';
import CustomerProfile from './pages/customer/Profile';
import CustomerCart from './pages/customer/Cart';
import CustomerAddresses from './pages/customer/Addresses';
import CustomerMeasurements from './pages/customer/Measurements';
import BookService from './pages/customer/BookService';

// Tailor
import TailorDashboard from './pages/tailor/Dashboard';
import TailorProfile from './pages/tailor/Profile';

// Delivery
import DeliveryTasks from './pages/delivery/Tasks';
import DeliveryEarnings from './pages/delivery/Earnings';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminTailors from './pages/admin/Tailors';
import AdminOrders from './pages/admin/Orders';
import AdminProducts from './pages/admin/Products';
import AdminServices from './pages/admin/Services';
import AdminPayments from './pages/admin/Payments';
import AdminDeliveryPartners from './pages/admin/DeliveryPartners';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ── PUBLIC AUTH ROUTES ── */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* ── CUSTOMER ROUTES (protected: customer only) ── */}
          <Route element={<ProtectedRoute allowedRole="customer" />}>
            <Route element={<MobileLayout role="customer" />}>
              <Route path="/customer" element={<CustomerHome />} />
              <Route path="/customer/shop" element={<CustomerShop />} />
              <Route path="/customer/cart" element={<CustomerCart />} />
              <Route path="/customer/orders" element={<CustomerOrders />} />
              <Route path="/customer/addresses" element={<CustomerAddresses />} />
              <Route path="/customer/measurements" element={<CustomerMeasurements />} />
              <Route path="/customer/book" element={<BookService />} />
              <Route path="/customer/profile" element={<CustomerProfile />} />
            </Route>
            {/* Full-screen order page (no bottom nav) */}
            <Route path="/customer/order/:id" element={<CustomerOrder />} />
          </Route>

          {/* ── TAILOR ROUTES (protected: tailor only) ── */}
          <Route element={<ProtectedRoute allowedRole="tailor" />}>
            <Route element={<MobileLayout role="tailor" />}>
              <Route path="/tailor" element={<TailorDashboard />} />
              <Route path="/tailor/profile" element={<TailorProfile />} />
            </Route>
          </Route>

          {/* ── DELIVERY ROUTES (protected: delivery only) ── */}
          <Route element={<ProtectedRoute allowedRole="delivery" />}>
            <Route element={<MobileLayout role="delivery" />}>
              <Route path="/delivery" element={<DeliveryTasks />} />
              <Route path="/delivery/earnings" element={<DeliveryEarnings />} />
            </Route>
          </Route>

          {/* ── ADMIN ROUTES (protected: admin only) ── */}
          <Route element={<ProtectedRoute allowedRole="admin" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/tailors" element={<AdminTailors />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/services" element={<AdminServices />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/delivery" element={<AdminDeliveryPartners />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}