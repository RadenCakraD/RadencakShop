import React, { useState } from 'react';
import { Package, Clock, Filter, Truck, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function LogisticsReceive({ packages, fetchLogisticsData }) {
    const [loading, setLoading] = useState(null);

    const handlePickup = async (id) => {
        setLoading(id);
        try {
            await axios.post(`/api/logistics/pickup-hub/${id}`);
            toast.success("Tugas penjemputan logistik diterima!");
            fetchLogisticsData();
        } catch (e) {
            toast.error(e.response?.data?.message || "Gagal mengambil tugas");
        } finally {
            setLoading(null);
        }
    };

    const handleReceiveAtHub = async (id) => {
        setLoading(id);
        try {
            await axios.post(`/api/logistics/receive-hub/${id}`);
            toast.success("Paket telah diterima di Hub Logistik!");
            fetchLogisticsData();
        } catch (e) {
            toast.error(e.response?.data?.message || "Gagal konfirmasi penerimaan");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-10">
            {/* Section 1: Ready to Pickup from Courier Hub */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black uppercase text-rc-main tracking-[0.2em] flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        Siap Dijemput dari Hub Kurir
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.ready_for_logistics?.length > 0 ? packages.ready_for_logistics.map(p => (
                        <div key={p.id} className="bg-rc-card border border-rc-main/10 rounded-2xl p-6 hover:border-yellow-500/30 transition-all duration-500 group shadow-lg">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">Waiting Pickup</p>
                                    <h4 className="font-bold text-rc-main text-sm">#{p.order_number || p.id}</h4>
                                </div>
                                <Truck className="w-5 h-5 text-rc-muted group-hover:text-yellow-500 transition-colors" />
                            </div>
                            <div className="space-y-3 mb-8">
                                <div className="text-[9px] font-bold text-rc-muted uppercase tracking-wider">Lokasi Penjemputan</div>
                                <div className="text-[10px] font-black text-rc-main uppercase flex items-center gap-2">
                                    <Package className="w-3 h-3 text-rc-logo" /> Kantor Cabang Lokal
                                </div>
                            </div>
                            <button 
                                onClick={() => handlePickup(p.id)} 
                                disabled={loading === p.id}
                                className="w-full bg-yellow-500 text-black font-black text-[10px] py-4 rounded-xl shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/30 transition-all uppercase tracking-widest disabled:opacity-50"
                            >
                                {loading === p.id ? 'Memproses...' : 'Ambil Tugas Jemput'}
                            </button>
                        </div>
                    )) : (
                        <div className="col-span-full py-12 bg-rc-bg/50 border border-dashed border-rc-main/10 rounded-3xl flex flex-col items-center justify-center">
                            <p className="text-[10px] font-black text-rc-muted uppercase tracking-[0.2em]">Belum ada paket yang siap dihub kurir</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Section 2: In Transit to Logistics Hub */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black uppercase text-rc-main tracking-[0.2em] flex items-center gap-3">
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                        Menuju Gudang Logistik
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.picking_up?.length > 0 ? packages.picking_up.map(p => (
                        <div key={p.id} className="bg-rc-card border border-rc-main/10 rounded-2xl p-6 hover:border-teal-500/30 transition-all duration-500 group shadow-lg">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest mb-1">In Transit</p>
                                    <h4 className="font-bold text-rc-main text-sm">#{p.order_number || p.id}</h4>
                                </div>
                                <Clock className="w-5 h-5 text-rc-muted group-hover:text-teal-500 transition-colors" />
                            </div>
                            <button 
                                onClick={() => handleReceiveAtHub(p.id)} 
                                disabled={loading === p.id}
                                className="w-full bg-teal-500 text-black font-black text-[10px] py-4 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/30 transition-all uppercase tracking-widest disabled:opacity-50"
                            >
                                {loading === p.id ? 'Memproses...' : 'Konfirmasi Tiba di Gudang'}
                            </button>
                        </div>
                    )) : (
                        <div className="col-span-full py-12 bg-rc-bg/50 border border-dashed border-rc-main/10 rounded-3xl flex flex-col items-center justify-center">
                            <p className="text-[10px] font-black text-rc-muted uppercase tracking-[0.2em]">Belum ada paket dalam perjalanan</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
