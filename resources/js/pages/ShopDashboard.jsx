import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import AddProductModal from '../components/Modals/AddProductModal';
import EditProfileModal from '../components/Modals/EditProfileModal';
import MiniChatPanel from '../components/MiniChatPanel';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import StaffList from '../components/StaffList';
import { 
    LayoutDashboard, Package, ClipboardList, Ticket, 
    BarChart3, Users, Play, PenTool, Crown, 
    TrendingUp, Eye, ShoppingCart, Plus, ArrowLeft, MessageCircle,
    Wallet, AlertCircle, Clock, Truck
} from 'lucide-react';

export default function ShopDashboard() {
    const navigate = useNavigate();
    const [shopData, setShopData] = useState(null);
    const [profitData, setProfitData] = useState(null);
    const [vouchers, setVouchers] = useState([]);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [staffs, setStaffs] = useState([]);
    const [pinnedProductId, setPinnedProductId] = useState(null);
    const [liveMessages, setLiveMessages] = useState([
        { id: 1, user: 'Budi', text: 'Spill produk yang merah dong kak!' },
        { id: 2, user: 'Susi', text: 'Ada diskon gak buat hari ini?' }
    ]);
    const [newLiveMsg, setNewLiveMsg] = useState('');
    
    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    
    // Active Tab & Filters
    const [activeTab, setActiveTab] = useState('produk');
    const [activeCategory, setActiveCategory] = useState('Semua');

    // Withdrawal
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawBank, setWithdrawBank] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const fetchShopData = async () => {
        try {
            const response = await axios.get('/api/shop/my');
            setShopData(response.data);
            
            // fetch insights
            axios.get('/api/shop/insights').then(res => setInsights(res.data)).catch(e => console.log(e));
            // fetch profit silently
            axios.get('/api/shop/profit').then(res => setProfitData(res.data)).catch(e => console.log(e));
            // fetch vouchers silently
            axios.get('/api/vouchers').then(res => setVouchers(res.data)).catch(e => console.log(e));
            // fetch staff
            axios.get('/api/user/staff').then(res => setStaffs(res.data)).catch(e => console.log(e));
        } catch (err) {
            if (err.response && err.response.status === 404) {
                navigate('/daftar-toko'); // Jika belum daftar
            } else {
                setError('Gagal memuat data toko.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        setIsWithdrawing(true);
        try {
            await axios.post('/api/withdrawals', {
                amount: withdrawAmount,
                type: 'shop',
                bank_info: withdrawBank
            });
            alert("Penarikan dana berhasil diajukan!");
            setWithdrawAmount('');
            setWithdrawBank('');
            // refresh profit
            axios.get('/api/shop/profit').then(res => setProfitData(res.data)).catch(e => console.log(e));
        } catch (e) {
            alert(e.response?.data?.message || "Gagal menarik dana");
        } finally {
            setIsWithdrawing(false);
        }
    };

    useEffect(() => {
        fetchShopData();
    }, []);

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setIsAddModalOpen(true);
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Hapus produk ini secara permanen?')) return;
        try {
            await axios.delete(`/api/shop/product/${productId}`);
            fetchShopData();
        } catch (err) {
            alert('Gagal menghapus produk ini.');
        }
    };

    const handleVerifyShop = async () => {
        if (!window.confirm('Tingkatkan tokomu menjadi Raden?')) return;
        try {
            await axios.post('/api/shop/verify');
            alert("Toko berhasil diverifikasi menjadi Raden!");
            fetchShopData();
        } catch (err) {
            alert("Gagal memverifikasi toko.");
        }
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await axios.post(`/api/shop/orders/${orderId}/status`, { status: newStatus });
            fetchShopData(); // reload
        } catch(e) {
            alert("Gagal update status.");
        }
    };

    // Voucher handling
    const [newVoucher, setNewVoucher] = useState({
        nama_voucher: '', code: '', type: 'percentage', value: '', min_purchase: '', valid_until: '', kuota: ''
    });

    const handleCreateVoucher = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/vouchers', newVoucher);
            alert("Voucher Toko berhasil dibuat");
            setNewVoucher({ nama_voucher: '', code: '', type: 'percentage', value: '', min_purchase: '', valid_until: '', kuota: '' });
            fetchShopData();
        } catch (e) {
            alert(e.response?.data?.message || "Gagal memproses voucher");
        }
    };

    const handleDeleteVoucher = async (id) => {
        if (!window.confirm("Hapus voucher ini?")) return;
        try {
            await axios.delete(`/api/vouchers/${id}`);
            fetchShopData();
        } catch (e) {
            alert("Gagal menghapus voucher");
        }
    };

    const handleSendLiveMsg = (e) => {
        e.preventDefault();
        if (!newLiveMsg) return;
        setLiveMessages(prev => [...prev, { id: Date.now(), user: 'Host (Anda)', text: newLiveMsg }]);
        setNewLiveMsg('');
    };

    if (loading) return (
        <div className="bg-[#0b0c10] min-h-screen flex text-rc-main">
            <div className="flex-1 p-4 md:p-8 ml-0 md:ml-64">
                <div className="h-10 bg-rc-card w-1/4 rounded animate-pulse mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[1,2,3].map(i => <div key={i} className="h-32 bg-rc-card rounded-xl animate-pulse border-[0.5px] border-rc-main/10"></div>)}
                </div>
                <div className="h-64 bg-rc-card rounded-xl animate-pulse border-[0.5px] border-rc-main/10"></div>
            </div>
        </div>
    );
    if (error) return <div className="p-8 text-center text-red-500 bg-rc-bg min-h-screen">{error}</div>;
    if (!shopData) return null;

    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    const categories = shopData?.products 
        ? ['Semua', ...new Set(shopData.products.map(p => p.kategori).filter(Boolean))] 
        : ['Semua'];

    const filteredProducts = shopData?.products 
        ? (activeCategory === 'Semua' ? shopData.products : shopData.products.filter(p => p.kategori === activeCategory))
        : [];

    return (
        <div className="bg-rc-bg min-h-screen text-rc-main font-sans pb-16">
            
            {/* Header / Banner - Consistent 16:9 Ratio */}
            <div className="w-full aspect-[16/9] bg-cover bg-center relative bg-rc-card" style={{ backgroundImage: `url("${shopData.full_banner_url}"), url("https://placehold.co/1200x400/1a1b23/FFCC00?text=RadenCak+Banner")` }}>
                {/* Overlay Hitam Halus untuk memastikan teks di bawahnya bisa dibaca */}
                <div className="absolute inset-0 bg-rc-bg/40"></div>
                
                {/* Tombol Kembali (Home) */}
                <div className="absolute top-6 left-4 md:left-8 z-10">
                    <button onClick={() => navigate('/dashboard')} className="bg-rc-card/50 hover:bg-rc-card text-rc-main px-5 py-2 text-[10px] sm:text-xs font-semibold tracking-widest uppercase rounded-md transition-colors flex items-center gap-2 border-[0.5px] border-rc-main/10">
                        <i className="fa-solid fa-arrow-left"></i> BERANDA UTAMA
                    </button>
                </div>

                {/* Profile Section - Minimalist */}
                <div className="absolute -bottom-16 left-4 md:left-10 flex items-end space-x-5 z-10">
                    <div className="relative">
                        <img 
                            src={shopData.full_profil_url} 
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(shopData.nama_toko)}&background=27272a&color=FFCC00&bold=true&size=512`;
                            }}
                            alt="Avatar" 
                            className="w-24 h-24 md:w-32 md:h-32 rounded-lg border-4 border-rc-bg bg-rc-bg object-cover"
                        />
                        {shopData.shop_tier === 'raden' && (
                           <div className="absolute -top-3 -right-3 bg-rc-logo text-rc-bg p-1.5 px-3 uppercase text-[9px] font-bold rounded flex items-center gap-1">
                               <i className="fa-solid fa-crown"></i> RADEN
                           </div>
                        )}
                    </div>
                    <div className="mb-2">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-rc-main uppercase drop-shadow-md">
                            {shopData.nama_toko}
                        </h1>
                        <div className="text-xs text-rc-main/80 mt-1 uppercase flex flex-col items-start gap-1 font-medium drop-shadow-md">
                            <div className="flex items-center gap-2"><i className="fa-solid fa-location-dot text-rc-logo"></i> {shopData.alamat_toko}</div>
                            <div className="flex flex-wrap gap-2 pl-5 opacity-80 text-[10px]">
                                {shopData.district && <span className="bg-rc-main/5 px-2 py-0.5 rounded border border-rc-main/10">Kec. {shopData.district}</span>}
                                {shopData.regency && <span className="bg-rc-main/5 px-2 py-0.5 rounded border border-rc-main/10">{shopData.regency}</span>}
                                {shopData.province && <span className="bg-rc-main/5 px-2 py-0.5 rounded border border-rc-main/10">Prov. {shopData.province}</span>}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Actions Right */}
                <div className="absolute bottom-4 right-4 md:right-8 flex gap-3">
                    {shopData.shop_tier !== 'raden' && (
                        <button onClick={handleVerifyShop} className="bg-rc-logo hover:opacity-80 text-rc-bg text-[10px] sm:text-xs font-bold tracking-widest px-5 py-2.5 rounded-md transition-colors uppercase flex items-center gap-2">
                            <i className="fa-solid fa-crown"></i> Verifikasi Raden
                        </button>
                    )}
                    <button onClick={() => setIsEditProfileOpen(true)} className="bg-rc-main hover:opacity-80 text-rc-bg px-5 py-2.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase rounded-md transition-colors flex items-center gap-2">
                        <i className="fa-solid fa-pen"></i> TATA PROFIL
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-24">
                {/* Tabs - Clean Elegant Underlines */}
                <div className="flex border-b-[0.5px] border-rc-main/20 mb-8 gap-8 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'produk', label: `KATALOG (${shopData.products?.length || 0})`, icon: Package },
                        { id: 'pesanan', label: 'MANAJEMEN ORDER', icon: ClipboardList },
                        { id: 'promosi', label: 'VOUCHER TOKO', icon: Ticket },
                        { id: 'laporan', label: 'INSIGHTS', icon: BarChart3 },
                        ...(shopData.shop_tier === 'raden' ? [
                            { id: 'karyawan', label: 'KARYAWAN', icon: Users },
                            { id: 'live', label: 'LIVE STUDIO', icon: Play }
                        ] : [])
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 font-semibold tracking-wider text-[10px] md:text-xs uppercase whitespace-nowrap transition-all relative flex items-center gap-2 ${activeTab === tab.id ? 'text-rc-main' : 'text-rc-muted hover:text-rc-main/70'}`}
                        >   
                            <tab.icon size={14} className={activeTab === tab.id ? 'text-rc-logo' : 'text-rc-muted'} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div 
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 w-full h-[2px] bg-rc-main"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab: Produk */}
                {activeTab === 'produk' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Product Category Tabs */}
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-colors whitespace-nowrap ${activeCategory === cat ? 'bg-rc-main text-rc-bg' : 'bg-rc-card/50 border-[0.5px] border-rc-main/10 text-rc-muted hover:bg-rc-card hover:text-rc-main'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => { setEditingProduct(null); setIsAddModalOpen(true); }}
                                className="bg-rc-main hover:opacity-80 text-rc-bg px-5 py-2.5 rounded-md text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition-colors flex-shrink-0"
                            >
                                <i className="fa-solid fa-plus"></i> KREASI PRODUK
                            </button>
                        </div>
                        
                        {filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {filteredProducts.map(product => (
                                    <ProductCard 
                                        key={product.id} 
                                        product={{...product, shop: shopData}} 
                                        onEdit={() => handleEditProduct(product)}
                                        onDelete={() => handleDeleteProduct(product.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-rc-card/20 rounded-xl border-[0.5px] border-rc-main/10">
                                <i className="fa-solid fa-box-open text-3xl text-rc-muted/50 mb-4 block"></i>
                                <p className="text-xs uppercase tracking-widest font-semibold text-rc-muted">TIDAK ADA PRODUK DITEMUKAN</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Pesanan */}
                {activeTab === 'pesanan' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {[
                                { id: 'paid', label: 'PESANAN BARU', color: 'border-red-500', icon: AlertCircle },
                                { id: 'processing', label: 'SEDANG DIPROSES', color: 'border-blue-500', icon: Clock },
                                { id: 'ready_for_pickup', label: 'SIAP DIJEMPUT', color: 'border-rc-logo', icon: Truck }
                            ].map(col => {
                                const colOrders = (shopData.orders || []).filter(o => o.status === col.id || (col.id === 'paid' && o.status === 'pending'));
                                return (
                                    <div key={col.id} className="flex flex-col gap-4">
                                        <div className={`flex items-center justify-between p-4 bg-rc-card rounded-xl border-t-4 ${col.color} shadow-lg`}>
                                            <div className="flex items-center gap-2">
                                                <col.icon size={16} className={col.color.replace('border-', 'text-')} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-rc-main">{col.label}</span>
                                            </div>
                                            <span className="bg-white/5 px-2 py-1 rounded text-[9px] font-bold text-rc-muted">{colOrders.length}</span>
                                        </div>
                                        <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto no-scrollbar">
                                            {colOrders.length === 0 ? (
                                                <div className="py-10 text-center bg-rc-card/20 rounded-xl border border-dashed border-white/5">
                                                    <p className="text-[9px] font-bold text-rc-muted uppercase tracking-widest">Kosong</p>
                                                </div>
                                            ) : (
                                                colOrders.map(order => (
                                                    <div key={order.id} className="bg-rc-card p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="text-xs font-black text-rc-logo">{formatRp(order.total_amount)}</div>
                                                            <div className="text-[9px] font-bold text-rc-muted uppercase">#{order.id.toString().slice(-6)}</div>
                                                        </div>
                                                        <div className="space-y-2 mb-4">
                                                            {(order.items || []).slice(0, 2).map((item, idx) => (
                                                                <div key={idx} className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded bg-rc-bg border border-white/5 flex-shrink-0 overflow-hidden">
                                                                        <img src={item.product?.primary_image} className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <div className="text-[9px] font-medium text-rc-muted truncate">{item.qty}x {item.product?.nama_produk}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {(order.status === 'pending' || order.status === 'paid') && (
                                                                <button onClick={() => handleUpdateStatus(order.id, 'processing')} className="w-full py-2 bg-white/5 hover:bg-rc-main hover:text-rc-bg text-rc-main text-[9px] font-black uppercase rounded-lg transition-all border border-white/10">
                                                                    TERIMA & KEMAS
                                                                </button>
                                                            )}
                                                            {order.status === 'processing' && (
                                                                <button onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')} className="w-full py-2 bg-rc-logo hover:opacity-80 text-rc-bg text-[9px] font-black uppercase rounded-lg transition-all">
                                                                    PANGGIL KURIR
                                                                </button>
                                                            )}
                                                            {order.status === 'ready_for_pickup' && (
                                                                <div className="w-full py-2 bg-white/5 text-rc-muted text-[9px] font-black uppercase rounded-lg text-center border border-white/10">
                                                                    MENUNGGU KURIR...
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Tab: Promosi / Vouchers */}
                {activeTab === 'promosi' && (
                    <div className="space-y-6 animate-fade-in">
                        <form onSubmit={handleCreateVoucher} className="bg-rc-card p-6 rounded-xl border-[0.5px] border-rc-main/20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="lg:col-span-4 mb-2">
                                <h3 className="text-sm font-bold text-rc-logo uppercase tracking-widest flex items-center gap-2 border-b-[0.5px] border-rc-main/20 pb-3">
                                    <i className="fa-solid fa-tags"></i> BUAT VOUCHER DISKON TOKO
                                </h3>
                            </div>
                            <div className="lg:col-span-2">
                                <label className="block text-[10px] uppercase font-bold text-rc-muted mb-1">Nama Promo</label>
                                <input type="text" required value={newVoucher.nama_voucher} onChange={e => setNewVoucher({...newVoucher, nama_voucher: e.target.value})} className="w-full p-2 bg-rc-bg border-[0.5px] border-rc-main/10 text-rc-main focus:outline-none rounded text-xs" placeholder="Misal: Flash Sale Toko" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-rc-muted mb-1">Kode Spesifik</label>
                                <input type="text" required value={newVoucher.code} onChange={e => setNewVoucher({...newVoucher, code: e.target.value})} className="w-full p-2 bg-rc-bg border-[0.5px] border-rc-main/10 text-rc-main focus:outline-none rounded text-xs uppercase" placeholder="TOKODISKON" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-rc-muted mb-1">Batas Kuota Pemakaian</label>
                                <input type="number" min="1" required value={newVoucher.kuota} onChange={e => setNewVoucher({...newVoucher, kuota: e.target.value})} className="w-full p-2 bg-rc-bg border-[0.5px] border-rc-main/10 text-rc-main focus:outline-none rounded text-xs" placeholder="100" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-rc-muted mb-1">Format Potongan</label>
                                <select value={newVoucher.type} onChange={e => setNewVoucher({...newVoucher, type: e.target.value})} className="w-full p-2 bg-rc-bg border-[0.5px] border-rc-main/10 text-rc-main focus:outline-none rounded text-xs uppercase font-bold">
                                    <option value="percentage">Persentase (%)</option>
                                    <option value="fixed">Rupiah (Rp)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-rc-muted mb-1">Nilai Potongan</label>
                                <input type="number" min="0" required value={newVoucher.value} onChange={e => setNewVoucher({...newVoucher, value: e.target.value})} className="w-full p-2 bg-rc-bg border-[0.5px] border-rc-main/10 text-rc-main focus:outline-none rounded text-xs" placeholder={newVoucher.type === 'percentage' ? 'Ex: 10' : 'Ex: 50000'} />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-rc-muted mb-1">Min. Belanja (Rp)</label>
                                <input type="number" min="0" required value={newVoucher.min_purchase} onChange={e => setNewVoucher({...newVoucher, min_purchase: e.target.value})} className="w-full p-2 bg-rc-bg border-[0.5px] border-rc-main/10 text-rc-main focus:outline-none rounded text-xs" placeholder="0 = Tanpa Syarat" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-rc-muted mb-1">Kedaluwarsa Pada</label>
                                <input type="date" required value={newVoucher.valid_until} onChange={e => setNewVoucher({...newVoucher, valid_until: e.target.value})} className="w-full p-2 bg-rc-bg border-[0.5px] border-rc-main/10 text-rc-main focus:outline-none rounded text-xs uppercase" />
                            </div>
                            <div className="lg:col-span-4 mt-2">
                                <button type="submit" className="w-full bg-rc-main hover:opacity-80 text-rc-bg px-4 py-2.5 text-xs font-bold rounded-md transition-colors uppercase tracking-widest">
                                    TERBITKAN VOUCHER
                                </button>
                            </div>
                        </form>

                        {vouchers.length === 0 ? (
                            <div className="text-center py-20 bg-rc-card/20 rounded-xl border-[0.5px] border-rc-main/10">
                                <i className="fa-solid fa-tags text-3xl text-rc-muted/50 mb-4 block"></i>
                                <p className="text-xs uppercase tracking-widest font-semibold text-rc-muted">BELUM ADA VOUCHER AKTIF</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {vouchers.map(v => (
                                    <div key={v.id} className="relative group p-6 rounded-xl border-[0.5px] border-rc-main/20 bg-rc-card flex flex-col justify-between hover:border-rc-logo transition-colors">
                                        <div>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="text-sm font-bold text-rc-main uppercase tracking-widest">{v.nama_voucher}</div>
                                                <div className="bg-rc-bg border-[0.5px] border-rc-logo px-2.5 py-1 rounded text-[10px] font-bold text-rc-logo tracking-widest">
                                                    {v.type === 'percentage' ? `${v.value}% OFF` : formatRp(v.value)}
                                                </div>
                                            </div>
                                            <code className="bg-rc-bg text-rc-main font-mono text-xs px-3 py-1.5 rounded tracking-wider border-[0.5px] border-rc-main/10 inline-block mb-4">{v.code}</code>
                                            <div className="text-[10px] font-semibold text-rc-muted flex flex-col gap-1.5 uppercase tracking-wide">
                                                <span className="flex justify-between"><span>MIN. BELANJA:</span> <span>{formatRp(v.min_purchase)}</span></span>
                                                <span className="flex justify-between"><span>SISA KUOTA:</span> <span>{v.kuota} TRANSAKSI</span></span>
                                                <span className="flex justify-between"><span>BERLAKU S/D:</span> <span>{new Date(v.valid_until).toLocaleDateString('id-ID')}</span></span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteVoucher(v.id)} className="absolute top-4 right-4 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white w-8 h-8 rounded-md opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                            <i className="fa-solid fa-trash-can text-sm"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Laporan / Insights */}
                {activeTab === 'laporan' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                            <div className="bg-rc-card p-6 rounded-xl border border-rc-main/10 shadow-lg relative overflow-hidden group">
                                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                                    <TrendingUp size={100} />
                                </div>
                                <div className="text-rc-muted text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                                    <i className="fa-solid fa-credit-card"></i> SALDO TERSEDIA
                                </div>
                                <div className="text-2xl md:text-3xl font-bold tracking-tight text-rc-logo">{profitData ? formatRp(profitData.total_profit - (profitData.withdrawn || 0)) : 'Rp 0'}</div>
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">+8.2%</span>
                                    <span className="text-[10px] text-rc-muted uppercase">vs bulan lalu</span>
                                </div>
                            </div>
                            <div className="bg-rc-card p-6 rounded-xl border border-rc-main/10 shadow-lg">
                                <div className="text-rc-muted text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                                    <Eye size={14} className="text-blue-400" /> TOTAL KUNJUNGAN
                                </div>
                                <div className="text-2xl md:text-3xl font-bold tracking-tight text-rc-main">{insights?.summary?.total_products ? '2,481' : '0'} <span className="text-xs text-rc-muted font-medium uppercase">VIEW</span></div>
                                <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[65%]"></div>
                                </div>
                            </div>
                            <div className="bg-rc-card p-6 rounded-xl border border-rc-main/10 shadow-lg">
                                <div className="text-rc-muted text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                                    <ClipboardList size={14} className="text-emerald-400" /> TOTAL PESANAN
                                </div>
                                <div className="text-2xl md:text-3xl font-bold tracking-tight text-rc-main">{insights?.summary?.total_orders || '0'} <span className="text-xs text-rc-muted font-medium uppercase">TRANSAKSI</span></div>
                                <div className="mt-4 text-[10px] text-emerald-400 font-bold uppercase">{insights?.summary?.pending_orders || 0} PERLU DIPROSES</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-rc-card p-8 rounded-xl border border-rc-main/10">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xs font-black uppercase text-rc-main tracking-widest">Performa Penjualan</h3>
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 bg-rc-logo rounded-full"></div>
                                        <span className="text-[10px] font-bold text-rc-muted uppercase">Revenue (IDR)</span>
                                    </div>
                                </div>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={insights?.revenue_chart || []}>
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f5cc00" stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor="#f5cc00" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                            <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                                            <YAxis hide />
                                            <Tooltip contentStyle={{ backgroundColor: '#1a1b23', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                                            <Area type="monotone" dataKey="revenue" stroke="#f5cc00" strokeWidth={3} fill="url(#colorRev)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-rc-card p-6 rounded-xl border border-rc-main/10">
                                <h3 className="text-xs font-black uppercase text-rc-main tracking-widest mb-6">Produk Terpopuler</h3>
                                <div className="space-y-4">
                                    {(insights?.top_products || []).map((p, i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors group">
                                            <div className="w-8 h-8 rounded-lg bg-rc-bg flex items-center justify-center font-black text-rc-logo text-xs border border-rc-main/10 group-hover:border-rc-logo transition-colors">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <h4 className="text-[10px] font-bold text-rc-main truncate uppercase">{p.nama_produk}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[9px] text-rc-muted flex items-center gap-1"><Eye size={10} /> {p.views}</span>
                                                    <span className="text-[9px] text-rc-muted flex items-center gap-1"><ShoppingCart size={10} /> {p.cart_adds}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-rc-card p-8 rounded-xl border border-rc-main/20 shadow-xl">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-rc-logo/10 flex items-center justify-center text-rc-logo text-xl shadow-lg">
                                    <Wallet size={24} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-rc-main">Tarik Saldo Pendapatan</h4>
                                    <p className="text-[10px] text-rc-muted uppercase tracking-wider">Pencairan dana otomatis ke rekening terdaftar</p>
                                </div>
                            </div>
                            <form onSubmit={handleWithdraw} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-rc-muted mb-2 tracking-widest">Nominal Tarik (Rp)</label>
                                    <input required type="number" min="10000" max={profitData ? profitData.total_profit - (profitData.withdrawn || 0) : 0} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="w-full bg-rc-bg p-3 border border-rc-main/10 rounded-xl outline-none focus:border-rc-logo text-xs text-rc-main transition-all" placeholder="Min. 10000" />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-rc-muted mb-2 tracking-widest">Tujuan Pengiriman Dana</label>
                                    <input required type="text" value={withdrawBank} onChange={e => setWithdrawBank(e.target.value)} className="w-full bg-rc-bg p-3 border border-rc-main/10 rounded-xl outline-none focus:border-rc-logo text-xs text-rc-main transition-all" placeholder="Bank - No. Rekening - Nama" />
                                </div>
                                <button type="submit" disabled={isWithdrawing || !profitData || (profitData.total_profit - (profitData.withdrawn||0)) < 10000} className="bg-rc-logo text-rc-bg font-black text-[10px] tracking-widest py-3.5 rounded-xl shadow-lg shadow-rc-logo/20 uppercase hover:bg-yellow-400 transition-all transform hover:-translate-y-1 disabled:opacity-30">
                                    {isWithdrawing ? 'MEMPROSES...' : 'AJUKAN PENCAIRAN'}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}

                {/* Tab: Karyawan */}
                {activeTab === 'karyawan' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="bg-gradient-to-br from-rc-logo/10 to-transparent p-10 rounded-xl border-[0.5px] border-rc-logo/30">
                            <h3 className="text-sm font-black uppercase text-rc-logo mb-2 tracking-widest"><i className="fa-solid fa-users-gear mr-2"></i> Manajemen Karyawan Toko</h3>
                            <p className="text-xs text-rc-muted mb-6">Kelola staf admin toko, SPG/SPB untuk membantu memproses pesanan dan live streaming.</p>
                            
                            <div className="bg-rc-bg/50 p-6 rounded-xl border-[0.5px] border-rc-main/10 max-w-lg">
                                <h4 className="text-[10px] font-black uppercase text-rc-main mb-4 tracking-widest">Undang Staff Baru</h4>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const email = e.target.email.value;
                                    try {
                                        const res = await axios.post('/api/invitations', { email });
                                        toast.success(res.data.message);
                                        e.target.reset();
                                    } catch (err) {
                                        toast.error(err.response?.data?.message || "Gagal mengundang staff");
                                    }
                                }} className="flex gap-2">
                                    <input 
                                        name="email"
                                        type="email" 
                                        placeholder="Email calon staff..." 
                                        required
                                        className="flex-1 bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main text-xs font-bold p-3 rounded-xl outline-none focus:border-rc-logo transition"
                                    />
                                    <button type="submit" className="bg-rc-logo text-rc-bg text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-yellow-400 transition-all">Undang</button>
                                </form>
                            </div>
                        </div>

                        <StaffList parentId={shopData.owner_id} />
                    </div>
                )}

                {/* Tab: Live Streaming */}
                {activeTab === 'live' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                        {/* Live Preview & Stream Stats */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="aspect-video bg-black rounded-3xl relative overflow-hidden shadow-2xl border-[0.5px] border-white/10 group">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                {/* Simulated Camera View */}
                                <div className="w-full h-full flex items-center justify-center">
                                    <i className="fa-solid fa-video-slash text-rc-muted text-4xl group-hover:scale-110 transition-transform"></i>
                                    <p className="absolute bottom-1/2 translate-y-12 text-[10px] font-black uppercase text-rc-muted tracking-[0.3em]">Kamera Belum Aktif</p>
                                </div>
                                
                                {/* Live Badges */}
                                <div className="absolute top-6 left-6 flex gap-3">
                                    <div className="bg-red-600 text-white px-3 py-1 rounded text-[9px] font-black uppercase flex items-center gap-2 shadow-lg">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div> LIVE
                                    </div>
                                    <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded text-[9px] font-black uppercase flex items-center gap-2 border border-white/10">
                                        <i className="fa-solid fa-eye"></i> 1,248
                                    </div>
                                </div>

                                {/* Pinned Product Overlay */}
                                {pinnedProductId && (
                                    <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="absolute bottom-6 left-6 right-6 md:right-auto md:w-80">
                                        <div className="bg-white rounded-2xl p-3 flex gap-4 shadow-2xl items-center border-[0.5px] border-white/20">
                                            <div className="w-16 h-16 rounded-xl bg-rc-bg overflow-hidden flex-shrink-0">
                                                <img src={shopData.products?.find(p => p.id === pinnedProductId)?.primary_image} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[10px] font-black text-black uppercase truncate">{shopData.products?.find(p => p.id === pinnedProductId)?.nama_produk}</h4>
                                                <p className="text-xs font-bold text-rc-logo drop-shadow-sm">{formatRp(shopData.products?.find(p => p.id === pinnedProductId)?.harga)}</p>
                                                <button className="mt-1 w-full bg-black text-white text-[9px] font-black py-1.5 rounded-lg uppercase">Beli Sekarang</button>
                                            </div>
                                            <button onClick={() => setPinnedProductId(null)} className="text-black/20 hover:text-red-500 p-1"><i className="fa-solid fa-xmark"></i></button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                <div className="bg-rc-card p-6 rounded-2xl border-[0.5px] border-rc-main/10 text-center">
                                    <div className="text-[10px] font-black text-rc-muted uppercase mb-1">Likes</div>
                                    <div className="text-2xl font-black text-rc-main">24.5K</div>
                                </div>
                                <div className="bg-rc-card p-6 rounded-2xl border-[0.5px] border-rc-main/10 text-center">
                                    <div className="text-[10px] font-black text-rc-muted uppercase mb-1">Orders</div>
                                    <div className="text-2xl font-black text-rc-logo">152</div>
                                </div>
                                <div className="bg-rc-card p-6 rounded-2xl border-[0.5px] border-rc-main/10 text-center">
                                    <div className="text-[10px] font-black text-rc-muted uppercase mb-1">Durasi</div>
                                    <div className="text-2xl font-black text-rc-main">01:12:04</div>
                                </div>
                            </div>

                            <div className="bg-rc-card rounded-2xl border-[0.5px] border-rc-main/10 overflow-hidden">
                                <div className="p-4 border-b-[0.5px] border-rc-main/10 flex justify-between items-center">
                                    <h3 className="text-[10px] font-black uppercase text-rc-main tracking-widest">Pin Produk ke Keranjang Live</h3>
                                </div>
                                <div className="p-4 flex gap-4 overflow-x-auto no-scrollbar">
                                    {shopData.products?.map(p => (
                                        <button 
                                            key={p.id} 
                                            onClick={() => setPinnedProductId(p.id)}
                                            className={`flex-shrink-0 w-24 space-y-2 group transition-all ${pinnedProductId === p.id ? 'opacity-100 scale-105' : 'opacity-50 hover:opacity-100'}`}
                                        >
                                            <div className={`aspect-square rounded-xl overflow-hidden border-2 transition-colors ${pinnedProductId === p.id ? 'border-rc-logo' : 'border-transparent group-hover:border-rc-main/30'}`}>
                                                <img src={p.primary_image} className="w-full h-full object-cover" />
                                            </div>
                                            <p className="text-[8px] font-bold text-rc-main uppercase truncate">{p.nama_produk}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Live Chat & Controls */}
                        <div className="flex flex-col gap-6 h-full">
                            <div className="bg-rc-card flex-1 rounded-3xl border-[0.5px] border-rc-main/10 flex flex-col min-h-[400px] max-h-[600px] overflow-hidden">
                                <div className="p-4 border-b-[0.5px] border-rc-main/10 bg-rc-main/5">
                                    <h3 className="text-[10px] font-black uppercase text-rc-main tracking-widest flex items-center gap-2">
                                        <i className="fa-solid fa-comments text-rc-logo"></i> Interaksi Live
                                    </h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                                    {liveMessages.map(msg => (
                                        <div key={msg.id} className="animate-fade-in-up">
                                            <span className="text-[9px] font-black text-rc-logo uppercase mr-2">{msg.user}:</span>
                                            <span className="text-[11px] font-medium text-rc-main">{msg.text}</span>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleSendLiveMsg} className="p-4 border-t-[0.5px] border-rc-main/10 bg-rc-bg/50">
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={newLiveMsg}
                                            onChange={e => setNewLiveMsg(e.target.value)}
                                            placeholder="Kirim pesan live..." 
                                            className="w-full bg-rc-card border-[0.5px] border-rc-main/10 text-rc-main text-xs p-3 pr-12 rounded-xl outline-none focus:border-rc-logo"
                                        />
                                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-rc-logo hover:scale-110 transition">
                                            <i className="fa-solid fa-paper-plane"></i>
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <button className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase py-5 rounded-3xl shadow-xl shadow-red-600/20 transition-all flex items-center justify-center gap-3">
                                <i className="fa-solid fa-power-off"></i> AKHIRI STREAMING
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <AddProductModal 
                key={isAddModalOpen ? (editingProduct?.id || 'new') : 'closed'}
                isOpen={isAddModalOpen} 
                onClose={() => { setIsAddModalOpen(false); setEditingProduct(null); }} 
                onSuccess={fetchShopData} 
                initialProduct={editingProduct}
            />

            <EditProfileModal 
                isOpen={isEditProfileOpen}
                onClose={() => setIsEditProfileOpen(false)}
                shopData={shopData}
                onSuccess={fetchShopData}
            />

            <MiniChatPanel 
                isOpen={isChatOpen} 
                onClose={() => setIsChatOpen(false)} 
            />

            <button 
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="fixed right-8 bottom-8 w-16 h-16 bg-rc-logo rounded-full shadow-2xl flex items-center justify-center text-rc-bg z-40 hover:scale-110 transition-all group"
            >
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[#0b0c10] animate-bounce">
                    3
                </div>
                <MessageCircle size={24} />
            </button>
        </div>
    );
}
