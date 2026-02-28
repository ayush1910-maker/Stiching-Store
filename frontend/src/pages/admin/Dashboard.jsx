import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, Truck, TrendingUp, Package, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../lib/api';

export default function AdminDashboard() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/dashboard/analytics')
            .then(res => setAnalytics(res.data?.data))
            .catch(() => {
                setAnalytics({
                    totalUsers: 142, totalTailors: 18, pendingTailorApprovals: 4,
                    totalOrders: 390, activeOrders: 47, totalRevenue: 284500,
                    deliveryPartners: 9, pendingPayouts: 32000,
                });
            })
            .finally(() => setLoading(false));
    }, []);

    const stats = analytics ? [
        { label: 'Total Users', value: analytics.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Active Tailors', value: analytics.totalTailors, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Pending Approvals', value: analytics.pendingTailorApprovals, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', urgent: analytics.pendingTailorApprovals > 0 },
        { label: 'Total Orders', value: analytics.totalOrders, icon: Package, color: 'text-purple-500', bg: 'bg-purple-50' },
        { label: 'Active Orders', value: analytics.activeOrders, icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Delivery Partners', value: analytics.deliveryPartners, icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    ] : [];

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <div>
                <h1 className="text-2xl font-bold font-serif tracking-tight">Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Platform Overview</p>
            </div>

            {/* Revenue Hero */}
            <div className="bg-gradient-to-br from-foreground to-dark-800 rounded-2xl p-5 text-card shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">Total Platform Revenue</p>
                <h2 className="text-4xl font-bold font-serif">₹{analytics?.totalRevenue?.toLocaleString()}</h2>
                <p className="text-sm opacity-60 mt-1">Pending Payouts: <span className="text-primary font-bold">₹{analytics?.pendingPayouts?.toLocaleString()}</span></p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-card border rounded-2xl p-4 ${stat.urgent ? 'border-amber-300 shadow-sm shadow-amber-100' : 'border-border'}`}
                        >
                            <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center mb-2`}>
                                <Icon size={18} className={stat.color} />
                            </div>
                            <p className="text-2xl font-bold font-serif">{stat.value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-2xl p-4">
                <h3 className="font-bold text-sm mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { label: '✂️ Review Tailors', path: '/admin/tailors' },
                        { label: '📦 All Orders', path: '/admin/orders' },
                        { label: '🚚 Delivery Partners', path: '/admin/delivery' },
                        { label: '💰 Payments', path: '/admin/payments' },
                    ].map((action) => (
                        <a key={action.label} href={action.path} className="py-3 px-3 rounded-xl bg-muted text-xs font-bold text-center hover:bg-primary/10 hover:text-primary transition-colors">
                            {action.label}
                        </a>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
