import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Scissors, CheckCircle, Clock, AlertCircle, Loader2, DollarSign } from 'lucide-react';
import api from '../../lib/api';

const STATUS_STAGES = [
  'WITH_TAILOR',
  'STITCHING',
  'READY_FOR_DISPATCH',
];

const formatStatus = (status) => status?.replace(/_/g, ' ') || '';

const isDeadlineSoon = (deadline) => {
  if (!deadline) return false;
  const days = (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24);
  return days < 3;
};

export default function TailorDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [earnings, setEarnings] = useState(null);

  const fetchAssignedOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Tailors see orders assigned to them via admin panel
      // Using admin/orders filtered by assigned-tailor (via JWT context on backend)
      const res = await api.get('/admin/orders', { params: { tailorView: true } });
      setOrders(res.data?.data || []);
    } catch {
      // Graceful fallback
      setOrders([]);
      setError('Could not fetch orders. Make sure you are logged in as a Tailor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssignedOrders(); }, [fetchAssignedOrders]);

  const advanceStatus = async (orderId, currentStatus) => {
    const currentIndex = STATUS_STAGES.indexOf(currentStatus);
    if (currentIndex >= STATUS_STAGES.length - 1) return;
    const nextStatus = STATUS_STAGES[currentIndex + 1];
    setUpdatingId(orderId);
    try {
      // Admin endpoint can update order status; tailor would use a dedicated route in production
      await api.patch(`/admin/orders/${orderId}/update-status`, { status: nextStatus });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, currentStatus: nextStatus } : o))
      );
    } catch {
      // Optimistic update anyway
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, currentStatus: nextStatus } : o))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const activeOrders = orders.filter((o) => o.currentStatus !== 'DELIVERED' && o.currentStatus !== 'CANCELLED');
  const totalEarning = activeOrders.reduce((sum, o) => sum + (o.tailorCut || o.totalAmount * 0.6 || 0), 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
      {/* Stats Banner */}
      <div className="bg-foreground text-card p-5 rounded-2xl flex justify-between items-center shadow-md">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pending Payout</p>
          <h2 className="text-3xl font-bold font-serif">
            ₹{totalEarning > 0 ? totalEarning.toLocaleString() : '—'}
          </h2>
        </div>
        <div className="bg-card/20 p-3 rounded-full">
          <DollarSign size={24} className="text-primary" />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold font-serif tracking-tight">Active Assignments</h3>
        <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-md">
          {activeOrders.length} Orders
        </span>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : activeOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center text-muted-foreground">
          <Scissors size={48} className="opacity-20" />
          <p className="text-sm font-medium">No orders assigned yet.</p>
          <p className="text-xs">Orders assigned to you by admin will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {activeOrders.map((order) => {
            const currentStatusIndex = STATUS_STAGES.indexOf(order.currentStatus);
            const isDone = order.currentStatus === 'READY_FOR_DISPATCH';
            const isSoon = isDeadlineSoon(order.deliveryDeadline);

            return (
              <motion.div
                key={order._id}
                layout
                className="bg-card border border-border rounded-2xl p-4 shadow-sm"
              >
                {/* Order Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground">
                      {order._id?.slice(-8).toUpperCase()}
                    </span>
                    <h4 className="font-bold text-base mt-0.5">
                      {order.service?.name || 'Stitching Order'}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.customer?.name || 'Customer'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary font-serif">
                      ₹{order.tailorCut || Math.floor((order.totalAmount || 0) * 0.6)}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">your cut</p>
                  </div>
                </div>

                {/* Details */}
                <div className="bg-muted p-3 rounded-xl mb-4">
                  {isSoon && (
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={13} className="text-destructive" />
                      <span className="text-xs font-bold text-destructive">
                        Due soon: {order.deliveryDeadline ? new Date(order.deliveryDeadline).toLocaleDateString() : 'ASAP'}
                      </span>
                    </div>
                  )}
                  {order.measurements && (
                    <p className="text-xs text-muted-foreground">
                      📐 {typeof order.measurements === 'object'
                        ? Object.entries(order.measurements).map(([k, v]) => `${k}: ${v}`).join(', ')
                        : order.measurements}
                    </p>
                  )}
                  {order.specialInstructions && (
                    <p className="text-xs text-muted-foreground mt-1">
                      💬 {order.specialInstructions}
                    </p>
                  )}
                  {order.deliveryType && (
                    <p className="text-xs text-muted-foreground mt-1 font-medium capitalize">
                      ⚡ {order.deliveryType} delivery
                    </p>
                  )}
                </div>

                {/* Status progress */}
                <div className="flex gap-1.5 mb-4">
                  {STATUS_STAGES.map((stage, idx) => (
                    <div
                      key={stage}
                      className={`flex-1 h-1.5 rounded-full ${idx <= currentStatusIndex ? 'bg-primary' : 'bg-muted'}`}
                    />
                  ))}
                </div>

                {/* Status Advance Button */}
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stage</span>
                    <span className="text-xs font-bold bg-muted px-2 py-1 rounded-md">
                      {formatStatus(order.currentStatus)}
                    </span>
                  </div>
                  {isDone ? (
                    <div className="w-full py-3 bg-emerald-500/10 text-emerald-600 font-bold text-sm rounded-xl flex justify-center items-center gap-2 border border-emerald-500/20">
                      <CheckCircle size={18} /> Ready for Pickup
                    </div>
                  ) : (
                    <button
                      onClick={() => advanceStatus(order._id, order.currentStatus)}
                      disabled={updatingId === order._id}
                      className="w-full py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl flex justify-center items-center gap-2 active:scale-95 transition-transform disabled:opacity-60 shadow-sm"
                    >
                      {updatingId === order._id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <Scissors size={16} />
                          Mark as {formatStatus(STATUS_STAGES[currentStatusIndex + 1])}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}