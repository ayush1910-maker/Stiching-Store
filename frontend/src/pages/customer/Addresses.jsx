import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, X, Loader2, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

const INITIAL_FORM = {
    name: '', phone: '', pincode: '', district: '', state: '', fullAddress: '',
    location: { lat: 34.0837, lng: 74.7973 } // Default: Srinagar
};

export default function CustomerAddresses() {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(INITIAL_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchAddresses = useCallback(async () => {
        try {
            const res = await api.get('/customer/address');
            setAddresses(res.data?.data || []);
        } catch {
            setAddresses([
                { _id: '1', name: 'Home', phone: '9876543210', fullAddress: '12 Dal Lake View, Rajbagh', district: 'Srinagar', state: 'J&K', pincode: '190001' },
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const res = await api.post('/customer/address', form);
            setAddresses(prev => [...prev, res.data?.data]);
            setShowForm(false);
            setForm(INITIAL_FORM);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save address');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold font-serif tracking-tight">My Addresses</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-1 text-sm font-bold text-primary bg-primary/10 px-3 py-2 rounded-xl"
                >
                    <Plus size={16} /> Add New
                </button>
            </div>

            {addresses.length === 0 && !showForm && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <MapPin size={48} className="text-muted-foreground/40" />
                    <p className="text-muted-foreground text-sm font-medium">No saved addresses yet</p>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {addresses.map((addr, idx) => (
                    <motion.div
                        key={addr._id || idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border rounded-2xl p-4"
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                <MapPin size={18} className="text-primary" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-sm">{addr.name}</h3>
                                    <span className="text-xs text-muted-foreground">{addr.phone}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{addr.fullAddress}</p>
                                <p className="text-xs text-muted-foreground">{addr.district}, {addr.state} - {addr.pincode}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Add Address Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end"
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="w-full bg-card rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-xl font-bold font-serif">Add New Address</h2>
                                <button onClick={() => setShowForm(false)} className="p-2 rounded-full bg-muted">
                                    <X size={18} />
                                </button>
                            </div>

                            {error && (
                                <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3 mb-4 flex gap-2 items-center">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            <form onSubmit={handleSave} className="flex flex-col gap-3">
                                {[
                                    { name: 'name', placeholder: 'Address label (e.g. Home, Office)', required: true },
                                    { name: 'phone', placeholder: 'Contact phone number', required: true },
                                    { name: 'fullAddress', placeholder: 'Full street address', required: true },
                                    { name: 'district', placeholder: 'District', required: true },
                                    { name: 'state', placeholder: 'State', required: true },
                                    { name: 'pincode', placeholder: 'Pincode', required: true },
                                ].map((field) => (
                                    <input
                                        key={field.name}
                                        name={field.name}
                                        placeholder={field.placeholder}
                                        value={form[field.name]}
                                        onChange={handleChange}
                                        required={field.required}
                                        className="w-full px-4 py-3.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                ))}
                                <p className="text-xs text-muted-foreground">📍 Location coordinates: ({form.location.lat}, {form.location.lng}) — GPS auto-detect coming soon</p>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 mt-2 shadow-lg shadow-primary/20"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : 'Save Address'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
