import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, ClipboardList, User, ShoppingCart, MapPin, Ruler, Scissors, DollarSign, Truck } from 'lucide-react';

export default function MobileLayout({ role = 'customer' }) {
  const location = useLocation();

  const navItems = {
    customer: [
      { name: 'Home', path: '/customer', icon: Home },
      { name: 'Shop', path: '/customer/shop', icon: ShoppingBag },
      { name: 'Book', path: '/customer/book', icon: Scissors },
      { name: 'Orders', path: '/customer/orders', icon: ClipboardList },
      { name: 'Cart', path: '/customer/cart', icon: ShoppingCart },
      { name: 'Profile', path: '/customer/profile', icon: User },
    ],
    tailor: [
      { name: 'Tasks', path: '/tailor', icon: Scissors },
      { name: 'Profile', path: '/tailor/profile', icon: User },
    ],
    delivery: [
      { name: 'Deliveries', path: '/delivery', icon: Truck },
      { name: 'Earnings', path: '/delivery/earnings', icon: DollarSign },
    ],
  };

  const headerTitles = {
    customer: '✂️ TailorCraft',
    tailor: '✄ Tailor Portal',
    delivery: '🚚 Delivery',
  };

  const currentNav = navItems[role] || [];

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Top App Bar */}
      <header className="px-4 py-3 bg-card border-b border-border shadow-sm flex justify-between items-center z-10">
        <h1 className="text-lg font-bold tracking-tight font-serif">{headerTitles[role]}</h1>
        <div className="flex items-center gap-2">
          {role === 'customer' && (
            <Link to="/customer/measurements" className="flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1.5 rounded-full">
              <Ruler size={12} /> Sizes
            </Link>
          )}
          {role === 'customer' && (
            <Link to="/customer/addresses" className="flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1.5 rounded-full">
              <MapPin size={12} />
            </Link>
          )}
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
            {role.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-card border-t border-border z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className={`flex justify-around px-1 py-2 ${currentNav.length > 4 ? 'pb-2' : 'pb-3'}`}>
          {currentNav.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${isActive ? 'text-primary scale-110' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] font-semibold">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}