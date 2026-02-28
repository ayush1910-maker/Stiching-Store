import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, Scissors, CheckCircle, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

const ORDER_STAGES = [
  { id: 'ORDER_PLACED', label: 'Order Confirmed', icon: Package },
  { id: 'FABRIC_PICKED', label: 'Fabric Picked Up', icon: Truck },
  { id: 'WITH_TAILOR', label: 'With Tailor', icon: Scissors },
  { id: 'STITCHING', label: 'Stitching', icon: Scissors },
  { id: 'READY_FOR_DISPATCH', label: 'Ready for Dispatch', icon: Package },
  { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
];

const STATUS_TO_INDEX = Object.fromEntries(ORDER_STAGES.map((s, i) => [s.id, i]));

export default function CustomerOrders() {
  const [activeTab, setActiveTab] = useState('active');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // The backend tracks orders per customer via JWT; we fetch each tracked order.
      // There's no "list my orders" endpoint — we'll use a cached list of order IDs.
      // Fallback: show placeholder if none cached.
      const cachedIds = JSON.parse(localStorage.getItem('tm_my_order_ids') || '[]');

      if (cachedIds.length === 0) {
        setOrders([]);
        return;
      }

      const results = await Promise.allSettled(
        cachedIds.map((id) => api.get(`/customer/orders/${id}/track`))
      );
      const fetched = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value.data?.data);
      setOrders(fetched.filter(Boolean));
    } catch (err) {
      setError('Could not load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const activeOrders = orders.filter((o) => o?.currentStatus !== 'DELIVERED' && o?.currentStatus !== 'CANCELLED');
  const pastOrders = orders.filter((o) => o?.currentStatus === 'DELIVERED' || o?.currentStatus === 'CANCELLED');
  const displayOrders = activeTab === 'active' ? activeOrders : pastOrders;

  const getStageIndex = (statusId) => STATUS_TO_INDEX[statusId] ?? 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold font-serif tracking-tight">My Orders</h1>

      {/* Tabs */}
      <div className="flex p-1 bg-muted rounded-xl">
        {['active', 'past'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all capitalize ${activeTab === tab ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
          >
            {tab === 'active' ? 'Active' : 'Past Orders'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 h-48 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium rounded-2xl px-4 py-4 flex gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" /> {error}
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Package size={48} className="text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm font-medium">
            {activeTab === 'active' ? 'No active orders' : 'No past orders'}
          </p>
          {activeTab === 'active' && (
            <Link to="/customer/book" className="text-sm font-bold text-primary bg-primary/10 px-5 py-2.5 rounded-xl">
              Book a Stitching ✂️
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {displayOrders.map((order) => {
            const progressIdx = getStageIndex(order.currentStatus);
            return (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-4 shadow-sm"
              >
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4 border-b border-border pb-4">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground">
                      {order._id?.slice(-8).toUpperCase()}
                    </span>
                    <h3 className="font-bold text-base mt-0.5">
                      {order.service?.name || 'Stitching Order'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.deliveryType && `${order.deliveryType} delivery`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary font-serif">
                      ₹{order.totalAmount || order.estimatedAmount || '—'}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {order.currentStatus?.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>

                {/* Vertical Timeline */}
                <div className="relative pl-2 py-1">
                  {ORDER_STAGES.map((stage, index) => {
                    const isCompleted = index <= progressIdx;
                    const isCurrent = index === progressIdx;
                    const StageIcon = stage.icon;
                    return (
                      <div key={stage.id} className="flex gap-4 mb-5 last:mb-0 relative z-10">
                        {index !== ORDER_STAGES.length - 1 && (
                          <div
                            className={`absolute left-[11px] top-6 bottom-[-20px] w-[2px] ${index < progressIdx ? 'bg-primary' : 'bg-muted'
                              }`}
                          />
                        )}
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2 ${isCompleted
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'bg-card border-muted text-muted-foreground'
                            }`}
                        >
                          {isCompleted ? <CheckCircle size={12} /> : <div className="w-2 h-2 rounded-full bg-muted" />}
                        </div>
                        <div className="flex-1">
                          <h4
                            className={`text-sm font-bold ${isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                          >
                            {stage.label}
                          </h4>
                          {isCurrent && order.estimatedDelivery && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              ETA: <span className="text-foreground font-medium">{order.estimatedDelivery}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Rate tailor after delivery */}
                {order.currentStatus === 'DELIVERED' && !order.isRated && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <Link
                      to={`/customer/order/${order._id}`}
                      className="text-xs font-bold text-primary flex items-center gap-1 bg-primary/10 px-3 py-2 rounded-lg w-fit"
                    >
                      Rate your Tailor ⭐ <ChevronRight size={14} />
                    </Link>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}