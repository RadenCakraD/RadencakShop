import React, { useState } from 'react';
import { Search, UserCheck, Shield, Truck, Warehouse, UserPlus, ShieldCheck } from 'lucide-react';
import AddStaffModal from '../Modals/AddStaffModal';

export default function AdminStaffList({ usersList, fetchUsers, pageUsers, totalPagesUsers }) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const staffRoles = ['admin_staff', 'admin_logistik', 'sortir_logistik', 'logistik_internal', 'logistik_external', 'admin_kurir', 'sortir_kurir', 'kurir'];
    const staffUsers = usersList.filter(u => staffRoles.includes(u.role));

    const getRoleBadge = (role) => {
        switch(role) {
            case 'admin_staff': return <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1"><Shield className="w-3 h-3" /> Admin Staff</span>;
            case 'admin_logistik': return <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1"><Shield className="w-3 h-3" /> Admin Logistik</span>;
            case 'sortir_logistik': return <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1"><Warehouse className="w-3 h-3" /> Sortir Logistik</span>;
            case 'logistik_internal': return <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1"><Truck className="w-3 h-3" /> Dist. Internal</span>;
            case 'logistik_external': return <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1"><Truck className="w-3 h-3" /> Dist. Eksternal</span>;
            case 'admin_kurir': return <span className="bg-teal-500/20 text-teal-400 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1"><Shield className="w-3 h-3" /> Admin Kurir</span>;
            case 'sortir_kurir': return <span className="bg-teal-500/20 text-teal-400 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1"><Warehouse className="w-3 h-3" /> Sortir Kurir</span>;
            case 'kurir': return <span className="bg-teal-500/20 text-teal-400 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1"><Truck className="w-3 h-3" /> Kurir Lapangan</span>;
            case 'shop_staff': return <span className="bg-rc-logo/20 text-rc-logo px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1">Shop Staff</span>;
            default: return <span className="bg-rc-main/10 text-rc-muted px-3 py-1 rounded-full text-[9px] font-black uppercase">{role}</span>;
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await axios.post(`/api/user/staff/${id}/status`, { status });
            fetchUsers(pageUsers);
        } catch (e) {
            alert("Gagal mengupdate status");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-rc-card border border-rc-main/10 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-rc-main/5 flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-black uppercase text-rc-main tracking-widest flex items-center gap-3">
                            <UserCheck className="w-5 h-5 text-rc-logo" /> Daftar Karyawan & Staff Aktif
                        </h3>
                        <div className="text-[10px] font-bold text-rc-muted uppercase">{staffUsers.length} Personel Terdata</div>
                    </div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-rc-logo text-rc-bg px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rc-logo/20 hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" /> Rekrut Staff Baru
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-rc-bg text-[10px] uppercase text-rc-muted tracking-widest">
                            <tr>
                                <th className="p-6">Nama & Email</th>
                                <th className="p-6">Posisi / Departemen</th>
                                <th className="p-6">Wilayah</th>
                                <th className="p-6">Status</th>
                                <th className="p-6">Aksi</th>
                                <th className="p-6 text-right">Kontak</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs text-rc-main">
                            {staffUsers.length > 0 ? staffUsers.map((s, i) => (
                                <tr key={s.id} className={`${i % 2 === 0 ? 'bg-rc-card' : 'bg-rc-card/50'} border-b border-rc-main/5 hover:bg-rc-main/5 transition-colors`}>
                                    <td className="p-6">
                                        <div className="font-black uppercase tracking-tight">{s.name}</div>
                                        <div className="text-[10px] text-rc-muted font-medium">{s.email}</div>
                                    </td>
                                    <td className="p-6">{getRoleBadge(s.role)}</td>
                                    <td className="p-6 text-[10px] font-bold uppercase text-rc-muted">{s.region?.country || 'Global'}</td>
                                    <td className="p-6">
                                        <span className={`w-2 h-2 rounded-full inline-block mr-2 ${s.status === 'active' ? 'bg-green-500' : s.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                                        <span className="font-bold uppercase text-[10px]">{s.status}</span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex gap-2">
                                            {s.status === 'pending' && (
                                                <button onClick={() => handleUpdateStatus(s.id, 'active')} className="bg-green-500 text-white p-2 rounded-lg hover:scale-110 transition-all shadow-lg shadow-green-500/20">
                                                    <UserCheck className="w-3 h-3" />
                                                </button>
                                            )}
                                            {s.status === 'active' ? (
                                                <button onClick={() => handleUpdateStatus(s.id, 'rejected')} className="bg-red-500/10 text-red-500 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                                                    Nonaktifkan
                                                </button>
                                            ) : s.status === 'rejected' ? (
                                                <button onClick={() => handleUpdateStatus(s.id, 'active')} className="bg-rc-logo text-rc-bg p-2 rounded-lg hover:bg-yellow-400 transition-all font-black text-[9px] uppercase">
                                                    Aktifkan
                                                </button>
                                            ) : null}
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <a href={`https://wa.me/${s.no_hp}`} target="_blank" className="text-rc-logo hover:underline font-black">{s.no_hp || '-'}</a>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center text-rc-muted uppercase font-black text-xs tracking-widest opacity-30">
                                        Belum ada karyawan yang terdaftar di sistem.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddStaffModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onSuccess={() => fetchUsers(pageUsers)} 
                defaultRole="admin_staff"
            />
        </div>
    );
}
