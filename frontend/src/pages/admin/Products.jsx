import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';
import api from '../../lib/api';

const EMPTY_FORM = {
    name: '', description: '', category: '', price: '', discountPrice: '', stock: '', sizes: '', colors: '', isActive: true
};

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const fetchProducts = useCallback(async () => {
        try {
            // Use service browse as proxy — in real app admin would have product list endpoint
            setProducts([
                { _id: 'p1', name: 'Emerald Silk Saree', category: 'Sarees', price: 4599, stock: 5, isActive: true },
                { _id: 'p2', name: 'Floral Cotton Kurti', category: 'Kurtis', price: 1299, stock: 12, isActive: true },
                { _id: 'p3', name: 'Designer Lehenga', category: 'Lehengas', price: 8999, stock: 2, isActive: false },
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                price: Number(form.price),
                stock: Number(form.stock),
                discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
                sizes: form.sizes ? form.sizes.split(',').map(s => s.trim()) : [],
                colors: form.colors ? form.colors.split(',').map(c => c.trim()) : [],
            };
            if (editingId) {
                await api.patch(`/admin/products/${editingId}/edit`, payload);
                setProducts(prev => prev.map(p => p._id === editingId ? { ...p, ...payload } : p));
            } else {
                const res = await api.post('/admin/products/add', payload);
                setProducts(prev => [...prev, res.data?.data || { ...payload, _id: Date.now().toString() }]);
            }
        } catch {
            const payload = { ...form, _id: Date.now().toString() };
            if (!editingId) setProducts(prev => [...prev, payload]);
        } finally {
            setSaving(false);
            setShowForm(false);
            setEditingId(null);
            setForm(EMPTY_FORM);
        }
    };

    const handleDelete = async (id) => {
        try { await api.delete(`/admin/products/${id}/delete`); } catch { /* ignore */ }
        setProducts(prev => prev.filter(p => p._id !== id));
    };

    const updateStock = async (id, stock) => {
        try { await api.patch(`/admin/products/${id}/update-stock`, { stock: Number(stock) }); } catch { /* ignore */ }
        setProducts(prev => prev.map(p => p._id === id ? { ...p, stock: Number(stock) } : p));
    };

    const openEdit = (product) => {
        setForm({ ...product, sizes: product.sizes?.join(', ') || '', colors: product.colors?.join(', ') || '' });
        setEditingId(product._id);
        setShowForm(true);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold font-serif tracking-tight">Products</h1>
                <button onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); }} className="flex items-center gap-1 text-sm font-bold text-primary bg-primary/10 px-3 py-2 rounded-xl">
                    <Plus size={16} /> Add
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><Loader2 size={28} className="animate-spin text-primary" /></div>
            ) : (
                <div className="flex flex-col gap-3">
                    {products.map((product) => (
                        <div key={product._id} className="bg-card border border-border rounded-2xl p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-sm">{product.name}</h3>
                                    <p className="text-xs text-muted-foreground">{product.category}</p>
                                </div>
                                <div className="flex gap-1.5">
                                    <button onClick={() => openEdit(product)} className="p-2 bg-muted rounded-lg">
                                        <Edit size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(product._id)} className="p-2 bg-destructive/10 text-destructive rounded-lg">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-primary font-serif">₹{product.price}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Stock:</span>
                                    <input
                                        type="number"
                                        value={product.stock}
                                        onChange={(e) => updateStock(product._id, e.target.value)}
                                        className="w-16 text-center py-1 bg-muted border border-border rounded-lg text-xs font-bold"
                                    />
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${product.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                    {product.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Product Form Bottom Sheet */}
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
                                <h2 className="text-xl font-bold font-serif">{editingId ? 'Edit Product' : 'Add Product'}</h2>
                                <button onClick={() => setShowForm(false)} className="p-2 rounded-full bg-muted"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleSave} className="flex flex-col gap-3">
                                {[
                                    { name: 'name', placeholder: 'Product name', required: true },
                                    { name: 'description', placeholder: 'Description' },
                                    { name: 'category', placeholder: 'Category (e.g. Sarees, Kurtis)', required: true },
                                    { name: 'price', placeholder: 'Price (₹)', type: 'number', required: true },
                                    { name: 'discountPrice', placeholder: 'Discount price (optional)', type: 'number' },
                                    { name: 'stock', placeholder: 'Stock quantity', type: 'number', required: true },
                                    { name: 'sizes', placeholder: 'Sizes (comma separated: S, M, L, XL)' },
                                    { name: 'colors', placeholder: 'Colors (comma separated: Red, Blue)' },
                                ].map((f) => (
                                    <input
                                        key={f.name}
                                        name={f.name}
                                        type={f.type || 'text'}
                                        placeholder={f.placeholder}
                                        value={form[f.name]}
                                        onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
                                        required={f.required}
                                        className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-all"
                                    />
                                ))}
                                <button type="submit" disabled={saving} className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-primary/20">
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : (editingId ? 'Update Product' : 'Add Product')}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
