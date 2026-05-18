import React from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, User, Star } from 'lucide-react';

export default function LogisticsPerformance({ staffs = [] }) {
    // Filter active staffs and sort by rating/performance descending
    const activeStaffs = staffs
        .filter(s => s.status === 'active')
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));

    const getRoleLabel = (role) => {
        switch (role) {
            case 'sortir_logistik':
                return 'Staf Sortir Gudang';
            case 'logistik_internal':
                return 'Logistik Distribusi Internal';
            case 'logistik_external':
                return 'Logistik Distribusi Eksternal';
            default:
                return 'Staf Logistik';
        }
    };

    const metrics = [
        { label: 'Kecepatan Sortir', value: 92, color: 'bg-teal-500' },
        { label: 'Keakuratan Resi', value: 98, color: 'bg-blue-500' },
        { label: 'Keamanan Paket', value: 99, color: 'bg-green-500' },
        { label: 'Kepuasan Pelanggan', value: activeStaffs.length > 0 ? Math.round((activeStaffs.reduce((acc, c) => acc + (parseFloat(c.rating) || 0), 0) / activeStaffs.length) * 20) : 85, color: 'bg-yellow-500' },
    ];

    return (
        <div className="space-y-12">
            {/* Metrik Efisiensi Operasional */}
            <div className="bg-rc-card p-10 rounded-[3rem] border border-rc-main/10 relative overflow-hidden shadow-2xl animate-fade-in">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[100px] rounded-full"></div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-black text-rc-main uppercase tracking-tighter mb-10 flex items-center gap-4">
                        <TrendingUp className="w-8 h-8 text-teal-500" />
                        Metrik Efisiensi Operasional Gudang
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {metrics.map((m, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-[10px] font-black text-rc-muted uppercase tracking-widest">{m.label}</span>
                                    <span className="text-xl font-black text-rc-main tracking-tighter">{m.value}%</span>
                                </div>
                                <div className="h-2.5 bg-rc-bg rounded-full overflow-hidden p-0.5 border border-rc-main/5">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${m.value}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className={`h-full ${m.color} rounded-full shadow-lg`}
                                    ></motion.div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Logistics Staff Leaderboard */}
            <div className="bg-rc-card rounded-[3rem] border border-rc-main/10 p-10 shadow-2xl animate-fade-in">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-xl font-black text-rc-main uppercase tracking-tighter flex items-center gap-3">
                            <Award className="w-6 h-6 text-yellow-500" />
                            Peringkat Kinerja Staf Logistik
                        </h3>
                        <p className="text-[10px] font-bold text-rc-muted uppercase tracking-widest mt-1">Berdasarkan Efisiensi Kerja & Produktivitas Gudang</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {activeStaffs.length > 0 ? activeStaffs.map((c, i) => (
                        <div key={c.id} className="flex items-center justify-between p-5 bg-rc-bg/50 rounded-2xl border border-rc-main/5 hover:border-teal-500/30 transition-all group">
                            <div className="flex items-center gap-6">
                                <div className="w-8 text-xs font-black text-rc-muted italic">#0{i + 1}</div>
                                <div className="w-12 h-12 rounded-xl bg-rc-card border border-rc-main/10 flex items-center justify-center text-rc-muted overflow-hidden">
                                    {c.avatar ? <img src={c.avatar.startsWith('http') ? c.avatar : `/storage/${c.avatar}`} className="w-full h-full object-cover" /> : <User className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-rc-main uppercase">{c.name}</h4>
                                    <p className="text-[10px] text-rc-muted font-bold tracking-wider">{getRoleLabel(c.role)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <div className="flex items-center gap-1.5 text-yellow-500 mb-0.5">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="text-sm font-black tracking-tighter">{(parseFloat(c.rating) || 5.0).toFixed(1)}</span>
                                    </div>
                                    <p className="text-[8px] font-black text-rc-muted uppercase tracking-tighter">Nilai Efisiensi</p>
                                </div>
                                <div className={`w-2 h-12 rounded-full ${parseFloat(c.rating) >= 4.5 ? 'bg-green-500' : parseFloat(c.rating) >= 3.5 ? 'bg-yellow-500' : 'bg-red-500'} opacity-20 group-hover:opacity-100 transition-opacity`}></div>
                            </div>
                        </div>
                    )) : (
                        <div className="py-20 text-center">
                            <p className="text-[10px] font-black text-rc-muted uppercase tracking-widest">Belum ada data kinerja staf logistik tersedia</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
