import React, { useState } from 'react';
import { Plus, Clock, Users, Warehouse, Truck, Banknote } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function LogisticsEmployees({ staffs, handleStaffStatus, setIsAddStaffModalOpen, fetchData }) {
    const [updatingSalary, setUpdatingSalary] = useState(null);

    const handleUpdateSalary = async (staffId, amount) => {
        setUpdatingSalary(staffId);
        try {
            await axios.post(`/api/logistics/staff/${staffId}/salary`, { salary_per_package: amount });
            toast.success("Gaji per paket diperbarui");
            if (fetchData) fetchData();
        } catch (e) {
            toast.error("Gagal memperbarui gaji");
        } finally {
            setUpdatingSalary(null);
        }
    };

    const getRoleLabel = (role) => {
        if (!role) return 'STAFF';
        const labels = {
            logistik_staff: 'Staff Gudang',
            sortir_logistik: 'Sortir Logistik',
            logistik_internal: 'Distribusi Internal',
            logistik_external: 'Distribusi Eksternal',
        };
        return labels[role] || role.replace('_', ' ').toUpperCase();
    };

    return (
        <div className="space-y-10">
            <div className="flex justify-between items-center bg-rc-card p-8 rounded-[2rem] border border-rc-main/10 relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                    <h3 className="text-xl font-black uppercase text-rc-main tracking-tighter">Database Karyawan</h3>
                    <p className="text-[10px] font-black text-rc-muted uppercase tracking-[0.2em] mt-1">Personel Operasional Gudang & Logistik</p>
                </div>
                <button 
                    onClick={() => setIsAddStaffModalOpen(true)}
                    className="bg-teal-500 text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-teal-500/20 hover:scale-105 transition-all flex items-center gap-2 relative z-10"
                >
                    <Plus className="w-4 h-4" /> Rekrut Staff Baru
                </button>
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl rounded-full"></div>
            </div>

            {/* Staff Sections */}
            <div className="space-y-8">
                {/* Pending */}
                {staffs.filter(s => s.status === 'pending').length > 0 && (
                    <div>
                        <h4 className="text-[10px] font-black text-rc-logo uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" /> Persetujuan Tertunda
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {staffs.filter(s => s.status === 'pending').map(s => (
                                <div key={s.id} className="bg-rc-card border border-rc-logo/30 p-6 rounded-[2rem] flex flex-col items-center text-center">
                                    <div className="w-20 h-20 rounded-3xl bg-rc-bg border border-rc-logo/20 flex items-center justify-center text-rc-logo mb-4 text-3xl shadow-inner">
                                        <Plus />
                                    </div>
                                    <h4 className="font-black text-rc-main uppercase text-sm mb-1">{s.name}</h4>
                                    <p className="text-[10px] text-rc-muted font-bold mb-2">{s.email}</p>
                                    <span className="text-[9px] font-black text-rc-logo uppercase mb-6 tracking-widest">{getRoleLabel(s.role)}</span>
                                    <div className="flex gap-2 w-full mt-auto">
                                        <button onClick={() => handleStaffStatus(s.id, 'active')} className="flex-1 bg-rc-logo text-rc-bg text-[10px] font-black py-3 rounded-xl uppercase tracking-widest hover:scale-105 transition-all">Terima</button>
                                        <button onClick={() => handleStaffStatus(s.id, 'rejected')} className="flex-1 bg-rc-bg border border-red-500/30 text-red-500 text-[10px] font-black py-3 rounded-xl uppercase tracking-widest hover:bg-red-500/10 transition-all">Tolak</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Active */}
                <div>
                    <h4 className="text-[10px] font-black text-rc-muted uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" /> Personel Aktif
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {staffs.filter(s => s.status === 'active').map(s => (
                            <div key={s.id} className="bg-rc-card border border-rc-main/10 p-8 rounded-[2.5rem] flex flex-col group hover:border-teal-500/30 transition-all duration-500 shadow-lg">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-rc-bg border border-rc-main/10 flex items-center justify-center text-rc-muted group-hover:scale-110 group-hover:bg-teal-500/10 group-hover:text-teal-500 transition-all duration-500">
                                            {s.role?.includes('internal') || s.role?.includes('external') ? <Truck className="w-6 h-6" /> : <Warehouse className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-rc-main uppercase text-[12px] tracking-tight">{s.name}</h4>
                                            <p className="text-[9px] text-rc-muted font-bold uppercase">{s.role?.replace('_', ' ') || 'STAFF'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleStaffStatus(s.id, 'rejected')} className="text-[9px] font-black text-red-500/30 hover:text-red-500 uppercase tracking-widest transition-colors">Nonaktif</button>
                                </div>

                                <div className="p-4 bg-rc-bg/50 rounded-2xl border border-rc-main/5">
                                    <label className="text-[8px] font-black text-rc-muted uppercase tracking-widest mb-2 block flex items-center gap-1">
                                        <Banknote className="w-3 h-3 text-teal-500" /> Gaji Per Paket (IDR)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            defaultValue={s.salary_per_package} 
                                            onBlur={(e) => handleUpdateSalary(s.id, e.target.value)}
                                            disabled={updatingSalary === s.id}
                                            className="bg-transparent border-none outline-none text-rc-main font-black text-lg w-full"
                                            placeholder="Cth: 2000"
                                        />
                                        {updatingSalary === s.id && <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rejected / Inactive */}
                {staffs.filter(s => s.status === 'rejected').length > 0 && (
                    <div>
                        <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                            <Plus className="w-3.5 h-3.5 rotate-45" /> Personel Nonaktif
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {staffs.filter(s => s.status === 'rejected').map(s => (
                                <div key={s.id} className="bg-rc-card/50 border border-red-500/10 p-6 rounded-[2rem] flex flex-col items-center text-center opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                                    <div className="w-16 h-16 rounded-full bg-rc-bg border border-rc-main/10 flex items-center justify-center text-rc-muted mb-4">
                                        <Warehouse className="w-6 h-6" />
                                    </div>
                                    <h4 className="font-black text-rc-main uppercase text-[11px] mb-1">{s.name}</h4>
                                    <p className="text-[9px] text-rc-muted font-bold mb-2">{s.email}</p>
                                    <p className="text-[8px] text-rc-muted uppercase mb-4">{getRoleLabel(s.role)}</p>
                                    <button onClick={() => handleStaffStatus(s.id, 'active')} className="bg-rc-logo text-rc-bg text-[9px] font-black py-2 px-6 rounded-xl uppercase tracking-widest hover:scale-105 transition-all">Aktifkan</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
