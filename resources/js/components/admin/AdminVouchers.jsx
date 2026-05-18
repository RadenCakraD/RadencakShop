import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Ticket, Plus, Trash2, Search, Percent, CircleDollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminVouchers() {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newVoucher, setNewVoucher] = useState({
        code: '',
        discount_type: 'percent',
        discount_value: '',
        min_order: 0,
        max_discount: 0,
        quota: 10,
        expires_at: ''
    });

    useEffect(() => {
        fetchVouchers();
    }, []);

    const fetchVouchers = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/vouchers');
            setVouchers(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                nama_voucher: `Voucher Platform ${newVoucher.code}`,
                code: newVoucher.code,
                type: newVoucher.discount_type === 'percent' ? 'percentage' : 'fixed',
                value: newVoucher.discount_value,
                min_purchase: newVoucher.min_order,
                valid_until: newVoucher.expires_at,
                kuota: newVoucher.quota
            };
            await axios.post('/api/admin/vouchers', payload);
            toast.success("Voucher berhasil dibuat!");
            setIsAdding(false);
            setNewVoucher({ code: '', discount_type: 'percent', discount_value: '', min_order: 0, max_discount: 0, quota: 10, expires_at: '' });
            fetchVouchers();
        } catch (e) {
            toast.error(e.response?.data?.message || "Gagal membuat voucher");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Hapus voucher ini?")) return;
        try {
            await axios.delete(`/api/admin/vouchers/${id}`);
            toast.success("Voucher dihapus");
            fetchVouchers();
        } catch (e) {
            toast.error("Gagal menghapus");
        }
    };

    if (loading) return <div className="py-20 text-center animate-pulse">Memuat Voucher...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-black uppercase text-rc-muted tracking-[0.3em]">Promo & Voucher Platform</h3>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-rc-logo text-rc-bg px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-400 transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> {isAdding ? 'Batal' : 'Voucher Baru'}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleCreate} className="bg-rc-card p-8 rounded-[2rem] border border-rc-logo/30 grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-down">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-rc-muted">Kode Voucher</label>
                        <input required value={newVoucher.code} onChange={e => setNewVoucher({...newVoucher, code: e.target.value.toUpperCase()})} placeholder="PROMO123" className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-2xl text-xs font-bold text-rc-main outline-none focus:border-rc-logo" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-rc-muted">Tipe Diskon</label>
                        <select value={newVoucher.discount_type} onChange={e => setNewVoucher({...newVoucher, discount_type: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-2xl text-xs font-bold text-rc-main outline-none focus:border-rc-logo">
                            <option value="percent">Persentase (%)</option>
                            <option value="fixed">Nominal Tetap (Rp)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-rc-muted">Nilai Diskon</label>
                        <input type="number" required value={newVoucher.discount_value} onChange={e => setNewVoucher({...newVoucher, discount_value: e.target.value})} placeholder="10" className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-2xl text-xs font-bold text-rc-main outline-none focus:border-rc-logo" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-rc-muted">Min. Order (Rp)</label>
                        <input type="number" value={newVoucher.min_order} onChange={e => setNewVoucher({...newVoucher, min_order: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-2xl text-xs font-bold text-rc-main outline-none focus:border-rc-logo" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-rc-muted">Max. Potongan (Rp)</label>
                        <input type="number" value={newVoucher.max_discount} onChange={e => setNewVoucher({...newVoucher, max_discount: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-2xl text-xs font-bold text-rc-main outline-none focus:border-rc-logo" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-rc-muted">Kuota</label>
                        <input type="number" value={newVoucher.quota} onChange={e => setNewVoucher({...newVoucher, quota: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-2xl text-xs font-bold text-rc-main outline-none focus:border-rc-logo" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-rc-muted">Tgl. Kadaluarsa</label>
                        <input type="date" value={newVoucher.expires_at} onChange={e => setNewVoucher({...newVoucher, expires_at: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-2xl text-xs font-bold text-rc-main outline-none focus:border-rc-logo" />
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                        <button type="submit" className="bg-rc-logo text-rc-bg px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-yellow-400 transition-all">Simpan Voucher</button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vouchers.map(v => (
                    <div key={v.id} className="bg-rc-card p-6 rounded-[2rem] border border-rc-main/10 relative overflow-hidden group hover:border-rc-logo transition-all duration-500 shadow-xl">
                        <div className="absolute -right-8 -top-8 w-24 h-24 bg-rc-logo/5 rounded-full blur-2xl group-hover:bg-rc-logo/10 transition-colors"></div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-rc-main/5 rounded-2xl border border-rc-main/10 text-rc-logo group-hover:scale-110 transition-transform">
                                {v.type === 'percentage' ? <Percent className="w-6 h-6" /> : <CircleDollarSign className="w-6 h-6" />}
                            </div>
                            <button onClick={() => handleDelete(v.id)} className="text-rc-muted hover:text-red-500 transition-colors p-2"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <h4 className="text-xl font-black text-rc-main tracking-tighter mb-1">{v.code}</h4>
                        <p className="text-[10px] text-rc-muted uppercase font-black tracking-widest mb-4">
                            Diskon {v.type === 'percentage' ? `${v.value}%` : `Rp ${v.value?.toLocaleString()}`}
                        </p>
                        <div className="space-y-2 border-t border-rc-main/5 pt-4">
                            <div className="flex justify-between text-[10px] font-bold uppercase">
                                <span className="text-rc-muted">Min. Order</span>
                                <span className="text-rc-main">Rp {v.min_purchase?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold uppercase">
                                <span className="text-rc-muted">Kuota Sisa</span>
                                <span className="text-rc-main">{v.kuota} Pcs</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold uppercase">
                                <span className="text-rc-muted">Berakhir</span>
                                <span className="text-rc-main">{v.valid_until ? new Date(v.valid_until).toLocaleDateString('id-ID') : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
