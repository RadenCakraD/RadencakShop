import React from 'react';
import { Truck } from 'lucide-react';

export default function LogisticsAssign({ packages, couriers, selectedCouriers, setSelectedCouriers, handleAssign }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black uppercase text-rc-main tracking-[0.2em] flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    Sortir & Penugasan Kurir
                </h3>
            </div>

            <div className="bg-rc-card border border-rc-main/10 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead className="bg-rc-main/5 text-[9px] font-black uppercase text-rc-muted tracking-[0.2em]">
                        <tr>
                            <th className="px-8 py-5">Info Paket</th>
                            <th className="px-8 py-5">Tujuan Pengiriman</th>
                            <th className="px-8 py-5">Tugaskan Kurir</th>
                            <th className="px-8 py-5 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs font-bold text-rc-main">
                        {packages.at_warehouse?.length > 0 ? packages.at_warehouse.map(p => (
                            <tr key={p.id} className="border-t border-rc-main/5 hover:bg-rc-main/5 transition-colors">
                                <td className="px-8 py-6">
                                    <div className="font-mono text-teal-400 text-[11px] mb-1">#{p.order_number}</div>
                                    <div className="text-[9px] font-black text-rc-muted uppercase tracking-wider">{p.shipping_service}</div>
                                </td>
                                <td className="px-8 py-6 max-w-[200px]">
                                    <div className="truncate mb-1">{p.address_info}</div>
                                    <div className="text-[10px] font-bold text-rc-logo mb-1"><i className="fa-solid fa-map-pin mr-1"></i>Kec. {p.destination_district || '-'}</div>
                                    <div className="text-[9px] font-black text-rc-muted uppercase">{p.user?.name}</div>
                                </td>
                                <td className="px-8 py-6">
                                    <select
                                        className="bg-rc-bg border border-rc-main/10 p-2.5 rounded-xl text-[10px] font-bold text-rc-main outline-none focus:border-yellow-500 w-full max-w-[220px]"
                                        value={selectedCouriers[p.id] || ''}
                                        onChange={(e) => setSelectedCouriers({ ...selectedCouriers, [p.id]: e.target.value })}
                                    >
                                        <option value="">-- Pilih Kurir Pengantar --</option>
                                        {couriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button 
                                        onClick={() => handleAssign(p.id, selectedCouriers[p.id])}
                                        className="bg-yellow-500 text-black px-6 py-2.5 rounded-xl text-[9px] font-black uppercase hover:bg-yellow-400 shadow-lg shadow-yellow-500/10 transition-all flex items-center gap-2 ml-auto"
                                    >
                                        <Truck className="w-3.5 h-3.5" /> Kirim Paket
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="px-8 py-20 text-center text-rc-muted uppercase font-black opacity-30">Semua paket telah diproses.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
