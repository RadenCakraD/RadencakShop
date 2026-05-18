import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, CheckCircle2, XCircle, Clock, ArrowUpRight, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminWithdrawals() {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchWithdrawals(1);
    }, []);

    const fetchWithdrawals = async (p = 1) => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/admin/withdrawals?page=${p}`);
            setWithdrawals(res.data.data || res.data);
            setTotalPages(res.data.last_page || 1);
            setPage(p);
        } catch (e) {
            toast.error("Gagal mengambil data penarikan");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        try {
            await axios.post(`/api/admin/withdrawals/${id}/${action}`);
            toast.success(`Penarikan berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}`);
            fetchWithdrawals(page);
        } catch (e) {
            toast.error("Gagal memproses penarikan");
        }
    };

    if (loading && page === 1) return <div className="py-20 text-center animate-pulse text-rc-muted uppercase text-xs font-black tracking-widest">Sinkronisasi Keuangan...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-rc-card rounded-[2.5rem] border border-rc-main/10 overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-rc-bg border-b border-rc-main/10">
                            <th className="p-6 text-[10px] font-black uppercase text-rc-muted tracking-widest">Pengguna / Toko</th>
                            <th className="p-6 text-[10px] font-black uppercase text-rc-muted tracking-widest">Metode & Akun</th>
                            <th className="p-6 text-[10px] font-black uppercase text-rc-muted tracking-widest">Nominal</th>
                            <th className="p-6 text-[10px] font-black uppercase text-rc-muted tracking-widest">Status</th>
                            <th className="p-6 text-[10px] font-black uppercase text-rc-muted tracking-widest text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-rc-main/5">
                        {withdrawals.map(w => (
                            <tr key={w.id} className="hover:bg-rc-main/5 transition-colors">
                                <td className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-rc-logo/10 flex items-center justify-center text-rc-logo font-black text-xs">
                                            {w.user?.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-rc-main uppercase tracking-tight">{w.user?.name}</p>
                                            <p className="text-[10px] text-rc-muted font-bold">{w.shop?.nama_toko || 'Personal'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <p className="text-xs font-black text-rc-main uppercase">{w.bank_name}</p>
                                    <p className="text-[10px] text-rc-muted font-bold">{w.account_number} a/n {w.account_name}</p>
                                </td>
                                <td className="p-6">
                                    <p className="text-sm font-black text-rc-logo">Rp {w.amount?.toLocaleString()}</p>
                                    <p className="text-[9px] text-rc-muted font-bold uppercase">{new Date(w.created_at).toLocaleString('id-ID')}</p>
                                </td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${
                                        w.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                        w.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                        'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 animate-pulse'
                                    }`}>
                                        {w.status === 'pending' ? 'Menunggu' : w.status === 'completed' ? 'Selesai' : 'Ditolak'}
                                    </span>
                                </td>
                                <td className="p-6 text-right">
                                    {w.status === 'pending' && (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleAction(w.id, 'approve')} className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all shadow-lg" title="Setujui">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleAction(w.id, 'reject')} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-lg" title="Tolak">
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                    {w.status !== 'pending' && (
                                        <span className="text-rc-muted italic text-[9px] uppercase font-bold">Terselesaikan</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {withdrawals.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center opacity-50">
                        <Wallet className="w-12 h-12 text-rc-muted mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest text-rc-muted">Tidak ada riwayat penarikan.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => fetchWithdrawals(i + 1)}
                            className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${page === i + 1 ? 'bg-rc-logo text-rc-bg' : 'bg-rc-card text-rc-muted hover:bg-rc-main/5'}`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
