import React from 'react';
import { CreditCard } from 'lucide-react';

export default function CourierSalary({ earnings, withdrawn }) {
    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-br from-green-500/10 to-transparent p-10 rounded-[3rem] border border-green-500/20">
                <h3 className="text-sm font-black uppercase text-green-500 mb-2 tracking-widest">Saldo Dompet Saya</h3>
                <p className="text-5xl font-black tracking-tighter text-rc-main"><span className="text-2xl font-normal text-rc-muted">Rp</span> {(earnings - withdrawn).toLocaleString()}</p>
                <div className="flex gap-4 mt-8">
                    <button className="bg-green-500 text-black px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-green-500/20"><CreditCard className="w-4 h-4" /> Tarik Dana</button>
                    <button className="bg-rc-bg border border-rc-main/10 text-rc-muted px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest">Riwayat</button>
                </div>
            </div>
        </div>
    );
}
