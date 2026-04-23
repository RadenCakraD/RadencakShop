import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function Information() {
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const initialTab = searchParams.get('tab') || 'pending';

    // States
    const [orders, setOrders] = useState({ pending: [], processing: [], shipped: [], completed: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(initialTab);

    // Review Modal States
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [reviewForm, setReviewForm] = useState({ order_id: null, product_id: null, rating: 5, comment: '' });
    const [reviewProduct, setReviewProduct] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Tracking Modal States
    const [isTrackingOpen, setIsTrackingOpen] = useState(false);
    const [trackingData, setTrackingData] = useState([]);
    const [trackingOrder, setTrackingOrder] = useState(null);
    const [loadingTrack, setLoadingTrack] = useState(false);

    const fetchOrders = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            const res = await axios.get('/api/orders', { headers: { Authorization: `Bearer ${token}` } });
            setOrders(res.data);
        } catch (err) {
            console.error("Gagal load order", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleBatalBayar = async (id) => {
        if (!window.confirm("Apakah Anda yakin ingin membatalkan pesanan ini?\n\nPerhatian: Jika pesanan ini di-checkout bersamaan dengan toko lain (satu kali bayar), maka membatalkan pesanan ini JUGA akan membatalkan pesanan dari toko lain tersebut secara otomatis. Stok akan dikembalikan ke toko.")) return;
        try {
            await axios.post(`/api/orders/${id}/cancel`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
            alert("Pesanan berhasil dibatalkan.");
            fetchOrders();
        } catch (err) {
            alert("Gagal membatalkan: " + (err.response?.data?.message || err.message));
        }
    };

    const handleTerimaPesanan = async (id) => {
        if (!window.confirm("Apakah Anda yakin telah menerima pesanan ini dengan baik?")) return;
        try {
            await axios.post(`/api/orders/${id}/receive`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
            fetchOrders();
        } catch (err) {
            alert("Gagal memproses.");
        }
    };

    const openReviewModal = (orderId, product) => {
        setReviewProduct(product);
        setReviewForm({ order_id: orderId, product_id: product.id, rating: 5, comment: '' });
        setIsReviewOpen(true);
    };

    const submitReview = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post(`/api/orders/${reviewForm.order_id}/review`, {
                product_id: reviewForm.product_id,
                rating: reviewForm.rating,
                comment: reviewForm.comment
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
            alert("Terima kasih atas ulasan Anda!");
            setIsReviewOpen(false);
        } catch (err) {
            alert("Gagal mengirim ulasan: " + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleTrackOrder = async (order) => {
        setTrackingOrder(order);
        setIsTrackingOpen(true);
        setLoadingTrack(true);
        try {
            const res = await axios.get(`/api/orders/${order.id}/tracking`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
            setTrackingData(res.data.trackings);
        } catch (err) {
            console.error("Gagal memuat tracking", err);
        } finally {
            setLoadingTrack(false);
        }
    };

    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    const faqData = [
        { q: "Berapa lama waktu pengiriman?", a: "Waktu bergantung pada estimasi kurir yang dipilih oleh masing-masing Penjual Toko saat memproses pesanan Anda." },
        { q: "Apa itu Lencana Raden?", a: "Raden Shop adalah lencana khusus bahwa toko tersebut sangat tepercaya oleh sistem kami." }
    ];

    const tabConfig = [
        { key: 'pending', label: 'Belum Bayar', icon: 'fa-wallet' },
        { key: 'processing', label: 'Dikemas', icon: 'fa-box' },
        { key: 'shipped', label: 'Dikirim', icon: 'fa-truck-fast' },
        { key: 'completed', label: 'Selesai', icon: 'fa-check-double' }
    ];

    return (
        <div className="bg-rc-bg min-h-screen text-rc-main font-sans pb-20">
            {/* Elegant Glass Header */}
            <div className="bg-rc-bg/80 backdrop-blur-xl shadow-sm sticky top-0 z-40 border-b-[0.5px] border-rc-main/10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="text-sm font-light tracking-widest text-rc-muted hover:text-rc-logo transition flex items-center gap-2 uppercase">
                        <i className="fa-solid fa-chevron-left"></i> Kembali
                    </button>
                    <h1 className="text-xl font-light tracking-widest text-rc-main border-l-[0.5px] border-rc-logo/50 pl-4">STATUS PESANAN</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 space-y-8">

                {/* Order Tracking Tabs */}
                <div className="bg-gradient-to-br from-rc-card/60 to-rc-bg backdrop-blur-md rounded-2xl border-[0.5px] border-rc-main/10 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.2)]">
                    <div className="flex justify-between md:justify-start overflow-x-auto custom-scrollbar border-b-[0.5px] border-rc-main/10 p-2">
                        {tabConfig.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 text-sm transition-all duration-300 whitespace-nowrap rounded-lg ${activeTab === tab.key ? 'bg-rc-logo/10 text-rc-logo font-medium tracking-wide shadow-[0_0_10px_rgba(255,215,0,0.05)]' : 'text-rc-muted font-light hover:text-rc-main'}`}
                            >
                                <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
                                {orders[tab.key]?.length > 0 && (
                                    <span className="ml-1 bg-rc-main/10 px-2 py-0.5 rounded-full text-[10px] tabular-nums">{orders[tab.key].length}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 min-h-[300px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-48 opacity-50"><i className="fa-solid fa-spinner fa-spin text-3xl text-rc-logo"></i></div>
                        ) : orders[activeTab]?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-rc-muted font-light tracking-wide opacity-70">
                                <i className="fa-solid fa-box-open text-4xl mb-4 text-rc-main/20"></i>
                                Tidak ada pesanan di kategori ini.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {orders[activeTab].map(order => (
                                    <div key={order.id} className="bg-rc-bg/50 border-[0.5px] border-rc-main/10 rounded-xl p-4 hover:border-rc-logo/30 transition-all duration-300">
                                        <div className="flex justify-between items-start mb-3 border-b-[0.5px] border-rc-main/10 pb-3">
                                            <div className="flex items-center gap-2">
                                                <i className="fa-solid fa-store text-rc-logo"></i>
                                                <span className="font-medium text-sm tracking-wide">{order.shop?.nama_toko || 'Toko'}</span>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="text-[10px] text-rc-muted font-light tabular-nums bg-rc-main/5 px-2 py-1 rounded">No: RDN-{order.id.toString().padStart(6, '0')}</div>
                                                <div className="text-[10px] font-bold text-rc-logo uppercase">{order.status.replace('_', ' ')}</div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {order.items?.map((item, idx) => (
                                                <div key={idx} className="flex gap-4 items-center">
                                                    <div className="w-16 h-16 bg-rc-card rounded shadow-inner border-[0.5px] border-rc-main/5 overflow-hidden flex-shrink-0">
                                                        <img src={item.product?.primary_image} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-grow">
                                                        <h4 className="text-sm font-light text-rc-main mb-1 truncate">{item.product_name}</h4>
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-rc-muted font-light">x{item.quantity}</span>
                                                            <span className="text-rc-logo tracking-wider">{formatRp(item.price)}</span>
                                                        </div>
                                                        {activeTab === 'completed' && (
                                                            <button onClick={() => openReviewModal(order.id, item.product)} className="mt-2 text-[10px] uppercase font-light tracking-widest text-rc-bg bg-rc-logo px-3 py-1 rounded hover:bg-yellow-400 transition shadow-[0_0_8px_rgba(255,215,0,0.3)]">
                                                                Beri Penilaian <i className="fa-solid fa-star text-white/70 ml-1"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-4 pt-4 border-t-[0.5px] border-rc-main/10 flex justify-between items-end">
                                            <div className="text-xs font-light text-rc-muted">
                                                Total Pesanan:
                                            </div>
                                            <div className="text-lg font-normal tracking-wide text-rc-logo">
                                                {formatRp(order.total_amount)}
                                            </div>
                                        </div>

                                        {/* Tracking Action (Available on processing and shipped) */}
                                        {(activeTab === 'processing' || activeTab === 'shipped') && (
                                            <div className="mt-4 flex justify-start">
                                                <button onClick={() => handleTrackOrder(order)} className="text-[10px] uppercase font-bold tracking-widest bg-rc-card border-[0.5px] border-rc-main/20 text-rc-main px-4 py-2 rounded hover:text-rc-logo hover:border-rc-logo/50 transition flex items-center gap-2 shadow-sm">
                                                    <i className="fa-solid fa-satellite-dish"></i> Lacak Pengiriman
                                                </button>
                                            </div>
                                        )}

                                        {/* Aksi berdasarkan status */}
                                        {activeTab === 'pending' && (
                                            <div className="mt-4 flex justify-end gap-3">
                                                <button onClick={() => handleBatalBayar(order.id)} className="text-xs uppercase font-light tracking-widest border-[0.5px] border-red-500/50 text-red-500 px-4 py-2 rounded shadow-sm hover:bg-red-500/10 transition">Batal Pesanan</button>
                                                {order.snap_token ? (
                                                    <button 
                                                        onClick={() => {
                                                            if (!window.snap) {
                                                                alert("Gagal memuat sistem pembayaran! Pastikan Anda mematikan AdBlocker atau refresh halaman ini.");
                                                                return;
                                                            }
                                                            window.snap.pay(order.snap_token, {
                                                                onSuccess: async () => { 
                                                                    try {
                                                                        await axios.post('/api/checkout/success-prototype', { snap_token: order.snap_token }, {
                                                                            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
                                                                        });
                                                                    } catch(e) {}
                                                                    alert("Pembayaran berhasil!"); 
                                                                    setActiveTab('processing');
                                                                    fetchOrders(); 
                                                                },
                                                                onPending: () => { alert("Menunggu pembayaran Anda."); },
                                                                onError: () => { alert("Pembayaran gagal."); }
                                                            });
                                                        }} 
                                                        className="text-xs uppercase font-light tracking-widest border-[0.5px] border-rc-logo text-rc-logo px-4 py-2 rounded shadow-sm hover:bg-rc-logo/10 transition"
                                                    >
                                                        Lanjut Bayar
                                                    </button>
                                                ) : (
                                                    <Link to="/pembayaran" className="text-xs uppercase font-light tracking-widest border-[0.5px] border-rc-logo text-rc-logo px-4 py-2 rounded shadow-sm hover:bg-rc-logo/10 transition">Lanjut Bayar</Link>
                                                )}
                                            </div>
                                        )}
                                        {activeTab === 'shipped' && (
                                            <div className="mt-4 flex justify-end">
                                                <button onClick={() => handleTerimaPesanan(order.id)} className="text-xs uppercase font-light tracking-widest bg-rc-logo text-rc-bg border-[0.5px] border-transparent px-6 py-2 rounded shadow-[0_0_15px_rgba(255,215,0,0.2)] hover:bg-yellow-400 transition">Pesanan Diterima</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* FAQ Mini */}
                <div className="bg-rc-card/30 rounded-2xl border-[0.5px] border-rc-main/10 p-6 over:border-rc-logo/30 transition">
                    <h3 className="text-sm font-light tracking-widest text-rc-main mb-4 uppercase border-b-[0.5px] border-rc-main/10 pb-2">Bantuan Cepat (FAQ)</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        {faqData.map((item, idx) => (
                            <div key={idx}>
                                <h4 className="text-xs font-medium text-rc-logo mb-1"><i className="fa-solid fa-circle-question opacity-70 mr-1"></i> {item.q}</h4>
                                <p className="text-[11px] text-rc-muted font-light leading-relaxed">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tracking Modal */}
            {isTrackingOpen && trackingOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsTrackingOpen(false)}></div>
                    <div className="bg-rc-bg p-6 rounded-2xl border-[0.5px] border-rc-main/30 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative w-full max-w-lg animate-fade-in z-10 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-black tracking-widest text-rc-main uppercase flex items-center gap-2">
                                <i className="fa-solid fa-satellite-dish text-rc-logo animate-pulse"></i> RESI PELACAKAN RDN-{trackingOrder.id.toString().padStart(6, '0')}
                            </h2>
                            <button type="button" onClick={() => setIsTrackingOpen(false)} className="text-rc-muted hover:text-red-500 text-xl font-bold transition">&times;</button>
                        </div>
                        
                        <div className="overflow-y-auto no-scrollbar flex-1 relative pl-4 pr-2">
                            {loadingTrack ? (
                                <div className="py-10 text-center"><i className="fa-solid fa-spinner fa-spin text-rc-logo text-2xl"></i></div>
                            ) : trackingData.length > 0 ? (
                                <div className="space-y-6 before:absolute before:inset-y-0 before:left-[21px] before:w-[0.5px] before:bg-rc-main/10">
                                    {trackingData.map((t, idx) => (
                                        <div key={idx} className="relative flex items-start gap-6 group">
                                            <div className={`w-3 h-3 mt-1 rounded-full border-[2px] border-rc-bg z-10 shadow-[0_0_5px_rgba(255,255,255,0.2)] ${idx === 0 ? 'bg-rc-logo shadow-[0_0_8px_rgba(255,215,0,0.5)]' : 'bg-rc-muted/50'}`}></div>
                                            <div className="flex-1 -mt-1.5 pb-2">
                                                <div className="flex justify-between items-center mb-1 drop-shadow">
                                                    <span className={`text-xs font-bold tracking-widest uppercase ${idx === 0 ? 'text-rc-logo' : 'text-rc-main'}`}>{t.status}</span>
                                                </div>
                                                <div className="text-[10px] text-rc-muted/60 mb-2 font-bold uppercase">{new Date(t.created_at).toLocaleString('id-ID')}</div>
                                                <p className="text-[11px] text-rc-main font-medium leading-relaxed mb-1 italic">"{t.note}"</p>
                                                <p className="text-[10px] text-rc-muted uppercase"><i className="fa-solid fa-location-arrow text-rc-logo/50 mr-1"></i> {t.location}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center text-xs text-rc-muted font-bold tracking-widest uppercase">
                                    <i className="fa-solid fa-truck-ramp-box text-3xl mb-3 opacity-50 block"></i>
                                    Pesanan Anda sedang dipersiapkan. Belum ada log pelacakan.
                                </div>
                            )}
                        </div>
                        
                        {trackingData.length > 0 && <div className="text-[9px] text-rc-muted text-center mt-4 border-t-[0.5px] border-rc-main/10 pt-4 uppercase tracking-widest">Waktu ditunjukkan dari zona WIB (Server Time).</div>}
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {isReviewOpen && reviewProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsReviewOpen(false)}></div>
                    <div className="bg-rc-bg p-8 rounded-2xl border-[0.5px] border-rc-logo/30 shadow-[0_0_30px_rgba(255,215,0,0.1)] relative w-full max-w-md animate-fade-in z-10">
                        <h2 className="text-xl font-light tracking-widest text-rc-logo mb-2 uppercase">Ulasan Produk</h2>
                        <p className="text-sm font-light text-rc-muted mb-6">Berikan ranting dan komentar untuk {reviewProduct?.nama_produk || 'Produk ini'}</p>

                        <form onSubmit={submitReview}>
                            <div className="mb-6 flex justify-center gap-2 text-3xl">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        type="button"
                                        key={star}
                                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                        className={`transition-all duration-300 ${star <= reviewForm.rating ? 'text-rc-logo drop-shadow-[0_0_8px_rgba(255,215,0,0.5)] scale-110' : 'text-rc-main/20 hover:text-rc-logo/50'}`}
                                    >
                                        <i className="fa-solid fa-star"></i>
                                    </button>
                                ))}
                            </div>
                            <div className="mb-6">
                                <label className="block text-[10px] uppercase font-light tracking-widest text-rc-muted mb-2">Komentar Singkat</label>
                                <textarea
                                    className="w-full bg-transparent border-[0.5px] border-rc-main/20 rounded text-rc-main p-3 text-sm focus:border-rc-logo outline-none transition custom-scrollbar font-light"
                                    rows="3"
                                    placeholder="Sangat memuaskan..."
                                    value={reviewForm.comment}
                                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setIsReviewOpen(false)} className="px-4 py-2 text-xs uppercase font-light tracking-widest text-rc-muted hover:text-rc-main transition">Batal</button>
                                <button type="submit" disabled={submitting} className="px-6 py-2 bg-rc-logo text-rc-bg text-xs uppercase font-light tracking-widest rounded hover:bg-yellow-400 transition shadow-[0_0_10px_rgba(255,215,0,0.15)] disabled:opacity-50">
                                    {submitting ? 'Menyimpan...' : 'Kirim Ulasan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
