import { motion } from 'framer-motion';
import { TrendingUp, Banknote, Truck, Calendar } from 'lucide-react';

const mockEarnings = {
    thisWeek: 1240,
    thisMonth: 4800,
    lifetimeDeliveries: 127,
    pendingPayout: 620,
};

const mockHistory = [
    { id: 'DT-8890', date: '27 Feb', type: 'DROP', amount: 120, area: 'Rajbagh' },
    { id: 'DT-8889', date: '26 Feb', type: 'PICKUP', amount: 80, area: 'Jawahar Nagar' },
    { id: 'DT-8888', date: '26 Feb', type: 'DROP', amount: 150, area: 'Hyderpora' },
    { id: 'DT-8881', date: '25 Feb', type: 'DROP', amount: 90, area: 'Bemina' },
];

export default function DeliveryEarnings() {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <h1 className="text-2xl font-bold font-serif tracking-tight">My Earnings</h1>

            {/* Hero Stat */}
            <div className="bg-gradient-to-br from-primary to-brand-700 rounded-2xl p-6 text-primary-foreground shadow-lg shadow-primary/20">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">This Month's Earnings</p>
                <h2 className="text-4xl font-bold font-serif mb-1">₹{mockEarnings.thisMonth.toLocaleString()}</h2>
                <p className="text-sm opacity-70 font-medium">+₹{mockEarnings.thisWeek} this week</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: 'Pending Payout', value: `₹${mockEarnings.pendingPayout}`, icon: Banknote, highlight: true },
                    { label: 'Total Deliveries', value: mockEarnings.lifetimeDeliveries, icon: Truck },
                ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className={`rounded-2xl p-4 border ${stat.highlight ? 'border-primary/30 bg-primary/5' : 'bg-card border-border'}`}>
                            <Icon size={20} className={`mb-2 ${stat.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                            <p className="text-2xl font-bold font-serif">{stat.value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Recent Deliveries */}
            <div>
                <h3 className="text-base font-bold font-serif tracking-tight mb-3">Recent Deliveries</h3>
                <div className="flex flex-col gap-2">
                    {mockHistory.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.type === 'DROP' ? 'bg-primary/10' : 'bg-amber-50'}`}>
                                {item.type === 'DROP' ? <Truck size={16} className="text-primary" /> : <Calendar size={16} className="text-amber-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">{item.id}</p>
                                <p className="text-[10px] text-muted-foreground">{item.type === 'DROP' ? '📦 Delivery' : '🧺 Pickup'} · {item.area} · {item.date}</p>
                            </div>
                            <span className="font-bold text-primary font-serif text-sm">+₹{item.amount}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
