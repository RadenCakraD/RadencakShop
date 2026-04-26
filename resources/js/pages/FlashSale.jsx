import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

export default function FlashSale() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState('');

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

    return (
        <div className="bg-rc-bg min-h-screen pb-20 text-rc-main font-sans">
            <div className="bg-rc-bg sticky top-0 z-40 border-b-[0.5px] border-rc-main/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="text-rc-muted hover:text-rc-main transition flex items-center gap-2 text-xs font-bold uppercase">
                        <i className="fa-solid fa-arrow-left"></i> Kembali
                    </button>
                    <h1 className="text-sm font-black text-rc-logo uppercase tracking-widest"><i className="fa-solid fa-bolt"></i> Flash Sale</h1>
                    <div className="w-8"></div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
                <div className="bg-gradient-to-r from-rc-logo/20 to-rc-logo/5 border border-rc-logo/30 rounded-2xl p-6 md:p-10 mb-10 flex flex-col items-center text-center shadow-[0_0_30px_rgba(255,204,0,0.15)] relative overflow-hidden">
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-rc-logo/30 blur-3xl rounded-full"></div>
                    <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-rc-logo/30 blur-3xl rounded-full"></div>
                    
                    <i className="fa-solid fa-bolt text-5xl md:text-7xl text-rc-logo mb-4 drop-shadow-[0_0_15px_rgba(255,204,0,0.8)] relative z-10"></i>
                    <h1 className="text-3xl md:text-5xl font-black text-rc-logo uppercase tracking-widest mb-4 relative z-10">Flash Sale</h1>
                    
                    {timeLeft && timeLeft !== 'BERAKHIR' ? (
                        <div className="flex flex-col items-center relative z-10">
                            <span className="text-xs md:text-sm text-rc-muted font-bold uppercase tracking-widest mb-2">Penawaran Berakhir Dalam</span>
                            <div className="text-2xl md:text-4xl font-black text-rc-bg bg-rc-logo px-6 py-2 md:py-3 rounded-lg tracking-[0.2em] shadow-[0_0_20px_rgba(255,204,0,0.5)]">
                                {timeLeft}
                            </div>
                        </div>
                    ) : (
                        <div className="text-xl md:text-2xl font-black text-rc-bg bg-red-500 px-6 py-2 md:py-3 rounded-lg tracking-widest relative z-10">
                            WAKTU HABIS
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                            <div key={i} className="w-full aspect-[3/4] bg-rc-card rounded-xl border-[0.5px] border-rc-main/10 animate-pulse"></div>
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} hideActions={true} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-rc-muted">
                        <i className="fa-solid fa-box-open text-6xl mb-4 opacity-50"></i>
                        <p className="font-bold uppercase tracking-widest">Tidak ada flash sale saat ini</p>
                    </div>
                )}
            </div>
        </div>
    );
}
