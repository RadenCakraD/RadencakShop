import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function Cart() {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState([]);
    const [processingId, setProcessingId] = useState(null);

    const fetchCart = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.get('/api/cart');
            const data = response.data;
            setCartItems(data);

            // Auto-select all items by default on first load if we don't have existing selections
            if (selectedItems.length === 0 && data.length > 0) {
                setSelectedItems(data.map(item => item.id.toString()));
            }
        } catch (err) {
            console.error("Gagal memuat keranjang", err);
            if (err.response?.status === 401) {
                localStorage.removeItem('auth_token');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    const toggleSelect = (idStr) => {
        setSelectedItems(prev =>
            prev.includes(idStr) ? prev.filter(i => i !== idStr) : [...prev, idStr]
        );
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === cartItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(cartItems.map(i => i.id.toString()));
        }
    };

    const handleUpdateQty = async (id, currentQty, delta) => {
        const newQty = currentQty + delta;
        if (newQty < 1) return;

        setProcessingId(id);
        try {
            await axios.put(`/api/cart/${id}`, { quantity: newQty });
            // Optimistic update
            setCartItems(prev => prev.map(item => item.id === id ? { ...item, qty: newQty } : item));
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal mengubah jumlah stok');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Hapus barang ini dari keranjang?")) return;
        setProcessingId(id);
        try {
            await axios.delete(`/api/cart/${id}`);
            setCartItems(prev => prev.filter(item => item.id !== id));
            setSelectedItems(prev => prev.filter(i => i !== id.toString()));
        } catch (err) {
            alert('Gagal menghapus produk');
        } finally {
            setProcessingId(null);
        }
    };

    const handleCheckout = () => {
        if (selectedItems.length === 0) {
            alert('Pilih minimal satu barang untuk dicheckout.');
            return;
        }
        localStorage.setItem('checkout_items', JSON.stringify(selectedItems));
        navigate('/pembayaran');
    };

    // Kalkulasi Total
    let totalItems = 0;
    let totalPrice = 0;

    cartItems.forEach(item => {
        if (selectedItems.includes(item.id.toString())) {
            const price = item.variant ? parseFloat(item.variant.harga_jual) : parseFloat(item.product.harga_jual);
            totalItems += item.qty;
            totalPrice += price * item.qty;
        }
    });

    if (loading) return <div className="min-h-screen flex items-center justify-center text-rc-logo bg-rc-bg font-bold mb-[200px]"><i className="fa-solid fa-spinner fa-spin text-4xl"></i></div>;

    return (
        <div className="bg-rc-bg min-h-screen pb-32 text-rc-main font-sans">

            <div className="bg-rc-bg sticky top-0 z-40 border-b-[0.5px] border-rc-main/20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center">
                    <button onClick={() => navigate(-1)} className="text-rc-muted hover:text-rc-main transition flex items-center gap-2 text-xs font-bold uppercase mr-4">
                        <i className="fa-solid fa-chevron-left"></i> KEMBALI
                    </button>
                    <h1 className="text-lg font-bold text-rc-main border-l-[0.5px] border-rc-main/50 pl-4 uppercase">Keranjang Belanja</h1>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">

                {cartItems.length === 0 ? (
                    <div className="bg-rc-card rounded-2xl shadow-lg border-[0.5px] border-rc-main/30 p-12 text-center">
                        <i className="fa-solid fa-cart-shopping text-6xl text-rc-muted opacity-50 mb-4 block"></i>
                        <h2 className="text-xl font-bold text-rc-main">Keranjangmu masih kosong</h2>
                        <p className="text-rc-muted mt-2 mb-6 text-sm">Yuk pilih barang kesukaanmu dan tambahkan ke sini!</p>
                        <Link to="/dashboard" className="bg-rc-logo hover:bg-yellow-400 text-rc-bg font-bold py-3 px-8 rounded-xl transition inline-block shadow-md">
                            Mulai Belanja
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">

                        {/* Header Checkbox */}
                        <div className="bg-rc-card p-4 rounded-lg border-[0.5px] border-rc-main/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.length === cartItems.length && cartItems.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 text-rc-logo bg-transparent border-[1px] border-rc-main/50 rounded focus:ring-rc-logo cursor-pointer appearance-none checked:bg-rc-logo relative"
                                    />
                                    <span className="font-bold text-sm text-rc-main uppercase">Pilih Semua ({cartItems.length})</span>
                                </label>
                            </div>
                            {selectedItems.length > 0 && (
                                <button className="text-xs font-bold uppercase border-[1px] border-red-500/50 px-3 py-1 rounded text-red-500 hover:bg-red-500 hover:text-white transition-colors">Hapus Terpilih</button>
                            )}
                        </div>

                        {/* List Items */}
                        <div className="bg-rc-bg rounded-lg border-[0.5px] border-rc-main/20 mt-4 overflow-hidden">
                            {cartItems.map((item, idx) => {
                                const price = item.variant ? parseFloat(item.variant.harga_jual) : parseFloat(item.product.harga_jual);
                                const original = item.variant ? (parseFloat(item.variant.harga_asli) || price) : (parseFloat(item.product.harga_dasar) || price);
                                const discountPersen = original > price ? Math.round(((original - price) / original) * 100) : 0;
                                const idStr = item.id.toString();
                                const isSelected = selectedItems.includes(idStr);
                                const isProcessing = processingId === item.id;

                                const imgUrl = item.variant && item.variant.image_url 
                                    ? `/storage/${item.variant.image_url}` 
                                    : item.product.primary_image;

                                return (
                                    <div key={item.id} className={`p-6 flex gap-4 ${idx !== cartItems.length - 1 ? 'border-b-[0.5px] border-rc-main/20' : ''} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <div className="flex items-start pt-2">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelect(idStr)}
                                                className="w-4 h-4 text-rc-logo bg-transparent border-[1px] border-rc-main/50 rounded focus:ring-rc-logo cursor-pointer appearance-none checked:bg-rc-logo relative"
                                            />
                                        </div>
                                        <Link to={`/product/${item.product.slug}`} className="w-24 h-24 flex-shrink-0 bg-rc-bg rounded-xl overflow-hidden border-[0.5px] border-rc-main/30 block">
                                            <img src={imgUrl.startsWith('http') ? imgUrl : imgUrl} className="w-full h-full object-cover" alt="Product" />
                                        </Link>
                                        <div className="flex flex-col flex-grow">
                                            <Link to={`/product/${item.product.slug}`} className="font-bold text-rc-main text-sm md:text-base line-clamp-2 hover:text-rc-logo transition">
                                                {item.product.nama_produk}
                                            </Link>

                                            <div className="text-xs text-rc-muted mt-1.5 mb-2 flex items-center gap-2">
                                                {item.variant && <span className="bg-rc-logo/10 text-rc-logo border border-rc-logo/30 rounded px-2 py-0.5"><strong className="font-semibold">{item.variant.nama_jenis}</strong></span>}
                                            </div>

                                            <div className="mt-auto flex items-end justify-between">
                                                <div className="flex flex-col">
                                                    {original > price && (
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-bold bg-rc-logo/20 text-rc-logo px-1.5 py-0.5 rounded">{discountPersen}%</span>
                                                            <span className="text-xs text-rc-muted line-through">{formatRp(original)}</span>
                                                        </div>
                                                    )}
                                                    <span className="font-bold text-rc-logo text-lg">{formatRp(price)}</span>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    {/* Kuantitas */}
                                                    <div className="flex items-center border-[0.5px] border-rc-main/50 rounded-lg overflow-hidden flex-shrink-0 bg-rc-bg">
                                                        <button onClick={() => handleUpdateQty(item.id, item.qty, -1)} disabled={item.qty <= 1} className="w-8 h-8 flex items-center justify-center text-rc-main hover:text-rc-logo hover:bg-rc-card disabled:opacity-50 transition"><i className="fa-solid fa-minus text-[10px]"></i></button>
                                                        <div className="w-10 h-8 flex items-center justify-center text-sm font-bold text-rc-main">{item.qty}</div>
                                                        <button onClick={() => handleUpdateQty(item.id, item.qty, 1)} className="w-8 h-8 flex items-center justify-center text-rc-main hover:text-rc-logo hover:bg-rc-card transition"><i className="fa-solid fa-plus text-[10px]"></i></button>
                                                    </div>

                                                    {/* Tong Sampah */}
                                                    <button onClick={() => handleDelete(item.id)} className="text-rc-muted hover:text-red-500 transition px-2 py-1 flex-shrink-0">
                                                        <i className="fa-solid fa-trash-can text-lg"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Checkout Bar Floating */}
            {cartItems.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-rc-bg border-t-[0.5px] border-rc-main/20 z-40">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-rc-muted uppercase mb-1">Total Belanja ({selectedItems.length} brg)</span>
                            <span className="text-xl md:text-2xl font-bold text-rc-logo">{formatRp(totalPrice)}</span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            disabled={selectedItems.length === 0}
                            className="bg-rc-logo text-rc-bg hover:opacity-80 uppercase font-bold py-3 md:py-4 px-8 md:px-12 rounded transition-colors disabled:opacity-50 flex items-center gap-2 text-xs md:text-sm"
                        >
                            CHECKOUT <i className="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
