import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, X, Loader2, CheckCircle, UserCheck, Truck } from 'lucide-react';
import api from '../../lib/api';

const STATUS_COLORS = {
    ORDER_PLACED: 'bg-blue-100 text-blue-700',
    FABRIC_PICKED: 'bg-amber-100 text-amber-700',
    WITH_TAILOR: 'bg-purple-100 text-purple-700',
    STITCHING: 'bg-indigo-100 text-indigo-700',
    READY_FOR_DISPATCH: 'bg-green-100 text-green-700',
    OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-700',
    DELIVERED: 'bg-primary/10 text-primary',
    CANCELLED: 'bg-red-100 text-red-600',
};

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/orders');
            setOrders(res.data?.data || []);
        } catch {
            setOrders([
                { _id: 'o1', createdAt: new Date().toISOString(), status: 'ORDER_PLACED', customer: { name: 'Farhan Ahmad' }, service: { name: 'Kurti Stitching' }, totalAmount: 1299, deliveryType: 'normal' },
                { _id: 'o2', createdAt: new Date().toISOString(), status: 'WITH_TAILOR', customer: { name: 'Ayesha Bhat' }, service: { name: 'Salwar Suit' }, totalAmount: 1799, deliveryType: 'express' },
                { _id: 'o3', createdAt: new Date().toISOString(), status: 'READY_FOR_DISPATCH', customer: { name: 'Rohit Kumar' }, service: { name: 'Blouse Custom' }, totalAmount: 1499, deliveryType: 'premium' },
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const doAction = async (orderId, path, body = {}) => {
        setActionLoading(orderId + path);
        try {
            await api.patch(`/admin/orders/${orderId}/${path}`, body);
            await fetchOrders();
        } catch { /* ignore */ } finally {
            setActionLoading(null);
        }
    };

    const displayed = orders.filter(o =>
        !search || (o.customer?.name || '').toLowerCase().includes(search.toLowerCase()) || o._id.includes(search)
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <h1 className="text-2xl font-bold font-serif tracking-tight">All Orders</h1>

            <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    placeholder="Search by customer or order ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><Loader2 size={28} className="animate-spin text-primary" /></div>
            ) : (
                <div className="flex flex-col gap-3">
                    {displayed.map((order) => (
                        <motion.div key={order._id} layout className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                            <button
                                onClick={() => setExpanded(expanded === order._id ? null : order._id)}
                                className="w-full p-4 text-left flex items-start justify-between"
                            >
                                <div>
                                    <span className="text-xs text-muted-foreground font-bold">{order._id.slice(-8).toUpperCase()}</span>
                                    <h3 className="font-bold text-sm mt-0.5">{order.customer?.name}</h3>
                                    <p className="text-xs text-muted-foreground">{order.service?.name} · {order.deliveryType}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <span className="font-bold text-primary font-serif">₹{order.totalAmount}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${STATUS_COLORS[order.status] || 'bg-muted text-muted-foreground'}`}>
                                        {order.status?.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </button>

                            <AnimatePresence>
                                {expanded === order._id && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-4 pb-4 border-t border-border pt-3 flex flex-col gap-2">
                                            <p className="text-xs text-muted-foreground">Order ID: {order._id}</p>
                                            <p className="text-xs text-muted-foreground">Date: {new Date(order.createdAt).toLocaleDateString()}</p>

                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                                {order.status === 'ORDER_PLACED' && (
                                                    <button
                                                        onClick={() => doAction(order._id, 'assign-tailor', { tailorId: 't1' })}
                                                        disabled={!!actionLoading}
                                                        className="py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center justify-center gap-1 col-span-2"
                                                    >
                                                        {actionLoading === order._id + 'assign-tailor' ? <Loader2 size={14} className="animate-spin" /> : <><UserCheck size={14} /> Assign Tailor</>}
                                                    </button>
                                                )}
                                                {order.status === 'READY_FOR_DISPATCH' && (
                                                    <button
                                                        onClick={() => doAction(order._id, 'quality-approve')}
                                                        disabled={!!actionLoading}
                                                        className="py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center justify-center gap-1 col-span-1"
                                                    >
                                                        {actionLoading === order._id + 'quality-approve' ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle size={14} /> QC Approve</>}
                                                    </button>
                                                )}
                                                {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
                                                    <button
                                                        onClick={() => doAction(order._id, 'cancel', { cancellationReason: 'Cancelled by admin' })}
                                                        disabled={!!actionLoading}
                                                        className="py-2.5 border border-destructive/30 text-destructive rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                                                    >
                                                        <X size={14} /> Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                    {displayed.length === 0 && (
                        <div className="text-center py-10 text-sm text-muted-foreground">No orders found</div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
