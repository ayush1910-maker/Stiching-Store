import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, FileText, Loader2, Download } from 'lucide-react';
import api from '../../lib/api';

export default function AdminPayments() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payoutForm, setPayoutForm] = useState({ userId: '', amount: '', type: 'TAILOR', cycleStart: '', cycleEnd: '' });
    const [payoutLoading, setPayoutLoading] = useState(false);
    const [payoutSuccess, setPayoutSuccess] = useState('');

    const fetchTransactions = useCallback(async () => {
        try {
            const res = await api.get('/admin/payments/transactions');
            setTransactions(res.data?.data || []);
        } catch {
            setTransactions([
                { _id: 'tx1', amount: 1299, type: 'stitching', status: 'COMPLETED', createdAt: new Date().toISOString(), user: { name: 'Farhan Ahmad' } },
                { _id: 'tx2', amount: 4599, type: 'ecommerce', status: 'COMPLETED', createdAt: new Date().toISOString(), user: { name: 'Ayesha Khan' } },
                { _id: 'tx3', amount: 1499, type: 'stitching', status: 'PENDING', createdAt: new Date().toISOString(), user: { name: 'Rohit Kumar' } },
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    const processPayout = async (e) => {
        e.preventDefault();
        setPayoutLoading(true);
        try {
            await api.post('/admin/payments/process-payout', {
                ...payoutForm,
                amount: Number(payoutForm.amount),
            });
            setPayoutSuccess(`✅ Payout of ₹${payoutForm.amount} processed successfully!`);
            setPayoutForm({ userId: '', amount: '', type: 'TAILOR', cycleStart: '', cycleEnd: '' });
        } catch (err) {
            setPayoutSuccess('❌ ' + (err.response?.data?.message || 'Failed to process payout'));
        } finally {
            setPayoutLoading(false);
        }
    };

    const STATUS_COLORS = {
        COMPLETED: 'bg-primary/10 text-primary',
        PENDING: 'bg-amber-100 text-amber-700',
        FAILED: 'bg-red-100 text-red-600',
    };

    const total = transactions.filter(t => t.status === 'COMPLETED').reduce((sum, t) => sum + t.amount, 0);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <h1 className="text-2xl font-bold font-serif tracking-tight">Payments</h1>

            {/* Revenue Summary */}
            <div className="bg-gradient-to-br from-foreground to-dark-800 rounded-2xl p-5 text-card shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">Total Collected</p>
                <h2 className="text-3xl font-bold font-serif">₹{total.toLocaleString()}</h2>
                <p className="text-xs opacity-60 mt-1">{transactions.filter(t => t.status === 'COMPLETED').length} successful transactions</p>
            </div>

            {/* Process Payout */}
            <div className="bg-card border border-border rounded-2xl p-4">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><DollarSign size={16} className="text-primary" /> Process Payout</h3>
                {payoutSuccess && (
                    <p className={`text-sm font-medium mb-3 rounded-xl px-3 py-2 ${payoutSuccess.startsWith('✅') ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                        {payoutSuccess}
                    </p>
                )}
                <form onSubmit={processPayout} className="flex flex-col gap-3">
                    <input
                        placeholder="User ID (24-char hex)"
                        value={payoutForm.userId}
                        onChange={(e) => setPayoutForm({ ...payoutForm, userId: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="number"
                            placeholder="Amount (₹)"
                            value={payoutForm.amount}
                            onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                            required
                            className="px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
                        />
                        <select
                            value={payoutForm.type}
                            onChange={(e) => setPayoutForm({ ...payoutForm, type: e.target.value })}
                            className="px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
                        >
                            <option value="TAILOR">Tailor</option>
                            <option value="DELIVERY">Delivery</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Cycle Start</label>
                            <input type="date" value={payoutForm.cycleStart} onChange={(e) => setPayoutForm({ ...payoutForm, cycleStart: e.target.value })} required className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Cycle End</label>
                            <input type="date" value={payoutForm.cycleEnd} onChange={(e) => setPayoutForm({ ...payoutForm, cycleEnd: e.target.value })} required className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary" />
                        </div>
                    </div>
                    <button type="submit" disabled={payoutLoading} className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                        {payoutLoading ? <Loader2 size={16} className="animate-spin" /> : 'Process Payout'}
                    </button>
                </form>
            </div>

            {/* Transactions */}
            <div>
                <h3 className="font-bold font-serif tracking-tight mb-3">Recent Transactions</h3>
                {loading ? (
                    <div className="flex justify-center py-6"><Loader2 size={24} className="animate-spin text-primary" /></div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {transactions.map((tx) => (
                            <div key={tx._id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                    <DollarSign size={16} className="text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold">{tx.user?.name || 'Customer'}</p>
                                    <p className="text-[10px] text-muted-foreground capitalize">{tx.type} · {new Date(tx.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="font-bold text-primary font-serif text-sm">₹{tx.amount}</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${STATUS_COLORS[tx.status] || 'bg-muted text-muted-foreground'}`}>
                                        {tx.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
