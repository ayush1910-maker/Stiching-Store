import { motion } from 'framer-motion';
import { User, MapPin, Ruler, Bell, Shield, LogOut, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function CustomerProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.name || 'Customer';
  const displayEmail = user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6"
    >
      <h1 className="text-2xl font-bold font-serif tracking-tight mb-2">My Profile</h1>

      {/* User Info Card */}
      <div className="bg-gradient-to-br from-primary to-brand-800 rounded-2xl p-6 text-primary-foreground shadow-md flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30 text-2xl font-bold font-serif">
          {initial}
        </div>
        <div>
          <h2 className="text-xl font-bold font-serif">{displayName}</h2>
          <p className="text-xs opacity-80 mt-0.5">{displayEmail}</p>
          <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-md mt-1.5 inline-block uppercase tracking-wide">
            {user?.role || 'customer'}
          </span>
        </div>
      </div>

      {/* Settings List */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {[
          { to: '/customer/measurements', icon: Ruler, label: 'Saved Measurements', desc: 'Manage your custom fit profiles' },
          { to: '/customer/addresses', icon: MapPin, label: 'Saved Addresses', desc: 'Home, Office, etc.' },
          { to: '/customer/orders', icon: Bell, label: 'My Orders', desc: 'Track and review orders' },
        ].map((item, idx, arr) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${idx < arr.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Icon size={20} />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-foreground">{item.label}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </Link>
          );
        })}

        {/* Change Password */}
        <button className="w-full flex items-center justify-between p-4 border-t border-border hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Shield size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-foreground">Privacy &amp; Terms</h3>
              <p className="text-xs text-muted-foreground">Platform policies</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 w-full p-4 mt-2 text-destructive font-bold bg-destructive/10 rounded-2xl active:scale-95 transition-transform border border-destructive/20"
      >
        <LogOut size={20} />
        Log Out
      </button>
    </motion.div>
  );
}