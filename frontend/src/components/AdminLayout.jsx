import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ShoppingBag, Scissors, CreditCard, Truck, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Tailors', path: '/admin/tailors', icon: Scissors },
    { name: 'Orders', path: '/admin/orders', icon: Package },
    { name: 'Products', path: '/admin/products', icon: ShoppingBag },
    { name: 'Services', path: '/admin/services', icon: Users },
    { name: 'Delivery', path: '/admin/delivery', icon: Truck },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
];

export default function AdminLayout() {
    const location = useLocation();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Top Bar */}
            <header className="px-4 py-3 bg-card border-b border-border shadow-sm flex justify-between items-center z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <Scissors size={16} className="text-white" />
                    </div>
                    <h1 className="text-lg font-bold font-serif tracking-tight">TailorCraft <span className="text-xs font-medium text-muted-foreground bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md ml-1">Admin</span></h1>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-bold text-destructive bg-destructive/10 px-3 py-2 rounded-xl">
                    <LogOut size={14} /> Logout
                </button>
            </header>

            {/* Horizontal sub-nav */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-4 py-2.5 bg-card border-b border-border">
                {NAV_ITEMS.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Icon size={13} />
                            {item.name}
                        </Link>
                    );
                })}
            </div>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto p-4 no-scrollbar">
                <Outlet />
            </main>
        </div>
    );
}
