import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Scissors, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROLES = [
    { value: 'customer', label: '🛍️ Customer', desc: 'Order custom stitching' },
    { value: 'tailor', label: '✂️ Tailor', desc: 'Accept stitching orders' },
    { value: 'delivery', label: '🚚 Delivery', desc: 'Deliver orders' },
];

export default function Register() {
    const navigate = useNavigate();
    const { register, loading } = useAuth();
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await register(form.name, form.email, form.password, form.role);
        if (result.success) {
            const routes = { customer: '/customer', tailor: '/tailor', delivery: '/delivery', admin: '/admin' };
            navigate(routes[result.role] || '/customer', { replace: true });
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center mb-8"
            >
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg mb-4">
                    <Scissors size={32} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold font-serif tracking-tight">Tailor<span className="text-primary">Craft</span></h1>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full max-w-sm"
            >
                <div className="bg-card border border-border rounded-3xl p-6 shadow-xl">
                    <h2 className="text-2xl font-bold font-serif mb-1">Create account</h2>
                    <p className="text-sm text-muted-foreground mb-5">Join TailorCraft today</p>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium rounded-xl px-4 py-3 mb-4"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Name */}
                        <div className="relative">
                            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                name="name"
                                type="text"
                                placeholder="Full name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                minLength={2}
                                className="w-full pl-10 pr-4 py-3.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>

                        {/* Email */}
                        <div className="relative">
                            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                name="email"
                                type="email"
                                placeholder="Email address"
                                value={form.email}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-3.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                name="password"
                                type={showPw ? 'text' : 'password'}
                                placeholder="Password (min 6 chars)"
                                value={form.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                className="w-full pl-10 pr-11 py-3.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(!showPw)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                            >
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        {/* Role Picker */}
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">I am a...</p>
                            <div className="grid grid-cols-3 gap-2">
                                {ROLES.map((role) => (
                                    <button
                                        key={role.value}
                                        type="button"
                                        onClick={() => setForm({ ...form, role: role.value })}
                                        className={`flex flex-col items-center p-3 rounded-xl border-2 text-center transition-all ${form.role === role.value
                                                ? 'border-primary bg-primary/10 shadow-sm'
                                                : 'border-border bg-muted/30'
                                            }`}
                                    >
                                        <span className="text-xl mb-1">{role.label.split(' ')[0]}</span>
                                        <span className="text-[10px] font-bold text-foreground leading-tight">{role.label.split(' ')[1]}</span>
                                        <span className="text-[9px] text-muted-foreground leading-tight mt-0.5">{role.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 active:scale-98 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Create Account <ArrowRight size={16} /></>}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link to="/login" className="font-bold text-primary">
                            Sign in
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
