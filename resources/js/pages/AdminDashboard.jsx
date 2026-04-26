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
    const [couriers, setCouriers] = useState([]);
    const [logistics, setLogistics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [countrySettings, setCountrySettings] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [shippingSettings, setShippingSettings] = useState({
        regular: 15000,
        express: 25000
    });

    // Search States
    const [searchFlashSale, setSearchFlashSale] = useState('');
    const [searchUsers, setSearchUsers] = useState('');
    const [searchVouchers, setSearchVouchers] = useState('');
    const [searchCouriers, setSearchCouriers] = useState('');
    const [searchLogistics, setSearchLogistics] = useState('');

    const [newBanner, setNewBanner] = useState({ title: '', description: '', link_url: '', image: null });
    const [editBannerId, setEditBannerId] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Voucher Form
    const [newVoucher, setNewVoucher] = useState({ nama_voucher: '', code: '', type: 'fixed', value: '', min_purchase: '', valid_until: '', kuota: '' });
    const [uploadingVoucher, setUploadingVoucher] = useState(false);

    // Drag & Drop State
    const [draggedIdx, setDraggedIdx] = useState(null);
    const [hasUnsavedReorder, setHasUnsavedReorder] = useState(false);
    const [isSavingReorder, setIsSavingReorder] = useState(false);

    // Flash Sale Draft State
    const [flashSaleDrafts, setFlashSaleDrafts] = useState({});
    const [isSavingFlashSale, setIsSavingFlashSale] = useState(false);

    // Pagination States
    const [pageProducts, setPageProducts] = useState(1);
    const [totalPagesProducts, setTotalPagesProducts] = useState(1);
    const [pageUsers, setPageUsers] = useState(1);
    const [totalPagesUsers, setTotalPagesUsers] = useState(1);
    const [pageWithdrawals, setPageWithdrawals] = useState(1);
    const [totalPagesWithdrawals, setTotalPagesWithdrawals] = useState(1);

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

    const fetchProducts = (page = 1) => {
        axios.get(`/api/admin/products?q=${searchFlashSale}&page=${page}`).then(res => {
            setProducts(res.data.data || res.data);
            setTotalPagesProducts(res.data.last_page || 1);
            setPageProducts(page);
        }).catch(console.error);
    }

    const fetchUsers = (page = 1) => {
        axios.get(`/api/admin/users?q=${searchUsers}&page=${page}`).then(res => {
            setUsersList(res.data.data || res.data);
            setTotalPagesUsers(res.data.last_page || 1);
            setPageUsers(page);
        }).catch(console.error);
    }

    const fetchWithdrawals = (page = 1) => {
        axios.get(`/api/admin/withdrawals?page=${page}`).then(res => {
            setWithdrawals(res.data.data || res.data);
            setTotalPagesWithdrawals(res.data.last_page || 1);
            setPageWithdrawals(page);
        }).catch(console.error);
    }

    const fetchData = () => {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } };
        axios.get('/api/admin/banners', config).then(res => setBanners(res.data)).catch(console.error);
        fetchProducts(1);
        fetchUsers(1);
        axios.get(`/api/vouchers?q=${searchVouchers}`, config).then(res => setVouchers(res.data)).catch(console.error);
        fetchWithdrawals(1);
        axios.get(`/api/admin/users?role=courier&q=${searchCouriers}`, config).then(res => setCouriers(res.data.data || [])).catch(console.error);
        axios.get(`/api/admin/users?role=logistics&q=${searchLogistics}`, config).then(res => setLogistics(res.data.data || [])).catch(console.error);
        axios.get('/api/regions', config).then(res => setCountrySettings(Array.isArray(res.data) ? res.data : [])).catch(console.error);
        axios.get('/api/admin/complaints', config).then(res => setComplaints(Array.isArray(res.data) ? res.data : [])).catch(console.error);
        setTimeout(() => setLoading(false), 500);
    };

    // Refetch when search changes (debounce simulated by manual enter or simple timeout could be used, here we fetch on blur/enter or direct)
    useEffect(() => {
        if (user) fetchData();
    }, [searchFlashSale, searchUsers, searchVouchers]);


    const handleBannerFile = (e) => setNewBanner({ ...newBanner, image: e.target.files[0] });

    const handleUploadBanner = async (e) => {
        e.preventDefault();
        if (!editBannerId && !newBanner.image) return alert("Pilih gambar dahulu!");
        if (!window.confirm(editBannerId ? "Yakin ingin memperbarui banner ini?" : "Yakin ingin menambahkan banner baru ini?")) return;

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

    const handleDragEnd = () => {
        setDraggedIdx(null);
        setHasUnsavedReorder(true);
    };

    const handleSaveReorder = async () => {
        if (!window.confirm('Simpan urutan banner ini?')) return;
        setIsSavingReorder(true);
        const ordered_ids = banners.map(b => b.id);
        try {
            await axios.post('/api/admin/banners/reorder', { ordered_ids }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
            setHasUnsavedReorder(false);
            alert('Urutan banner berhasil disimpan!');
        } catch (e) {
            console.error("Gagal menyimpan reorder", e);
            alert('Gagal menyimpan urutan.');
        } finally {
            setIsSavingReorder(false);
        }
    };

    const handleSaveTaxes = async () => {
        if (!window.confirm('Simpan perubahan pajak & ongkir?')) return;
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } };
        try {
            await Promise.all(countrySettings.map(region =>
                axios.put(`/api/regions/${region.id}`, region, config)
            ));
            alert('Perubahan pajak & biaya wilayah berhasil disimpan!');
            fetchData();
        } catch (e) {
            console.error(e);
            alert('Gagal menyimpan sebagian atau seluruh data pajak.');
        }
    };

    const [flashSaleSchedule, setFlashSaleSchedule] = useState({
        start: '',
        end: ''
    });

    const handleToggleFlashSaleDraft = (id, currentEffectiveStatus) => {
        setFlashSaleDrafts(prev => ({
            ...prev,
            [id]: !currentEffectiveStatus
        }));
    };

    const handleSaveFlashSale = async () => {
        if (!window.confirm('Yakin ingin menyimpan semua perubahan Flash Sale?')) return;
        setIsSavingFlashSale(true);
        try {
            await axios.post('/api/admin/products/bulk-flash-sale', {
                updates: flashSaleDrafts,
                flash_sale_start: flashSaleSchedule.start || null,
                flash_sale_end: flashSaleSchedule.end || null
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
            setFlashSaleDrafts({});
            fetchData();
            alert("Berhasil menyimpan perubahan Flash Sale!");
        } catch (e) {
            console.error(e);
            alert("Gagal menyimpan flash sale");
        } finally {
            setIsSavingFlashSale(false);
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

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Hapus user ini?")) return;
        try {
            await axios.delete(`/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } });
            fetchData();
        } catch (e) {
            alert("Gagal menghapus user");
        }
    };

    // if (loading && !banners.length && !vouchers.length) return <div className="text-center p-20 text-rc-muted animate-pulse font-bold tracking-widest uppercase">Memuat Portal Super Admin...</div>;

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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 flex flex-col md:flex-row gap-8 items-start">
                {/* Mobile Menu Toggle (Header-like) */}
                <div className="w-full md:hidden mb-4 flex items-center justify-between">
                    <button onClick={() => setIsSidebarOpen(true)} className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-white shadow-lg">
                        <i className="fa-solid fa-bars text-blue-400"></i> MENU
                    </button>
                    <h2 className="text-xs font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Pusat Navigasi</h2>
                </div>

                {/* Mobile Backdrop */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                )}

                {/* Sidebar Navigation (Off-Canvas on Mobile) */}
                <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0b0c10] border-r border-white/10 shadow-2xl p-4 transform transition-transform duration-300 md:relative md:inset-auto md:translate-x-0 md:bg-transparent md:border-0 md:shadow-none md:p-0 md:w-64 md:flex-shrink-0 md:sticky md:top-28 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                    {/* Mobile Close Button & Header */}
                    <div className="flex justify-between items-center mb-6 md:hidden">
                        <h2 className="text-xs font-black uppercase text-blue-400 tracking-widest flex items-center gap-2">
                            <i className="fa-solid fa-shield-halved"></i> ADMIN PANEL
                        </h2>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-rc-muted hover:text-white w-8 h-8 flex items-center justify-center rounded-full bg-white/5">
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>

                    <div className="flex flex-col bg-white/5 p-2 rounded-2xl border border-white/5 shadow-inner relative gap-2 flex-grow overflow-y-auto no-scrollbar">
                        {[
                            { id: 'withdrawals', label: 'Keuangan', icon: 'fa-wallet' },
                            { id: 'banners', label: 'Banners', icon: 'fa-images' },
                            { id: 'flashsale', label: 'Flash Sale', icon: 'fa-bolt' },
                            { id: 'users', label: 'Pengguna', icon: 'fa-users' },
                            { id: 'vouchers', label: 'Vouchers', icon: 'fa-ticket-simple' },
                            { id: 'couriers', label: 'Mitra Kurir', icon: 'fa-truck-fast' },
                            { id: 'logistics', label: 'Mitra Logistik', icon: 'fa-warehouse' },
                            { id: 'complaints', label: 'Pengaduan', icon: 'fa-headset' },
                            { id: 'tax_settings', label: 'Atur Pajak & Ongkir', icon: 'fa-gears' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
                                className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === tab.id ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25' : 'text-rc-muted hover:text-white hover:bg-white/5'}`}
                            >
                                <i className={`fa-solid ${tab.icon} w-5 text-center`}></i> <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-grow min-w-0 w-full">

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

                            {/* Pagination for Withdrawals */}
                            <div className="flex justify-between items-center mt-6">
                                <button disabled={pageWithdrawals <= 1} onClick={() => fetchWithdrawals(pageWithdrawals - 1)} className="px-6 py-3 bg-white/[0.03] text-rc-main rounded-xl border border-white/10 hover:bg-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs uppercase tracking-widest transition-all">
                                    <i className="fa-solid fa-chevron-left mr-2"></i> Mundur
                                </button>
                                <span className="text-rc-muted text-xs font-mono font-bold tracking-widest">HAL {pageWithdrawals} / {totalPagesWithdrawals}</span>
                                <button disabled={pageWithdrawals >= totalPagesWithdrawals} onClick={() => fetchWithdrawals(pageWithdrawals + 1)} className="px-6 py-3 bg-white/[0.03] text-rc-main rounded-xl border border-white/10 hover:bg-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs uppercase tracking-widest transition-all">
                                    Maju <i className="fa-solid fa-chevron-right ml-2"></i>
                                </button>
                            </div>
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
                                        <input type="text" value={newBanner.title} onChange={e => setNewBanner({ ...newBanner, title: e.target.value })} className="w-full bg-black/40 border border-white/10 p-3 text-xs rounded-xl text-rc-main focus:border-indigo-500 outline-none transition-colors shadow-inner" placeholder="Pesta Diskon Tengah Tahun..." />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-rc-muted uppercase tracking-widest mb-2">Tautan Destinasi (URL)</label>
                                        <input type="text" value={newBanner.link_url} onChange={e => setNewBanner({ ...newBanner, link_url: e.target.value })} className="w-full bg-black/40 border border-white/10 p-3 text-xs rounded-xl text-rc-main focus:border-indigo-500 outline-none transition-colors shadow-inner font-mono" placeholder="/products/kategori-elektronik" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                    <div>
                                        <label className="block text-[10px] font-black text-rc-muted uppercase tracking-widest mb-2">Narasi Deskripsi (Opsional)</label>
                                        <textarea value={newBanner.description} onChange={e => setNewBanner({ ...newBanner, description: e.target.value })} className="w-full bg-black/40 border border-white/10 p-3 text-xs rounded-xl text-rc-main resize-none h-14 focus:border-indigo-500 outline-none transition-colors shadow-inner" placeholder="Tuliskan deskripsi singkat untuk meta informasi..."></textarea>
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

                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-black uppercase text-rc-main tracking-widest">Daftar Spanduk Promosi</h3>
                                {hasUnsavedReorder && (
                                    <button onClick={handleSaveReorder} disabled={isSavingReorder} className="bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase text-[10px] px-6 py-2 rounded-xl shadow-lg transition-all animate-pulse">
                                        {isSavingReorder ? 'Menyimpan...' : 'Simpan Urutan (Wajib)'}
                                    </button>
                                )}
                            </div>
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
                        <div className="space-y-8 animate-fade-in">
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

                            {Object.keys(flashSaleDrafts).length > 0 && (
                                <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-[0_0_20px_rgba(250,204,21,0.1)] gap-4">
                                    <div>
                                        <h3 className="text-sm font-black text-yellow-500 uppercase tracking-widest"><i className="fa-solid fa-triangle-exclamation"></i> Draf Flash Sale Aktif</h3>
                                        <p className="text-xs text-rc-muted mt-1">Anda memiliki {Object.keys(flashSaleDrafts).length} draf perubahan status Flash Sale.</p>
                                    </div>

                                    <div className="flex flex-col gap-2 bg-black/20 p-3 rounded-lg border border-yellow-500/10 w-full md:w-auto">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-rc-muted w-12 uppercase">Mulai:</span>
                                            <input type="datetime-local" value={flashSaleSchedule.start} onChange={e => setFlashSaleSchedule(prev => ({ ...prev, start: e.target.value }))} className="bg-rc-bg text-rc-main text-xs px-2 py-1 rounded border border-rc-main/20 outline-none focus:border-yellow-500" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-rc-muted w-12 uppercase">Selesai:</span>
                                            <input type="datetime-local" value={flashSaleSchedule.end} onChange={e => setFlashSaleSchedule(prev => ({ ...prev, end: e.target.value }))} className="bg-rc-bg text-rc-main text-xs px-2 py-1 rounded border border-rc-main/20 outline-none focus:border-yellow-500" />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-2 md:mt-0 w-full md:w-auto justify-end">
                                        <button onClick={() => setFlashSaleDrafts({})} className="px-4 py-2 border border-red-500/30 text-red-500 font-bold uppercase text-[10px] rounded-lg hover:bg-red-500/10 whitespace-nowrap">Batal</button>
                                        <button onClick={handleSaveFlashSale} disabled={isSavingFlashSale} className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase text-[10px] rounded-lg shadow-lg whitespace-nowrap">
                                            {isSavingFlashSale ? 'Menyimpan...' : 'Simpan Permanen'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="text-xs font-black text-yellow-400 uppercase tracking-widest mb-4 border-b border-yellow-500/20 pb-2"><i className="fa-solid fa-bolt"></i> Sedang Flash Sale</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {products.map(p => {
                                        const effectiveStatus = flashSaleDrafts[p.id] !== undefined ? flashSaleDrafts[p.id] : p.is_flash_sale;
                                        if (!effectiveStatus) return null;
                                        return (
                                            <div key={p.id} className="bg-rc-card border-[0.5px] rounded-lg p-3 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.2)] relative overflow-hidden group">
                                                {flashSaleDrafts[p.id] !== undefined && <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-black px-2 py-0.5 rounded-bl shadow-lg">DRAFT BARU</div>}
                                                <img src={p.primary_image} className="w-full h-32 object-cover rounded mb-3" alt="prod" />
                                                <h3 className="text-xs font-bold text-rc-main truncate mb-1">{p.nama_produk}</h3>
                                                <p className="text-[10px] text-rc-muted truncate mb-3"><i className="fa-solid fa-shop"></i> {p.shop?.nama_toko}</p>
                                                <button
                                                    onClick={() => handleToggleFlashSaleDraft(p.id, effectiveStatus)}
                                                    className="w-full py-1.5 text-[10px] font-bold uppercase rounded transition-colors bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black border border-yellow-500/20"
                                                >
                                                    <i className="fa-solid fa-xmark"></i> Hapus dari Flash Sale
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-black text-rc-muted uppercase tracking-widest mb-4 border-b border-white/5 pb-2"><i className="fa-solid fa-box"></i> Katalog Reguler (Belum Flash Sale)</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {products.map(p => {
                                        const effectiveStatus = flashSaleDrafts[p.id] !== undefined ? flashSaleDrafts[p.id] : p.is_flash_sale;
                                        if (effectiveStatus) return null;
                                        return (
                                            <div key={p.id} className={`bg-rc-card border-[0.5px] rounded-lg p-3 ${flashSaleDrafts[p.id] !== undefined ? 'border-red-400/50' : 'border-rc-main/10'} relative overflow-hidden`}>
                                                {flashSaleDrafts[p.id] !== undefined && <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-bl shadow-lg">DIHAPUS DARI FS</div>}
                                                <img src={p.primary_image} className="w-full h-32 object-cover rounded mb-3 opacity-80" alt="prod" />
                                                <h3 className="text-xs font-bold text-rc-main truncate mb-1">{p.nama_produk}</h3>
                                                <p className="text-[10px] text-rc-muted truncate mb-3"><i className="fa-solid fa-shop"></i> {p.shop?.nama_toko}</p>
                                                <button
                                                    onClick={() => handleToggleFlashSaleDraft(p.id, effectiveStatus)}
                                                    className="w-full py-1.5 text-[10px] font-bold uppercase rounded transition-colors bg-white/5 text-rc-muted hover:text-white hover:bg-white/10"
                                                >
                                                    <i className="fa-solid fa-bolt"></i> Jadikan Flash Sale
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            {/* Pagination for Products */}
                            <div className="flex justify-between items-center mt-4">
                                <button disabled={pageProducts <= 1} onClick={() => fetchProducts(pageProducts - 1)} className="px-4 py-2 bg-rc-bg text-rc-main rounded-lg border-[0.5px] border-rc-main/10 disabled:opacity-50">Sebelumnya</button>
                                <span className="text-rc-muted">Halaman {pageProducts} dari {totalPagesProducts}</span>
                                <button disabled={pageProducts >= totalPagesProducts} onClick={() => fetchProducts(pageProducts + 1)} className="px-4 py-2 bg-rc-bg text-rc-main rounded-lg border-[0.5px] border-rc-main/10 disabled:opacity-50">Berikutnya</button>
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

                            {Object.entries(usersList.reduce((acc, user) => {
                                acc[user.role] = acc[user.role] || [];
                                acc[user.role].push(user);
                                return acc;
                            }, {})).map(([role, users]) => (
                                <div key={role} className="mb-8">
                                    <h3 className="text-[10px] font-black uppercase text-rc-muted tracking-widest mb-3 border-b border-white/5 pb-2">Kategori: {role.replace('_', ' ')}</h3>
                                    <div className="overflow-x-auto border-[0.5px] border-rc-main/10 rounded-xl">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-rc-card border-b-[0.5px] border-rc-main/10 text-[10px] uppercase text-rc-muted tracking-widest">
                                                <tr>
                                                    <th className="p-4 w-[30%]">Pengguna</th>
                                                    <th className="p-4 w-[30%]">Email</th>
                                                    <th className="p-4 w-[20%]">Role Saat Ini</th>
                                                    <th className="p-4 w-[20%]">Ubah Role</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-xs text-rc-main">
                                                {users.map((u, i) => (
                                                    <tr key={u.id} className={i % 2 === 0 ? 'bg-rc-bg' : 'bg-rc-card/30'}>
                                                        <td className="p-4 font-bold">{u.username} <br /><span className="text-[9px] font-normal text-rc-muted">{u.name}</span></td>
                                                        <td className="p-4">{u.email}</td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 rounded-sm text-[9px] font-bold uppercase ${u.role === 'super_admin' ? 'bg-red-500/20 text-red-400' : u.role === 'admin_staff' ? 'bg-blue-500/20 text-blue-400' : u.role === 'admin_logistik' ? 'bg-teal-500/20 text-teal-400' : u.role === 'admin_kurir' ? 'bg-green-500/20 text-green-400' : 'bg-rc-main/10 text-rc-muted'}`}>{u.role.replace('_', ' ')}</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <select
                                                                value={u.role}
                                                                onChange={(e) => changeUserRole(u.id, e.target.value)}
                                                                className="bg-rc-card text-xs font-bold text-rc-main p-1 rounded outline-none border-[0.5px] border-rc-main/20 w-full"
                                                                disabled={user.role !== 'super_admin'}
                                                            >
                                                                <option value="user">USER / TOKO</option>
                                                                <option value="kurir_staff">KURIR STAFF</option>
                                                                <option value="admin_kurir">KURIR ADMIN</option>
                                                                <option value="logistik_staff">LOGISTIK STAFF</option>
                                                                <option value="admin_logistik">LOGISTIK ADMIN</option>
                                                                <option value="admin_staff">ADMIN STAFF</option>
                                                                <option value="super_admin">SUPER ADMIN</option>
                                                            </select>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                            {/* Pagination for Users */}
                            <div className="flex justify-between items-center mt-4">
                                <button disabled={pageUsers <= 1} onClick={() => fetchUsers(pageUsers - 1)} className="px-4 py-2 bg-rc-bg text-rc-main rounded-lg border-[0.5px] border-rc-main/10 disabled:opacity-50">Sebelumnya</button>
                                <span className="text-rc-muted">Halaman {pageUsers} dari {totalPagesUsers}</span>
                                <button disabled={pageUsers >= totalPagesUsers} onClick={() => fetchUsers(pageUsers + 1)} className="px-4 py-2 bg-rc-bg text-rc-main rounded-lg border-[0.5px] border-rc-main/10 disabled:opacity-50">Berikutnya</button>
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
                                    <input required type="text" value={newVoucher.nama_voucher} onChange={e => setNewVoucher({ ...newVoucher, nama_voucher: e.target.value })} className="w-full bg-rc-bg border border-rc-main/10 p-2 text-xs rounded text-rc-main outline-none" placeholder="e.g. Diskon Spesial Merdeka" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-rc-muted uppercase mb-1">Kode Voucher</label>
                                    <input required type="text" value={newVoucher.code} onChange={e => setNewVoucher({ ...newVoucher, code: e.target.value.toUpperCase() })} className="w-full bg-rc-bg border border-rc-main/10 p-2 text-xs rounded text-rc-main outline-none placeholder:text-rc-muted/30" placeholder="e.g. RDNMERDEKA24" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-rc-muted uppercase mb-1">Tipe Potongan</label>
                                    <select value={newVoucher.type} onChange={e => setNewVoucher({ ...newVoucher, type: e.target.value })} className="w-full bg-rc-bg border border-rc-main/10 p-2 text-xs rounded text-rc-main outline-none">
                                        <option value="fixed">Nominal Rupiah (Rp)</option>
                                        <option value="percentage">Persentase (%)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-rc-muted uppercase mb-1">Nilai Potongan</label>
                                    <input required type="number" value={newVoucher.value} onChange={e => setNewVoucher({ ...newVoucher, value: e.target.value })} className="w-full bg-rc-bg border border-rc-main/10 p-2 text-xs rounded text-rc-main outline-none" placeholder={newVoucher.type === 'percentage' ? "e.g. 10 (Maks 100)" : "e.g. 20000"} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-rc-muted uppercase mb-1">Minimum Belanja (Rp)</label>
                                    <input required type="number" value={newVoucher.min_purchase} onChange={e => setNewVoucher({ ...newVoucher, min_purchase: e.target.value })} className="w-full bg-rc-bg border border-rc-main/10 p-2 text-xs rounded text-rc-main outline-none" min="0" placeholder="e.g. 50000" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-rc-muted uppercase mb-1">Kedaluwarsa (Tgl & Waktu)</label>
                                    <input required type="datetime-local" value={newVoucher.valid_until} onChange={e => setNewVoucher({ ...newVoucher, valid_until: e.target.value })} className="w-full bg-rc-bg border border-rc-main/10 p-2 text-xs rounded text-rc-main outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-rc-muted uppercase mb-1">Kuota Tersedia</label>
                                    <input required type="number" value={newVoucher.kuota} onChange={e => setNewVoucher({ ...newVoucher, kuota: e.target.value })} className="w-full bg-rc-bg border border-rc-main/10 p-2 text-xs rounded text-rc-main outline-none" min="1" placeholder="e.g. 100" />
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

                    {/* Tab: Couriers */}
                    {activeTab === 'couriers' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                                <h2 className="text-xl font-black uppercase tracking-tighter text-rc-main">Manajemen Mitra Kurir (Mitra)</h2>
                                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                    <div className="relative w-full sm:w-64">
                                        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-rc-muted text-xs"></i>
                                        <input
                                            type="text"
                                            value={searchCouriers}
                                            onChange={e => setSearchCouriers(e.target.value)}
                                            onKeyUp={e => e.key === 'Enter' && fetchData()}
                                            placeholder="Cari Nama Mitra Kurir..."
                                            className="w-full bg-rc-bg border border-rc-main/10 p-3 pl-11 text-xs rounded-xl text-rc-main outline-none focus:border-green-500 transition shadow-inner"
                                        />
                                    </div>
                                    <Link to="/daftar-mitra" className="bg-rc-logo text-white px-6 py-3 rounded-xl font-bold text-[10px] uppercase shadow-lg hover:scale-105 transition-all whitespace-nowrap"><i className="fa-solid fa-plus mr-2"></i> Tambah Mitra Kurir</Link>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {couriers.length > 0 ? couriers.map(c => (
                                    <div key={c.id} className="bg-rc-card p-6 rounded-2xl border-[0.5px] border-rc-main/10 flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-rc-bg border border-rc-main/10 flex items-center justify-center overflow-hidden">
                                            {c.profile_photo_url ? <img src={c.profile_photo_url} className="w-full h-full object-cover" /> : <i className="fa-solid fa-truck text-rc-muted"></i>}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-xs font-black text-rc-main uppercase">{c.name}</h4>
                                            <p className="text-[10px] text-rc-muted uppercase">{c.phone || c.email}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[8px] font-black bg-green-500/10 text-green-500 px-2 py-0.5 rounded">Active</span>
                                                <span className="text-[8px] font-bold text-rc-muted uppercase">Kurir Ekspedisi</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteUser(c.id)} className="text-rc-muted hover:text-red-500 transition-colors" title="Hapus"><i className="fa-solid fa-trash"></i></button>
                                    </div>
                                )) : (
                                    <div className="col-span-full py-20 text-center opacity-50 italic text-xs uppercase tracking-widest font-bold">Belum ada kurir yang terdaftar secara khusus.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab: Logistics */}
                    {activeTab === 'logistics' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                                <h2 className="text-xl font-black uppercase tracking-tighter text-rc-main">Manajemen Mitra Logistik & Gudang</h2>
                                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                    <div className="relative w-full sm:w-64">
                                        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-rc-muted text-xs"></i>
                                        <input
                                            type="text"
                                            value={searchLogistics}
                                            onChange={e => setSearchLogistics(e.target.value)}
                                            onKeyUp={e => e.key === 'Enter' && fetchData()}
                                            placeholder="Cari Nama Mitra..."
                                            className="w-full bg-rc-bg border border-rc-main/10 p-3 pl-11 text-xs rounded-xl text-rc-main outline-none focus:border-teal-500 transition shadow-inner"
                                        />
                                    </div>
                                    <Link to="/daftar-mitra" className="bg-rc-logo text-white px-6 py-3 rounded-xl font-bold text-[10px] uppercase shadow-lg hover:scale-105 transition-all whitespace-nowrap"><i className="fa-solid fa-plus mr-2"></i> Tambah Mitra Baru</Link>
                                </div>
                            </div>
                            <div className="bg-rc-card rounded-2xl border-[0.5px] border-rc-main/10 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-rc-main/5 text-[10px] font-black uppercase text-rc-muted tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Nama Perusahaan/Mitra</th>
                                            <th className="px-6 py-4">Jenis Otoritas</th>
                                            <th className="px-6 py-4">Kontak/Email</th>
                                            <th className="px-6 py-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs font-bold text-rc-main">
                                        {logistics.length > 0 ? logistics.map(l => (
                                            <tr key={l.id} className="border-t border-rc-main/5 hover:bg-rc-main/5 transition-colors">
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-rc-bg flex items-center justify-center overflow-hidden border border-rc-main/10">
                                                        {l.profile_photo_url ? <img src={l.profile_photo_url} className="w-full h-full object-cover" /> : <i className="fa-solid fa-warehouse text-rc-muted"></i>}
                                                    </div>
                                                    {l.name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="uppercase text-[9px] font-black px-2 py-1 bg-teal-500/10 text-teal-500 rounded border border-teal-500/20">{l.role === 'admin_logistik' ? 'Pusat' : 'Gudang Wilayah'}</span>
                                                </td>
                                                <td className="px-6 py-4"><span className="text-[10px] font-mono text-rc-muted">{l.email}</span></td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => handleDeleteUser(l.id)} className="text-rc-muted hover:text-red-500 transition-colors"><i className="fa-solid fa-trash-can"></i></button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-10 text-center text-rc-muted opacity-50 uppercase tracking-widest font-bold">Belum ada mitra logistik yang terdaftar.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Tab: Complaints (Pengaduan) */}
                    {activeTab === 'complaints' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-black uppercase tracking-tighter text-rc-main">Pusat Pengaduan & Resolusi</h2>
                                {complaints.filter(c => c.status === 'open').length > 0 && (
                                    <span className="text-[10px] font-bold bg-red-500 text-white px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                                        {complaints.filter(c => c.status === 'open').length} Baru
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {complaints.length > 0 ? complaints.map(c => (
                                    <div key={c.id} className="bg-rc-card p-6 rounded-2xl border-[0.5px] border-rc-main/10 flex flex-col md:flex-row gap-6 items-start md:items-center group hover:border-blue-500/30 transition-all">
                                        <div className={`w-12 h-12 rounded-xl bg-rc-bg flex items-center justify-center text-xl transition-colors ${c.status === 'open' ? 'text-red-500 group-hover:text-red-400' : 'text-green-500 group-hover:text-green-400'}`}>
                                            <i className="fa-solid fa-circle-exclamation"></i>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-[9px] font-black uppercase text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                                                    {c.user?.name || 'User'}
                                                </span>
                                                <span className="text-[9px] font-bold text-rc-muted uppercase">
                                                    {new Date(c.created_at).toLocaleDateString('id-ID')}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold text-rc-main uppercase">{c.subject}</h4>
                                            <p className="text-xs text-rc-muted line-clamp-2 mt-1">{c.message}</p>
                                        </div>
                                        <div className="flex gap-2 w-full md:w-auto">
                                            <button onClick={() => {
                                                axios.post(`/api/admin/complaints/${c.id}/resolve`, {}, {
                                                    headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
                                                }).then(() => {
                                                    alert('Pengaduan diselesaikan!');
                                                    fetchData();
                                                }).catch(e => alert('Gagal resolve pengaduan'));
                                            }} disabled={c.status !== 'open'} className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-[10px] uppercase hover:bg-blue-500 transition disabled:opacity-50">Tandai Selesai</button>
                                            <button className="flex-1 md:flex-none bg-rc-bg text-rc-muted px-6 py-2 rounded-lg font-bold text-[10px] uppercase hover:text-red-500 transition border border-rc-main/10">Hapus</button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-20 text-rc-muted opacity-50 uppercase tracking-widest font-bold">Belum ada pengaduan yang masuk.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab: Tax Settings (Atur Pajak) */}
                    {activeTab === 'tax_settings' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="mb-8">
                                <h2 className="text-xl font-black uppercase tracking-tighter text-rc-main">Konfigurasi Pajak & Biaya Layanan</h2>
                                <p className="text-xs text-rc-muted uppercase font-bold tracking-widest mt-1 opacity-60">Atur besaran pajak negara dan layanan per wilayah operasional</p>
                            </div>
                            <div className="bg-rc-card rounded-[2rem] border-[0.5px] border-white/10 p-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -z-10"></div>

                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                    <div>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                            <i className="fa-solid fa-earth-americas text-blue-500"></i> Wilayah & Biaya Aktif
                                        </h3>
                                        <p className="text-xs text-rc-muted font-bold uppercase tracking-widest mt-1 opacity-60">Konfigurasi Global Pajak, Kurs, dan Logistik per Negara</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={fetchData} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all shadow-lg" title="Refresh Data">
                                            <i className="fa-solid fa-rotate"></i>
                                        </button>
                                        <button onClick={handleSaveTaxes} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-xl shadow-blue-600/20 transition-all flex items-center gap-3">
                                            <i className="fa-solid fa-floppy-disk"></i> Simpan Perubahan
                                        </button>
                                    </div>
                                </div>

                                <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-black/20">
                                    <div className="overflow-x-auto no-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-white/[0.03] text-[9px] font-black uppercase text-rc-muted border-b border-white/10">
                                                    <th className="p-5 min-w-[150px]">Negara / Wilayah</th>
                                                    <th className="p-5 min-w-[180px] text-pink-400 border-l border-white/5"><i className="fa-solid fa-coins mr-1"></i> Keuangan (Kurs)</th>
                                                    <th className="p-5 min-w-[120px] text-blue-400 border-l border-white/5"><i className="fa-solid fa-percent mr-1"></i> Pajak & Layanan</th>
                                                    <th className="p-5 min-w-[180px] text-green-400 border-l border-white/5"><i className="fa-solid fa-truck-ramp-box mr-1"></i> Pengiriman (Reg/Exp)</th>
                                                    <th className="p-5 min-w-[250px] text-purple-400 border-l border-white/5"><i className="fa-solid fa-handshake mr-1"></i> Fee Mitra (M/L/SK/SL)</th>
                                                    <th className="p-5 text-right border-l border-white/5">Opsi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm font-bold text-rc-main divide-y divide-white/5">
                                                {countrySettings.map((country, idx) => (
                                                    <tr key={country.id} className="hover:bg-white/[0.02] transition-colors group">
                                                        <td className="p-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 text-lg font-black uppercase">
                                                                    {country.code?.substring(0, 2)}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-white text-sm uppercase tracking-tight">{country.name}</span>
                                                                    <span className="text-[10px] text-blue-500/70 font-black tracking-[0.2em]">{country.code}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-5 border-l border-white/5">
                                                            <div className="flex items-center gap-2">
                                                                <input type="text" value={country.currency_code} onChange={e => {
                                                                    const newList = [...countrySettings];
                                                                    newList[idx].currency_code = e.target.value;
                                                                    setCountrySettings(newList);
                                                                }} className="bg-white/5 border border-white/10 p-2 rounded-lg text-[10px] w-14 focus:border-pink-500 outline-none text-pink-400 uppercase text-center" />
                                                                <input type="text" value={country.currency_symbol} onChange={e => {
                                                                    const newList = [...countrySettings];
                                                                    newList[idx].currency_symbol = e.target.value;
                                                                    setCountrySettings(newList);
                                                                }} className="bg-white/5 border border-white/10 p-2 rounded-lg text-[10px] w-10 focus:border-pink-500 outline-none text-pink-400 text-center" />
                                                                <div className="text-[10px] text-rc-muted mx-1">/</div>
                                                                <input type="number" step="0.000001" value={country.exchange_rate} onChange={e => {
                                                                    const newList = [...countrySettings];
                                                                    newList[idx].exchange_rate = e.target.value;
                                                                    setCountrySettings(newList);
                                                                }} className="bg-white/5 border border-white/10 p-2 rounded-lg text-[10px] w-24 focus:border-pink-500 outline-none text-white" />
                                                            </div>
                                                        </td>
                                                        <td className="p-5 border-l border-white/5">
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[9px] text-rc-muted w-4">TX</span>
                                                                    <input type="number" value={country.tax_rate} onChange={e => {
                                                                        const newList = [...countrySettings];
                                                                        newList[idx].tax_rate = e.target.value;
                                                                        setCountrySettings(newList);
                                                                    }} className="bg-white/5 border border-white/10 p-2 rounded-lg text-[10px] w-full focus:border-blue-500 outline-none text-blue-400 font-black" />
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[9px] text-rc-muted w-4">SV</span>
                                                                    <input type="number" value={country.service_fee} onChange={e => {
                                                                        const newList = [...countrySettings];
                                                                        newList[idx].service_fee = e.target.value;
                                                                        setCountrySettings(newList);
                                                                    }} className="bg-white/5 border border-white/10 p-2 rounded-lg text-[10px] w-full focus:border-blue-500 outline-none text-blue-400" />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-5 border-l border-white/5">
                                                            <div className="flex flex-col gap-2">
                                                                <input type="number" placeholder="Santai" value={country.shipping_fee_santai} onChange={e => {
                                                                    const newList = [...countrySettings];
                                                                    newList[idx].shipping_fee_santai = e.target.value;
                                                                    setCountrySettings(newList);
                                                                }} className="bg-white/5 border border-white/10 p-2 rounded-lg text-[10px] w-full focus:border-green-500 outline-none text-green-400" />
                                                                <input type="number" placeholder="Cepat" value={country.shipping_fee_cepat} onChange={e => {
                                                                    const newList = [...countrySettings];
                                                                    newList[idx].shipping_fee_cepat = e.target.value;
                                                                    setCountrySettings(newList);
                                                                }} className="bg-white/5 border border-white/10 p-2 rounded-lg text-[10px] w-full focus:border-green-500 outline-none text-green-400 font-black" />
                                                            </div>
                                                        </td>
                                                        <td className="p-5 border-l border-white/5">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <input type="number" title="Fee Mitra" value={country.partner_fee} onChange={e => {
                                                                    const newList = [...countrySettings];
                                                                    newList[idx].partner_fee = e.target.value;
                                                                    setCountrySettings(newList);
                                                                }} className="bg-white/5 border border-white/10 p-2 rounded-lg text-[10px] focus:border-purple-500 outline-none" />
                                                                <input type="number" title="Fee Logistik" value={country.logistics_fee} onChange={e => {
                                                                    const newList = [...countrySettings];
                                                                    newList[idx].logistics_fee = e.target.value;
                                                                    setCountrySettings(newList);
                                                                }} className="bg-white/5 border border-white/10 p-2 rounded-lg text-[10px] focus:border-purple-500 outline-none" />
                                                                <input type="number" title="Staff Kurir" value={country.courier_staff_fee} onChange={e => {
                                                                    const newList = [...countrySettings];
                                                                    newList[idx].courier_staff_fee = e.target.value;
                                                                    setCountrySettings(newList);
                                                                }} className="bg-white/5 border border-white/10 p-2 rounded-lg text-[10px] focus:border-orange-500 outline-none" />
                                                                <input type="number" title="Staff Logistik" value={country.logistics_staff_fee} onChange={e => {
                                                                    const newList = [...countrySettings];
                                                                    newList[idx].logistics_staff_fee = e.target.value;
                                                                    setCountrySettings(newList);
                                                                }} className="bg-white/5 border border-white/10 p-2 rounded-lg text-[10px] focus:border-orange-500 outline-none" />
                                                            </div>
                                                        </td>
                                                        <td className="p-5 border-l border-white/5 text-right">
                                                            <button
                                                                title="Hapus Wilayah"
                                                                onClick={async () => {
                                                                    if (!window.confirm(`Yakin ingin menghapus wilayah ${country.name}?`)) return;
                                                                    try {
                                                                        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } };
                                                                        await axios.delete(`/api/regions/${country.id}`, config);
                                                                        alert('Wilayah berhasil dihapus.');
                                                                        fetchData();
                                                                    } catch (err) {
                                                                        alert('Gagal: ' + (err.response?.data?.message || 'Terjadi kesalahan'));
                                                                    }
                                                                }}
                                                                className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all flex items-center justify-center border border-red-500/20 ml-auto"
                                                            >
                                                                <i className="fa-solid fa-trash-can"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}

                                                {/* Premium Add Row */}
                                                <tr className="bg-blue-600/[0.05] border-t-2 border-blue-600/20">
                                                    <td className="p-5">
                                                        <div className="flex flex-col gap-2">
                                                            <input id="new-region-name" placeholder="Nama Negara" className="bg-black/40 border border-blue-500/30 p-3 rounded-xl text-xs w-full focus:border-blue-500 outline-none text-white" />
                                                            <input id="new-region-code" placeholder="Kode (ID/MY)" className="bg-black/40 border border-blue-500/30 p-2 rounded-lg text-[10px] w-20 focus:border-blue-500 outline-none text-blue-400 uppercase font-black" />
                                                        </div>
                                                    </td>
                                                    <td className="p-5 border-l border-white/5">
                                                        <div className="flex items-center gap-2">
                                                            <input id="new-region-cur-code" placeholder="MYR" className="bg-black/40 border border-pink-500/30 p-2 rounded-lg text-[10px] w-14 focus:border-pink-500 outline-none" />
                                                            <input id="new-region-cur-sym" placeholder="RM" className="bg-black/40 border border-pink-500/30 p-2 rounded-lg text-[10px] w-10 focus:border-pink-500 outline-none" />
                                                            <input id="new-region-rate" type="number" step="0.000001" placeholder="0.0003" className="bg-black/40 border border-pink-500/30 p-2 rounded-lg text-[10px] w-24 focus:border-pink-500 outline-none" />
                                                        </div>
                                                    </td>
                                                    <td className="p-5 border-l border-white/5">
                                                        <div className="flex flex-col gap-2">
                                                            <input id="new-region-tax" type="number" placeholder="Tax %" className="bg-black/40 border border-blue-500/30 p-2 rounded-lg text-[10px] focus:border-blue-500 outline-none" />
                                                            <input id="new-region-service" type="number" placeholder="Service %" className="bg-black/40 border border-blue-500/30 p-2 rounded-lg text-[10px] focus:border-blue-500 outline-none" />
                                                        </div>
                                                    </td>
                                                    <td className="p-5 border-l border-white/5">
                                                        <div className="flex flex-col gap-2">
                                                            <input id="new-region-santai" type="number" placeholder="Ongkir Santai" className="bg-black/40 border border-green-500/30 p-2 rounded-lg text-[10px] focus:border-green-500 outline-none" />
                                                            <input id="new-region-cepat" type="number" placeholder="Ongkir Cepat" className="bg-black/40 border border-green-500/30 p-2 rounded-lg text-[10px] focus:border-green-500 outline-none" />
                                                        </div>
                                                    </td>
                                                    <td className="p-5 border-l border-white/5">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <input id="new-region-partner" type="number" placeholder="Mitra" className="bg-black/40 border border-purple-500/30 p-2 rounded-lg text-[10px] focus:border-purple-500 outline-none" />
                                                            <button
                                                                onClick={async () => {
                                                                    const getVal = (id, def = 0) => document.getElementById(id).value || def;
                                                                    const data = {
                                                                        name: getVal('new-region-name', ''),
                                                                        code: getVal('new-region-code', ''),
                                                                        currency_code: getVal('new-region-cur-code', 'IDR'),
                                                                        currency_symbol: getVal('new-region-cur-sym', 'Rp'),
                                                                        exchange_rate: getVal('new-region-rate', 1),
                                                                        tax_rate: getVal('new-region-tax', 0),
                                                                        service_fee: getVal('new-region-service', 0),
                                                                        shipping_fee_santai: getVal('new-region-santai', 0),
                                                                        shipping_fee_cepat: getVal('new-region-cepat', 0),
                                                                        partner_fee: getVal('new-region-partner', 0),
                                                                        logistics_fee: 0, courier_staff_fee: 0, logistics_staff_fee: 0
                                                                    };
                                                                    if (!data.name || !data.code) return alert('Nama dan Kode (ID/MY) wajib diisi!');
                                                                    try {
                                                                        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } };
                                                                        await axios.post('/api/regions', data, config);
                                                                        alert('Wilayah baru berhasil ditambahkan!');
                                                                        ['new-region-name', 'new-region-code', 'new-region-cur-code', 'new-region-cur-sym', 'new-region-rate', 'new-region-tax', 'new-region-service', 'new-region-santai', 'new-region-cepat', 'new-region-partner'].forEach(id => {
                                                                            document.getElementById(id).value = '';
                                                                        });
                                                                        fetchData();
                                                                    } catch (err) {
                                                                        alert('Gagal: ' + (err.response?.data?.message || 'Terjadi kesalahan sistem'));
                                                                    }
                                                                }}
                                                                className="col-span-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase py-2 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
                                                            >
                                                                <i className="fa-solid fa-plus"></i> Tambah
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 border-l border-white/5"></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
