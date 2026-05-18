import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function LogisticsRadar({ packages }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black uppercase text-rc-main tracking-[0.2em] flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                    Feed Radar Logistik Wilayah
                </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.radar?.length > 0 ? packages.radar.map((pkg, i) => (
                    <div key={i} className="bg-rc-card border border-rc-main/10 rounded-2xl p-6 relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-[10px] font-black text-rc-muted uppercase mb-1 tracking-widest">Resi: #{pkg.order_number}</p>
                                <h4 className="font-bold text-rc-main text-sm uppercase">{pkg.user?.name}</h4>
                            </div>
                            <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${pkg.status === 'delivering' ? 'bg-blue-500/10 text-blue-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                {pkg.status.replace('_', ' ')}
                            </span>
                        </div>
                        <div className="space-y-3 text-[10px] font-bold text-rc-muted mb-6">
                            <div className="flex items-start gap-2">
                                <div className="w-1 h-1 bg-rc-muted/30 rounded-full mt-1.5 shrink-0"></div> 
                                <div>
                                    <span className="uppercase block text-[9px] text-rc-main/50 mb-0.5">Asal: {pkg.shop?.nama_toko}</span>
                                    <span className="text-yellow-500">Kec. {pkg.origin_district || '-'}, Prov. {pkg.origin_province || '-'}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-1 h-1 bg-rc-muted/30 rounded-full mt-1.5 shrink-0"></div> 
                                <div>
                                    <span className="uppercase block text-[9px] text-rc-main/50 mb-0.5">Tujuan: {pkg.address_info}</span>
                                    <span className="text-blue-500">Kec. {pkg.destination_district || '-'}, Prov. {pkg.destination_province || '-'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-rc-main/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-rc-bg border border-rc-main/10 rounded-lg flex items-center justify-center text-[10px] font-black">
                                    {pkg.delivery_courier?.name?.charAt(0) || '?'}
                                </div>
                                <p className="text-[9px] font-black text-rc-main uppercase">{pkg.delivery_courier?.name || 'TBA'}</p>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-rc-muted group-hover:text-rc-logo transition-colors" />
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-32 text-center text-rc-muted uppercase font-black tracking-[0.3em] opacity-30">Radar Bersih (Tidak Ada Aktivitas)</div>
                )}
            </div>
        </div>
    );
}
