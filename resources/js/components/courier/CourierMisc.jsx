import React from 'react';
import { AlertTriangle, Headset, Users } from 'lucide-react';

export function CourierPenalties() {
    return (
        <div className="space-y-6">
            <div className="bg-rc-card p-10 rounded-[3rem] border border-rc-main/10 flex flex-col items-center text-center">
                <AlertTriangle className="w-12 h-12 text-red-500/50 mb-4" />
                <h3 className="text-sm font-black uppercase text-rc-main tracking-widest">Radar Penalti</h3>
                <p className="text-[10px] text-rc-muted font-bold uppercase mt-2">Tidak ada catatan pelanggaran terdeteksi.</p>
            </div>
        </div>
    );
}

export function CourierHelp() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-rc-card p-8 rounded-3xl border border-rc-main/10 hover:border-rc-logo/30 transition-all">
                    <Headset className="w-8 h-8 text-rc-logo mb-4" />
                    <h4 className="font-black uppercase text-sm mb-2">Pusat Bantuan</h4>
                    <p className="text-[10px] text-rc-muted font-bold uppercase mb-6">Hubungi operator untuk masalah operasional di lapangan.</p>
                    <button className="w-full bg-rc-bg border border-rc-main/10 py-4 rounded-xl text-[9px] font-black uppercase">Chat Operator</button>
                </div>
            </div>
        </div>
    );
}

export function CourierProfile({ user }) {
    return (
        <div className="bg-rc-card p-10 rounded-[3rem] border border-rc-main/10">
            <div className="flex flex-col items-center mb-10">
                <div className="w-24 h-24 rounded-[2rem] bg-rc-bg border border-rc-main/10 flex items-center justify-center text-rc-muted mb-4 overflow-hidden">
                    {user?.avatar ? <img src={user.avatar.startsWith('http') ? user.avatar : `/storage/${user.avatar}`} className="w-full h-full object-cover" alt="Profile" /> : <Users className="w-8 h-8" />}
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest text-rc-main">{user?.name}</h3>
                <p className="text-[10px] font-bold text-rc-muted uppercase">{user?.role?.replace('_', ' ')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-rc-muted tracking-widest">Email</label>
                    <div className="p-4 bg-rc-bg border border-rc-main/10 rounded-xl text-xs font-bold">{user?.email}</div>
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-rc-muted tracking-widest">Username</label>
                    <div className="p-4 bg-rc-bg border border-rc-main/10 rounded-xl text-xs font-bold">{user?.username}</div>
                </div>
            </div>
        </div>
    );
}

export function CourierSettings() {
    return (
        <div className="bg-rc-card p-10 rounded-[3rem] border border-rc-main/10">
            <h3 className="text-sm font-black uppercase text-green-500 mb-8 tracking-widest">Pengaturan Radar</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-6 bg-rc-bg border border-rc-main/10 rounded-2xl">
                    <div>
                        <p className="text-[11px] font-black uppercase text-rc-main">Notifikasi Misi Baru</p>
                        <p className="text-[9px] font-bold text-rc-muted uppercase">Dapatkan suara saat ada paket baru di pool.</p>
                    </div>
                    <div className="w-12 h-6 bg-green-500 rounded-full p-1 flex justify-end"><div className="w-4 h-4 bg-white rounded-full"></div></div>
                </div>
            </div>
        </div>
    );
}
