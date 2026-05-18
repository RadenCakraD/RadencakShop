import React from 'react';
import { MapPinned } from 'lucide-react';
import MitraReviewList from '../logistics/MitraReviewList';

export default function CourierAdminTabs({ activeTab, user }) {
    if (activeTab === 'aspirasi') {
        return <MitraReviewList />;
    }

    if (activeTab === 'address') {
        return (
            <div className="bg-rc-card p-10 rounded-[3rem] border border-rc-main/10">
                <h3 className="text-sm font-black uppercase text-rc-main mb-8 tracking-widest flex items-center gap-2"><MapPinned className="w-5 h-5 text-green-500" /> Alamat Cabang Operasional</h3>
                <div className="space-y-4">
                    <div className="p-6 bg-rc-bg border border-rc-main/10 rounded-2xl">
                        <p className="text-[11px] font-black uppercase text-rc-main">{user?.mitra_name || 'Radencak Hub Utama'}</p>
                        <p className="text-[9px] font-bold text-rc-muted uppercase mt-1">Alamat tidak dikonfigurasi. Silakan hubungi pusat.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (activeTab === 'profit') {
        return (
            <div className="space-y-8">
                <div className="bg-gradient-to-br from-green-500/10 to-transparent p-10 rounded-[3rem] border border-green-500/20">
                    <h3 className="text-sm font-black uppercase text-green-500 mb-2 tracking-widest">Laba Laporan Wilayah</h3>
                    <p className="text-5xl font-black tracking-tighter text-rc-main"><span className="text-2xl font-normal text-rc-muted">Rp</span> 0</p>
                    <p className="text-[10px] text-rc-muted mt-4 font-bold uppercase">Laba bersih setelah pembagian hasil kurir dan biaya operasional.</p>
                </div>
            </div>
        );
    }

    return null;
}
