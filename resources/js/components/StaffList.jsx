import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function StaffList({ parentId }) {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/user/staff');
            setStaff(res.data);
        } catch (e) {
            console.error("Gagal memuat staff:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleDeactivate = async (id, name) => {
        if (!window.confirm(`Apakah Anda yakin ingin menonaktifkan ${name}?`)) return;
        try {
            await axios.post(`/api/user/staff/${id}/status`, { status: 'rejected' });
            toast.success("Staff dinonaktifkan");
            fetchStaff();
        } catch (e) {
            toast.error("Gagal menonaktifkan staff");
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            const res = await axios.post(`/api/user/staff/${id}/status`, { status });
            toast.success(res.data.message);
            fetchStaff();
        } catch (e) {
            toast.error("Gagal mengupdate status");
        }
    };

    if (loading) return <div className="text-center py-4 text-rc-muted animate-pulse font-bold uppercase text-[10px]">Memuat daftar staff...</div>;

    return (
        <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase text-rc-main flex items-center gap-2">
                <i className="fa-solid fa-users text-rc-logo"></i> Daftar Staff Aktif
            </h4>
            {staff.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-rc-main/10 rounded-xl text-rc-muted text-xs font-bold uppercase">
                    Belum ada staff yang terdaftar.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {staff.map(s => (
                        <div key={s.id} className="p-4 bg-rc-bg/50 border-[0.5px] border-rc-main/10 rounded-xl flex items-center justify-between group hover:border-rc-logo/30 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden border-[0.5px] border-rc-main/10 bg-rc-card">
                                    <img src={s.full_avatar_url} className="w-full h-full object-cover" alt={s.name} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-rc-main uppercase">{s.name}</div>
                                    <div className="text-[9px] text-rc-muted uppercase font-black tracking-widest">{s.role?.replace('_', ' ') || 'STAFF'} • {s.status}</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {s.status === 'pending' && (
                                    <>
                                        <button onClick={() => handleUpdateStatus(s.id, 'active')} className="p-2 bg-green-600/10 text-green-500 rounded-lg hover:bg-green-600 hover:text-white transition-all text-[10px]" title="Terima Staff">
                                            <i className="fa-solid fa-check"></i>
                                        </button>
                                        <button onClick={() => handleUpdateStatus(s.id, 'rejected')} className="p-2 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all text-[10px]" title="Tolak Staff">
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    </>
                                )}
                                <button onClick={() => handleDeactivate(s.id, s.name)} className="p-2 bg-rc-main/5 text-rc-muted rounded-lg hover:bg-red-600 hover:text-white transition-all text-[10px]" title="Nonaktifkan Staff">
                                    <i className="fa-solid fa-user-minus"></i>
                                </button>
                                {s.status === 'rejected' && (
                                    <button onClick={() => handleUpdateStatus(s.id, 'active')} className="p-2 bg-rc-logo text-rc-bg rounded-lg hover:bg-yellow-400 transition-all text-[10px]" title="Aktifkan Kembali">
                                        <i className="fa-solid fa-user-check"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
