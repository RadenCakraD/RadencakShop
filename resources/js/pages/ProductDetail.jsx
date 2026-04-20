import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

export default function ProductDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();

    // States
    const [product, setProduct] = useState(null);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState(false);
    const [buyNowLoading, setBuyNowLoading] = useState(false);

    // Interactive UI States
    const [activeVariant, setActiveVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    useEffect(() => {
        const fetchProductDetail = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/products/${slug}`);
                const data = response.data;
                setProduct(data);

                // Setup initial variant to lowest price variant if available
                if (data.variants && data.variants.length > 0) {
                    const lowest = data.variants.reduce((min, v) => parseFloat(v.harga_jual) < parseFloat(min.harga_jual) ? v : min, data.variants[0]);
                    setActiveVariant(lowest);
                }

                // Fetch similar products
                if (data.kategori) {
                    const simRes = await axios.get('/api/products');
                    // Dummy filter just for visual purposes
                    setSimilarProducts(simRes.data.data ? simRes.data.data.slice(0, 6) : simRes.data.slice(0, 6));
                }

            } catch (err) {
                console.error("Gagal memuat detail produk:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProductDetail();
        window.scrollTo(0, 0); // Scroll to top when changing products
    }, [slug]);

    // Computed Values berdasarkan Variant vs Base
    const displayPrice = activeVariant ? parseFloat(activeVariant.harga_jual) : (product ? parseFloat(product.harga_jual) : 0);
    const displayOriginal = activeVariant
        ? (parseFloat(activeVariant.harga_asli) > 0 ? parseFloat(activeVariant.harga_asli) : displayPrice)
        : (product ? (parseFloat(product.harga_dasar) > 0 ? parseFloat(product.harga_dasar) : displayPrice) : 0);
    const maxStock = activeVariant ? parseInt(activeVariant.stok) : (product ? parseInt(product.stok) : 0);

    const handleQtyChange = (delta) => {
        setQuantity(prev => {
            let newVal = prev + delta;
            if (newVal < 1) newVal = 1;
            if (newVal > maxStock) newVal = maxStock;
            return newVal;
        });
    };

    const handleAddToCart = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            alert('Silakan login terlebih dahulu!');
            navigate('/login');
            return;
        }

        setAddingToCart(true);
        try {
            await axios.post('/api/cart', {
                product_id: product.id,
                quantity: quantity,
                product_variant_id: activeVariant?.id || null
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert('Berhasil ditambah ke keranjang!');
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menambahkan ke keranjang');
        } finally {
            setAddingToCart(false);
        }
    };

    const handleBuyNow = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            alert('Silakan login terlebih dahulu!');
            navigate('/login');
            return;
        }

        setBuyNowLoading(true);
        try {
            const res = await axios.post('/api/cart', {
                product_id: product.id,
                quantity: quantity,
                product_variant_id: activeVariant?.id || null
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const cartData = res.data;
            if (cartData && cartData.cart) {
                localStorage.setItem('checkout_items', JSON.stringify([String(cartData.cart.id)]));
                navigate('/pembayaran');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal memproses Beli Sekarang');
        } finally {
            setBuyNowLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-rc-logo bg-rc-bg font-bold mb-[200px]"><i className="fa-solid fa-spinner fa-spin text-4xl"></i></div>;
    if (!product) return <div className="text-center py-20 bg-rc-bg min-h-screen text-red-500 font-bold text-xl">Produk Tidak Ditemukan (404)</div>;

    // Kumpulkan Semua Gambar (Utama + Varian)
    let allImages = [];
    if (product.images) allImages = [...product.images];
    if (product.variants) {
        product.variants.forEach(v => {
            if (v.image_url) allImages.push({ image_url: v.image_url, is_variant: true, var_id: v.id });
        });
    }
    const defaultImgUrl = "/logo_web/no-product.png";

    return (
        <div className="bg-rc-bg min-h-screen pb-16 text-rc-main font-sans">

            {/* Header / Nav Simple */}
            <div className="bg-rc-bg sticky top-0 z-40 mb-8 border-b-[0.5px] border-rc-main/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="text-rc-muted hover:text-rc-main transition flex items-center gap-2 text-xs font-bold uppercase">
                        <i className="fa-solid fa-chevron-left"></i> KEMBALI
                    </button>
                    <Link to="/keranjang" className="text-rc-muted hover:text-rc-main transition p-2 relative">
                        <i className="fa-solid fa-cart-shopping text-xl"></i>
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Product Layout Grid */}
                <div className="bg-rc-card rounded-xl border-[0.5px] border-rc-main/20 p-6 flex flex-col lg:flex-row gap-8 lg:gap-10 relative overflow-hidden">

                    {/* Left: Gallery */}
                    <div className="flex-shrink-0 w-full lg:w-[40%] flex flex-col gap-4 z-10">
                        {allImages.length > 0 ? (
                            <>
                                <div className="aspect-square bg-rc-bg rounded-xl overflow-hidden border-[0.5px] border-rc-main/20 relative">
                                    <img
                                        src={allImages[activeImageIndex]?.image_url.startsWith('http') ? allImages[activeImageIndex]?.image_url : `/storage/${allImages[activeImageIndex]?.image_url}`}
                                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                        alt="Main Product"
                                    />
                                </div>
                                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                    {allImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-[2px] transition-colors ${activeImageIndex === idx ? 'border-rc-logo' : 'border-transparent opacity-60 hover:opacity-100 hover:border-rc-main/50'}`}
                                        >
                                            <img src={img.image_url.startsWith('http') ? img.image_url : `/storage/${img.image_url}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="aspect-square bg-rc-bg border-[0.5px] border-rc-main/30 rounded-xl flex items-center justify-center">
                                <img src={defaultImgUrl} className="w-full h-full object-cover rounded-xl" />
                            </div>
                        )}
                    </div>

                    {/* Right: Info */}
                    <div className="flex-grow flex flex-col z-10">
                        <h1 className="text-2xl lg:text-4xl font-bold text-rc-main mb-3 leading-tight uppercase">
                            {product.nama_produk}
                        </h1>

                        <div className="flex items-center gap-4 text-[10px] text-rc-muted mb-6 pb-6 border-b-[0.5px] border-rc-main/20 uppercase font-bold">
                            <span className="flex items-center gap-1 text-rc-logo"><i className="fa-solid fa-star"></i> 5.0</span>
                            <span className="w-[4px] h-[4px] bg-rc-main/20 rounded-full"></span>
                            <span>{Math.floor(Math.random() * 100) + 10} TERJUAL</span>
                            <span className="w-[4px] h-[4px] bg-rc-main/20 rounded-full"></span>
                            <span className="flex items-center gap-1"><i className="fa-solid fa-tag text-rc-muted/50"></i> {product.kategori}</span>
                        </div>

                        {/* Harga Box */}
                        <div className="mb-8 p-5 bg-rc-bg rounded-xl border-[0.5px] border-rc-main/20">
                            {displayOriginal > displayPrice && (
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="bg-rc-logo text-rc-bg text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase">
                                        Diskon {Math.round(((displayOriginal - displayPrice) / displayOriginal) * 100)}%
                                    </span>
                                    <span className="text-rc-muted line-through text-xs font-bold">{formatRp(displayOriginal)}</span>
                                </div>
                            )}
                            <div className="text-3xl lg:text-4xl font-bold text-rc-logo flex items-end gap-1">
                                <span className="text-lg text-rc-logo/80 mb-1">IDR</span> {formatRp(displayPrice).replace('Rp', '').trim()}
                            </div>
                        </div>

                        {/* Varian Selection */}
                        {product.variants && product.variants.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-[10px] font-bold text-rc-muted mb-3 uppercase">Spesifikasi: <span className="text-rc-main">{activeVariant?.nama_jenis}</span></h3>
                                <div className="flex flex-wrap gap-3">
                                    {product.variants.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() => {
                                                setActiveVariant(v);
                                                const varImgIdx = allImages.findIndex(img => img.var_id === v.id);
                                                if (varImgIdx !== -1) setActiveImageIndex(varImgIdx);
                                            }}
                                            className={`px-4 py-2 border-[1px] font-bold text-xs transition-colors rounded-sm uppercase ${activeVariant?.id === v.id
                                                    ? 'border-rc-logo bg-rc-bg text-rc-logo'
                                                    : 'border-rc-main/20 text-rc-muted hover:border-rc-main hover:text-rc-main bg-rc-bg'
                                                } ${v.stok == 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                            disabled={v.stok == 0}
                                        >
                                            {v.nama_jenis}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Opsi Kuantitas */}
                        <div className="mb-10 flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-8">
                            <div>
                                <h3 className="text-[10px] font-bold text-rc-muted mb-3 uppercase">Kuantitas</h3>
                                <div className="flex items-center border-[1px] border-rc-main/20 rounded-sm w-fit bg-rc-bg">
                                    <button onClick={() => handleQtyChange(-1)} className="w-10 h-10 flex items-center justify-center text-rc-main hover:bg-rc-card transition-colors disabled:opacity-20" disabled={quantity <= 1}>
                                        <i className="fa-solid fa-minus text-xs"></i>
                                    </button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        readOnly
                                        className="w-12 h-10 text-center font-bold text-rc-main bg-transparent border-none outline-none appearance-none"
                                    />
                                    <button onClick={() => handleQtyChange(1)} className="w-10 h-10 flex items-center justify-center text-rc-main hover:bg-rc-card transition-colors disabled:opacity-20" disabled={quantity >= maxStock}>
                                        <i className="fa-solid fa-plus text-xs"></i>
                                    </button>
                                </div>
                            </div>
                            <div className="text-[10px] font-bold text-rc-muted uppercase pb-2">
                                <span>Tersedia <strong className="text-rc-main mx-1">{maxStock}</strong> unit stok</span>
                            </div>
                        </div>

                        {/* Aksi Tambah Keranjang */}
                        <div className="flex flex-col sm:flex-row gap-4 mt-auto pt-8 border-t-[0.5px] border-rc-main/20">
                            <button
                                onClick={handleBuyNow}
                                disabled={buyNowLoading || maxStock === 0}
                                className="flex-1 bg-rc-card border-[0.5px] border-rc-logo text-rc-logo font-bold text-xs py-3.5 px-6 rounded-md hover:bg-rc-logo hover:text-rc-bg transition-colors uppercase flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {buyNowLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <><i className="fa-solid fa-credit-card"></i> Bayar Langsung</>}
                            </button>
                            <button
                                onClick={handleAddToCart}
                                disabled={addingToCart || maxStock === 0}
                                className="flex-1 bg-rc-logo text-rc-bg font-bold text-xs py-3.5 px-6 rounded-md hover:opacity-80 transition-opacity uppercase flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {addingToCart ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <><i className="fa-solid fa-cart-shopping"></i> Masukkan Keranjang</>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Toko Panel */}
                {product.shop && (
                    <div className="bg-rc-card rounded-xl border-[0.5px] border-rc-main/20 p-6 mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <img src={product.shop.foto_profil ? `/storage/${product.shop.foto_profil}` : defaultImgUrl} className="w-16 h-16 rounded-md object-cover border-[0.5px] border-rc-main/20" />
                            <div>
                                <h3 className="font-bold uppercase text-rc-main text-sm flex items-center gap-3">
                                    {product.shop.nama_toko}
                                    {product.shop.shop_tier === 'raden' && (
                                        <span className="bg-rc-logo text-rc-bg text-[8px] px-2 py-0.5 rounded-sm font-bold"><i className="fa-solid fa-crown mr-1"></i>RADEN</span>
                                    )}
                                </h3>
                                <p className="text-[10px] font-semibold text-rc-muted mt-1 uppercase"><i className="fa-solid fa-plane-departure mr-1"></i> Dari {product.shop.alamat_toko}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 text-xs font-bold uppercase">
                            <button
                                onClick={async () => {
                                    if (!localStorage.getItem('auth_token')) { alert('Silakan login terlebih dahulu'); navigate('/login'); return; }
                                    try {
                                        await axios.post('/api/chat', { shop_id: product.shop.id });
                                        navigate('/chat');
                                    } catch (e) { alert('Gagal membuka chat'); }
                                }}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center gap-2"
                            >
                                <i className="fa-regular fa-comment-dots"></i> Diskusi
                            </button>
                            <Link to={`/toko/${product.shop.id}`} className="px-6 py-2.5 bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main hover:bg-rc-main hover:text-rc-bg rounded-md transition-colors flex items-center gap-2">
                                <i className="fa-solid fa-door-open"></i> Masuk Toko
                            </Link>
                        </div>
                    </div>
                )}

                {/* Deskripsi Panjang */}
                <div className="bg-rc-card rounded-xl border-[0.5px] border-rc-main/20 p-6 md:p-8 mt-8">
                    <h2 className="text-sm font-bold uppercase text-rc-main mb-6 border-b-[0.5px] border-rc-main/20 pb-4 flex items-center gap-2">
                        <i className="fa-solid fa-align-left text-rc-muted"></i> Keterangan Eksklusif
                    </h2>
                    <div className="prose prose-invert max-w-none text-rc-muted whitespace-pre-wrap leading-relaxed text-sm font-medium bg-rc-bg p-6 rounded-md border-[0.5px] border-rc-main/10">
                        {product.deskripsi}
                    </div>
                </div>

                {similarProducts.length > 0 && (
                    <div className="mt-16">
                        <h2 className="text-2xl font-bold text-rc-main mb-8 border-l-4 border-rc-logo pl-4">Mungkin Anda Suka</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {similarProducts.map(sp => (
                                <ProductCard key={sp.id} product={sp} hideActions={true} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
