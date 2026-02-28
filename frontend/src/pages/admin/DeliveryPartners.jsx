import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Plus, Trash2, X, Loader2 } from 'lucide-react';
import api from '../../lib/api';

const VEHICLE_TYPES = ['BIKE', 'SCOOTER', 'BICYCLE', 'CAR'];

const EMPTY_FORM = {
    name: '', email: '', password: '', vehicleType: 'BIKE',
    documents: { aadhar: '', pan: '', drivingLicense: '' },
    bankDetails: { accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '' }
};

export default function AdminDeliveryPartners() {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setPartners([
            { _id: 'd1', name: 'Imran Malik', vehicleType: 'BIKE', isOnline: true, deliveriesCompleted: 47 },
            { _id: 'd2', name: 'Sajid Khan', vehicleType: 'SCOOTER', isOnline: false, deliveriesCompleted: 23 },
        ]);
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.post('/admin/delivery/add-partner', form);
            setPartners(prev => [...prev, res.data?.data || { ...form, _id: Date.now().toString(), isOnline: false, deliveriesCompleted: 0 }]);
        } catch {
            setPartners(prev => [...prev, { ...form, _id: Date.now().toString(), isOnline: false, deliveriesCompleted: 0 }]);
        } finally {
            setSaving(false);
            setShowForm(false);
            setForm(EMPTY_FORM);
        }
    };

    const handleRemove = async (id) => {
        try { await api.delete(`/admin/delivery/${id}/remove-partner`); } catch { /* ignore */ }
        setPartners(prev => prev.filter(p => p._id !== id));
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold font-serif tracking-tight">Delivery Partners</h1>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-sm font-bold text-primary bg-primary/10 px-3 py-2 rounded-xl">
                    <Plus size={16} /> Add
                </button>
            </div>

            <div className="flex flex-col gap-3">
                {partners.map((partner) => (
                    <div key={partner._id} className="bg-card border border-border rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-foreground text-card rounded-2xl flex items-center justify-center text-lg font-bold">
                                {partner.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-sm">{partner.name}</h3>
                                    <span className={`w-2 h-2 rounded-full ${partner.isOnline ? 'bg-primary' : 'bg-muted-foreground'}`} />
                                    <span className="text-[10px] text-muted-foreground">{partner.isOnline ? 'Online' : 'Offline'}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">🏍️ {partner.vehicleType} · {partner.deliveriesCompleted} deliveries</p>
                            </div>
                            <button onClick={() => handleRemove(partner._id)} className="p-2 bg-destructive/10 text-destructive rounded-xl">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
                {partners.length === 0 && (
                    <div className="text-center py-10 text-sm text-muted-foreground">No delivery partners added</div>
                )}
            </div>

            {/* Add Partner Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end">
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="w-full bg-card rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto no-scrollbar"
                        >
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-xl font-bold font-serif">Add Delivery Partner</h2>
                                <button onClick={() => setShowForm(false)} className="p-2 rounded-full bg-muted"><X size={18} /></button>
                            </div>

                            <form onSubmit={handleAdd} className="flex flex-col gap-3">
                                <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary" />
                                <input type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary" />
                                <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary" />

                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Vehicle Type</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {VEHICLE_TYPES.map((v) => (
                                            <button key={v} type="button" onClick={() => setForm({ ...form, vehicleType: v })}
                                                className={`py-2 rounded-xl border-2 text-xs font-bold transition-all ${form.vehicleType === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
                                            >
                                                {v === 'BIKE' ? '🏍️' : v === 'SCOOTER' ? '🛵' : v === 'BICYCLE' ? '🚲' : '🚗'} {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-1">Bank Details</p>
                                {[
                                    { key: 'accountHolderName', placeholder: 'Account holder name' },
                                    { key: 'accountNumber', placeholder: 'Account number' },
                                    { key: 'ifscCode', placeholder: 'IFSC code' },
                                    { key: 'bankName', placeholder: 'Bank name' },
                                ].map((f) => (
                                    <input
                                        key={f.key}
                                        placeholder={f.placeholder}
                                        value={form.bankDetails[f.key]}
                                        onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, [f.key]: e.target.value } })}
                                        className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
                                    />
                                ))}

                                <button type="submit" disabled={saving} className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-primary/20 mt-1">
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : 'Add Partner'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
