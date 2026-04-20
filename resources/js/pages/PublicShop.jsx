import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

export default function PublicShop() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [shopData, setShopData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Semua');

    useEffect(() => {
        const fetchShop = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/shop/${id}`);
                setShopData(response.data);
            } catch (err) {
                console.error("Gagal memuat info toko:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchShop();
        window.scrollTo(0, 0);
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-rc-logo bg-rc-bg font-bold"><i className="fa-solid fa-spinner fa-spin text-4xl"></i></div>;

    if (!shopData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-rc-bg p-6">
                <i className="fa-solid fa-shop-slash text-6xl text-rc-muted opacity-50 mb-4"></i>
                <h2 className="text-xl font-bold text-rc-main">Toko Tidak Ditemukan</h2>
                <p className="text-rc-muted mt-2 mb-6 text-sm">Toko yang kamu cari mungkin sudah tutup atau dihapus.</p>
                <button onClick={() => navigate(-1)} className="px-6 py-2 bg-rc-logo text-rc-bg font-bold rounded-lg hover:bg-yellow-400 transition">Kembali</button>
            </div>
        );
    }

    const shop = shopData;
    const products = shopData.products || [];
    const defaultBanner = '/logo_web/no-product.png';
    const defaultAvatar = '/logo_web/no-product.png';

    const categories = ['Semua', ...new Set(products.map(p => p.kategori).filter(Boolean))];

    // Search and Category filter
    const filteredProducts = products.filter(p => {
        const matchesCategory = activeCategory === 'Semua' || p.kategori === activeCategory;
        const matchesSearch = p.nama_produk?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="bg-rc-bg min-h-screen pb-20 text-rc-main font-sans">

            {/* Header / Nav Simple */}
            <div className="bg-rc-bg sticky top-0 z-40 border-b-[0.5px] border-rc-main/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <button onClick={() => navigate('/dashboard')} className="text-rc-muted hover:text-rc-main transition flex items-center gap-2 text-xs font-bold uppercase">
                        <i className="fa-solid fa-chevron-left"></i> E-COMMERCE
                    </button>
                    <Link to="/keranjang" className="text-rc-muted hover:text-rc-main transition p-2">
                        <i className="fa-solid fa-cart-shopping text-xl"></i>
                    </Link>
                </div>
            </div>

            {/* Shop Hero Banner & Profile */}
            <div className="bg-rc-bg border-b-[0.5px] border-rc-main/10 relative">
                <div className="w-full h-48 md:h-72 overflow-hidden bg-rc-bg relative group border-b-[0.5px] border-rc-main/10">
                    <img
                        src={shop.foto_banner ? `/storage/${shop.foto_banner}` : defaultBanner}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 opacity-80"
                        alt="Banner Toko"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-rc-bg via-rc-bg/20 to-transparent"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 relative -mt-20 pb-8 z-10">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[2px] border-rc-bg overflow-hidden bg-rc-bg p-1 flex-shrink-0">
                            <img
                                src={shop.foto_profil ? `/storage/${shop.foto_profil}` : defaultAvatar}
                                className="w-full h-full object-cover rounded-full"
                                alt="Profil Toko"
                            />
                        </div>
                        <div className="flex-grow z-10 mb-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-rc-main uppercase flex items-center gap-3">
                                {shop.nama_toko}
                                {shop.shop_tier === 'raden' ? (
                                    <span className="bg-rc-logo text-rc-bg text-[9px] px-2.5 py-1 rounded-sm font-bold inline-flex items-center gap-1">
                                        <i className="fa-solid fa-crown"></i> RADEN SHOP
                                    </span>
                                ) : (
                                    <span className="bg-rc-bg text-rc-muted border-[1px] border-rc-main/20 text-[9px] px-2.5 py-1 rounded-sm font-bold inline-flex items-center gap-1">
                                        <i className="fa-solid fa-user"></i> RAKYAT SHOP
                                    </span>
                                )}
                            </h1>
                            <div className="text-rc-muted mt-2 flex items-center gap-3 text-xs font-bold uppercase">
                                <span className="flex items-center gap-1"><i className="fa-solid fa-location-dot"></i> {shop.alamat_toko || 'Indonesia'}</span>
                                <span className="w-[4px] h-[4px] bg-rc-main/20 rounded-full"></span>
                                <span>BERDIRI SEJAK {new Date(shop.created_at).getFullYear()}</span>
                            </div>
                        </div>
                        <div className="w-full md:w-auto z-10">
                            <div className="bg-rc-bg border-[0.5px] border-rc-main/20 p-4 rounded-xl text-center min-w-[200px]">
                                <div className="text-xs text-rc-muted uppercase font-bold mb-1">Total Produk</div>
                                <div className="text-2xl font-bold text-rc-logo">{products.length}</div>
                            </div>
                            <button
                                onClick={async () => {
                                    if (!localStorage.getItem('auth_token')) { alert('Silakan login terlebih dahulu'); navigate('/login'); return; }
                                    try {
                                        await axios.post('/api/chat', { shop_id: shop.id });
                                        navigate('/chat');
                                    } catch (e) { alert('Gagal membuka chat'); }
                                }}
                                className="w-full mt-3 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-bold uppercase transition flex items-center justify-center gap-2"
                            >
                                <i className="fa-regular fa-comment-dots"></i> CHAT PENJUAL
                            </button>
                        </div>
                    </div>

                    {shop.deskripsi_toko && (
                        <div className="mt-8 bg-rc-card border-[0.5px] border-rc-main/20 p-6 rounded-xl">
                            <h3 className="text-rc-main font-bold uppercase text-sm mb-3 border-b-[0.5px] border-rc-main/20 pb-3 flex items-center gap-2"><i className="fa-solid fa-store text-rc-logo"></i> RIWAYAT TOKO</h3>
                            <p className="text-rc-muted text-sm font-medium leading-relaxed whitespace-pre-wrap">{shop.deskripsi_toko}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Produk Toko Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b-[0.5px] border-rc-main/20 pb-4">
                    <div className="flex flex-col gap-3">
                        <h2 className="text-lg font-bold text-rc-main border-l-[0.5px] border-rc-main/50 pl-4 uppercase">Koleksi Butik</h2>
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
                    </div>

                    <div className="relative max-w-sm w-full">
                        <input
                            type="text"
                            placeholder={`Cari di ${shop.nama_toko}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-rc-bg border-[1px] border-rc-main/20 text-rc-main rounded-md focus:border-rc-logo focus:outline-none transition font-bold text-sm placeholder-rc-muted/50"
                        />
                        <i className="fa-solid fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-rc-muted/50 text-xs"></i>
                    </div>
                </div>

                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} hideActions={true} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-rc-card rounded-2xl border-[0.5px] border-rc-main/30 shadow-lg mt-4">
                        <i className="fa-solid fa-box-open text-rc-muted opacity-30 text-6xl mb-4 block"></i>
                        <h3 className="text-rc-main font-bold text-lg mb-1">Etalase Kosong</h3>
                        <p className="text-rc-muted">
                            {searchQuery ? 'Toko ini tidak memiliki produk yang sesuai dengan pencarianmu.' : 'Toko ini belum menambahkan produk ke etalase.'}
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
}
