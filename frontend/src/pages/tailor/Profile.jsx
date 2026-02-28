import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Scissors, Star, Settings, LogOut, ChevronRight, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function TailorProfile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const stats = [
        { label: 'Orders Done', value: '42', icon: Scissors },
        { label: 'Rating', value: '4.8★', icon: Star },
        { label: 'Earnings', value: '₹28K', icon: Award },
    ];

    const menuItems = [
        { icon: User, label: 'Personal Details', desc: 'Update your name & contact' },
        { icon: Settings, label: 'Bank & Payouts', desc: 'Manage payout details' },
        { icon: Award, label: 'Skills & Services', desc: 'What you stitch' },
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            {/* Profile Header */}
            <div className="bg-gradient-to-br from-foreground to-dark-800 rounded-2xl p-5 text-card">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg">
                        {(user?.name || 'T').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold font-serif">{user?.name || 'Master Tailor'}</h2>
                        <p className="text-sm opacity-70">{user?.email || 'tailor@tailorcraft.in'}</p>
                        <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-md mt-1 inline-block">
                            ✂️ Tailor Partner
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-card border border-border rounded-2xl p-3 text-center">
                            <Icon size={18} className="text-primary mx-auto mb-1" />
                            <p className="text-lg font-bold font-serif">{stat.value}</p>
                            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Menu Items */}
            <div className="flex flex-col gap-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button key={item.label} className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 w-full text-left">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                <Icon size={18} className="text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold">{item.label}</p>
                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                            <ChevronRight size={16} className="text-muted-foreground" />
                        </button>
                    );
                })}
            </div>

            {/* Logout */}
            <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-destructive/30 text-destructive font-bold text-sm"
            >
                <LogOut size={16} /> Sign Out
            </button>
        </motion.div>
    );
}
