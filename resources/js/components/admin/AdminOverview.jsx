import React from 'react';
import { 
    TrendingUp, ShoppingBag, AlertCircle, CheckCircle2, 
    Clock, ArrowUpRight 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminOverview({ stats }) {
    if (!stats) return <div className="p-8 text-center text-rc-muted animate-pulse">Memuat Ringkasan...</div>;

    const cards = [
        { label: 'Total Pendapatan', value: `Rp ${stats.metrics?.total_revenue?.toLocaleString() || 0}`, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
        { label: 'Total Pesanan', value: stats.metrics?.total_orders || 0, icon: ShoppingBag, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { label: 'Komplain Aktif', value: stats.metrics?.active_complaints || 0, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
        { label: 'Penarikan Tertunda', value: stats.metrics?.pending_withdrawals || 0, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className="bg-rc-card p-6 rounded-2xl border border-rc-main/10 hover:border-rc-logo/30 transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${card.bg}`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <span className="text-rc-muted hover:text-rc-logo cursor-pointer"><ArrowUpRight className="w-4 h-4" /></span>
                        </div>
                        <h3 className="text-[10px] font-black text-rc-muted uppercase tracking-[0.2em] mb-1">{card.label}</h3>
                        <p className="text-2xl font-black text-rc-main tracking-tighter">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Chart Section */}
            <div className="bg-rc-card p-6 rounded-2xl border border-rc-main/10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-sm font-black text-rc-main uppercase tracking-widest">Analisis Pertumbuhan</h3>
                        <p className="text-[10px] text-rc-muted uppercase tracking-wider">Statistik pendapatan 7 hari terakhir</p>
                    </div>
                    <select className="bg-rc-bg border border-rc-main/10 text-[10px] font-bold uppercase p-2 rounded-lg outline-none text-rc-muted">
                        <option>7 Hari Terakhir</option>
                        <option>30 Hari Terakhir</option>
                    </select>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.revenue_chart || []}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FFCC00" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#FFCC00" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis dataKey="name" stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis stroke="#666" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `Rp${val/1000}k`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', border: '0.5px solid #ffffff10', borderRadius: '12px' }}
                                itemStyle={{ color: '#FFCC00', fontWeight: 'bold', fontSize: '12px' }}
                            />
                            <Area type="monotone" dataKey="total" stroke="#FFCC00" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
