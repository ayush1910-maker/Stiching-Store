import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Scissors, Truck, CreditCard, Star,
  CheckCircle, Loader2, AlertCircle, Upload
} from 'lucide-react';
import api from '../../lib/api';

const DELIVERY_OPTIONS = [
  { id: 'normal', name: 'Standard (15 Days)', surcharge: 0 },
  { id: 'express', name: 'Express (7 Days)', surcharge: 300 },
  { id: 'premium', name: 'Premium (3 Days)', surcharge: 600 },
];

export default function CustomerOrder() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Determine mode: if id looks like a MongoDB ObjectId, it's a placed order (track/rate mode)
  // Otherwise, it's a service ID being booked (booking mode)
  const isOrderId = id?.length === 24;

  const [mode, setMode] = useState(isOrderId ? 'track' : 'book'); // 'book' | 'track' | 'rate'
  const [service, setService] = useState(null);
  const [order, setOrder] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Booking form state
  const [deliveryType, setDeliveryType] = useState('normal');
  const [fabricSource, setFabricSource] = useState('CUSTOMER');
  const [pickupAddressId, setPickupAddressId] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [measurements, setMeasurements] = useState({ chest: '', waist: '', shoulder: '', length: '' });

  // Rating state
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [ratingDone, setRatingDone] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isOrderId) {
        // Track mode: fetch order details
        const res = await api.get(`/customer/orders/${id}/track`);
        setOrder(res.data?.data);
        setMode(res.data?.data?.currentStatus === 'DELIVERED' ? 'rate' : 'track');
      } else {
        // Booking mode: fetch service details + addresses
        const [svcRes, addrRes] = await Promise.allSettled([
          api.get('/customer/services', { params: { limit: 20 } }),
          api.get('/customer/address'),
        ]);
        if (svcRes.status === 'fulfilled') {
          const list = svcRes.value.data?.data || [];
          const found = list.find((s) => s._id === id);
          setService(found || list[0] || { _id: id, name: 'Stitching Service', basePrice: 999 });
        }
        if (addrRes.status === 'fulfilled') {
          const addrs = addrRes.value.data?.data || [];
          setAddresses(addrs);
          if (addrs.length > 0) setPickupAddressId(addrs[0]._id);
        }
      }
    } catch (err) {
      setError('Failed to load order details.');
    } finally {
      setLoading(false);
    }
  }, [id, isOrderId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedDelivery = DELIVERY_OPTIONS.find((d) => d.id === deliveryType);
  const totalAmount = (service?.basePrice || 0) + (selectedDelivery?.surcharge || 0);

  // --- Booking flow ---
  const handleBooking = async () => {
    if (!pickupAddressId && addresses.length > 0) {
      setError('Please select a pickup address.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const orderRes = await api.post('/customer/orders', {
        serviceId: service._id,
        deliveryType,
        fabricSource,
        pickupAddressId: pickupAddressId || undefined,
        deliveryAddressId: pickupAddressId || undefined,
        specialInstructions,
      });
      const newOrder = orderRes.data?.data;
      const newOrderId = newOrder?._id;

      // Upload measurements right after order creation
      if (newOrderId && Object.values(measurements).some((v) => v)) {
        await api.post(`/customer/orders/${newOrderId}/upload-measurements`, {
          measurements,
        }).catch(() => { });
      }

      // Cache order ID so Orders list can track it
      const cached = JSON.parse(localStorage.getItem('tm_my_order_ids') || '[]');
      if (newOrderId && !cached.includes(newOrderId)) {
        localStorage.setItem('tm_my_order_ids', JSON.stringify([newOrderId, ...cached]));
      }

      navigate('/customer/orders');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Rating flow ---
  const handleRate = async () => {
    setSubmitting(true);
    try {
      await api.post(`/customer/orders/${id}/rate-tailor`, { rating, review });
      setRatingDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit rating.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col min-h-screen items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col min-h-screen pb-32"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-card border-b border-border sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="p-2 bg-muted rounded-full">
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-bold text-lg font-serif">
          {mode === 'track' ? 'Order Tracking' : mode === 'rate' ? 'Rate Your Tailor' : service?.name}
        </h1>
      </div>

      {error && (
        <div className="mx-4 mt-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ── BOOKING MODE ── */}
      {mode === 'book' && service && (
        <div className="p-4 flex flex-col gap-6">
          {/* Service Summary */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Service</p>
            <h2 className="text-xl font-bold font-serif mt-1">{service.name}</h2>
            <p className="font-bold text-primary text-lg font-serif">Starting ₹{service.basePrice}</p>
          </div>

          {/* Fabric Source */}
          <section>
            <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <Scissors size={16} className="text-primary" /> Fabric Source
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'CUSTOMER', label: 'My Own Fabric', desc: "We'll pick it up" },
                { value: 'PLATFORM', label: 'Platform Fabric', desc: 'Sourced by us' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFabricSource(opt.value)}
                  className={`p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${fabricSource === opt.value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card'
                    }`}
                >
                  {opt.label}
                  <div className="text-xs text-muted-foreground mt-0.5 font-normal">{opt.desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Measurements */}
          <section>
            <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <Upload size={16} className="text-primary" /> Measurements
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'chest', label: 'Chest (in)' },
                { key: 'waist', label: 'Waist (in)' },
                { key: 'shoulder', label: 'Shoulder (in)' },
                { key: 'length', label: 'Length (in)' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-muted-foreground">{f.label}</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="0"
                    value={measurements[f.key]}
                    onChange={(e) => setMeasurements({ ...measurements, [f.key]: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl bg-card text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              💡 Or save your profile in <span className="text-primary font-bold">Measurements</span> and we'll auto-fill.
            </p>
          </section>

          {/* Delivery Speed */}
          <section>
            <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <Truck size={16} className="text-primary" /> Delivery Speed
            </h2>
            <div className="flex flex-col gap-2">
              {DELIVERY_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${deliveryType === opt.id ? 'border-primary bg-primary/5' : 'border-border bg-card'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryType === opt.id}
                      onChange={() => setDeliveryType(opt.id)}
                      className="accent-primary w-4 h-4"
                    />
                    <span className="text-sm font-medium">{opt.name}</span>
                  </div>
                  <span className="text-sm font-bold text-muted-foreground">
                    {opt.surcharge === 0 ? 'Included' : `+₹${opt.surcharge}`}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Address picker */}
          {addresses.length > 0 && (
            <section>
              <h2 className="font-semibold mb-3 text-sm flex items-center gap-2">
                📍 Pickup Address
              </h2>
              <div className="flex flex-col gap-2">
                {addresses.map((addr) => (
                  <label
                    key={addr._id}
                    className={`p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${pickupAddressId === addr._id ? 'border-primary bg-primary/5' : 'border-border bg-card'
                      }`}
                  >
                    <input
                      type="radio"
                      name="addr"
                      checked={pickupAddressId === addr._id}
                      onChange={() => setPickupAddressId(addr._id)}
                      className="hidden"
                    />
                    <p className="font-bold text-xs">{addr.name}</p>
                    <p className="text-xs text-muted-foreground">{addr.fullAddress}, {addr.district}</p>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Special instructions */}
          <textarea
            placeholder="Any special instructions for the tailor... (optional)"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-border rounded-xl bg-card text-sm resize-none outline-none focus:border-primary"
          />
        </div>
      )}

      {/* ── TRACK MODE ── */}
      {mode === 'track' && order && (
        <div className="p-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">Order ID</p>
            <p className="font-bold text-sm mt-0.5">{order._id}</p>
            <p className="text-xs text-muted-foreground mt-2">Current Status</p>
            <p className="font-bold text-primary mt-0.5">{order.currentStatus?.replace(/_/g, ' ')}</p>
          </div>
        </div>
      )}

      {/* ── RATE MODE ── */}
      {mode === 'rate' && (
        <div className="p-4 flex flex-col gap-5">
          {ratingDone ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center gap-4 py-16"
            >
              <CheckCircle size={56} className="text-primary" />
              <h2 className="text-xl font-bold font-serif">Thank you for your feedback! 🎉</h2>
            </motion.div>
          ) : (
            <>
              <div className="bg-card border border-border rounded-2xl p-5 text-center">
                <p className="text-sm text-muted-foreground mb-4">How was your stitching experience?</p>
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRating(star)}>
                      <Star
                        size={36}
                        className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Write a review (optional)..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-muted/50 text-sm resize-none outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={handleRate}
                disabled={submitting}
                className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-60"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Submit Rating ⭐'}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── BOOKING: Sticky Checkout Bar ── */}
      {mode === 'book' && (
        <div className="fixed bottom-0 left-0 w-full bg-card border-t border-border p-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-50">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-muted-foreground font-medium">Total</span>
            <span className="text-2xl font-bold font-serif text-primary">₹{totalAmount}</span>
          </div>
          <button
            onClick={handleBooking}
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-primary/20 disabled:opacity-60"
          >
            {submitting
              ? <Loader2 size={20} className="animate-spin" />
              : <><CreditCard size={20} /> Confirm & Place Order</>
            }
          </button>
        </div>
      )}
    </motion.div>
  );
}