import React from 'react';
import { Wallet } from 'lucide-react';

export default function LogisticsSalary() {
    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-br from-teal-500/10 to-transparent p-10 rounded-[3rem] border border-teal-500/20">
                <h3 className="text-sm font-black uppercase text-teal-500 mb-2 tracking-widest">Saldo Pendapatan Staff</h3>
                <p className="text-5xl font-black tracking-tighter text-rc-main"><span className="text-2xl font-normal text-rc-muted">Rp</span> 0</p>
                <p className="text-[10px] text-rc-muted mt-4 font-bold uppercase">Berdasarkan jumlah paket yang berhasil diproses di hub ini.</p>
            </div>
            
            <div className="bg-rc-card p-10 rounded-[3rem] border border-rc-main/10">
                <h4 className="text-xs font-black uppercase tracking-widest text-rc-muted mb-8 flex items-center gap-3"><Wallet className="w-4 h-4" /> Pengajuan Penarikan</h4>
                <div className="py-20 text-center border border-dashed border-rc-main/10 rounded-2xl">
                    <p className="text-[10px] font-black text-rc-muted uppercase tracking-widest">Sistem pembayaran otomatis sedang dalam sinkronisasi bank.</p>
                </div>
            </div>
        </div>
    );
}
