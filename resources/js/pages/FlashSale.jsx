import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { motion } from 'framer-motion';

export default function FlashSale() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState('');
    const [activeCategory, setActiveCategory] = useState('Semua');
    const categoriesRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('/api/flash-sales');
                setProducts(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (products.length === 0) return;
        
        const endTimes = products
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
    }, [products]);

    const categories = ['Semua', ...new Set(products.map(p => p.kategori).filter(Boolean))];
    const filteredProducts = activeCategory === 'Semua' 
        ? products 
        : products.filter(p => p.kategori === activeCategory);

    return (
        <div className="bg-rc-bg min-h-screen pb-20 text-rc-main font-sans">
            {/* Header Sticky */}
            <div className="bg-rc-bg/80 backdrop-blur-xl sticky top-0 z-40 border-b-[0.5px] border-rc-main/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="text-rc-muted hover:text-rc-main transition flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                        <i className="fa-solid fa-arrow-left"></i> Kembali
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-xs font-black text-rc-logo uppercase tracking-[0.2em] flex items-center gap-2">
                            <i className="fa-solid fa-bolt animate-pulse"></i> Flash Sale
                        </h1>
                    </div>
                    <div className="w-8"></div>
                </div>

                {/* Horizontal Category Scroller - "DASHBOARD GESER" */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4 overflow-hidden">
                    <motion.div 
                        drag="x"
                        dragConstraints={{ right: 0, left: -(categories.length * 100) }} // Approximate
                        className="flex gap-3 py-2 cursor-grab active:cursor-grabbing"
                        style={{ width: 'max-content' }}
                    >
                        {categories.map((cat, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveCategory(cat)}
                                className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeCategory === cat 
                                    ? 'bg-rc-logo text-rc-bg shadow-lg shadow-rc-logo/20 scale-105' 
                                    : 'bg-rc-card border border-rc-main/10 text-rc-muted hover:text-rc-main hover:bg-rc-main/5'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
                {/* Hero Banner */}
                <div className="bg-gradient-to-br from-rc-logo/20 via-rc-logo/5 to-transparent border border-rc-logo/30 rounded-[2.5rem] p-8 md:p-12 mb-12 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rc-logo/10 blur-[100px] rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-rc-logo/5 blur-[100px] rounded-full"></div>
                    
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 100 }}
                        className="relative z-10"
                    >
                        <i className="fa-solid fa-bolt text-6xl md:text-8xl text-rc-logo mb-6 drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]"></i>
                    </motion.div>
                    
                    <h1 className="text-4xl md:text-6xl font-black text-rc-main uppercase tracking-tighter mb-6 relative z-10">
                        Radar <span className="text-rc-logo">Flash</span> Sale
                    </h1>
                    
                    {timeLeft && timeLeft !== 'BERAKHIR' ? (
                        <div className="flex flex-col items-center relative z-10">
                            <span className="text-[10px] md:text-xs text-rc-muted font-black uppercase tracking-[0.4em] mb-4 opacity-60">Sistem Berakhir Dalam</span>
                            <div className="text-3xl md:text-5xl font-black text-rc-bg bg-rc-logo px-10 py-4 md:py-6 rounded-[2rem] tracking-[0.2em] shadow-2xl shadow-rc-logo/30 border-4 border-rc-bg/20">
                                {timeLeft}
                            </div>
                        </div>
                    ) : timeLeft === 'BERAKHIR' ? (
                        <div className="text-xl md:text-2xl font-black text-white bg-red-600 px-12 py-5 rounded-2xl tracking-widest relative z-10 shadow-2xl uppercase">
                            Radar Off (Selesai)
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 text-rc-muted">
                            <div className="w-2 h-2 bg-rc-logo rounded-full animate-ping"></div>
                            <p className="text-xs font-black uppercase tracking-widest">Sinkronisasi Waktu...</p>
                        </div>
                    )}
                </div>

                {/* Product Grid / Section Swipe */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                            <div key={i} className="w-full aspect-[3/4] bg-rc-card rounded-3xl border border-rc-main/10 animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                        {filteredProducts.map((product, idx) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <ProductCard product={product} hideActions={true} />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-rc-card/20 rounded-[3rem] border border-dashed border-rc-main/10">
                        <i className="fa-solid fa-box-open text-6xl mb-6 text-rc-muted opacity-20"></i>
                        <p className="font-black uppercase tracking-[0.3em] text-rc-muted text-xs">Radar Kosong (Tidak ada produk)</p>
                    </div>
                )}
            </div>
        </div>
    );
}

