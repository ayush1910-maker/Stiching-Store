import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Trash2, Plus, Minus, Package, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

export default function CustomerCart() {
    const [cart, setCart] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [loading, setLoading] = useState(true);
    const [orderLoading, setOrderLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [error, setError] = useState('');

    const fetchCart = useCallback(async () => {
        try {
            const [cartRes, addrRes] = await Promise.all([
                api.get('/customer/cart'),
                api.get('/customer/address'),
            ]);
            setCart(cartRes.data?.data?.items || []);
            const addrList = addrRes.data?.data || [];
            setAddresses(addrList);
            if (addrList.length > 0) setSelectedAddress(addrList[0]._id);
        } catch {
            // Use mock on API failure
            setCart([
                { _id: '1', product: { _id: 'p1', name: 'Emerald Silk Saree', price: 4599 }, quantity: 1, size: 'M', color: 'Green' },
                { _id: '2', product: { _id: 'p2', name: 'Floral Cotton Kurti', price: 1299 }, quantity: 2, size: 'L', color: 'Blue' },
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCart(); }, [fetchCart]);

    const removeItem = async (productId) => {
        try {
            await api.delete(`/customer/cart/remove/${productId}`);
            setCart(prev => prev.filter(i => i.product._id !== productId));
        } catch {
            setCart(prev => prev.filter(i => i.product._id !== productId));
        }
    };

    const total = cart.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);

    const placeOrder = async () => {
        if (!selectedAddress) { setError('Please select a shipping address'); return; }
        setOrderLoading(true);
        setError('');
        try {
            await api.post('/customer/ecommerce/place-order', {
                paymentMethod,
                shippingAddressId: selectedAddress,
            });
            setOrderSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to place order');
        } finally {
            setOrderLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
        </div>
    );

    if (orderSuccess) return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center gap-5 py-20">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <Package size={48} className="text-primary" />
            </div>
            <div>
                <h2 className="text-2xl font-bold font-serif">Order Placed! 🎉</h2>
                <p className="text-sm text-muted-foreground mt-2">Your order is confirmed. We'll notify you when it ships.</p>
            </div>
        </motion.div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold font-serif tracking-tight">My Cart</h1>
                <span className="text-sm font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full">{cart.length} items</span>
            </div>

            {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <ShoppingBag size={48} className="text-muted-foreground/40" />
                    <p className="text-muted-foreground font-medium">Your cart is empty</p>
                </div>
            ) : (
                <>
                    {/* Cart Items */}
                    <div className="flex flex-col gap-3">
                        <AnimatePresence>
                            {cart.map((item) => (
                                <motion.div
                                    key={item._id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-card border border-border rounded-2xl p-4 flex gap-3"
                                >
                                    <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                        <ShoppingBag size={24} className="text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-sm leading-tight">{item.product?.name}</h3>
                                        {item.size && <span className="text-xs text-muted-foreground">Size: {item.size}</span>}
                                        {item.color && <span className="text-xs text-muted-foreground ml-2">Color: {item.color}</span>}
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="font-bold text-primary font-serif">₹{item.product?.price}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                                                <button
                                                    onClick={() => removeItem(item.product?._id)}
                                                    className="p-1.5 rounded-lg bg-destructive/10 text-destructive"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Address Selection */}
                    {addresses.length > 0 && (
                        <div className="bg-card border border-border rounded-2xl p-4">
                            <h3 className="font-bold text-sm mb-3">📍 Shipping Address</h3>
                            <div className="flex flex-col gap-2">
                                {addresses.map((addr) => (
                                    <label key={addr._id} className={`flex gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedAddress === addr._id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                        <input type="radio" name="address" value={addr._id} checked={selectedAddress === addr._id} onChange={() => setSelectedAddress(addr._id)} className="mt-0.5 accent-primary" />
                                        <div>
                                            <p className="text-xs font-bold">{addr.name}</p>
                                            <p className="text-xs text-muted-foreground">{addr.fullAddress}</p>
                                            <p className="text-xs text-muted-foreground">{addr.district}, {addr.state} - {addr.pincode}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Payment Method */}
                    <div className="bg-card border border-border rounded-2xl p-4">
                        <h3 className="font-bold text-sm mb-3">💳 Payment Method</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {['COD', 'ONLINE'].map((method) => (
                                <button
                                    key={method}
                                    onClick={() => setPaymentMethod(method)}
                                    className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${paymentMethod === method ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
                                >
                                    {method === 'COD' ? '💵 Cash on Delivery' : '💳 Online Payment'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-card border border-border rounded-2xl p-4">
                        <h3 className="font-bold text-sm mb-3">Order Summary</h3>
                        <div className="flex flex-col gap-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-semibold">₹{total}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Delivery</span>
                                <span className="font-semibold text-primary">Free</span>
                            </div>
                            <div className="flex justify-between border-t border-border pt-2 mt-1">
                                <span className="font-bold">Total</span>
                                <span className="font-bold text-primary font-serif text-lg">₹{total}</span>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium rounded-xl px-4 py-3 flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <button
                        onClick={placeOrder}
                        disabled={orderLoading}
                        className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-60"
                    >
                        {orderLoading ? <Loader2 size={18} className="animate-spin" /> : <><CreditCard size={18} /> Place Order (₹{total})</>}
                    </button>
                </>
            )}
        </motion.div>
    );
}
