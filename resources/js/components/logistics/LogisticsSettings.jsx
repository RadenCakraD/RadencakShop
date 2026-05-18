import React from 'react';

export default function LogisticsSettings({ user }) {
    return (
        <div className="bg-rc-card p-10 rounded-[3rem] border border-rc-main/10">
            <h3 className="text-sm font-black uppercase text-teal-500 mb-8 tracking-[0.2em]">Konfigurasi Hub Operasional</h3>
            <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); alert("Fitur pembaruan segera hadir!"); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-rc-muted tracking-widest">Identitas Gudang</label>
                        <input defaultValue={user?.mitra_name} className="w-full bg-rc-bg border border-rc-main/10 p-5 rounded-2xl text-xs font-bold text-rc-main outline-none focus:border-teal-500 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-rc-muted tracking-widest">Kontak Darurat Hub</label>
                        <input defaultValue={user?.no_hp} className="w-full bg-rc-bg border border-rc-main/10 p-5 rounded-2xl text-xs font-bold text-rc-main outline-none focus:border-teal-500 transition-all" />
                    </div>
                </div>
                <button className="bg-teal-500 text-black px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-teal-500/20 hover:scale-105 transition-all">Simpan Konfigurasi</button>
            </form>
        </div>
    );
}
