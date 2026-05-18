import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, Warehouse, ShieldCheck, Trash2, Ban, CheckCircle2, Search, MapPin, Phone, User, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPartners({ roleFilter }) {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchPartners(1);
    }, [roleFilter, search]);

    const fetchPartners = async (p = 1) => {
        setLoading(true);
        try {
            const role = roleFilter === 'couriers' ? 'courier' : 'logistics';
            const res = await axios.get(`/api/admin/users?role=${role}&q=${search}&page=${p}`);
            setPartners(res.data.data || res.data);
            setTotalPages(res.data.last_page || 1);
            setPage(p);
        } catch (e) {
            toast.error("Gagal mengambil data mitra");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        const action = status === 'active' ? 'mengaktifkan' : 'menonaktifkan';
        if (!confirm(`Yakin ingin ${action} mitra ini?`)) return;
        try {
            await axios.post(`/api/user/${id}/status`, { status });
            toast.success(`Mitra berhasil di${status === 'active' ? 'aktifkan' : 'nonaktifkan'}`);
            fetchPartners(page);
        } catch (e) {
            toast.error("Gagal mengubah status mitra");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Peringatan: Menghapus mitra akan menghapus seluruh data operasional mereka! Lanjutkan?")) return;
        try {
            await axios.delete(`/api/admin/users/${id}`);
            toast.success("Mitra dihapus permanen");
            fetchPartners(page);
        } catch (e) {
            toast.error("Gagal menghapus mitra");
        }
    };

    if (loading && page === 1) return <div className="py-20 text-center animate-pulse text-rc-muted uppercase text-xs font-black tracking-widest">Sinkronisasi Data Mitra...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${roleFilter === 'couriers' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                        {roleFilter === 'couriers' ? <Truck className="w-6 h-6" /> : <Warehouse className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-rc-main uppercase tracking-tighter">
                            Daftar Mitra {roleFilter === 'couriers' ? 'Kurir' : 'Logistik'}
                        </h3>
                        <p className="text-[10px] text-rc-muted font-bold uppercase tracking-widest">Kelola status dan operasional mitra terdaftar.</p>
                    </div>
                </div>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rc-muted" />
                    <input 
                        type="text" 
                        placeholder="Cari nama, email, atau username..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-rc-card border border-rc-main/10 p-4 pl-12 rounded-2xl text-xs font-bold text-rc-main outline-none focus:border-rc-logo transition-all"
                    />
                </div>
            </div>

            {/* Partners Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {partners.map(p => (
                    <div key={p.id} className="bg-rc-card p-6 rounded-[2.5rem] border border-rc-main/10 relative overflow-hidden group hover:border-rc-logo/30 transition-all duration-500 shadow-2xl">
                        <div className="absolute top-0 right-0 p-6">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${
                                p.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                p.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                'bg-red-500/10 text-red-500 border-red-500/20'
                            }`}>
                                {p.status === 'active' ? 'Aktif' : p.status === 'pending' ? 'Menunggu' : 'Non-Aktif'}
                            </span>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-rc-main/5 flex items-center justify-center text-rc-logo border border-rc-main/10 shadow-inner">
                                <User className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-rc-main uppercase tracking-tight">{p.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="flex text-yellow-500">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-2.5 h-2.5 ${i < Math.round(p.rating || 5) ? 'fill-current' : 'opacity-20'}`} />
                                        ))}
                                    </div>
                                    <span className="text-[9px] font-black text-rc-main">{(parseFloat(p.rating) || 5.0).toFixed(1)}</span>
                                    <span className="text-[8px] font-bold text-rc-muted uppercase">({p.rating_count || 0} ulasan)</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-start gap-3 text-rc-muted">
                                <MapPin className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                                <span className="text-[10px] font-bold uppercase leading-tight">
                                    {p.role === 'admin_logistik' ? (
                                        p.coverage_province ? `Prov. ${p.coverage_province}` : 'Seluruh Wilayah'
                                    ) : (
                                        p.coverage_province ? (
                                            `${p.coverage_district ? `Kec. ${p.coverage_district}, ` : ''}${p.coverage_regency ? `${p.coverage_regency}, ` : ''}Prov. ${p.coverage_province}`
                                        ) : 'Seluruh Wilayah'
                                    )}
                                    <span className="text-[8px] block text-rc-muted font-normal mt-0.5">
                                        Negara: {p.region?.country || 'Indonesia'}
                                    </span>
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-rc-muted">
                                <Phone className="w-3.5 h-3.5 text-green-500" />
                                <span className="text-[10px] font-bold">{p.no_hp}</span>
                            </div>
                            <div className="flex items-center gap-3 text-rc-muted">
                                <ShieldCheck className="w-3.5 h-3.5 text-rc-logo" />
                                <span className="text-[9px] font-bold uppercase">Terdaftar: {new Date(p.created_at).toLocaleDateString('id-ID')}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {p.status === 'active' ? (
                                <button 
                                    onClick={() => handleUpdateStatus(p.id, 'inactive')}
                                    className="flex-1 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <Ban className="w-3.5 h-3.5" /> Berhentikan
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleUpdateStatus(p.id, 'active')}
                                    className="flex-1 bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Aktifkan
                                </button>
                            )}
                            <button 
                                onClick={() => handleDelete(p.id)}
                                className="p-3 bg-rc-main/5 border border-rc-main/10 text-rc-muted hover:text-red-500 hover:border-red-500/50 rounded-xl transition-all"
                                title="Hapus Permanen"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {partners.length === 0 && (
                <div className="py-32 text-center flex flex-col items-center opacity-30">
                    <ShieldCheck className="w-16 h-16 text-rc-muted mb-4" />
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-rc-muted">Belum ada mitra terdaftar di kategori ini.</p>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-8">
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => fetchPartners(i + 1)}
                            className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${page === i + 1 ? 'bg-rc-logo text-rc-bg shadow-lg' : 'bg-rc-card text-rc-muted hover:bg-rc-main/5'}`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
