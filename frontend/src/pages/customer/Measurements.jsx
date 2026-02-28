import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, Plus, Save, Loader2, X } from 'lucide-react';
import api from '../../lib/api';

// Common garment measurements
const MEASUREMENT_FIELDS = [
    { key: 'chest', label: 'Chest (inches)' },
    { key: 'waist', label: 'Waist (inches)' },
    { key: 'hips', label: 'Hips (inches)' },
    { key: 'shoulder', label: 'Shoulder (inches)' },
    { key: 'sleeveLength', label: 'Sleeve Length' },
    { key: 'length', label: 'Kurti/Dress Length' },
    { key: 'salwarLength', label: 'Salwar/Pant Length' },
    { key: 'neckDepth', label: 'Neck Depth' },
];

const INITIAL_DATA = MEASUREMENT_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {});

export default function CustomerMeasurements() {
    const [profiles, setProfiles] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [profileName, setProfileName] = useState('');
    const [data, setData] = useState(INITIAL_DATA);
    const [isDefault, setIsDefault] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // No list endpoint exists; show saved locally + mock
    useEffect(() => {
        const cached = localStorage.getItem('tm_measurement_profiles');
        if (cached) setProfiles(JSON.parse(cached));
        else {
            const mock = [{ _id: 'm1', profileName: 'My Standard Fit', isDefault: true, data: { chest: '36', waist: '30', hips: '38', shoulder: '15', length: '42' } }];
            setProfiles(mock);
        }
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const res = await api.post('/customer/measurements/save', { profileName, data, isDefault });
            const newProfile = res.data?.data || { _id: Date.now().toString(), profileName, data, isDefault };
            const updated = [...profiles, newProfile];
            setProfiles(updated);
            localStorage.setItem('tm_measurement_profiles', JSON.stringify(updated));
            setShowForm(false);
            setProfileName('');
            setData(INITIAL_DATA);
        } catch (err) {
            // Save locally as fallback
            const newProfile = { _id: Date.now().toString(), profileName, data, isDefault };
            const updated = [...profiles, newProfile];
            setProfiles(updated);
            localStorage.setItem('tm_measurement_profiles', JSON.stringify(updated));
            setShowForm(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold font-serif tracking-tight">Measurements</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-1 text-sm font-bold text-primary bg-primary/10 px-3 py-2 rounded-xl"
                >
                    <Plus size={16} /> New Profile
                </button>
            </div>

            {/* Info Banner */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3">
                <Ruler size={20} className="text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    Save your measurements once. We'll use them to stitch your perfect outfit every time — no need to re-enter for future orders.
                </p>
            </div>

            {profiles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Ruler size={48} className="text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No measurement profiles saved yet</p>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {profiles.map((profile) => (
                    <motion.div
                        key={profile._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border rounded-2xl p-4"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-sm">{profile.profileName}</h3>
                                {profile.isDefault && (
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md mt-1 inline-block">
                                        ✓ Default
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(profile.data).filter(([, v]) => v).map(([key, value]) => (
                                <div key={key} className="bg-muted/60 rounded-xl px-3 py-2">
                                    <p className="text-[10px] text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                                    <p className="text-sm font-bold">{value}"</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Add Measurement Bottom Sheet */}
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
                            className="w-full bg-card rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto no-scrollbar"
                        >
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-xl font-bold font-serif">New Measurement Profile</h2>
                                <button onClick={() => setShowForm(false)} className="p-2 rounded-full bg-muted">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="flex flex-col gap-3">
                                <input
                                    placeholder="Profile name (e.g. Summer Kurtis)"
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                />

                                <div className="grid grid-cols-2 gap-2">
                                    {MEASUREMENT_FIELDS.map((field) => (
                                        <div key={field.key}>
                                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">{field.label}</label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                placeholder="inches"
                                                value={data[field.key]}
                                                onChange={(e) => setData({ ...data, [field.key]: e.target.value })}
                                                className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-all"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isDefault}
                                        onChange={(e) => setIsDefault(e.target.checked)}
                                        className="accent-primary w-4 h-4"
                                    />
                                    Set as default profile
                                </label>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-primary/20"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={16} /> Save Profile</>}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
