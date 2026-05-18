import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCheck, UserX, Clock, MapPin, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminMitraRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/mitra/pending');
            setRequests(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        try {
            await axios.post(`/api/admin/mitra/${id}/status`, { status });
            toast.success(`Mitra berhasil ${status === 'active' ? 'disetujui' : 'ditolak'}`);
            fetchRequests();
        } catch (e) {
            toast.error("Gagal memproses permintaan");
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-rc-logo/20 border-t-rc-logo rounded-full animate-spin"></div>
            <p className="text-[10px] text-rc-muted font-black uppercase tracking-widest">Memuat Permintaan Mitra...</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-rc-card/50 rounded-[2.5rem] border border-rc-main/10">
                        <Clock className="w-12 h-12 text-rc-muted mx-auto mb-4 opacity-20" />
                        <h3 className="text-sm font-black text-rc-main uppercase tracking-widest">Tidak Ada Permintaan Pending</h3>
                        <p className="text-[10px] text-rc-muted uppercase tracking-widest mt-2">Semua pengajuan mitra telah diproses.</p>
                    </div>
                ) : (
                    requests.map((mitra) => (
                        <div key={mitra.id} className="bg-rc-card p-6 rounded-[2rem] border border-rc-main/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4">
                                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-[8px] font-black uppercase rounded-full border border-yellow-500/20">
                                    Pending
                                </span>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-rc-main/10 flex-shrink-0 bg-rc-bg flex items-center justify-center">
                                    <img 
                                        src={mitra.full_avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(mitra.username || mitra.name)}&background=27272a&color=FFCC00&bold=true`} 
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-black text-rc-main uppercase tracking-tight truncate">{mitra.mitra_name || mitra.name}</h4>
                                    <p className="text-[10px] text-rc-muted font-bold truncate">
                                        {mitra.email}
                                    </p>
                                    <div className="mt-1">
                                        <span className="text-[8px] bg-rc-logo/10 text-rc-logo border border-rc-logo/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                                            {{
                                                'admin_kurir': 'Calon Mitra Kurir',
                                                'admin_logistik': 'Calon Mitra Logistik',
                                                'shop_owner': 'Calon Pemilik Toko',
                                                'kurir_staff': 'Staff Kurir',
                                                'sortir_kurir': 'Sortir Kurir',
                                                'kurir': 'Kurir Lapangan',
                                                'logistik_staff': 'Staff Logistik',
                                                'sortir_logistik': 'Sortir Logistik',
                                                'logistik_internal': 'Dist. Internal',
                                                'logistik_external': 'Dist. Eksternal',
                                                'shop_staff': 'Staff Toko'
                                            }[mitra.pending_role || mitra.role] || (mitra.pending_role || mitra.role)?.replace('_', ' ')?.toUpperCase() || 'CALON MITRA'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-start gap-3 text-rc-muted">
                                    <MapPin className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-[10px] font-bold uppercase leading-tight">
                                        {(mitra.pending_role || mitra.role) === 'admin_logistik' ? (
                                            mitra.coverage_province ? `Prov. ${mitra.coverage_province}` : 'Seluruh Wilayah'
                                        ) : (
                                            mitra.coverage_province ? (
                                                `${mitra.coverage_district ? `Kec. ${mitra.coverage_district}, ` : ''}${mitra.coverage_regency ? `${mitra.coverage_regency}, ` : ''}Prov. ${mitra.coverage_province}`
                                            ) : 'Seluruh Wilayah'
                                        )}
                                        <span className="text-[8px] block text-rc-muted font-normal mt-0.5">
                                            Negara: {mitra.region?.country || 'Indonesia'}
                                        </span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-rc-muted">
                                    <Phone className="w-3.5 h-3.5 text-green-500" />
                                    <span className="text-[10px] font-bold">{mitra.no_hp}</span>
                                </div>
                                <div className="flex items-center gap-3 text-rc-muted">
                                    <Clock className="w-3.5 h-3.5 text-rc-muted" />
                                    <span className="text-[9px] font-bold uppercase">Mendaftar: {new Date(mitra.created_at).toLocaleDateString('id-ID')}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => handleAction(mitra.id, 'active')}
                                    className="flex-1 bg-rc-logo text-rc-bg px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-400 transition-all flex items-center justify-center gap-2"
                                >
                                    <UserCheck className="w-3.5 h-3.5" /> Setujui
                                </button>
                                <button 
                                    onClick={() => handleAction(mitra.id, 'rejected')}
                                    className="flex-1 bg-rc-main/5 border border-rc-main/10 text-red-500 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                                >
                                    <UserX className="w-3.5 h-3.5" /> Tolak
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function ShieldCheck(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}
