import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Zap, Crown, Clock, MapPin, FileText, ChevronRight, Loader2, CheckCircle } from 'lucide-react';
import api from '../../lib/api';

const DELIVERY_TYPES = [
    { value: 'normal', label: 'Standard', icon: Clock, desc: '15 working days', colorClass: 'text-muted-foreground', multiplier: 1 },
    { value: 'express', label: 'Express', icon: Zap, desc: '7 working days', colorClass: 'text-amber-500', multiplier: 1.4 },
    { value: 'premium', label: 'Premium', icon: Crown, desc: '3 working days', colorClass: 'text-primary', multiplier: 2 },
];

const FABRIC_OPTIONS = [
    { value: 'CUSTOMER', label: '🧵 My Fabric', desc: 'I will provide the fabric' },
    { value: 'PLATFORM', label: '🛒 Platform Fabric', desc: 'Buy fabric from us' },
];

export default function BookService() {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [step, setStep] = useState(1); // 1: service, 2: details, 3: confirm
    const [selected, setSelected] = useState({
        serviceId: '',
        deliveryType: 'normal',
        pickupAddressId: '',
        deliveryAddressId: '',
        fabricSource: 'CUSTOMER',
        specialInstructions: '',
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const [svcRes, addrRes] = await Promise.all([
                api.get('/customer/services'),
                api.get('/customer/address'),
            ]);
            setServices(svcRes.data?.data || []);
            const addrs = addrRes.data?.data || [];
            setAddresses(addrs);
            if (addrs.length > 0) {
                setSelected(prev => ({ ...prev, pickupAddressId: addrs[0]._id, deliveryAddressId: addrs[0]._id }));
            }
        } catch {
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

    useEffect(() => { fetchData(); }, [fetchData]);

    const selectedService = services.find(s => s._id === selected.serviceId);
    const deliveryType = DELIVERY_TYPES.find(d => d.value === selected.deliveryType);
    const price = selectedService ? Math.round(selectedService.basePrice * (deliveryType?.multiplier || 1)) : 0;

    const placeOrder = async () => {
        setSubmitting(true);
        setError('');
        try {
            await api.post('/customer/orders', selected);
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to place order');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
        </div>
    );

    if (success) return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center gap-5 py-20">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle size={48} className="text-primary" />
            </div>
            <div>
                <h2 className="text-2xl font-bold font-serif">Order Booked! 🎉</h2>
                <p className="text-sm text-muted-foreground mt-2">We'll pick up your fabric soon and begin stitching.</p>
            </div>
            <button
                onClick={() => navigate('/customer/orders')}
                className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl"
            >
                Track My Order
            </button>
        </motion.div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold font-serif">Book Stitching</h1>
                <div className="flex gap-1">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`h-1.5 w-8 rounded-full transition-all ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* Step 1: Choose Service */}
                {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-3">
                        <p className="text-sm text-muted-foreground font-medium">Choose your stitching service</p>
                        {services.map((svc) => (
                            <button
                                key={svc._id}
                                onClick={() => {
                                    setSelected(prev => ({ ...prev, serviceId: svc._id }));
                                    setTimeout(() => setStep(2), 200);
                                }}
                                className={`flex justify-between items-center p-4 rounded-2xl border-2 transition-all text-left ${selected.serviceId === svc._id ? 'border-primary bg-primary/5' : 'border-border bg-card'
                                    }`}
                            >
                                <div>
                                    <h3 className="font-bold text-sm">{svc.name}</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">From ₹{svc.basePrice}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-primary font-serif">₹{svc.basePrice}</span>
                                    <ChevronRight size={16} className="text-muted-foreground" />
                                </div>
                            </button>
                        ))}
                    </motion.div>
                )}

                {/* Step 2: Delivery & Fabric */}
                {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Delivery Speed</p>
                            <div className="flex flex-col gap-2">
                                {DELIVERY_TYPES.map((type) => {
                                    const Icon = type.icon;
                                    const typePrice = selectedService ? Math.round(selectedService.basePrice * type.multiplier) : 0;
                                    return (
                                        <button
                                            key={type.value}
                                            onClick={() => setSelected(prev => ({ ...prev, deliveryType: type.value }))}
                                            className={`flex justify-between items-center p-4 rounded-2xl border-2 transition-all ${selected.deliveryType === type.value ? 'border-primary bg-primary/5' : 'border-border bg-card'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon size={20} className={type.colorClass} />
                                                <div className="text-left">
                                                    <p className="font-bold text-sm">{type.label}</p>
                                                    <p className="text-xs text-muted-foreground">{type.desc}</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-primary font-serif">₹{typePrice}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fabric Source</p>
                            <div className="grid grid-cols-2 gap-2">
                                {FABRIC_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setSelected(prev => ({ ...prev, fabricSource: opt.value }))}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all ${selected.fabricSource === opt.value ? 'border-primary bg-primary/5' : 'border-border bg-card'
                                            }`}
                                    >
                                        <p className="text-lg mb-1">{opt.label.split(' ')[0]}</p>
                                        <p className="font-bold text-xs">{opt.label.split(' ').slice(1).join(' ')}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {addresses.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pickup Address</p>
                                <div className="flex flex-col gap-2">
                                    {addresses.map((addr) => (
                                        <button
                                            key={addr._id}
                                            onClick={() => setSelected(prev => ({ ...prev, pickupAddressId: addr._id, deliveryAddressId: addr._id }))}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${selected.pickupAddressId === addr._id ? 'border-primary bg-primary/5' : 'border-border bg-card'
                                                }`}
                                        >
                                            <p className="font-bold text-xs">{addr.name}</p>
                                            <p className="text-xs text-muted-foreground">{addr.fullAddress}, {addr.district}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <textarea
                            placeholder="Special instructions for the tailor (optional)"
                            value={selected.specialInstructions}
                            onChange={(e) => setSelected(prev => ({ ...prev, specialInstructions: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />

                        <div className="flex gap-3">
                            <button onClick={() => setStep(1)} className="flex-1 py-3 border border-border rounded-xl font-bold text-sm">
                                Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={!selected.serviceId}
                                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm disabled:opacity-60"
                            >
                                Review Order
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Confirm */}
                {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
                        <div className="bg-card border border-border rounded-2xl p-5">
                            <h3 className="font-bold font-serif text-lg mb-4">Order Summary</h3>
                            <div className="flex flex-col gap-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Service</span>
                                    <span className="font-bold">{selectedService?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Delivery</span>
                                    <span className="font-bold">{deliveryType?.label} ({deliveryType?.desc})</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Fabric</span>
                                    <span className="font-bold">{selected.fabricSource === 'CUSTOMER' ? 'I provide' : 'Platform'}</span>
                                </div>
                                {selected.specialInstructions && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Notes</span>
                                        <span className="font-medium text-right max-w-[60%] text-xs">{selected.specialInstructions}</span>
                                    </div>
                                )}
                                <div className="h-px bg-border my-1" />
                                <div className="flex justify-between text-base">
                                    <span className="font-bold">Total</span>
                                    <span className="font-bold text-primary font-serif text-lg">₹{price}</span>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium rounded-xl px-4 py-3">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={() => setStep(2)} className="flex-1 py-3.5 border border-border rounded-xl font-bold text-sm">
                                Back
                            </button>
                            <button
                                onClick={placeOrder}
                                disabled={submitting}
                                className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-primary/20"
                            >
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : <>Confirm & Book</>}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
