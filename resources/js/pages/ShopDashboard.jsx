import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import AddProductModal from '../components/Modals/AddProductModal';
import EditProfileModal from '../components/Modals/EditProfileModal';

export default function ShopDashboard() {
    const navigate = useNavigate();
    const [shopData, setShopData] = useState(null);
    const [profitData, setProfitData] = useState(null);
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
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
            
            // fetch profit silently
            axios.get('/api/shop/profit').then(res => setProfitData(res.data)).catch(e => console.log(e));
            // fetch vouchers silently
            axios.get('/api/vouchers').then(res => setVouchers(res.data)).catch(e => console.log(e));
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

    if (loading) return <div className="p-8 text-center text-rc-muted bg-rc-bg min-h-screen">Memuat dasbor toko...</div>;
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
            
            {/* Header / Banner - Clean & Simple */}
            <div className="w-full h-[250px] md:h-[300px] bg-cover bg-center relative" style={{ backgroundImage: `url(${shopData.banner_toko ? '/storage/' + shopData.banner_toko : '/logo_web/no-product.png'})` }}>
                {/* Overlay Hitam Halus untuk memastikan teks di bawahnya bisa dibaca */}
                <div className="absolute inset-0 bg-rc-bg/40"></div>
                
                {/* Tombol Kembali (Home) */}
                <div className="absolute top-6 left-4 md:left-8 z-10">
                    <button onClick={() => navigate('/dashboard')} className="bg-rc-card/50 hover:bg-rc-card text-rc-main px-5 py-2 text-[10px] sm:text-xs font-semibold tracking-widest uppercase rounded-md transition-colors flex items-center gap-2 border-[0.5px] border-rc-main/10">
                        <i className="fa-solid fa-arrow-left"></i> BERANDA UTAMA
                    </button>
                </div>

                {/* Profile Section - Minimalist */}
                <div className="absolute -bottom-12 left-4 md:left-10 flex items-end space-x-5 z-10">
                    <div className="relative">
                        <img src={shopData.foto_profil ? '/storage/' + shopData.foto_profil : '/logo_web/no-product.png'} alt="Avatar" className="w-24 h-24 md:w-32 md:h-32 rounded-lg border-4 border-rc-bg bg-rc-bg object-cover"/>
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
                        <p className="text-xs text-rc-main/80 mt-1 uppercase flex items-center gap-2 font-medium drop-shadow-md">
                            <i className="fa-solid fa-location-dot"></i> {shopData.alamat_toko}
                        </p>
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

            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-20">
                {/* Tabs - Clean Elegant Underlines */}
                <div className="flex border-b-[0.5px] border-rc-main/20 mb-8 gap-8 overflow-x-auto no-scrollbar">
                    {['produk', 'pesanan', 'promosi', 'laporan'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 font-semibold tracking-wider text-xs md:text-sm uppercase whitespace-nowrap transition-colors relative ${activeTab === tab ? 'text-rc-main' : 'text-rc-muted hover:text-rc-main/70'}`}
                        >   
                            {tab === 'produk' && `KATALOG (${shopData.products?.length || 0})`}
                            {tab === 'pesanan' && `MANAJEMEN ORDER`}
                            {tab === 'promosi' && `VOUCHER TOKO`}
                            {tab === 'laporan' && `INSIGHTS`}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-rc-main"></div>}
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
                    <div className="space-y-4 animate-fade-in">
                        {!shopData.orders || shopData.orders.length === 0 ? (
                            <div className="text-center py-20 bg-rc-card/20 rounded-xl border-[0.5px] border-rc-main/10">
                                <i className="fa-solid fa-clipboard-list text-3xl text-rc-muted/50 mb-4 block"></i>
                                <p className="text-xs uppercase tracking-widest font-semibold text-rc-muted">BELUM ADA PESANAN MASUK</p>
                            </div>
                        ) : (
                            shopData.orders.map(order => (
                                <div key={order.id} className="bg-rc-card border-[0.5px] border-rc-main/10 p-5 md:p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-rc-main/30 transition-colors">
                                    <div className="flex flex-col border-l-4 pl-4 
                                            ${order.status === 'pending' ? 'border-red-500' : ''}
                                            ${order.status === 'processing' ? 'border-blue-500' : ''}
                                            ${order.status === 'shipped' ? 'border-rc-logo' : ''}
                                            ${order.status === 'completed' ? 'border-green-500' : ''}">
                                        <div className="text-2xl font-bold tracking-tight text-rc-logo mb-1">{formatRp(order.total_amount)}</div>
                                        <div className="text-xs text-rc-main flex items-center gap-2 uppercase tracking-wide font-medium">Status: 
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${order.status === 'pending' ? 'bg-red-500/10 text-red-400' : order.status === 'processing' ? 'bg-blue-500/10 text-blue-400' : order.status === 'shipped' ? 'bg-rc-logo/10 text-rc-logo' : 'bg-green-500/10 text-green-400'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-rc-muted mt-2 tracking-widest"><i className="fa-solid fa-clock"></i> {new Date(order.created_at).toLocaleString()}</div>
                                    </div>
                                    <div className="flex gap-3 w-full md:w-auto">
                                        {(order.status === 'pending' || order.status === 'paid') && (
                                            <button onClick={() => handleUpdateStatus(order.id, 'processing')} className="flex-1 md:flex-none border-[0.5px] border-rc-main/30 hover:bg-rc-main text-rc-main hover:text-rc-bg font-bold tracking-widest uppercase text-xs px-5 py-2.5 rounded-md transition-colors">
                                                Kemas Barang
                                            </button>
                                        )}
                                        {order.status === 'processing' && (
                                            <button onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')} className="flex-1 md:flex-none bg-rc-logo hover:opacity-80 text-rc-bg font-bold tracking-widest uppercase text-xs px-5 py-2.5 rounded-md transition-colors">
                                                Ajukan Jemput Paket
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
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

                {/* Tab: Laporan */}
                {activeTab === 'laporan' && (
                    <div className="space-y-6">
                        <div className="animate-fade-in grid gap-6 grid-cols-1 sm:grid-cols-2">
                            <div className="bg-rc-card p-8 rounded-xl border-[0.5px] border-rc-main/10 flex flex-col justify-center">
                                <div className="text-rc-muted text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                                    <i className="fa-solid fa-credit-card"></i> SALDO TOKO TERSEDIA
                                </div>
                                <div className="text-3xl md:text-5xl font-bold tracking-tight text-rc-logo">{profitData ? formatRp(profitData.total_profit - (profitData.withdrawn || 0)) : 'Rp 0'}</div>
                                <p className="text-[10px] text-rc-muted mt-2 font-bold uppercase">Total Penghasilan: {profitData ? formatRp(profitData.total_profit) : '0'} | Ditarik: {profitData ? formatRp(profitData.withdrawn || 0) : '0'}</p>
                            </div>
                            <div className="bg-rc-card p-8 rounded-xl border-[0.5px] border-rc-main/10 flex flex-col justify-center">
                                <div className="text-rc-muted text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                                    <i className="fa-solid fa-truck-fast"></i> TRANSAKSI BERHASIL 
                                </div>
                                <div className="text-3xl md:text-5xl font-bold tracking-tight text-rc-main">{profitData ? profitData.completed_orders_count : '0'} <span className="text-lg text-rc-muted font-medium">Pesanan</span></div>
                            </div>
                        </div>

                        <div className="bg-rc-card p-6 rounded-xl border-[0.5px] border-rc-main/10 shadow-lg">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-rc-logo mb-6 flex items-center gap-2"><i className="fa-solid fa-money-bill-transfer"></i> Tarik Saldo Menuju Rekening</h4>
                            <form onSubmit={handleWithdraw}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-rc-muted mb-1">Nominal Tarik (Rp)</label>
                                        <input required type="number" min="10000" max={profitData ? profitData.total_profit - (profitData.withdrawn || 0) : 0} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="w-full bg-rc-bg p-3 border-[0.5px] border-rc-main/10 rounded-lg outline-none focus:border-rc-logo text-xs text-rc-main" placeholder="Min. 10000" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-rc-muted mb-1">Informasi Bank / E-Wallet</label>
                                        <input required type="text" value={withdrawBank} onChange={e => setWithdrawBank(e.target.value)} className="w-full bg-rc-bg p-3 border-[0.5px] border-rc-main/10 rounded-lg outline-none focus:border-rc-logo text-xs text-rc-main" placeholder="Contoh: BCA 1234567890 a.n Sutejo" />
                                    </div>
                                </div>
                                <button type="submit" disabled={isWithdrawing || !profitData || (profitData.total_profit - (profitData.withdrawn||0)) < 10000} className="mt-4 bg-rc-logo text-rc-bg font-bold text-xs px-6 py-3 rounded-lg shadow-lg uppercase hover:bg-yellow-400 transition w-full sm:w-auto disabled:opacity-50">
                                    {isWithdrawing ? 'Memproses...' : 'Ajukan Penarikan'}
                                </button>
                            </form>
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
        </div>
    );
}
