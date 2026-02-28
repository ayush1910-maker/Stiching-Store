import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

const SERVICE_EMOJIS = ['👗', '👘', '👚', '✨', '🧵', '🪡', '👒', '🎀'];

export default function CustomerHome() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchServices = useCallback(async () => {
    try {
      const res = await api.get('/customer/services', { params: { limit: 8 } });
      setServices(res.data?.data || []);
    } catch (err) {
      setError('Could not load services.');
      // Graceful fallback so the page is never blank
      setServices([
        { _id: 's1', name: 'Kurti Stitching', basePrice: 999 },
        { _id: 's2', name: 'Salwar Suit Complete', basePrice: 1499 },
        { _id: 's3', name: 'Blouse Custom', basePrice: 1299 },
        { _id: 's4', name: 'Lehenga Choli', basePrice: 2499 },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-6"
    >
      {/* Greeting */}
      <div className="flex items-center justify-between mt-1">
        <div>
          <p className="text-xs text-muted-foreground font-medium">Good day,</p>
          <h2 className="text-xl font-bold font-serif tracking-tight">
            {firstName} 👋
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-card border border-border px-3 py-2 rounded-xl shadow-sm">
          <MapPin size={14} className="text-primary" />
          Kashmir
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-brand-800 text-primary-foreground p-6 shadow-md">
        <div className="relative z-10 w-2/3">
          <h2 className="text-2xl font-bold font-serif mb-2 leading-tight">
            Premium Custom Stitching
          </h2>
          <p className="text-sm opacity-90 mb-4">Doorstep measurements. Perfect fit guaranteed.</p>
          <Link
            to="/customer/book"
            className="inline-block bg-white text-primary text-sm font-bold px-5 py-2 rounded-full shadow-sm active:scale-95 transition-transform"
          >
            Book Now →
          </Link>
        </div>
        <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-white opacity-10 rounded-full blur-2xl" />
        <div className="absolute top-4 right-6 text-7xl opacity-20 select-none">✂️</div>
      </div>

      {/* Services Grid */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-bold font-serif tracking-tight">Our Services</h3>
          <Link to="/customer/book" className="text-sm font-semibold text-primary flex items-center gap-0.5">
            Book <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 h-32 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {services.map((service, index) => (
              <motion.div
                key={service._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/customer/order/${service._id}`}
                  className="flex flex-col bg-card border border-border p-4 rounded-2xl shadow-sm active:scale-95 transition-transform"
                >
                  <div className="text-4xl mb-3 bg-muted w-14 h-14 rounded-full flex items-center justify-center">
                    {SERVICE_EMOJIS[index % SERVICE_EMOJIS.length]}
                  </div>
                  <h4 className="font-semibold text-sm leading-tight mb-1 h-8 line-clamp-2">{service.name}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-primary font-serif">₹{service.basePrice}</span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-md">15 Days</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'My Orders', emoji: '📦', to: '/customer/orders' },
          { label: 'Measurements', emoji: '📐', to: '/customer/measurements' },
          { label: 'Addresses', emoji: '📍', to: '/customer/addresses' },
        ].map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="flex flex-col items-center gap-1.5 bg-card border border-border rounded-2xl p-3 text-center active:scale-95 transition-transform shadow-sm"
          >
            <span className="text-2xl">{item.emoji}</span>
            <span className="text-[10px] font-bold text-muted-foreground">{item.label}</span>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}