import React from 'react';
import { QrCode } from 'lucide-react';

export default function CourierScan() {
    return (
        <div className="space-y-8">
            <div className="bg-rc-card p-12 rounded-[3rem] border border-rc-main/10 flex flex-col items-center text-center">
                <div className="w-32 h-32 bg-rc-bg border border-rc-main/10 rounded-[2.5rem] flex items-center justify-center text-green-500 mb-8 shadow-inner">
                    <QrCode className="w-16 h-16" />
                </div>
                <h3 className="text-xl font-black uppercase text-rc-main tracking-widest mb-4">Scan Barcode Paket</h3>
                <p className="text-xs text-rc-muted font-bold uppercase tracking-widest max-w-sm mb-10">Arahkan kamera ke resi paket untuk memproses status secara otomatis.</p>
                <button className="bg-green-500 text-black px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-green-500/20 hover:scale-105 transition-all">Aktifkan Kamera</button>
            </div>
        </div>
    );
}
