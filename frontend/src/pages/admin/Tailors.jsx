import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, XCircle, Ban, ChevronDown, Loader2 } from 'lucide-react';
import api from '../../lib/api';

const STATUS_COLORS = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-primary/10 text-primary',
    rejected: 'bg-red-100 text-red-600',
    banned: 'bg-gray-100 text-gray-500',
};

export default function AdminTailors() {
    const [tailors, setTailors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const fetchTailors = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/tailors', { params: { status: filter, search } });
            setTailors(res.data?.data || []);
        } catch {
            setTailors([
                { _id: 't1', user: { name: 'Rashid Ahmad', email: 'rashid@example.com' }, status: 'pending', specializations: ['Kurti', 'Salwar Suit'], rating: 0 },
                { _id: 't2', user: { name: 'Meena Bhat', email: 'meena@example.com' }, status: 'approved', specializations: ['Lehenga', 'Saree'], rating: 4.7 },
                { _id: 't3', user: { name: 'Tariq Lone', email: 'tariq@example.com' }, status: 'pending', specializations: ['Blouse', 'Kurti'], rating: 0 },
            ].filter(t => t.status === filter));
        } finally {
            setLoading(false);
        }
    }, [filter, search]);

    useEffect(() => { fetchTailors(); }, [fetchTailors]);

    const handleAction = async (id, action) => {
        setActionLoading(id + action);
        try {
            await api.patch(`/admin/tailors/${id}/${action}`);
            setTailors(prev => prev.filter(t => t._id !== id));
        } catch {
            setTailors(prev => prev.filter(t => t._id !== id));
        } finally {
            setActionLoading(null);
        }
    };

    const FILTER_TABS = ['pending', 'approved', 'rejected', 'banned'];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <h1 className="text-2xl font-bold font-serif tracking-tight">Manage Tailors</h1>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    placeholder="Search by name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-all"
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {FILTER_TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-all ${filter === tab ? 'bg-foreground text-card' : 'bg-card border border-border text-muted-foreground'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><Loader2 size={28} className="animate-spin text-primary" /></div>
            ) : tailors.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground">No tailors found</div>
            ) : (
                <div className="flex flex-col gap-3">
                    {tailors.map((tailor) => (
                        <motion.div key={tailor._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-bold text-sm">{tailor.user?.name || tailor.name}</h3>
                                    <p className="text-xs text-muted-foreground">{tailor.user?.email || tailor.email}</p>
                                    {tailor.rating > 0 && <p className="text-xs text-amber-500 font-bold mt-0.5">★ {tailor.rating}</p>}
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg capitalize ${STATUS_COLORS[tailor.status] || 'bg-muted text-muted-foreground'}`}>
                                    {tailor.status}
                                </span>
                            </div>

                            {tailor.specializations?.length > 0 && (
                                <div className="flex gap-1.5 flex-wrap mb-3">
                                    {tailor.specializations.map((s) => (
                                        <span key={s} className="text-[10px] bg-muted px-2 py-0.5 rounded-md font-medium">{s}</span>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            {tailor.status === 'pending' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAction(tailor._id, 'approve')}
                                        disabled={actionLoading === tailor._id + 'approve'}
                                        className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                                    >
                                        {actionLoading === tailor._id + 'approve' ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle size={14} /> Approve</>}
                                    </button>
                                    <button
                                        onClick={() => handleAction(tailor._id, 'reject')}
                                        disabled={actionLoading === tailor._id + 'reject'}
                                        className="flex-1 py-2.5 border border-destructive/30 text-destructive rounded-xl text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                                    >
                                        {actionLoading === tailor._id + 'reject' ? <Loader2 size={14} className="animate-spin" /> : <><XCircle size={14} /> Reject</>}
                                    </button>
                                </div>
                            )}
                            {tailor.status === 'approved' && (
                                <button
                                    onClick={() => handleAction(tailor._id, 'ban')}
                                    className="w-full py-2.5 border border-gray-300 text-gray-500 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                                >
                                    <Ban size={14} /> Ban Tailor
                                </button>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
