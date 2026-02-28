import { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, MapPin, Package, CheckCircle, Clock, Navigation } from 'lucide-react';

// Mock delivery tasks — in production these would come from an admin-assigned endpoint
const mockTasks = [
    {
        id: 'DT-001',
        type: 'PICKUP',
        orderId: 'ORD-7782',
        customerName: 'Farhan Ahmad',
        address: 'Rajbagh, Srinagar - 190008',
        time: '10:30 AM',
        status: 'pending',
        amount: 80,
    },
    {
        id: 'DT-002',
        type: 'DROP',
        orderId: 'ORD-7770',
        customerName: 'Ayesha Bhat',
        address: 'Jawahar Nagar, Srinagar - 190011',
        time: '2:00 PM',
        status: 'completed',
        amount: 120,
    },
];

const TYPE_CONFIG = {
    PICKUP: { label: 'Pickup', icon: Package, color: 'text-amber-500', bg: 'bg-amber-50' },
    DROP: { label: 'Deliver', icon: Truck, color: 'text-primary', bg: 'bg-primary/10' },
};

export default function DeliveryTasks() {
    const [tasks, setTasks] = useState(mockTasks);
    const [activeTab, setActiveTab] = useState('pending');

    const markComplete = (id) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' } : t));
    };

    const displayed = tasks.filter(t => activeTab === 'pending' ? t.status === 'pending' : t.status === 'completed');

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            {/* Stats Banner */}
            <div className="bg-foreground text-card rounded-2xl p-5 flex justify-between items-center shadow-md">
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Today's Tasks</p>
                    <h2 className="text-3xl font-bold font-serif">{tasks.length}</h2>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Completed</p>
                    <h2 className="text-3xl font-bold font-serif text-primary">{tasks.filter(t => t.status === 'completed').length}</h2>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-muted rounded-xl">
                {['pending', 'completed'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg capitalize transition-all ${activeTab === tab ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Task Cards */}
            <div className="flex flex-col gap-3">
                {displayed.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground text-sm">No {activeTab} tasks</div>
                )}
                {displayed.map((task) => {
                    const config = TYPE_CONFIG[task.type];
                    const Icon = config.icon;
                    return (
                        <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border rounded-2xl p-4 shadow-sm"
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center shrink-0`}>
                                    <Icon size={18} className={config.color} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>{config.label}</span>
                                            <h3 className="font-bold text-sm mt-0.5">{task.customerName}</h3>
                                        </div>
                                        <span className="font-bold text-primary font-serif">₹{task.amount}</span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                        <MapPin size={12} className="text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">{task.address}</p>
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Clock size={12} className="text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">{task.time} · {task.orderId}</p>
                                    </div>
                                </div>
                            </div>

                            {task.status === 'pending' && (
                                <div className="flex gap-2 mt-1">
                                    <button className="flex-1 py-2.5 border border-border rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                                        <Navigation size={14} /> Navigate
                                    </button>
                                    <button
                                        onClick={() => markComplete(task.id)}
                                        className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                                    >
                                        <CheckCircle size={14} /> Mark Done
                                    </button>
                                </div>
                            )}
                            {task.status === 'completed' && (
                                <div className="flex items-center gap-2 text-primary text-xs font-bold">
                                    <CheckCircle size={14} /> Completed
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
