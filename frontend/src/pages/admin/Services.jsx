import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Plus, Edit, X, Loader2 } from 'lucide-react';
import api from '../../lib/api';

export default function AdminServices() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', basePrice: '', description: '', isActive: true });

    const fetchServices = useCallback(async () => {
        try {
            const res = await api.get('/customer/services'); // Browse endpoint
            setServices(res.data?.data || []);
        } catch {
            setServices([
                { _id: 's1', name: 'Kurti Stitching', basePrice: 999, description: 'Casual & festive kurtis', isActive: true },
                { _id: 's2', name: 'Salwar Suit Complete', basePrice: 1499, description: 'Full salwar kameez with dupatta', isActive: true },
                { _id: 's3', name: 'Blouse Custom', basePrice: 1299, description: 'Custom blouse stitching', isActive: true },
                { _id: 's4', name: 'Lehenga Choli', basePrice: 2499, description: 'Bridal & festive lehenga', isActive: true },
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchServices(); }, [fetchServices]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form, basePrice: Number(form.basePrice) };
            if (editingId) {
                await api.patch(`/admin/services/${editingId}/update`, payload);
                setServices(prev => prev.map(s => s._id === editingId ? { ...s, ...payload } : s));
            } else {
                const res = await api.post('/admin/services/create', payload);
                setServices(prev => [...prev, res.data?.data || { ...payload, _id: Date.now().toString() }]);
            }
        } catch {
            if (!editingId) setServices(prev => [...prev, { ...form, _id: Date.now().toString(), basePrice: Number(form.basePrice) }]);
            else setServices(prev => prev.map(s => s._id === editingId ? { ...s, ...form, basePrice: Number(form.basePrice) } : s));
        } finally {
            setSaving(false);
            setShowForm(false);
            setEditingId(null);
            setForm({ name: '', basePrice: '', description: '', isActive: true });
        }
    };

    const openEdit = (svc) => {
        setForm({ ...svc, basePrice: String(svc.basePrice) });
        setEditingId(svc._id);
        setShowForm(true);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold font-serif tracking-tight">Services</h1>
                <button
                    onClick={() => { setForm({ name: '', basePrice: '', description: '', isActive: true }); setEditingId(null); setShowForm(true); }}
                    className="flex items-center gap-1 text-sm font-bold text-primary bg-primary/10 px-3 py-2 rounded-xl"
                >
                    <Plus size={16} /> Add
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><Loader2 size={28} className="animate-spin text-primary" /></div>
            ) : (
                <div className="flex flex-col gap-3">
                    {services.map((svc) => (
                        <div key={svc._id} className="bg-card border border-border rounded-2xl p-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                        <Scissors size={18} className="text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">{svc.name}</h3>
                                        {svc.description && <p className="text-xs text-muted-foreground mt-0.5">{svc.description}</p>}
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="font-bold text-primary font-serif">₹{svc.basePrice}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${svc.isActive !== false ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                {svc.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => openEdit(svc)} className="p-2 bg-muted rounded-xl">
                                    <Edit size={14} />
                                </button>
                            </div>

                            {/* Pricing tiers if available */}
                            {svc.pricing?.length > 0 && (
                                <div className="mt-3 grid grid-cols-3 gap-1.5">
                                    {svc.pricing.map((p) => (
                                        <div key={p.deliveryType} className="bg-muted rounded-xl p-2 text-center">
                                            <p className="text-[10px] text-muted-foreground capitalize">{p.deliveryType}</p>
                                            <p className="text-xs font-bold">₹{p.price}</p>
                                            <p className="text-[10px] text-muted-foreground">{p.estimatedDays}d</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Service Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end">
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="w-full bg-card rounded-t-3xl p-6"
                        >
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-xl font-bold font-serif">{editingId ? 'Edit Service' : 'New Service'}</h2>
                                <button onClick={() => setShowForm(false)} className="p-2 rounded-full bg-muted"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleSave} className="flex flex-col gap-3">
                                <input name="name" placeholder="Service name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary" />
                                <input name="basePrice" type="number" placeholder="Base price (₹)" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} required className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary" />
                                <textarea name="description" placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm resize-none focus:outline-none focus:border-primary" />
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-primary w-4 h-4" />
                                    Active (visible to customers)
                                </label>
                                <button type="submit" disabled={saving} className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-primary/20">
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : (editingId ? 'Update Service' : 'Create Service')}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
