import { Package, Clock, CheckCircle2, Shield } from 'lucide-react';

export default function LogisticsOverview({ stats, user }) {
    const cards = [
        { label: 'Pesanan Masuk', value: stats?.total_in_delivery || 0, icon: Package, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { label: 'Siap Disortir', value: stats?.total_processing || 0, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
        { label: 'Selesai Terkirim', value: stats?.total_delivered || 0, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10' },
        { label: 'Reputasi Admin', value: (parseFloat(user?.rating) || 5.0).toFixed(1), icon: Shield, color: 'text-yellow-500', bg: 'bg-yellow-500/10', sub: `${user?.rating_count || 0} Ulasan Staff` },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {cards.map((s, i) => (
                <div key={i} className="bg-rc-card p-6 rounded-2xl border border-rc-main/10 flex items-center justify-between group hover:border-rc-logo/30 transition-all duration-300">
                    <div>
                        <p className="text-[10px] font-black text-rc-muted uppercase tracking-widest mb-1">{s.label}</p>
                        <p className="text-3xl font-black text-rc-main tracking-tighter">{s.value}</p>
                        {s.sub && <p className="text-[8px] font-bold text-rc-muted uppercase tracking-widest mt-1">{s.sub}</p>}
                    </div>
                    <div className={`p-4 rounded-2xl ${s.bg} group-hover:scale-110 transition-transform duration-500`}>
                        <s.icon className={`w-6 h-6 ${s.color}`} />
                    </div>
                </div>
            ))}
        </div>
    );
}
