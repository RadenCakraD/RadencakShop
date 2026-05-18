import React from 'react';
import { motion } from 'framer-motion';
import { Star, Shield, Users, TrendingUp } from 'lucide-react';

export default function CourierPerformance({ stats, user }) {
    const isAdmin = user?.role === 'admin_kurir' || user?.role === 'super_admin';
    
    const metrics = isAdmin ? [
        { label: 'Reputasi Mitra', value: (parseFloat(user?.rating) || 5) * 20, color: 'bg-yellow-500', icon: Shield, actualValue: (parseFloat(user?.rating) || 5).toFixed(1) },
        { label: 'Kepuasan Regional', value: 88, color: 'bg-teal-500', icon: Star, actualValue: '88%' },
        { label: 'Efisiensi Operasional', value: 94, color: 'bg-green-500', icon: TrendingUp, actualValue: '94%' },
        { label: 'Loyalitas Staff', value: Math.min((user?.rating_count || 0) * 10, 100), color: 'bg-blue-500', icon: Users, actualValue: user?.rating_count || 0 },
    ] : [
        { label: 'Rating Kepuasan', value: (stats?.rating || 0) * 20, color: 'bg-yellow-500', icon: Star, actualValue: (stats?.rating || 0).toFixed(1) },
        { label: 'Ketepatan Waktu', value: stats?.punctuality || 0, color: 'bg-green-500', icon: TrendingUp, actualValue: `${stats?.punctuality || 0}%` },
        { label: 'Penyelesaian Tugas', value: Math.min((stats?.completed || 0) * 5, 100), color: 'bg-blue-500', icon: Users, actualValue: stats?.completed || 0 },
        { label: 'Kesehatan Akun', value: 95, color: 'bg-teal-500', icon: Shield, actualValue: '95%' },
    ];

    return (
        <div className="space-y-10">
            <div className="bg-rc-card p-10 rounded-[3rem] border border-rc-main/10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[100px] rounded-full"></div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-black text-rc-main uppercase tracking-tighter mb-10 flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-green-500" />
                        Dashboard Kinerja {isAdmin ? 'Admin' : 'Personal'}
                    </h3>
                    
                    {isAdmin && (
                        <div className="mb-10 bg-rc-bg p-6 rounded-3xl border border-rc-main/5 flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                <Shield className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-rc-muted uppercase tracking-widest mb-1">Reputasi Management Anda</h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-3xl font-black text-rc-main tracking-tighter">{(parseFloat(user?.rating) || 5.0).toFixed(2)}</span>
                                    <div className="flex text-yellow-500 text-[10px]">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-3 h-3 ${i < Math.round(user?.rating || 5) ? 'fill-current' : 'opacity-20'}`} />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-bold text-rc-muted uppercase ml-2">({user?.rating_count || 0} Ulasan Staff)</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {metrics.map((m, i) => (
                            <div key={i} className="group">
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-[10px] font-black text-rc-muted uppercase tracking-widest flex items-center gap-2">
                                        <m.icon className="w-3 h-3" />
                                        {m.label}
                                    </span>
                                    <span className="text-xl font-black text-rc-main tracking-tighter">{m.actualValue}</span>
                                </div>
                                <div className="h-2.5 bg-rc-bg rounded-full overflow-hidden p-0.5 border border-rc-main/5">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${m.value}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className={`h-full ${m.color} rounded-full shadow-lg group-hover:brightness-110 transition-all`}
                                    ></motion.div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {isAdmin && (
                <div className="p-8 bg-blue-500/10 border border-blue-500/20 rounded-3xl">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest leading-relaxed text-center">
                        Rating management Anda dihitung berdasarkan penilaian anonim dari staff kurir Anda. Management yang baik meningkatkan loyalitas dan kinerja tim di lapangan.
                    </p>
                </div>
            )}
        </div>
    );
}
