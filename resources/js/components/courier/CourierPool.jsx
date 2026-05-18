import React, { useState } from 'react';
import { Package, UserCheck, Clock, Truck, CheckCircle2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function CourierPool({ 
    isAdmin, availablePickups, incomingToHub, atHub, waitingLogistics, 
    handleTakeTask, staffs, handleAssignTask, fetchData 
}) {
    const [selectedStaffs, setSelectedStaffs] = useState({});
    const [loading, setLoading] = useState(null);

    const handleReceiveAtHub = async (id) => {
        setLoading(id);
        try {
            await axios.post(`/api/courier/receive-hub/${id}`);
            toast.success("Paket diterima di Hub!");
            fetchData();
        } catch (e) {
            toast.error(e.response?.data?.message || "Gagal konfirmasi");
        } finally {
            setLoading(null);
        }
    };

    const handleReadyLogistics = async (id) => {
        setLoading(id);
        try {
            await axios.post(`/api/courier/ready-logistics/${id}`);
            toast.success("Paket siap dijemput Logistik!");
            fetchData();
        } catch (e) {
            toast.error(e.response?.data?.message || "Gagal update status");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-12">
            {/* Pool: Available Pickups from Sellers */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black uppercase text-rc-main tracking-[0.2em] flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                        Antrian Penjemputan Toko
                    </h3>
                    <span className="text-[10px] font-black text-green-500 uppercase px-3 py-1 bg-green-500/10 rounded-full">{availablePickups.length} Paket</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availablePickups.map(p => (
                        <div key={p.id} className="bg-rc-card border border-rc-main/10 rounded-3xl p-6 hover:border-green-500/50 transition-all duration-500 relative group shadow-xl">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-rc-bg border border-rc-main/10 rounded-2xl text-rc-muted"><Package className="w-5 h-5" /></div>
                                {!isAdmin && (
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-rc-muted uppercase">Bonus Jemput</p>
                                        <p className="text-lg font-black text-green-500 tracking-tighter">Rp 2.000</p>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4 mb-8">
                                <div>
                                    <p className="text-[9px] font-black text-rc-muted uppercase mb-1">Toko</p>
                                    <p className="text-[11px] font-bold text-rc-main uppercase">{p.shop?.nama_toko}</p>
                                    <p className="text-[9px] text-rc-muted mt-0.5"><i className="fa-solid fa-map-pin text-rc-logo mr-1"></i>Kec. {p.origin_district || '-'}</p>
                                </div>
                            </div>

                            {!isAdmin ? (
                                <button onClick={() => handleTakeTask(p.id)} className="w-full bg-green-500 text-black font-black text-[10px] py-4 rounded-2xl uppercase tracking-widest shadow-xl shadow-green-500/10 hover:scale-105 transition-all">
                                    Ambil Tugas
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    <select 
                                        className="w-full bg-rc-bg border border-rc-main/10 rounded-xl px-4 py-3 text-[10px] font-black text-rc-main outline-none focus:border-green-500 transition-all"
                                        value={selectedStaffs[p.id] || ''}
                                        onChange={(e) => setSelectedStaffs({...selectedStaffs, [p.id]: e.target.value})}
                                    >
                                        <option value="">Pilih Kurir...</option>
                                        {staffs.filter(s => s.role === 'kurir').map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={() => handleAssignTask(p.id, selectedStaffs[p.id])}
                                        className="w-full bg-rc-main text-rc-bg py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-500 transition-all"
                                    >
                                        <UserCheck className="w-4 h-4" /> Tugaskan
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Sorting Hub: Incoming from Local Couriers */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black uppercase text-rc-main tracking-[0.2em] flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        Menuju Hub Kurir
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {incomingToHub.map(p => (
                        <div key={p.id} className="bg-rc-card border border-rc-main/10 rounded-3xl p-6 hover:border-blue-500/30 transition-all duration-500 shadow-lg">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-rc-bg border border-rc-main/10 rounded-2xl text-blue-500"><Truck className="w-5 h-5" /></div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-rc-muted uppercase tracking-widest leading-none">Kurir</p>
                                    <p className="text-[10px] font-bold text-rc-main mt-1 uppercase">{p.pickup_courier?.name}</p>
                                </div>
                            </div>
                            <h4 className="font-bold text-rc-main text-[11px] mb-6">#{p.order_number || p.id}</h4>
                            <button 
                                onClick={() => handleReceiveAtHub(p.id)}
                                disabled={loading === p.id}
                                className="w-full bg-blue-500 text-white font-black text-[10px] py-4 rounded-2xl uppercase tracking-widest disabled:opacity-50"
                            >
                                {loading === p.id ? 'Loading...' : 'Konfirmasi Tiba di Hub'}
                            </button>
                        </div>
                    ))}
                    {incomingToHub.length === 0 && <div className="col-span-full py-8 text-center text-rc-muted uppercase font-black text-[9px] border border-dashed border-rc-main/10 rounded-3xl opacity-30">Tidak ada kurir dalam perjalanan ke hub.</div>}
                </div>
            </div>

            {/* In Hub: Ready to Handoff to Logistics */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black uppercase text-rc-main tracking-[0.2em] flex items-center gap-3">
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                        Penyortiran Ke Logistik
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {atHub.map(p => (
                        <div key={p.id} className="bg-rc-card border border-rc-main/10 rounded-3xl p-6 hover:border-teal-500/30 transition-all duration-500 shadow-lg group">
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-3 bg-rc-bg border border-rc-main/10 rounded-2xl text-teal-500"><CheckCircle2 className="w-5 h-5" /></div>
                                <ArrowRight className="w-5 h-5 text-rc-muted group-hover:translate-x-2 transition-transform" />
                            </div>
                            <h4 className="font-bold text-rc-main text-[11px] mb-6">#{p.order_number || p.id}</h4>
                            <button 
                                onClick={() => handleReadyLogistics(p.id)}
                                disabled={loading === p.id}
                                className="w-full bg-rc-main text-rc-bg font-black text-[10px] py-4 rounded-2xl uppercase tracking-widest hover:bg-teal-500 hover:text-black transition-all"
                            >
                                {loading === p.id ? 'Loading...' : 'Siapkan Untuk Logistik'}
                            </button>
                        </div>
                    ))}
                    {atHub.length === 0 && <div className="col-span-full py-8 text-center text-rc-muted uppercase font-black text-[9px] border border-dashed border-rc-main/10 rounded-3xl opacity-30">Hub kurir kosong.</div>}
                </div>
            </div>
        </div>
    );
}
