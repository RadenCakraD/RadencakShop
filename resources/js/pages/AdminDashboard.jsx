import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('banners');
    
    // Data State
    const [banners, setBanners] = useState([]);
    const [products, setProducts] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Search States
    const [searchFlashSale, setSearchFlashSale] = useState('');
    const [searchUsers, setSearchUsers] = useState('');
    const [searchVouchers, setSearchVouchers] = useState('');

    const [newBanner, setNewBanner] = useState({ title: '', description: '', link_url: '', image: null });
    const [editBannerId, setEditBannerId] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    // Voucher Form
    const [newVoucher, setNewVoucher] = useState({ nama_voucher: '', code: '', type: 'fixed', value: '', min_purchase: '', valid_until: '', kuota: '' });
    const [uploadingVoucher, setUploadingVoucher] = useState(false);
    
    // Drag & Drop State
    const [draggedIdx, setDraggedIdx] = useState(null);

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        try {
            const res = await axios.get('/api/user');
            const r = res.data.role;
            if (r !== 'super_admin' && r !== 'admin_staff' && r !== 'admin') {
                navigate('/dashboard', { replace: true });
                return;
            }
            setUser(res.data);
            fetchData();
        } catch (e) {
            navigate('/login');
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const results = await Promise.allSettled([
                axios.get('/api/admin/banners'),
                axios.get(`/api/admin/products?q=${searchFlashSale}`),
                axios.get(`/api/admin/users?q=${searchUsers}`),
                axios.get(`/api/vouchers?q=${searchVouchers}`),
                axios.get('/api/admin/withdrawals')
            ]);
            
            if (results[0].status === 'fulfilled') setBanners(results[0].value.data);
            if (results[1].status === 'fulfilled') setProducts(results[1].value.data);
            if (results[2].status === 'fulfilled') setUsersList(results[2].value.data);
            if (results[3].status === 'fulfilled') setVouchers(results[3].value.data);
            if (results[4].status === 'fulfilled') setWithdrawals(results[4].value.data);
            
        } catch (e) {
            console.error("Gagal load data admin", e);
        } finally {
            setLoading(false);
        }
    };

    // Refetch when search changes (debounce simulated by manual enter or simple timeout could be used, here we fetch on blur/enter or direct)
    useEffect(() => {
        if(user) fetchData();
    }, [searchFlashSale, searchUsers, searchVouchers]);


    const handleBannerFile = (e) => setNewBanner({ ...newBanner, image: e.target.files[0] });

    const handleUploadBanner = async (e) => {
        e.preventDefault();
        if (!editBannerId && !newBanner.image) return alert("Pilih gambar dahulu!");
        setUploading(true);
        const data = new FormData();
        if (newBanner.image instanceof File) {
            data.append('image', newBanner.image);
        }
        if (newBanner.title) data.append('title', newBanner.title);
        if (newBanner.description) data.append('description', newBanner.description);
        if (newBanner.link_url) data.append('link_url', newBanner.link_url);

        try {
            if (editBannerId) {
                await axios.post(`/api/admin/banners/${editBannerId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await axios.post('/api/admin/banners', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            setNewBanner({ title: '', description: '', link_url: '', image: null });
            setEditBannerId(null);
            fetchData();
        } catch (e) {
            alert("Gagal memproses banner");
        } finally {
            setUploading(false);
        }
    };

    const handleEditBanner = (b) => {
        setEditBannerId(b.id);
        setNewBanner({
            title: b.title || '',
            description: b.description || '',
            link_url: b.link_url || '',
            image: null
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditBannerId(null);
        setNewBanner({ title: '', description: '', link_url: '', image: null });
    };

    const handleDeleteBanner = async (id) => {
        if (!window.confirm("Hapus banner ini?")) return;
        try {
            await axios.delete(`/api/admin/banners/${id}`);
            fetchData();
        } catch (e) {
            alert("Gagal menghapus banner");
        }
    };

    // Drag and Drop Logic
    const handleDragStart = (e, index) => {
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragEnter = (e, index) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === index) return;
        
        const newBanners = [...banners];
        const draggedItem = newBanners[draggedIdx];
        newBanners.splice(draggedIdx, 1);
        newBanners.splice(index, 0, draggedItem);
        
        setDraggedIdx(index);
        setBanners(newBanners);
    };

    const handleDragEnd = async () => {
        setDraggedIdx(null);
        
        const ordered_ids = banners.map(b => b.id);
        try {
            await axios.post('/admin/banners/reorder', { ordered_ids }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
        } catch (e) {
            console.error("Gagal menyimpan reorder", e);
        }
    };

    const toggleFlashSale = async (id) => {
        try {
            await axios.post(`/api/admin/products/${id}/flash-sale`);
            fetchData();
        } catch (e) {
            alert("Gagal mengubah status flash sale");
        }
    };

    const changeUserRole = async (id, newRole) => {
        if (!window.confirm(`Ubah role menjadi ${newRole}?`)) return;
        try {
            await axios.put(`/api/admin/users/${id}/role`, { role: newRole });
            fetchData();
        } catch (e) {
            alert(e.response?.data?.message || "Gagal mengubah role");
        }
    };

    const handleApproveWithdrawal = async (id) => {
        if (!window.confirm("Approve pencairan dana ini?")) return;
        try {
            await axios.post(`/api/admin/withdrawals/${id}/approve`);
            fetchData();
        } catch (e) {
            alert(e.response?.data?.message || "Gagal menyetujui");
        }
    };

    const handleRejectWithdrawal = async (id) => {
        if (!window.confirm("Tolak pencairan dana ini? Saldo akan dikembalikan ke pending/batal.")) return;
        try {
            await axios.post(`/api/admin/withdrawals/${id}/reject`);
            fetchData();
        } catch (e) {
            alert(e.response?.data?.message || "Gagal menolak");
        }
    };

    const handleCreateVoucher = async (e) => {
        e.preventDefault();
        setUploadingVoucher(true);
        try {
            await axios.post('/api/vouchers', newVoucher, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } });
            setNewVoucher({ nama_voucher: '', code: '', type: 'fixed', value: '', min_purchase: '', valid_until: '', kuota: '' });
            fetchData();
            alert("Voucher berhasil dibuat!");
        } catch (e) {
            alert(e.response?.data?.message || "Gagal membuat voucher");
        } finally {
            setUploadingVoucher(false);
        }
    };

    const handleDeleteVoucher = async (id) => {
        if (!window.confirm("Hapus voucher ini?")) return;
        try {
            await axios.delete(`/api/vouchers/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } });
            fetchData();
        } catch (e) {
            alert("Gagal menghapus voucher");
        }
    };

    if (loading && !banners.length && !vouchers.length) return <div className="text-center p-20 text-rc-muted animate-pulse font-bold tracking-widest uppercase">Memuat Portal Super Admin...</div>;

    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);

    return (
        <div className="bg-[#0b0c10] min-h-screen font-sans text-rc-main pb-32 selection:bg-blue-500/30">
            {/* Header Glassmorphism */}
            <header className="sticky top-0 z-40 backdrop-blur-2xl bg-[#0b0c10]/80 border-b border-white/5 shadow-lg shadow-black/20">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-3 md:gap-4 text-center md:text-left">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <i className="fa-solid fa-shield-halved text-lg md:text-xl"></i>
                        </div>
                        <h1 className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 uppercase tracking-wide md:tracking-widest flex items-center gap-2">
                            PORTAL ADMIN <span className="text-[8px] md:text-[10px] bg-white/10 text-white px-2 py-0.5 rounded">SUPREME</span>
                        </h1>
                    </div>
                    <Link to="/dashboard" className="w-full md:w-auto text-center justify-center group flex items-center gap-2 text-[10px] md:text-xs font-bold text-rc-main bg-white/5 border border-white/10 px-5 py-2.5 rounded-xl hover:bg-white/10 transition-all duration-300 uppercase tracking-widest">
                        <i className="fa-solid fa-arrow-left-long group-hover:-translate-x-1 transition-transform"></i> KEMBALI
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 mt-10">
                {/* Modern Pill Tabs */}
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 mb-10 overflow-x-auto no-scrollbar shadow-inner relative">
                    {[
                        { id: 'withdrawals', label: 'Keuangan', icon: 'fa-wallet' },
                        { id: 'banners', label: 'Banners', icon: 'fa-images' },
                        { id: 'flashsale', label: 'Flash Sale', icon: 'fa-bolt' },
                        { id: 'users', label: 'Pengguna', icon: 'fa-users' },
                        { id: 'vouchers', label: 'Vouchers', icon: 'fa-ticket-simple' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 flex-1 justify-center ${activeTab === tab.id ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25' : 'text-rc-muted hover:text-white hover:bg-white/5'}`}
                        >
                            <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab: Penarikan Saldo (Keuangan) */}
                {activeTab === 'withdrawals' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/20 p-6 rounded-2xl flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Pusat Lalu Lintas Keuangan</h2>
                                <p className="text-xs text-rc-muted mt-1">Otoritas tertinggi. Verifikasi mutasi logistik dan profit toko di satu tempat.</p>
                            </div>
                            <div className="bg-blue-500/10 w-16 h-16 rounded-2xl border border-blue-500/20 flex items-center justify-center text-blue-400 text-2xl shadow-[0_0_20px_rgba(59,130,246,0.15)]"><i className="fa-solid fa-vault"></i></div>
                        </div>

                        {withdrawals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/[0.02] border border-white/5 rounded-3xl text-center">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-rc-muted/50 mb-4 text-3xl"><i className="fa-regular fa-folder-open"></i></div>
                                <h3 className="text-rc-muted font-bold tracking-widest uppercase mb-1">Brankas Terkunci</h3>
                                <p className="text-xs text-rc-muted/50">Tidak ada pengajuan pencairan dana saat ini.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {withdrawals.map(w => (
                                    <div key={w.id} className="group bg-white/[0.02] border border-white/[0.05] hover:border-blue-500/40 hover:bg-white/[0.04] rounded-3xl p-6 shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
                                        <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest bg-gradient-to-r shadow-lg backdrop-blur-md z-10 
                                            ${w.status === 'pending' ? 'from-yellow-500 to-amber-500 text-black shadow-yellow-500/20' : 
                                              w.status === 'completed' ? 'from-emerald-500 to-teal-500 text-white shadow-emerald-500/20' : 
                                              'from-red-500 to-rose-500 text-white shadow-red-500/20'}">
                                            {w.status}
                                        </div>
                                        
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg ${w.type === 'shop' ? 'bg-gradient-to-tr from-purple-600 to-fuchsia-600 shadow-purple-500/30' : 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/30'}`}>
                                                <i className={`fa-solid ${w.type === 'shop' ? 'fa-store' : 'fa-truck-fast'}`}></i>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-sm text-rc-main tracking-wide">{w.shop ? w.shop.nama_toko : (w.user?.name || w.user?.username)}</h3>
                                                <span className="text-[9px] font-black text-rc-muted uppercase tracking-widest">{w.type === 'shop' ? 'Entitas Penjual' : 'Divisi Logistik'}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-6 relative z-10">
                                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                                <span className="text-[9px] font-bold text-rc-muted/70 uppercase block mb-1">Nominal Pencairan</span>
                                                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{formatRp(w.amount)}</span>
                                            </div>
                                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400"><i className="fa-solid fa-building-columns"></i></div>
                                                <div className="flex-1 overflow-hidden">
                                                    <span className="text-[9px] font-bold text-rc-muted/70 uppercase block mb-0.5">Destinasi Surat Berharga</span>
                                                    <span className="text-xs font-bold text-rc-main truncate block">{w.bank_info}</span>
                                                </div>
                                            </div>
                                            <div className="text-[9px] text-rc-muted/50 text-right font-medium">
                                                Terbit: {new Date(w.created_at).toLocaleString('id-ID')}
                                            </div>
                                        </div>

                                        {w.status === 'pending' && (
                                            <div className="flex gap-3 pt-2">
                                                <button onClick={() => handleRejectWithdrawal(w.id)} className="w-[35%] py-3 rounded-xl bg-white/[0.03] border border-red-500/30 hover:bg-red-500 hover:border-red-500 text-red-500 hover:text-white text-[10px] font-black uppercase transition-all shadow-lg hover:shadow-red-500/25">
                                                    <i className="fa-solid fa-xmark mb-1 block text-sm"></i> TOLAK
                                                </button>
                                                <button onClick={() => handleApproveWithdrawal(w.id)} className="w-[65%] py-3 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white text-[10px] font-black uppercase transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-1">
                                                    <i className="fa-solid fa-check mb-1 block text-sm"></i> IZINKAN TRANSFER
                                                </button>
                                            </div>
                                        )}
                                        {/* Background Decoration */}
                                        <div className="absolute -bottom-10 -right-10 text-9xl text-white/[0.01] pointer-events-none transform -rotate-12 group-hover:scale-110 transition-transform duration-500">
                                            <i className="fa-brands fa-gg"></i>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Banners */}
                {activeTab === 'banners' && (
                    <div className="space-y-8 animate-fade-in">
                        <form onSubmit={handleUploadBanner} className="bg-white/[0.02] p-8 rounded-3xl border border-white/5 flex flex-col gap-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-rc-muted uppercase tracking-widest mb-2">Judul Spanduk Promosi</label>
                                    <input type="text" value={newBanner.title} onChange={e => setNewBanner({...newBanner, title: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 text-xs rounded-xl text-rc-main focus:border-indigo-500 outline-none transition-colors shadow-inner" placeholder="Pesta Diskon Tengah Tahun..." />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-rc-muted uppercase tracking-widest mb-2">Tautan Destinasi (URL)</label>
                                    <input type="text" value={newBanner.link_url} onChange={e => setNewBanner({...newBanner, link_url: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 text-xs rounded-xl text-rc-main focus:border-indigo-500 outline-none transition-colors shadow-inner font-mono" placeholder="/products/kategori-elektronik" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <div>
                                    <label className="block text-[10px] font-black text-rc-muted uppercase tracking-widest mb-2">Narasi Deskripsi (Opsional)</label>
                                    <textarea value={newBanner.description} onChange={e => setNewBanner({...newBanner, description: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 text-xs rounded-xl text-rc-main resize-none h-14 focus:border-indigo-500 outline-none transition-colors shadow-inner" placeholder="Tuliskan deskripsi singkat untuk meta informasi..."></textarea>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-rc-muted uppercase tracking-widest mb-2">Aset Media Gambar {editBannerId && <span className="text-yellow-500 lowercase normal-case">(kosongkan jika tidak diganti)</span>}</label>
                                    <div className="flex gap-3">
                                        <div className="relative flex-1 group">
                                            <input type="file" accept="image/*" onChange={handleBannerFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                            <div className="w-full bg-black/40 border border-white/10 p-3 text-xs rounded-xl text-rc-main group-hover:bg-white/5 group-hover:border-indigo-500/50 transition-all shadow-inner flex items-center justify-center gap-2 border-dashed">
                                                <i className="fa-solid fa-cloud-arrow-up text-rc-muted group-hover:text-indigo-400 transition-colors"></i> {newBanner.image ? (newBanner.image.name || 'Gambar Terpilih') : 'Pencet untuk memilih gambar...'}
                                            </div>
                                        </div>
                                        <button type="submit" disabled={uploading} className="bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-[10px] uppercase px-8 rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5">
                                            {uploading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : editBannerId ? 'Perbarui Atribut' : 'Injeksi Banner'}
                                        </button>
                                        {editBannerId && (
                                            <button type="button" onClick={handleCancelEdit} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 font-black text-[10px] uppercase px-6 rounded-xl transition-all">
                                                Batal
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </form>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {banners.map((b, i) => (
                                <div 
                                    key={b.id} 
                                    draggable 
                                    onDragStart={(e) => handleDragStart(e, i)}
                                    onDragEnter={(e) => handleDragEnter(e, i)}
                                    onDragEnd={handleDragEnd}
                                    className={`relative group rounded-xl overflow-hidden border-[0.5px] border-rc-main/10 cursor-move transition-transform ${draggedIdx === i ? 'scale-105 opacity-50 z-10' : ''}`}
                                >
                                    <img src={`/storage/${b.image_url}`} className="w-full h-[150px] object-cover pointer-events-none" alt="banner" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button onClick={() => handleEditBanner(b)} className="bg-yellow-500 text-black px-4 py-2 text-[10px] font-bold uppercase rounded hover:bg-yellow-400">Edit</button>
                                        <button onClick={() => handleDeleteBanner(b.id)} className="bg-red-500 text-white px-4 py-2 text-[10px] font-bold uppercase rounded hover:bg-red-600">Hapus</button>
                                    </div>
                                    <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] uppercase font-bold px-2 py-1 rounded">
                                        {i + 1}
                                    </div>
                                    {b.title && <div className="absolute bottom-2 left-2 bg-black/80 px-3 py-1 rounded text-xs font-bold text-white max-w-[80%] truncate">{b.title}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab: Flash Sale */}
                {activeTab === 'flashsale' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex bg-rc-card p-2 rounded-md border-[0.5px] border-rc-main/10 items-center">
                            <i className="fa-solid fa-search mx-3 text-rc-muted"></i>
                            <input 
                                type="text" 
                                placeholder="Cari nama produk atau toko..." 
                                value={searchFlashSale}
                                onChange={(e) => setSearchFlashSale(e.target.value)}
                                className="bg-transparent outline-none text-sm font-medium flex-1 text-rc-main"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {products.map(p => (
                                <div key={p.id} className={`bg-rc-card border-[0.5px] rounded-lg p-3 ${p.is_flash_sale ? 'border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.2)]' : 'border-rc-main/10'}`}>
                                    <img src={p.primary_image} className="w-full h-32 object-cover rounded mb-3" alt="prod"/>
                                    <h3 className="text-xs font-bold text-rc-main truncate mb-1">{p.nama_produk}</h3>
                                    <p className="text-[10px] text-rc-muted truncate mb-3"><i className="fa-solid fa-shop"></i> {p.shop?.nama_toko}</p>
                                    <button 
                                        onClick={() => toggleFlashSale(p.id)}
                                        className={`w-full py-1.5 text-[10px] font-bold uppercase rounded transition-colors ${p.is_flash_sale ? 'bg-yellow-500 text-black' : 'bg-rc-bg text-rc-muted hover:text-white hover:bg-rc-main'}`}
                                    >
                                        <i className="fa-solid fa-bolt"></i> {p.is_flash_sale ? 'Flash Sale Aktif' : 'Jadikan Flash Sale'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab: Users */}
                {activeTab === 'users' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex bg-rc-card p-2 rounded-md border-[0.5px] border-rc-main/10 items-center">
                            <i className="fa-solid fa-search mx-3 text-rc-muted"></i>
                            <input 
                                type="text" 
                                placeholder="Cari username, nama asli, email..." 
                                value={searchUsers}
                                onChange={(e) => setSearchUsers(e.target.value)}
                                className="bg-transparent outline-none text-sm font-medium flex-1 text-rc-main"
                            />
                        </div>

                        <div className="overflow-x-auto border-[0.5px] border-rc-main/10 rounded-xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-rc-card border-b-[0.5px] border-rc-main/10 text-[10px] uppercase text-rc-muted tracking-widest">
                                    <tr>
                                        <th className="p-4">Pengguna</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">Role Saat Ini</th>
                                        <th className="p-4">Ubah Role</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs text-rc-main">
                                    {usersList.map((u, i) => (
                                        <tr key={u.id} className={i % 2 === 0 ? 'bg-rc-bg' : 'bg-rc-card/30'}>
                                            <td className="p-4 font-bold">{u.username} <br/><span className="text-[9px] font-normal text-rc-muted">{u.name}</span></td>
                                            <td className="p-4">{u.email}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-sm text-[9px] font-bold uppercase ${u.role === 'super_admin' ? 'bg-red-500/20 text-red-400' : u.role === 'admin_staff' ? 'bg-blue-500/20 text-blue-400' : u.role === 'admin_logistik' ? 'bg-teal-500/20 text-teal-400' : u.role === 'admin_kurir' ? 'bg-green-500/20 text-green-400' : 'bg-rc-main/10 text-rc-muted'}`}>{u.role}</span>
                                            </td>
                                            <td className="p-4">
                                                <select 
                                                    value={u.role}
                                                    onChange={(e) => changeUserRole(u.id, e.target.value)}
                                                    className="bg-rc-card text-xs font-bold text-rc-main p-1 rounded outline-none border-[0.5px] border-rc-main/20"
                                                    disabled={user.role !== 'super_admin'}
                                                >
                                                    <option value="user">USER / TOKO (DEFAULT)</option>
                                                    <option value="kurir_staff">KURIR - STAFF (PENGANTAR)</option>
                                                    <option value="admin_kurir">KURIR - ADMIN</option>
                                                    <option value="logistik_staff">LOGISTIK - STAFF (GUDANG)</option>
                                                    <option value="admin_logistik">LOGISTIK - ADMIN</option>
                                                    <option value="admin_staff">PORTAL ADMIN - STAFF</option>
                                                    <option value="super_admin">SUPER ADMIN</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab: Vouchers */}
                {activeTab === 'vouchers' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex bg-rc-card p-2 rounded-md border-[0.5px] border-rc-main/10 items-center">
                            <i className="fa-solid fa-search mx-3 text-rc-muted"></i>
                            <input 
                                type="text" 
                                placeholder="Cari nama voucher atau kode..." 
                                value={searchVouchers}
                                onChange={(e) => setSearchVouchers(e.target.value)}
                                className="bg-transparent outline-none text-sm font-medium flex-1 text-rc-main"
                            />
                        </div>
                        
                        {/* Form Tambah Voucher */}
                        <form onSubmit={handleCreateVoucher} className="bg-rc-card p-6 rounded-xl border-[0.5px] border-rc-main/10 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="block text-[10px] font-bold text-rc-muted uppercase mb-1">Nama Voucher</label>
                                <input required type="text" value={newVoucher.nama_voucher} onChange={e => setNewVoucher({...newVoucher, nama_voucher: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-2 text-xs rounded text-rc-main outline-none" placeholder="e.g. Diskon Spesial Merdeka" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-rc-muted uppercase mb-1">Kode Voucher</label>
                                <input required type="text" value={newVoucher.code} onChange={e => setNewVoucher({...newVoucher, code: e.target.value.toUpperCase()})} className="w-full bg-rc-bg border border-rc-main/10 p-2 text-xs rounded text-rc-main outline-none placeholder:text-rc-muted/30" placeholder="e.g. RDNMERDEKA24" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-rc-muted uppercase mb-1">Tipe Potongan</label>
                                <select value={newVoucher.type} onChange={e => setNewVoucher({...newVoucher, type: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-2 text-xs rounded text-rc-main outline-none">
                                    <option value="fixed">Nominal Rupiah (Rp)</option>
                                    <option value="percentage">Persentase (%)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-rc-muted uppercase mb-1">Nilai Potongan</label>
                                <input required type="number" value={newVoucher.value} onChange={e => setNewVoucher({...newVoucher, value: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-2 text-xs rounded text-rc-main outline-none" placeholder={newVoucher.type === 'percentage' ? "e.g. 10 (Maks 100)" : "e.g. 20000"} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-rc-muted uppercase mb-1">Minimum Belanja (Rp)</label>
                                <input required type="number" value={newVoucher.min_purchase} onChange={e => setNewVoucher({...newVoucher, min_purchase: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-2 text-xs rounded text-rc-main outline-none" min="0" placeholder="e.g. 50000" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-rc-muted uppercase mb-1">Kedaluwarsa (Tgl & Waktu)</label>
                                <input required type="datetime-local" value={newVoucher.valid_until} onChange={e => setNewVoucher({...newVoucher, valid_until: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-2 text-xs rounded text-rc-main outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-rc-muted uppercase mb-1">Kuota Tersedia</label>
                                <input required type="number" value={newVoucher.kuota} onChange={e => setNewVoucher({...newVoucher, kuota: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-2 text-xs rounded text-rc-main outline-none" min="1" placeholder="e.g. 100" />
                            </div>
                            <button type="submit" disabled={uploadingVoucher} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase py-2.5 rounded transition shadow-lg">
                                {uploadingVoucher ? 'Memproses...' : 'Buat Voucher Master'}
                            </button>
                        </form>

                        {/* List Voucher */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {vouchers.map(v => (
                                <div key={v.id} className="bg-rc-card p-5 rounded-2xl border-[0.5px] border-rc-main/10 relative overflow-hidden group">
                                    {new Date(v.valid_until) < new Date() && <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="text-[10px] font-black uppercase text-blue-500 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">{v.code}</div>
                                        <button onClick={() => handleDeleteVoucher(v.id)} className="text-rc-muted hover:text-red-500"><i className="fa-solid fa-trash"></i></button>
                                    </div>
                                    <h3 className="font-bold text-sm text-rc-main">{v.nama_voucher}</h3>
                                    <p className="text-[10px] text-rc-muted max-w-[90%] truncate mt-1">Potongan: {v.type === 'percentage' ? v.value + '%' : 'Rp ' + Number(v.value).toLocaleString('id-ID')} | Min: Rp {Number(v.min_purchase).toLocaleString('id-ID')}</p>
                                    <div className="mt-4 pt-4 border-t-[0.5px] border-rc-main/10 flex justify-between items-center text-[10px] font-bold uppercase text-rc-muted">
                                        <span><i className="fa-solid fa-users"></i> Sisa: {v.kuota}</span>
                                        <span className={new Date(v.valid_until) < new Date() ? 'text-red-500' : ''}><i className="fa-solid fa-clock"></i> {new Date(v.valid_until).toLocaleDateString('id-ID')}</span>
                                    </div>
                                </div>
                            ))}
                            {vouchers.length === 0 && <p className="text-xs text-rc-muted bg-rc-card p-5 rounded-xl border-[0.5px] border-rc-main/10 md:col-span-2 lg:col-span-3 text-center opacity-50 uppercase tracking-widest font-bold">Belum ada voucher master yang aktif.</p>}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
