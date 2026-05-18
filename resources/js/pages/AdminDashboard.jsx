import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, ShieldCheck, Ticket, Truck, Headset, Wallet, ShoppingBag, Settings } from 'lucide-react';

// Components
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminOverview from '../components/admin/AdminOverview';
import AdminUsers from '../components/admin/AdminUsers';
import AdminProducts from '../components/admin/AdminProducts';
import AdminBanners from '../components/admin/AdminBanners';
import AdminShops from '../components/admin/AdminShops';
import AdminMitraRequests from '../components/admin/AdminMitraRequests';
import AdminVouchers from '../components/admin/AdminVouchers';
import AdminSettings from '../components/admin/AdminSettings';
import AdminStaffList from '../components/admin/AdminStaffList';
import AdminRegions from '../components/admin/AdminRegions';
import AdminWithdrawals from '../components/admin/AdminWithdrawals';
import AdminComplaints from '../components/admin/AdminComplaints';
import AdminPartners from '../components/admin/AdminPartners';


export default function AdminDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);

    // Data State
    const [banners, setBanners] = useState([]);
    const [products, setProducts] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [shopsList, setShopsList] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [pendingMitraCount, setPendingMitraCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Search & UI States
    const [searchFlashSale, setSearchFlashSale] = useState('');
    const [searchUsers, setSearchUsers] = useState('');
    const [searchShops, setSearchShops] = useState('');
    const [searchVouchers, setSearchVouchers] = useState('');
    const [newBanner, setNewBanner] = useState({ title: '', description: '', image: null });
    const [editBannerId, setEditBannerId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [draggedIdx, setDraggedIdx] = useState(null);
    const [hasUnsavedReorder, setHasUnsavedReorder] = useState(false);
    const [isSavingReorder, setIsSavingReorder] = useState(false);
    const [flashSaleDrafts, setFlashSaleDrafts] = useState({});
    const [isSavingFlashSale, setIsSavingFlashSale] = useState(false);

    // Pagination States
    const [pageProducts, setPageProducts] = useState(1);
    const [totalPagesProducts, setTotalPagesProducts] = useState(1);
    const [pageUsers, setPageUsers] = useState(1);
    const [totalPagesUsers, setTotalPagesUsers] = useState(1);
    const [pageShops, setPageShops] = useState(1);
    const [totalPagesShops, setTotalPagesShops] = useState(1);

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        try {
            const res = await axios.get('/api/user');
            if (res.data.role !== 'super_admin' && res.data.role !== 'admin_staff') {
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
        setLoading(true);
        try {
            const [statsRes, bannerRes, userRes, shopRes, voucherRes, withdrawalRes] = await Promise.all([
                axios.get('/api/admin/dashboard-stats'),
                axios.get('/api/admin/banners'),
                axios.get('/api/admin/users'),
                axios.get('/api/admin/shops'),
                axios.get('/api/vouchers'),
                axios.get('/api/admin/withdrawals')
            ]);
            setStats(statsRes.data);
            setBanners(bannerRes.data);
            setUsersList(userRes.data.data || userRes.data);
            setTotalPagesUsers(userRes.data.last_page || 1);
            setShopsList(shopRes.data.data || shopRes.data);
            setTotalPagesShops(shopRes.data.last_page || 1);
            setVouchers(voucherRes.data);
            setWithdrawals(withdrawalRes.data.data || withdrawalRes.data);
            
            // Fetch Pending Mitra Count
            const pendingRes = await axios.get('/api/admin/mitra/pending');
            setPendingMitraCount(pendingRes.data.length);

            fetchProducts(1);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
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

    const fetchShops = (page = 1) => {
        axios.get(`/api/admin/shops?q=${searchShops}&page=${page}`).then(res => {
            setShopsList(res.data.data || res.data);
            setTotalPagesShops(res.data.last_page || 1);
            setPageShops(page);
        }).catch(console.error);
    }

    // Banner Actions
    const handleCreateBanner = async () => {
        if (!newBanner.image) return alert("Pilih gambar banner!");
        setUploading(true);
        const fd = new FormData();
        fd.append('image', newBanner.image);
        fd.append('title', newBanner.title);
        fd.append('description', newBanner.description);
        try {
            await axios.post('/api/admin/banners', fd);
            setNewBanner({ title: '', description: '', image: null });
            const res = await axios.get('/api/admin/banners');
            setBanners(res.data);
            alert("Banner sedang diproses dan akan segera tampil!");
        } catch (e) {
            alert("Gagal tambah banner");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateBanner = async () => {
        setUploading(true);
        const fd = new FormData();
        if (newBanner.image) fd.append('image', newBanner.image);
        fd.append('title', newBanner.title);
        fd.append('description', newBanner.description);
        try {
            await axios.post(`/api/admin/banners/${editBannerId}`, fd);
            setEditBannerId(null);
            setNewBanner({ title: '', description: '', image: null });
            const res = await axios.get('/api/admin/banners');
            setBanners(res.data);
        } catch (e) {
            alert("Gagal update banner");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteBanner = async (id) => {
        if (!confirm("Hapus banner ini?")) return;
        try {
            await axios.delete(`/api/admin/banners/${id}`);
            setBanners(banners.filter(b => b.id !== id));
        } catch (e) { }
    };

    const saveReorder = async () => {
        setIsSavingReorder(true);
        try {
            await axios.post('/api/admin/banners/reorder', { ordered_ids: banners.map(b => b.id) });
            setHasUnsavedReorder(false);
        } catch (e) {
            alert("Gagal simpan urutan");
        } finally {
            setIsSavingReorder(false);
        }
    };

    const handleDragStart = (e, idx) => {
        setDraggedIdx(idx);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, idx) => {
        e.preventDefault();
        if (idx === draggedIdx) return;
        const items = [...banners];
        const draggedItem = items[draggedIdx];
        items.splice(draggedIdx, 1);
        items.splice(idx, 0, draggedItem);
        setBanners(items);
        setDraggedIdx(idx);
        setHasUnsavedReorder(true);
    };

    const handleDragEnd = () => {
        setDraggedIdx(null);
    };

    // User Actions
    const handleUpdateUserStatus = async (id, status) => {
        try {
            await axios.post(`/api/user/${id}/status`, { status });
            fetchUsers(pageUsers);
        } catch (e) {
            alert(e.response?.data?.message || "Gagal update status");
        }
    };

    const handleDeleteUser = async (id) => {
        if (!confirm("Peringatan: Menghapus user ini akan menghapus permanen Toko/Mitra dan data terkait! Lanjutkan?")) return;
        try {
            await axios.delete(`/api/admin/users/${id}`);
            fetchUsers(pageUsers);
        } catch (e) {
            alert("Gagal hapus user");
        }
    };

    const changeUserRole = async (id, newRole) => {
        try {
            await axios.put(`/api/admin/users/${id}/role`, { role: newRole });
            fetchUsers(pageUsers);
        } catch (e) { }
    };

    // Flash Sale Actions
    const handleBulkFlashSale = async (startTime, endTime) => {
        setIsSavingFlashSale(true);
        try {
            await axios.post('/api/admin/products/bulk-flash-sale', { 
                updates: flashSaleDrafts,
                flash_sale_start: startTime,
                flash_sale_end: endTime
            });
            setFlashSaleDrafts({});
            fetchProducts(pageProducts);
            alert("Status flash sale diperbarui!");
        } catch (e) {
            alert("Gagal simpan flash sale");
        } finally {
            setIsSavingFlashSale(false);
        }
    };

    if (!user || loading) return (
        <div className="min-h-screen bg-rc-bg flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 border-4 border-rc-logo/20 border-t-rc-logo rounded-full animate-spin"></div>
            <p className="text-rc-logo font-black uppercase tracking-[0.5em] animate-pulse">Menghubungkan ke Pusat Data...</p>
        </div>
    );

    return (
        <div className="bg-rc-bg min-h-screen flex font-sans selection:bg-rc-logo/30">
            <AdminSidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                isOpen={isSidebarOpen} 
                setIsOpen={setIsSidebarOpen}
                userRole={user.role}
                pendingMitraCount={pendingMitraCount}
            />

            <main className="flex-1 min-w-0 flex flex-col">
                <header className="bg-rc-card/50 backdrop-blur-md sticky top-0 z-30 border-b border-rc-main/10 p-4 flex justify-between items-center md:hidden">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-rc-main p-2">
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-rc-logo" />
                        <span className="font-black text-rc-main text-xs uppercase tracking-widest">Portal Admin</span>
                    </div>
                    <div className="w-10"></div>
                </header>

                <div className="p-4 md:p-10 max-w-7xl mx-auto w-full">
                    {/* Page Header */}
                    <div className="mb-12">
                        <h1 className="text-2xl md:text-4xl font-black text-rc-main uppercase tracking-tighter mb-2">
                            {activeTab === 'overview' ? 'Dashboard Ringkasan' : 
                             activeTab === 'banners' ? 'Manajemen Banner' :
                             activeTab === 'flash-sale' ? 'Kontrol Flash Sale' :
                             activeTab === 'users' ? 'Daftar Pengguna' :
                             activeTab === 'shops' ? 'Kelola Toko' :
                             activeTab === 'employees' ? 'Daftar Karyawan' :
                             activeTab === 'couriers' ? 'Mitra Kurir' :
                             activeTab === 'logistics' ? 'Mitra Logistik' :
                             activeTab === 'withdrawals' ? 'Keuangan & Penarikan' :
                             activeTab === 'vouchers' ? 'Manajemen Voucher' :
                             activeTab === 'complaints' ? 'Pusat Pengaduan' :
                             activeTab === 'mitra_requests' ? 'Persetujuan Mitra' :
                             activeTab === 'regions' ? 'Pajak & Konfigurasi Wilayah' :
                             activeTab === 'settings' ? 'Konfigurasi Sistem' :
                             'Portal Administrasi'}
                        </h1>
                        <p className="text-xs md:text-sm text-rc-muted font-bold uppercase tracking-widest flex items-center gap-2">
                            Selamat datang, <span className="text-rc-logo">{user.name}</span> <span className="w-1 h-1 bg-rc-muted rounded-full"></span> 
                            <span className="text-rc-main opacity-60">
                                {user.role === 'super_admin' ? 'Akses Penuh Terbuka' : 'Akses Terbatas Admin Staff'}
                            </span>
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'overview' && <AdminOverview stats={stats} />}
                            {activeTab === 'banners' && (
                                <AdminBanners 
                                    banners={banners} 
                                    newBanner={newBanner} 
                                    setNewBanner={setNewBanner}
                                    handleCreateBanner={handleCreateBanner}
                                    handleDeleteBanner={handleDeleteBanner}
                                    handleUpdateBanner={handleUpdateBanner}
                                    editBannerId={editBannerId}
                                    setEditBannerId={setEditBannerId}
                                    uploading={uploading}
                                    draggedIdx={draggedIdx}
                                    setDraggedIdx={setDraggedIdx}
                                    handleDragStart={handleDragStart}
                                    handleDragOver={handleDragOver}
                                    handleDragEnd={handleDragEnd}
                                    hasUnsavedReorder={hasUnsavedReorder}
                                    saveReorder={saveReorder}
                                    isSavingReorder={isSavingReorder}
                                />
                            )}
                            {activeTab === 'flash-sale' && (
                                <AdminProducts 
                                    products={products}
                                    searchFlashSale={searchFlashSale}
                                    setSearchFlashSale={setSearchFlashSale}
                                    flashSaleDrafts={flashSaleDrafts}
                                    setFlashSaleDrafts={setFlashSaleDrafts}
                                    handleBulkFlashSale={handleBulkFlashSale}
                                    isSavingFlashSale={isSavingFlashSale}
                                    pageProducts={pageProducts}
                                    totalPagesProducts={totalPagesProducts}
                                    fetchProducts={fetchProducts}
                                />
                            )}
                            {activeTab === 'users' && (
                                <AdminUsers 
                                    usersList={usersList}
                                    searchUsers={searchUsers}
                                    setSearchUsers={setSearchUsers}
                                    handleUpdateUserStatus={handleUpdateUserStatus}
                                    handleDeleteUser={handleDeleteUser}
                                    changeUserRole={changeUserRole}
                                    pageUsers={pageUsers}
                                    totalPagesUsers={totalPagesUsers}
                                    fetchUsers={fetchUsers}
                                    currentUser={user}
                                />
                            )}
                            {activeTab === 'shops' && (
                                <AdminShops 
                                    shopsList={shopsList}
                                    searchShops={searchShops}
                                    setSearchShops={setSearchShops}
                                    pageShops={pageShops}
                                    totalPagesShops={totalPagesShops}
                                    fetchShops={fetchShops}
                                />
                            )}
                            {activeTab === 'mitra_requests' && (
                                <AdminMitraRequests />
                            )}
                            {activeTab === 'vouchers' && (
                                <AdminVouchers />
                            )}
                            {activeTab === 'settings' && (
                                <AdminSettings />
                            )}
                            {activeTab === 'regions' && (
                                <AdminRegions />
                            )}
                            {activeTab === 'withdrawals' && (
                                <AdminWithdrawals />
                            )}
                            {activeTab === 'complaints' && (
                                <AdminComplaints />
                            )}
                            {activeTab === 'couriers' && (
                                <AdminPartners roleFilter="couriers" />
                            )}
                            {activeTab === 'logistics' && (
                                <AdminPartners roleFilter="logistics" />
                            )}
                            {activeTab === 'employees' && (
                                <AdminStaffList 
                                    usersList={usersList} 
                                    fetchUsers={fetchUsers} 
                                    pageUsers={pageUsers} 
                                    totalPagesUsers={totalPagesUsers} 
                                />
                            )}


                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

function X(props) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
