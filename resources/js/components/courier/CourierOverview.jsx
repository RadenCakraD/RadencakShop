import React from 'react';
import { Wallet, Star, CheckCircle2 } from 'lucide-react';

export default function CourierOverview({ stats, earnings, withdrawn }) {
    const cards = [
        { label: 'Dompet Saya', value: `Rp ${(earnings - withdrawn).toLocaleString()}`, icon: Wallet, color: 'text-green-400', bg: 'bg-green-400/10' },
        { label: 'Rating Kinerja', value: (stats?.rating || 0).toFixed(1), icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
        { label: 'Penyelesaian', value: stats?.completed || 0, icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {cards.map((s, i) => (
                <div key={i} className="bg-rc-card p-6 rounded-2xl border border-rc-main/10 flex items-center justify-between group hover:border-rc-logo/30 transition-all duration-300">
                    <div>
                        <p className="text-[10px] font-black text-rc-muted uppercase tracking-widest mb-1">{s.label}</p>
                        <p className="text-3xl font-black text-rc-main tracking-tighter">{s.value}</p>
                    </div>
                    <div className={`p-4 rounded-2xl ${s.bg} group-hover:scale-110 transition-transform duration-500`}>
                        <s.icon className={`w-6 h-6 ${s.color}`} />
                    </div>
                </div>
            ))}
        </div>
    );
}
