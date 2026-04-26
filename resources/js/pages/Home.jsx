import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import ProductCard from '../components/ProductCard';

const fetcher = url => axios.get(url).then(res => res.data);

export default function Home() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [flashSaleProducts, setFlashSaleProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [hasMorePages, setHasMorePages] = useState(true);
    const [activeCategory, setActiveCategory] = useState('Semua');
    const [timeLeft, setTimeLeft] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Debounce Search Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        axios.get('/api/flash-sales').then(res => setFlashSaleProducts(res.data)).catch(console.error);
    }, []);

    // Banner Carousel State
    const [currentSlide, setCurrentSlide] = useState(0);
    const [banners, setBanners] = useState([
        { image_url: "/logo_web/no-product.png" }
    ]);

    // Banner Carousel Logic
    const nextSlide = () => {
        setCurrentSlide(prev => (prev === banners.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentSlide(prev => (prev === 0 ? banners.length - 1 : prev - 1));
    };

    // Auto Slide
    useEffect(() => {
        const interval = setInterval(nextSlide, 7000);
        return () => clearInterval(interval);
    }, [banners.length]);

    // Fetch User Info & Banners with SWR
    const [user, setUser] = useState(null);
    const { data: userData } = useSWR(localStorage.getItem('auth_token') ? '/api/user' : null, fetcher);
    const { data: bannersData } = useSWR('/api/banners/active', fetcher);
    const { data: notifCount, mutate: mutateNotifCount } = useSWR(localStorage.getItem('auth_token') ? '/api/notifications/unread-count' : null, fetcher);
    const { data: notifications, mutate: mutateNotifications } = useSWR(isNotifOpen ? '/api/notifications' : null, fetcher);
    const { data: cartData } = useSWR(localStorage.getItem('auth_token') ? '/api/cart' : null, fetcher);
    const { data: chatData } = useSWR(localStorage.getItem('auth_token') ? '/api/chat/unread-count' : null, fetcher);

    const cartCount = cartData?.data?.length || 0;
    const chatUnreadCount = chatData?.unread_count || 0;

    useEffect(() => {
        if (userData) setUser(userData);
    }, [userData]);

    useEffect(() => {
        if (bannersData && bannersData.length > 0) setBanners(bannersData);
    }, [bannersData]);

    const handleOpenNotif = async () => {
        setIsNotifOpen(!isNotifOpen);
        setIsProfileOpen(false);
        if (!isNotifOpen && notifCount?.count > 0) {
            try {
                await axios.post('/api/notifications/read');
                mutateNotifCount({ count: 0 });
                mutateNotifications();
            } catch (e) { }
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [banners]);

    // Auto SWR Fetch for First Page Products
    const categoryParam = activeCategory !== 'Semua' ? `&category=${encodeURIComponent(activeCategory)}` : '';
    const searchParam = debouncedSearchQuery ? `&q=${encodeURIComponent(debouncedSearchQuery)}` : '';

    const { data: firstPageData, isValidating } = useSWR(`/api/products?page=1${categoryParam}${searchParam}`, fetcher);

    useEffect(() => {
        if (isValidating && products.length === 0) setLoading(true);
        if (firstPageData) {
            const rawProducts = firstPageData.data || firstPageData;
            setProducts(rawProducts);
            setPage(1);
            setHasMorePages(firstPageData.last_page ? 1 < firstPageData.last_page : rawProducts.length > 0);
            setLoading(false);
        }
    }, [firstPageData, isValidating]);

    // Manual Axios Fetch for Pagination Load More
    const fetchProducts = async (pageNum) => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/products?page=${pageNum}${categoryParam}${searchParam}`);
            const data = response.data;
            const rawProducts = data.data || data;

            setProducts(prev => [...prev, ...rawProducts]);

            if (data.last_page) {
                setHasMorePages(pageNum < data.last_page);
            } else {
                setHasMorePages(rawProducts.length > 0);
            }
        } catch (error) {
            console.error("Gagal mengambil data produk.", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products;

    useEffect(() => {
        if (flashSaleProducts.length === 0) return;
        
        const endTimes = flashSaleProducts
            .filter(p => p.flash_sale_end)
            .map(p => new Date(p.flash_sale_end).getTime());
            
        if (endTimes.length === 0) return;
        
        const nearestEnd = Math.min(...endTimes);

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = nearestEnd - now;

            if (distance < 0) {
                setTimeLeft('BERAKHIR');
                clearInterval(interval);
            } else {
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                
                setTimeLeft(`${hours.toString().padStart(2, '0')} : ${minutes.toString().padStart(2, '0')} : ${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [flashSaleProducts]);

    const loadMore = () => {
        if (!loading && hasMorePages) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchProducts(nextPage);
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post('/api/logout');
            localStorage.removeItem('auth_token');
            setUser(null);
            window.location.reload();
        } catch (e) {
            localStorage.removeItem('auth_token');
            setUser(null);
        }
    };

    return (
        <div className="bg-rc-bg min-h-screen pb-12 font-sans text-rc-main">

            {/* Navbar Global */}
            <div className="bg-rc-bg sticky top-0 z-40 border-b-[0.5px] border-rc-main/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
                    <Link to="/dashboard" className="text-lg sm:text-xl md:text-2xl font-bold tracking-wide text-rc-logo flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity">
                        <i className="fa-solid fa-store border-[0.5px] border-rc-logo/50 rounded p-1 sm:p-1.5 text-xs sm:text-sm bg-rc-logo text-rc-bg"></i> <span className="hidden sm:inline">RADENCAK</span>
                    </Link>

                    <div className="flex-1 max-w-xl mx-4 sm:mx-8 hidden md:block">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Cari barang atau toko..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2 bg-rc-card border-[0.5px] border-rc-main/20 rounded-md focus:border-rc-logo transition text-sm font-semibold text-rc-main placeholder-rc-muted outline-none"
                            />
                            <i className="fa-solid fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-rc-muted"></i>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-5">
                        {user ? (
                            <>
                                <Link to="/keranjang" className="text-rc-muted hover:text-rc-logo transition p-2 relative" title="Keranjang">
                                    <i className="fa-solid fa-cart-shopping text-lg sm:text-[20px]"></i>
                                    {cartCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-rc-logo text-rc-bg text-[7px] sm:text-[8px] font-bold flex items-center justify-center rounded-full border-[0.5px] border-rc-bg">{cartCount}</span>}
                                </Link>
                                <Link to="/chat" className="text-rc-muted hover:text-rc-logo transition p-2 relative" title="Chat">
                                    <i className="fa-solid fa-comment-dots text-lg sm:text-[20px]"></i>
                                    {chatUnreadCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-blue-500 text-white text-[7px] sm:text-[8px] font-bold flex items-center justify-center rounded-full border-[0.5px] border-rc-bg animate-pulse">{chatUnreadCount}</span>}
                                </Link>

                                {/* Ikon Lonceng */}
                                <div className="relative">
                                    <button onClick={handleOpenNotif} className="text-rc-muted hover:text-rc-logo transition p-1.5 sm:p-2 relative outline-none" title="Informasi Pesanan">
                                        <i className="fa-solid fa-bell text-lg sm:text-[20px]"></i>
                                        {(notifCount?.count > 0) && (
                                            <span className="absolute top-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-red-600 text-white text-[7px] sm:text-[8px] font-bold flex items-center justify-center rounded-full border-[0.5px] border-rc-bg animate-pulse">
                                                {notifCount.count}
                                            </span>
                                        )}
                                    </button>

                                    {/* Modal / Drawer Notifikasi */}
                                    {isNotifOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-rc-card border-[0.5px] border-rc-main/20 rounded-md shadow-2xl origin-top-right overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="bg-rc-bg p-3 border-b-[0.5px] border-rc-main/10 flex justify-between items-center">
                                                <span className="text-xs font-bold uppercase tracking-widest text-rc-main">Notifikasi</span>
                                                <Link to="/informasi" className="text-[10px] text-blue-400 hover:underline">Lihat Semua</Link>
                                            </div>
                                            <div className="max-h-80 overflow-y-auto no-scrollbar">
                                                {!notifications ? (
                                                    <div className="p-4 text-center text-xs text-rc-muted animate-pulse">Memuat...</div>
                                                ) : notifications.length === 0 ? (
                                                    <div className="p-8 text-center text-xs text-rc-muted flex flex-col items-center">
                                                        <i className="fa-regular fa-bell-slash text-2xl mb-2 opacity-50"></i>
                                                        Belum ada notifikasi
                                                    </div>
                                                ) : (
                                                    notifications.map(n => (
                                                        <div key={n.id} className={`p-3 border-b-[0.5px] border-rc-main/10 hover:bg-rc-bg transition ${!n.is_read ? 'bg-blue-500/5' : ''}`}>
                                                            <p className="text-xs text-rc-main font-semibold mb-1 leading-snug">{n.message}</p>
                                                            <p className="text-[9px] text-rc-muted">{new Date(n.created_at).toLocaleString('id-ID')}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Cerdas Profile Dropdown (Mobile Friendly) */}
                                <div className="relative ml-1 sm:ml-2 pl-2 sm:pl-4 border-l-[0.5px] border-rc-main/20 block">
                                    <div
                                        className="flex items-center gap-2 sm:gap-3 cursor-pointer py-1 group"
                                        onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                                    >
                                        <div className="hidden sm:flex flex-col items-end">
                                            <span className="text-sm font-bold text-rc-main uppercase">{user.username}</span>
                                            <span className="text-[10px] font-bold text-rc-muted uppercase">{user.role || 'Member'}</span>
                                        </div>
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-rc-card text-rc-logo flex justify-center items-center font-bold text-sm sm:text-lg overflow-hidden border-[0.5px] border-rc-main/20 transition-all group-hover:border-rc-main">
                                            {user.avatar ? <img src={`/storage/${user.avatar}`} className="w-full h-full object-cover" alt="avatar" /> : user.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <i className={`fa-solid fa-chevron-down text-[10px] sm:text-xs text-rc-muted group-hover:text-rc-main transition-transform duration-300 hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`}></i>
                                    </div>

                                    {/* Dropdown Menu - Click & Mobile Support */}
                                    {isProfileOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-rc-card border-[0.5px] border-rc-main/20 rounded-md shadow-lg transition-all duration-200 origin-top-right overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="p-1 space-y-0.5">
                                                <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-4 text-xs font-bold text-rc-main hover:bg-rc-main hover:text-rc-bg rounded-sm transition-colors uppercase">
                                                    <i className="fa-solid fa-user-gear w-4 text-center"></i> Setelan Akun
                                                </Link>
                                                <Link to="/pengaturan" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-4 text-xs font-bold text-rc-main hover:bg-rc-main hover:text-rc-bg rounded-sm transition-colors uppercase">
                                                    <i className="fa-solid fa-gear w-4 text-center"></i> Pengaturan
                                                </Link>

                                                <div className="h-[0.5px] w-full bg-rc-main/10 my-1"></div>
                                                <Link to="/toko" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-4 text-xs font-bold text-rc-logo hover:bg-rc-logo hover:text-rc-bg rounded-sm transition-colors uppercase">
                                                    <i className="fa-solid fa-shop w-4 text-center"></i> Dagang / Toko
                                                </Link>

                                                {user.role && user.role !== 'user' && user.role !== 'toko' && <div className="h-[0.5px] w-full bg-rc-main/10 my-1"></div>}

                                                {(user.role === 'super_admin' || user.role === 'admin_staff' || user.role === 'admin') && (
                                                    <Link to="/admin" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-4 text-xs font-bold text-blue-400 hover:bg-blue-600 hover:text-white rounded-sm transition-colors uppercase">
                                                        <i className="fa-solid fa-shield-halved w-4 text-center"></i> Portal Admin
                                                    </Link>
                                                )}
                                                {(user.role === 'admin_kurir' || user.role === 'kurir_staff' || user.role === 'super_admin') && (
                                                    <Link to="/kurir" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-4 text-xs font-bold text-green-400 hover:bg-green-600 hover:text-white rounded-sm transition-colors uppercase">
                                                        <i className="fa-solid fa-truck-fast w-4 text-center"></i> Portal Kurir
                                                    </Link>
                                                )}
                                                {(user.role === 'admin_logistik' || user.role === 'logistik_staff' || user.role === 'super_admin') && (
                                                    <Link to="/logistik" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-4 text-xs font-bold text-teal-400 hover:bg-teal-600 hover:text-white rounded-sm transition-colors uppercase">
                                                        <i className="fa-solid fa-warehouse w-4 text-center"></i> Portal Logistik
                                                    </Link>
                                                )}

                                                <div className="h-[0.5px] w-full bg-rc-main/10 my-1"></div>

                                                <button onClick={() => { handleLogout(); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-4 text-xs font-bold text-red-500 hover:bg-red-600 hover:text-white rounded-sm transition-colors text-left uppercase">
                                                    <i className="fa-solid fa-right-from-bracket w-4 text-center"></i> Log Out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link to="/login" className="px-3 sm:px-5 py-1.5 sm:py-2 text-rc-logo font-semibold hover:bg-rc-card rounded-lg transition text-xs sm:text-sm">Masuk</Link>
                                <Link to="/daftar" className="px-3 sm:px-5 py-1.5 sm:py-2 bg-rc-logo text-rc-bg font-bold rounded-lg hover:bg-yellow-400 transition shadow-sm text-xs sm:text-sm">Daftar</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search Bar (Mobile Only) */}
                <div className="md:hidden px-4 pb-4 bg-rc-bg border-b-[0.5px] border-rc-main/20">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari barang atau toko..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-rc-card border-[0.5px] border-rc-main/20 rounded-md focus:border-rc-logo transition text-sm font-semibold text-rc-main placeholder-rc-muted outline-none"
                        />
                        <i className="fa-solid fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-rc-muted"></i>
                    </div>
                </div>
            </div>

            {/* Hero Banner Carousel */}
            {!searchQuery && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                    <div className="relative w-full h-[220px] md:h-[400px] rounded-2xl md:rounded-[2rem] overflow-hidden border-[0.5px] border-rc-main/10 shadow-[0_0_30px_rgba(0,0,0,0.8)] group">
                        {banners.map((b, idx) => (
                            <div
                                key={idx}
                                className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                            >
                                <img src={b.image_url.startsWith('http') ? b.image_url : `/storage/${b.image_url}`} className="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-[5000ms]" alt="Banner Promo" />

                                {/* Deep Premium Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-rc-bg via-rc-bg/40 to-black/10"></div>

                                {/* Glassmorphism Text Panel */}
                                {(b.title || b.description) && (
                                    <div className="absolute bottom-6 md:bottom-12 left-4 md:left-12 max-w-[85%] lg:max-w-xl p-4 md:p-6 rounded-2xl md:rounded-[2rem] bg-rc-bg/30 md:bg-rc-bg/20 backdrop-blur-md border-[0.5px] border-rc-main/10 shadow-2xl">
                                        {b.title && <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-rc-logo to-white md:to-gray-200 text-xl md:text-4xl font-extrabold uppercase drop-shadow-lg mb-1 md:mb-2 leading-tight">{b.title}</h3>}
                                        {b.description && <p className="text-gray-300 text-[10px] md:text-sm font-semibold tracking-wide drop-shadow-md line-clamp-2 leading-relaxed">{b.description}</p>}
                                        {b.link_url && (
                                            <a href={b.link_url} className="inline-block mt-3 md:mt-5 bg-gradient-to-r from-rc-logo to-yellow-600 shadow-[0_0_15px_rgba(255,204,0,0.3)] text-rc-bg font-extrabold text-[10px] md:text-sm px-5 py-2 md:px-8 md:py-3 rounded-full hover:scale-105 hover:shadow-[0_0_25px_rgba(255,204,0,0.6)] transition-all flex items-center gap-2 max-w-max uppercase tracking-widest">
                                                Jelajahi <i className="fa-solid fa-arrow-right-long text-[10px] md:text-xs"></i>
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Navigation Arrows (PC Only or Visible on Hover) */}
                        <div className="absolute inset-0 z-20 flex items-center justify-between px-2 md:px-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); prevSlide(); }}
                                className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-rc-bg/40 backdrop-blur-md border border-rc-main/10 text-rc-main flex items-center justify-center hover:bg-rc-logo hover:text-rc-bg hover:border-rc-logo transition-all duration-300 pointer-events-auto shadow-xl"
                                title="Sebelumnya"
                            >
                                <i className="fa-solid fa-chevron-left text-[10px] md:text-base"></i>
                            </button>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextSlide(); }}
                                className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-rc-bg/40 backdrop-blur-md border border-rc-main/10 text-rc-main flex items-center justify-center hover:bg-rc-logo hover:text-rc-bg hover:border-rc-logo transition-all duration-300 pointer-events-auto shadow-xl"
                                title="Berikutnya"
                            >
                                <i className="fa-solid fa-chevron-right text-[10px] md:text-base"></i>
                            </button>
                        </div>

                        {/* Elegant Navigation Indicators */}
                        <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-2 md:gap-3">
                            {banners.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentSlide(idx)}
                                    className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 md:w-10 bg-rc-logo shadow-[0_0_10px_rgba(255,204,0,0.8)]' : 'w-2 md:w-3 bg-white/30 hover:bg-white/50 backdrop-blur-md'}`}
                                ></button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Category Navigation - Premium Unified Monotone Experience */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 md:mt-16">
                <div className="flex items-center gap-4 mb-6 md:mb-8">
                    <h2 className="text-sm md:text-base font-bold text-rc-logo uppercase tracking-widest flex items-center gap-2">
                        <i className="fa-solid fa-layer-group"></i> KATEGORI
                    </h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-rc-logo/30 to-transparent"></div>
                </div>

                <div className="flex overflow-x-auto pb-6 gap-3 md:gap-5 no-scrollbar">
                    {[
                        { name: 'Fashion', icon: 'fa-shirt' },
                        { name: 'Otomotif', icon: 'fa-car-side' },
                        { name: 'Gadget & PC', icon: 'fa-laptop' },
                        { name: 'Aksesoris', icon: 'fa-gem' },
                        { name: 'Gaya Pria', icon: 'fa-user-tie' },
                        { name: 'Gaya Wanita', icon: 'fa-person-dress' },
                        { name: 'Jam Tangan', icon: 'fa-watch' },
                        { name: 'Tas & Koper', icon: 'fa-suitcase-rolling' },
                        { name: 'Sepatu', icon: 'fa-shoe-prints' },
                        { name: 'Kesehatan', icon: 'fa-heart-pulse' },
                        { name: 'Perkakas', icon: 'fa-toolbox' },
                        { name: 'Hiburan', icon: 'fa-gamepad' },
                    ].map((cat, i) => {
                        const isActive = activeCategory === cat.name;
                        return (
                            <div key={i} onClick={() => setActiveCategory(isActive ? 'Semua' : cat.name)} className="flex-shrink-0 group cursor-pointer">
                                <div className={`w-20 h-24 md:w-28 md:h-32 rounded-[1rem] md:rounded-[1.5rem] border-[0.5px] flex flex-col items-center justify-center gap-3 md:gap-4 transition-all duration-300 relative overflow-hidden ${isActive
                                    ? 'bg-gradient-to-br from-rc-logo/10 to-rc-logo/5 border-rc-logo shadow-[0_0_20px_rgba(255,204,0,0.15)] -translate-y-2'
                                    : 'bg-rc-bg/50 border-rc-main/10 hover:border-rc-logo/40 hover:bg-rc-card hover:-translate-y-1'
                                    }`}>

                                    {/* Subtle internal glow on active */}
                                    {isActive && <div className="absolute -top-10 -right-10 w-20 h-20 bg-rc-logo/20 blur-2xl rounded-full"></div>}

                                    <i className={`fa-solid ${cat.icon} text-2xl md:text-3xl transition-colors duration-300 relative z-10 ${isActive ? 'text-rc-logo drop-shadow-[0_0_8px_rgba(255,204,0,0.6)]' : 'text-rc-muted group-hover:text-rc-logo/70'
                                        }`}></i>
                                    <span className={`text-[9px] md:text-[10px] font-bold text-center tracking-widest relative z-10 transition-colors uppercase px-1 ${isActive ? 'text-rc-logo' : 'text-rc-muted group-hover:text-rc-main'
                                        }`}>{cat.name}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Flash Sale Section */}
            {!searchQuery && flashSaleProducts.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
                    <div className="flex items-center gap-3 mb-6 border-[0.5px] border-rc-logo/30 bg-rc-card/50 p-4 rounded-2xl">
                        <i className="fa-solid fa-bolt text-rc-logo text-xl animate-pulse"></i>
                        <h2 className="text-lg md:text-xl font-black uppercase text-rc-logo tracking-tighter">FLASH SALE</h2>
                        {timeLeft && timeLeft !== 'BERAKHIR' && (
                            <div className="ml-auto flex items-center gap-3">
                                <span className="text-[10px] text-rc-muted font-black uppercase hidden md:inline tracking-widest">Berakhir dalam:</span>
                                <div className="bg-rc-logo text-rc-bg px-4 py-2 rounded-xl font-black tracking-[0.2em] shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                                    {timeLeft}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Horizontal Scroll Flash Sale Container */}
                    <div className="relative group">
                        <div 
                            id="flash-sale-container"
                            className="flex overflow-x-auto gap-4 md:gap-6 pb-6 no-scrollbar snap-x scroll-smooth"
                        >
                            {flashSaleProducts.slice(0, 15).map(product => (
                                <div key={`flash-${product.id}`} className="flex-shrink-0 w-[170px] md:w-[240px] snap-start">
                                    <ProductCard product={product} hideActions={true} />
                                </div>
                            ))}
                            
                            {/* Lihat Lengkap Button Card */}
                            <div 
                                onClick={() => navigate('/flash-sale')}
                                className="flex-shrink-0 w-[170px] md:w-[240px] snap-start flex flex-col items-center justify-center bg-rc-card/30 rounded-2xl border-[0.5px] border-rc-logo/20 group/btn hover:bg-rc-logo/5 transition-all cursor-pointer"
                            >
                                <div className="w-14 h-14 rounded-full bg-rc-logo/10 border border-rc-logo/20 flex items-center justify-center mb-4 group-hover/btn:bg-rc-logo transition-all duration-300">
                                    <i className="fa-solid fa-arrow-right text-xl text-rc-logo group-hover/btn:text-rc-bg group-hover/btn:translate-x-1 transition-all"></i>
                                </div>
                                <p className="text-rc-logo font-black text-[10px] uppercase tracking-[0.3em] text-center">Lihat Semua</p>
                            </div>
                        </div>

                        {/* Navigation Arrows for Desktop */}
                        <button 
                            onClick={() => document.getElementById('flash-sale-container').scrollBy({ left: -300, behavior: 'smooth' })}
                            className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-rc-bg/80 border border-rc-main/10 text-rc-main hidden md:flex items-center justify-center hover:bg-rc-logo hover:text-rc-bg transition-all shadow-2xl z-10 opacity-0 group-hover:opacity-100"
                        >
                            <i className="fa-solid fa-chevron-left"></i>
                        </button>
                        <button 
                            onClick={() => document.getElementById('flash-sale-container').scrollBy({ left: 300, behavior: 'smooth' })}
                            className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-rc-bg/80 border border-rc-main/10 text-rc-main hidden md:flex items-center justify-center hover:bg-rc-logo hover:text-rc-bg transition-all shadow-2xl z-10 opacity-0 group-hover:opacity-100"
                        >
                            <i className="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            )}

            {/* Main Recommendation Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pb-10">
                <h2 className="text-lg font-bold text-rc-main border-b-[2px] border-rc-main pb-2 mb-6 inline-block uppercase">
                    {searchQuery ? 'Hasil Pencarian' : 'Rekomendasi Untukmu'}
                </h2>

                {loading && products.length === 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 mt-10">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                            <div key={i} className="flex flex-col gap-3">
                                <div className="w-full aspect-square bg-rc-card border-[0.5px] border-rc-main/10 rounded-2xl animate-pulse"></div>
                                <div className="h-4 w-3/4 bg-rc-card border-[0.5px] border-rc-main/10 rounded animate-pulse mt-2"></div>
                                <div className="h-3 w-1/2 bg-rc-card border-[0.5px] border-rc-main/10 rounded animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 mt-10">
                        {filteredProducts.map(p => (
                            <ProductCard key={p.id} product={p} hideActions={true} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-20 bg-rc-card rounded-xl border-[0.5px] border-rc-main/20 w-full mt-10 shadow-sm opacity-50">
                        <i className="fa-solid fa-parachute-box text-4xl mb-4 text-rc-muted"></i>
                        <p className="text-rc-muted font-bold uppercase tracking-widest text-sm text-center px-6">
                            {searchQuery ? `Hasil untuk "${searchQuery}" tidak ditemukan` : 'Katalog produk sedang disiapkan'}
                        </p>
                    </div>
                )}

                {/* Load More */}
                {!searchQuery && hasMorePages && (
                    <div className="flex justify-center mt-10">
                        <button
                            onClick={loadMore}
                            disabled={loading}
                            className="bg-rc-card/50 border-[0.5px] border-rc-logo/50 text-rc-logo hover:bg-rc-logo hover:text-rc-bg font-bold py-3 px-8 rounded transition shadow flex items-center gap-2"
                        >
                            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Muat Lebih Banyak'}
                        </button>
                    </div>
                )}
            </div>

        </div>
    );
}
