import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Checkout() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [checkoutItems, setCheckoutItems] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processingCheckout, setProcessingCheckout] = useState(false);

    // Checkouts Form State
    const [shippingMethod, setShippingMethod] = useState('Santai');
    const [paymentMethod, setPaymentMethod] = useState('Transfer Bank');
    const [paymentSubMethod, setPaymentSubMethod] = useState('BCA');
    const [accountNumber, setAccountNumber] = useState('');
    const [isAccountVerified, setIsAccountVerified] = useState(false);
    const [voucherCode, setVoucherCode] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [checkingVoucher, setCheckingVoucher] = useState(false);

    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    const loadData = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            navigate('/login');
            return;
        }

        const selectedIdsStr = localStorage.getItem('checkout_items');
        const buyNowItemStr = localStorage.getItem('buy_now_item');
        
        if (!selectedIdsStr && !buyNowItemStr) {
            // Jika tidak ada barang, arahkan ke Home saja, jangan paksa ke keranjang agar tidak terjebak
            navigate('/');
            return;
        }

        try {
            setLoading(true);

            // Parallel Fetch: User Info and Addresses
            const [userRes, addressRes] = await Promise.all([
                axios.get('/api/user'),
                axios.get('/api/addresses')
            ]);

            setUser(userRes.data);
            setAddresses(addressRes.data);
            
            if (addressRes.data.length > 0) {
                const primary = addressRes.data.find(a => a.is_primary);
                setSelectedAddress(primary || addressRes.data[0]);
            }

            if (buyNowItemStr) {
                // Handle Buy Now (Direct)
                const buyNowData = JSON.parse(buyNowItemStr);
                setCheckoutItems([{
                    id: 'direct', // special id for direct buy
                    product_id: buyNowData.product_id,
                    variant_id: buyNowData.variant_id,
                    qty: buyNowData.qty,
                    product: buyNowData.product,
                    variant: buyNowData.variant
                }]);
            } else {
                // Handle Cart Checkout
                const selectedIds = JSON.parse(selectedIdsStr);
                const cartRes = await axios.get('/api/cart');
                const filteredCarts = cartRes.data.filter(c => selectedIds.includes(c.id.toString()));
                if (filteredCarts.length === 0) {
                    toast.error('Barang di keranjang tidak valid atau sudah dibayar.');
                    navigate('/keranjang');
                    return;
                }
                setCheckoutItems(filteredCarts);
            }

        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                localStorage.removeItem('auth_token');
                navigate('/login');
            } else {
                toast.error('Gagal memuat detail checkout.');
                navigate('/keranjang');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        // Injeksi Dinamis Script Midtrans Snapshot
        const midtransScriptUrl = 'https://app.sandbox.midtrans.com/snap/snap.js';
        const myMidtransClientKey = 'SB-Mid-client-A41_8Rz1AOSa7T9m777o0Yc4';

        let scriptTag = document.createElement('script');
        scriptTag.src = midtransScriptUrl;
        scriptTag.setAttribute('data-client-key', myMidtransClientKey);

        document.body.appendChild(scriptTag);

        return () => {
            document.body.removeChild(scriptTag);
        }
    }, []);

    const handleCheckoutExecute = async () => {
        if (!user) {
            toast.error("Memuat data pengguna...");
            return;
        }

        if (!selectedAddress) {
            toast.error("Harap tambahkan Alamat Pengiriman di Pusat Pengaturan terlebih dahulu!");
            return;
        }

        const addressStr = `[${selectedAddress.tag.toUpperCase()}] ${selectedAddress.receiver_name} | ${selectedAddress.phone_number} | ${selectedAddress.full_address} (Patokan: ${selectedAddress.note || '-'})`;

        const isDirectBuy = checkoutItems.length === 1 && checkoutItems[0].id === 'direct';

        const payload = {
            address_id: selectedAddress.id,
            address_info: addressStr,
            payment_method: paymentMethod === 'Cash / COD' ? 'Cash / COD' : `${paymentMethod} - ${paymentSubMethod} (${accountNumber})`,
            shipping_method: shippingMethod,
            voucher_code: appliedVoucher ? appliedVoucher.code : null,
            shipping_latitude: selectedAddress.latitude,
            shipping_longitude: selectedAddress.longitude
        };

        if (isDirectBuy) {
            payload.product_id = checkoutItems[0].product_id;
            payload.variant_id = checkoutItems[0].variant_id;
            payload.qty = checkoutItems[0].qty;
        } else {
            payload.cart_ids = checkoutItems.map(item => item.id);
        }

        setProcessingCheckout(true);
        try {
            const res = await axios.post('/api/checkout', payload);

            if (res.data.snap_token) {
                // Trigger Midtrans Snap Popup
                window.snap.pay(res.data.snap_token, {
                    onSuccess: async function (result) {
                        toast.success("Pembayaran berhasil! Silahkan tunggu validasi sistem.");
                        localStorage.removeItem('checkout_items');
                        localStorage.removeItem('buy_now_item');
                        navigate('/informasi?tab=pending');
                    },
                    onPending: function (result) {
                        toast.loading("Menunggu pembayaran Anda!");
                        localStorage.removeItem('checkout_items');
                        localStorage.removeItem('buy_now_item');
                        navigate('/informasi?tab=pending');
                    },
                    onError: function (result) {
                        toast.error("Pembayaran gagal!");
                    },
                    onClose: function () {
                        toast.error('Gagal: Anda menutup popup tanpa menyelesaikan pembayaran');
                        localStorage.removeItem('checkout_items');
                        localStorage.removeItem('buy_now_item');
                        navigate('/informasi?tab=pending');
                    }
                });
            } else {
                toast.success('Pesanan Berhasil Dibuat Secara COD.');
                localStorage.removeItem('checkout_items');
                localStorage.removeItem('buy_now_item');
                navigate('/informasi?tab=processing'); // COD usually goes to processing immediately
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal membuat pesanan');
        } finally {
            setProcessingCheckout(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-rc-logo bg-rc-bg font-bold mb-[200px]"><i className="fa-solid fa-spinner fa-spin text-4xl"></i></div>;

    // Kalkulasi Total
    let productTotal = 0;
    let totalQty = 0;
    let shopId = null;

    checkoutItems.forEach(item => {
        const price = item.variant ? parseFloat(item.variant.harga_jual) : parseFloat(item.product.harga_jual);
        productTotal += price * item.qty;
        totalQty += item.qty;
        if (!shopId) shopId = item.product.shop_id;
    });

    const handleCheckVoucher = async () => {
        if (!voucherCode) return;
        setCheckingVoucher(true);
        try {
            const res = await axios.post('/api/vouchers/check', {
                code: voucherCode,
                total_amount: productTotal,
                shop_id: shopId
            });
            setAppliedVoucher(res.data.voucher);
            setDiscountAmount(res.data.discount_amount);
            toast.success(res.data.message);
        } catch (e) {
            toast.error(e.response?.data?.message || "Voucher tidak valid");
            setAppliedVoucher(null);
            setDiscountAmount(0);
        } finally {
            setCheckingVoucher(false);
        }
    };

    const handleVerifyAccount = async () => {
        if (!accountNumber || accountNumber.length < 9) {
            toast.error("Nomor Rekening/Telepon minimal 9 karakter!");
            return;
        }

        const loadingToast = toast.loading("Memverifikasi identitas pemilik...");
        try {
            const res = await axios.post('/api/checkout/verify-bank', {
                provider: paymentSubMethod,
                account_number: accountNumber
            });
            setIsAccountVerified(true);
            toast.success(`Ditemukan: ${res.data.account_name} (${res.data.provider})`, { id: loadingToast });
        } catch (e) {
            setIsAccountVerified(false);
            toast.error("Verifikasi Gagal, data tidak terdaftar di sistem", { id: loadingToast });
        }
    };

    const shippingFee = selectedAddress?.region 
        ? (shippingMethod === 'Santai' ? parseFloat(selectedAddress.region.shipping_fee_santai) : parseFloat(selectedAddress.region.shipping_fee_cepat))
        : (shippingMethod === 'Santai' ? 10000 : 15000);
    const serviceFee = selectedAddress?.region ? parseFloat(selectedAddress.region.service_fee) : 500;
    const taxRate = selectedAddress?.region ? parseFloat(selectedAddress.region.tax_rate) : 0;
    const taxAmount = (productTotal * taxRate) / 100;
    const finalTotal = Math.max(0, productTotal + shippingFee + serviceFee + taxAmount - discountAmount);

    return (
        <div className="bg-rc-bg min-h-screen pb-32 text-rc-main font-sans">

            {/* Navigasi Minimal Checkout */}
            <div className="bg-rc-bg sticky top-0 z-40 border-b-[0.5px] border-rc-main/20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center">
                    <button onClick={() => navigate(-1)} className="text-rc-muted hover:text-rc-main transition flex items-center gap-2 text-xs font-bold uppercase mr-4">
                        <i className="fa-solid fa-chevron-left"></i> KEMBALI
                    </button>
                    <h1 className="text-lg font-bold text-rc-main border-l-[0.5px] border-rc-main/50 pl-4 flex items-center gap-2 uppercase">
                        <i className="fa-solid fa-shield-halved text-rc-logo"></i> CHECKOUT AMAN
                    </h1>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 flex flex-col lg:flex-row gap-6">

                {/* Kolom Kiri: Alamat & Produk */}
                <div className="flex-grow flex flex-col gap-6 w-full lg:w-2/3">

                    {/* Kotak Alamat Pengiriman */}
                    <div className="bg-rc-card rounded-xl border-[0.5px] border-rc-main/20 p-6 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-4 mt-2 border-b-[0.5px] border-rc-main/20 pb-3">
                            <h2 className="text-sm font-bold text-rc-main uppercase flex items-center gap-2">
                                <i className="fa-solid fa-location-dot text-rc-logo"></i> ALAMAT PENGIRIMAN
                            </h2>
                            <button onClick={() => setShowAddressModal(true)} className="text-xs font-bold text-rc-logo hover:text-white uppercase px-3 py-1 border-[0.5px] border-rc-logo/30 hover:bg-rc-logo rounded transition">
                                Ubah
                            </button>
                        </div>
                        {selectedAddress ? (
                            <div className="text-sm text-rc-muted bg-rc-bg p-4 rounded-lg border-[0.5px] border-rc-main/20">
                                <div className="font-bold text-base text-rc-main mb-1 flex items-center gap-2">
                                    {selectedAddress.receiver_name}
                                    <span className="bg-rc-logo text-rc-bg text-[9px] px-2 py-0.5 rounded shadow-sm uppercase font-black">{selectedAddress.tag}</span>
                                </div>
                                <div className="mb-1 font-bold tracking-wider">{selectedAddress.phone_number}</div>
                                <div className="text-xs mb-1 line-clamp-2">{selectedAddress.full_address}</div>
                                {selectedAddress.note && <div className="text-[10px] text-teal-400 font-bold bg-teal-400/10 px-2 py-1 rounded w-fit italic mt-1">"{selectedAddress.note}"</div>}
                            </div>
                        ) : (
                            <div className="text-sm text-rc-muted bg-red-500/10 p-4 rounded-lg border-[0.5px] border-red-500/30 flex items-center gap-3">
                                <i className="fa-solid fa-triangle-exclamation text-red-500 text-xl"></i>
                                <div>
                                    <div className="font-bold text-red-500 uppercase text-xs mb-0.5">Alamat Belum Diatur</div>
                                    <div className="text-[10px] text-rc-main/70">Harap tambahkan alamat di Pusat Pengaturan untuk melanjutkan pesanan.</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rincian Barang */}
                    <div className="bg-rc-bg rounded-xl border-[0.5px] border-rc-main/20 overflow-hidden">
                        <div className="px-6 py-4 border-b-[0.5px] border-rc-main/20 font-bold text-rc-main flex items-center gap-2">
                            <i className="fa-solid fa-box text-rc-logo"></i> Pesanan Anda
                        </div>
                        {checkoutItems.map((item, idx) => {
                            const price = item.variant ? parseFloat(item.variant.harga_jual) : parseFloat(item.product.harga_jual);
                            const imgUrl = item.variant && item.variant.image_url
                                ? `/storage/${item.variant.image_url}`
                                : item.product?.primary_image;

                            return (
                                <div key={item.id} className={`p-6 flex gap-4 hover:bg-rc-bg/50 transition ${idx !== checkoutItems.length - 1 ? 'border-b-[0.5px] border-dashed border-rc-main/20' : ''}`}>
                                    <img src={imgUrl.startsWith('http') ? imgUrl : imgUrl} className="w-20 h-20 rounded-lg object-cover border-[0.5px] border-rc-main/30" alt="Produk" />
                                    <div className="flex-grow flex flex-col justify-center">
                                        <h3 className="font-bold text-rc-main text-sm line-clamp-1">{item.product.nama_produk}</h3>
                                        {item.variant && <span className="text-xs font-semibold text-rc-logo mt-1 bg-rc-logo/10 w-fit px-2 py-0.5 rounded border border-rc-logo/30">{item.variant.nama_jenis}</span>}
                                        <div className="mt-1 text-xs text-rc-muted flex items-center gap-1"><i className="fa-solid fa-store text-[10px]"></i> {item.product.shop?.nama_toko}</div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-sm font-bold text-rc-logo">{formatRp(price)} <span className="text-xs font-normal text-rc-muted"> x {item.qty}</span></span>
                                            <span className="text-sm font-bold text-rc-main">{formatRp(price * item.qty)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pengiriman */}
                    <div className="bg-rc-bg rounded-xl border-[0.5px] border-rc-main/20 p-6">
                        <h2 className="text-sm font-bold text-rc-main mb-4 flex items-center gap-2 uppercase border-b-[0.5px] border-rc-main/20 pb-3">
                            <i className="fa-solid fa-truck-fast text-rc-logo"></i> Opsi Pengiriman
                        </h2>
                        <div className="flex flex-col md:flex-row gap-4">
                            <label className={`flex-1 flex justify-between items-center border-[0.5px] rounded-lg p-4 cursor-pointer transition ${shippingMethod === 'Santai' ? 'border-rc-logo bg-rc-bg border' : 'border-rc-main/30 hover:border-rc-logo'}`}>
                                <div>
                                    <input type="radio" name="shipping" checked={shippingMethod === 'Santai'} onChange={() => setShippingMethod('Santai')} className="hidden" />
                                    <div className="font-bold text-rc-main text-sm">Santai</div>
                                    <div className="text-xs text-rc-muted mt-1">Estimasi 5 Hari</div>
                                </div>
                                <div className="font-bold text-rc-main">{formatRp(selectedAddress?.region ? selectedAddress.region.shipping_fee_santai : 10000)}</div>
                            </label>
                            <label className={`flex-1 flex justify-between items-center border-[0.5px] rounded-lg p-4 cursor-pointer transition ${shippingMethod === 'Cepat' ? 'border-rc-logo bg-rc-bg border' : 'border-rc-main/30 hover:border-rc-logo'}`}>
                                <div>
                                    <input type="radio" name="shipping" checked={shippingMethod === 'Cepat'} onChange={() => setShippingMethod('Cepat')} className="hidden" />
                                    <div className="font-bold text-rc-main text-sm">Cepat</div>
                                    <div className="text-xs text-rc-muted mt-1">Estimasi 3 Hari</div>
                                </div>
                                <div className="font-bold text-rc-main">{formatRp(selectedAddress?.region ? selectedAddress.region.shipping_fee_cepat : 15000)}</div>
                            </label>
                        </div>
                    </div>

                    {/* Metode Pembayaran */}
                    <div className="bg-rc-bg rounded-xl border-[0.5px] border-rc-main/20 p-6">
                        <h2 className="text-sm font-bold text-rc-main mb-4 flex items-center gap-2 uppercase border-b-[0.5px] border-rc-main/20 pb-3">
                            <i className="fa-solid fa-wallet text-rc-logo"></i> Metode Pembayaran
                        </h2>
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            {['Transfer Bank', 'E-Money', 'Cash / COD'].map(method => (
                                <label key={method} className={`flex-1 text-center border-[0.5px] rounded-lg p-3 cursor-pointer transition ${paymentMethod === method ? 'border-rc-logo bg-rc-bg text-rc-logo font-bold' : 'border-rc-main/30 text-rc-main hover:border-rc-logo'}`}>
                                    <input type="radio" name="payment" checked={paymentMethod === method} onChange={() => {
                                        setPaymentMethod(method);
                                        setAccountNumber('');
                                        setIsAccountVerified(false);
                                        if (method === 'Transfer Bank') setPaymentSubMethod('BCA');
                                        if (method === 'E-Money') setPaymentSubMethod('DANA');
                                    }} className="hidden" />
                                    <div className="text-sm uppercase tracking-wide">{method}</div>
                                </label>
                            ))}
                        </div>

                        {paymentMethod === 'Transfer Bank' && (
                            <div className="p-4 bg-rc-card border-[0.5px] border-rc-main/10 rounded-md mb-4 shadow-sm">
                                <div className="text-xs font-bold uppercase text-rc-muted mb-2">Pilih Bank Anda</div>
                                <select value={paymentSubMethod} onChange={e => { setPaymentSubMethod(e.target.value); setIsAccountVerified(false); }} className="w-full bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main p-2.5 rounded text-sm outline-none mb-4 font-bold uppercase">
                                    <option value="BCA">Bank BCA</option>
                                    <option value="Mandiri">Bank Mandiri</option>
                                    <option value="BRI">Bank BRI</option>
                                    <option value="BNI">Bank BNI</option>
                                    <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                                </select>
                                <div className="text-xs font-bold uppercase text-rc-muted mb-2">Nomor Rekening Valid Anda</div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input type="number" placeholder="Contoh: 1234567890" value={accountNumber} onChange={e => { setAccountNumber(e.target.value); setIsAccountVerified(false); }} className="flex-1 bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main p-2.5 rounded text-sm outline-none" />
                                    <button type="button" onClick={handleVerifyAccount} className={`px-6 py-2.5 rounded text-xs font-bold uppercase transition-colors shadow-sm whitespace-nowrap ${isAccountVerified ? 'bg-green-600 text-white' : 'bg-rc-logo text-rc-bg hover:bg-yellow-400'}`}>
                                        {isAccountVerified ? <><i className="fa-solid fa-check mr-1"></i> Terverifikasi</> : 'Verifikasi'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'E-Money' && (
                            <div className="p-4 bg-rc-card border-[0.5px] border-rc-main/10 rounded-md mb-4 shadow-sm">
                                <div className="text-xs font-bold uppercase text-rc-muted mb-2">Pilih Provider E-Money</div>
                                <select value={paymentSubMethod} onChange={e => { setPaymentSubMethod(e.target.value); setIsAccountVerified(false); }} className="w-full bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main p-2.5 rounded text-sm outline-none mb-4 font-bold uppercase">
                                    <option value="DANA">DANA</option>
                                    <option value="OVO">OVO</option>
                                    <option value="GoPay">GoPay</option>
                                    <option value="ShopeePay">ShopeePay</option>
                                </select>
                                <div className="text-xs font-bold uppercase text-rc-muted mb-2">Nomor Telepon / E-Money Anda</div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input type="number" placeholder="Contoh: 08123456789" value={accountNumber} onChange={e => { setAccountNumber(e.target.value); setIsAccountVerified(false); }} className="flex-1 bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main p-2.5 rounded text-sm outline-none" />
                                    <button type="button" onClick={handleVerifyAccount} className={`px-6 py-2.5 rounded text-xs font-bold uppercase transition-colors shadow-sm whitespace-nowrap ${isAccountVerified ? 'bg-green-600 text-white' : 'bg-rc-logo text-rc-bg hover:bg-yellow-400'}`}>
                                        {isAccountVerified ? <><i className="fa-solid fa-check mr-1"></i> Terverifikasi</> : 'Verifikasi'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'Cash / COD' && (
                            <div className="p-4 bg-rc-logo/10 border-[0.5px] border-rc-logo/30 rounded-md flex gap-3 text-rc-logo items-start">
                                <i className="fa-solid fa-circle-info mt-1"></i>
                                <div className="text-xs">
                                    <strong>Bayar di Tempat (COD).</strong> Anda akan membayar langsung ke kurir saat paket tiba. Pastikan alamat Anda lengkap dan siapkan uang pas.
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Kolom Kanan: Rincian Biaya Sticky */}
                <div className="w-full lg:w-1/3">
                    <div className="bg-rc-card rounded-xl border-[0.5px] border-rc-main/20 p-6 sticky top-24">
                        <h2 className="text-sm font-bold text-rc-main uppercase mb-2 flex items-center gap-2">
                            <i className="fa-solid fa-receipt text-rc-logo"></i> RINGKASAN BELANJA
                        </h2>
                        {selectedAddress?.region ? (
                            <div className="mb-6 flex items-center gap-1.5 opacity-60">
                                <i className="fa-solid fa-earth-asia text-[10px] text-blue-500"></i>
                                <span className="text-[10px] font-black uppercase tracking-widest text-rc-main">Wilayah: {selectedAddress.region.name}</span>
                            </div>
                        ) : (
                            <div className="mb-6 h-4"></div>
                        )}
                        <div className="h-[0.5px] w-full bg-rc-main/10 mb-6"></div>

                        <div className="flex justify-between items-center mb-3">
                            <span className="text-rc-muted text-xs font-bold">Total Harga ({totalQty} Brg)</span>
                            <span className="text-rc-main font-bold">{formatRp(productTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-rc-muted text-xs font-bold">Biaya Pengiriman</span>
                            <span className="text-rc-main font-bold">{formatRp(shippingFee)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-rc-muted text-xs font-bold">Biaya Layanan</span>
                            <span className="text-rc-main font-bold">{formatRp(serviceFee)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-rc-muted text-xs font-bold">Pajak ({taxRate}%)</span>
                            <span className="text-rc-main font-bold">{formatRp(taxAmount)}</span>
                        </div>

                        {appliedVoucher && (
                            <div className="flex justify-between items-center mb-3 text-green-400">
                                <span className="text-xs font-bold uppercase"><i className="fa-solid fa-tag"></i> Diskon Voucher</span>
                                <span className="font-bold">- {formatRp(discountAmount)}</span>
                            </div>
                        )}

                        <div className="mb-6 border-b-[0.5px] border-dashed border-rc-main/20 pb-6">
                            <div className="text-xs font-bold uppercase text-rc-muted mb-2">Gunakan Voucher</div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Masukkan Kode"
                                    value={voucherCode}
                                    onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                                    className="w-full bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main rounded px-3 py-2 text-xs uppercase focus:outline-none"
                                />
                                <button
                                    onClick={handleCheckVoucher} disabled={checkingVoucher || !voucherCode}
                                    className="bg-rc-logo text-rc-bg px-4 py-2 text-xs font-bold uppercase rounded disabled:opacity-50"
                                >
                                    {checkingVoucher ? 'Cek..' : 'Terapkan'}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-end mb-8">
                            <span className="text-rc-main text-sm font-bold uppercase">Tagihan Akhir</span>
                            <span className="text-rc-logo font-bold text-2xl">{formatRp(finalTotal)}</span>
                        </div>

                        <button
                            onClick={handleCheckoutExecute}
                            disabled={processingCheckout || checkoutItems.length === 0 || (paymentMethod !== 'Cash / COD' && !isAccountVerified)}
                            className="w-full bg-rc-logo hover:bg-yellow-400 text-rc-bg font-bold uppercase py-3.5 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
                        >
                            {processingCheckout ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-check-circle"></i> Selesaikan Pesanan</>}
                        </button>

                        <div className="flex items-center justify-center gap-2 mt-6 p-3 bg-rc-bg rounded-lg border-[0.5px] border-rc-main/20 text-[10px] text-rc-muted font-bold uppercase">
                            <i className="fa-solid fa-lock text-rc-logo"></i> PROTEKSI ENKRIPSI
                        </div>
                    </div>
                </div>

            </div>

            {/* Modal Pilih Alamat */}
            {showAddressModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-rc-bg border-[0.5px] border-rc-main/20 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-5 border-b-[0.5px] border-rc-main/20 flex justify-between items-center bg-rc-card">
                            <h2 className="font-bold uppercase text-rc-main text-sm flex items-center gap-2">
                                <i className="fa-solid fa-map-location-dot text-rc-logo"></i> Pilih Alamat
                            </h2>
                            <button onClick={() => setShowAddressModal(false)} className="text-rc-muted hover:text-red-500 transition w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/10">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-3">
                            {addresses.length === 0 ? (
                                <div className="text-center py-10 text-rc-muted text-xs">
                                    <i className="fa-solid fa-box-open text-3xl mb-3 opacity-50 block"></i>
                                    Belum ada alamat tersimpan.
                                </div>
                            ) : (
                                addresses.map(addr => (
                                    <div 
                                        key={addr.id} 
                                        onClick={() => { setSelectedAddress(addr); setShowAddressModal(false); }}
                                        className={`p-4 rounded-lg border-[0.5px] cursor-pointer transition ${selectedAddress?.id === addr.id ? 'border-rc-logo bg-rc-logo/5' : 'border-rc-main/20 hover:border-rc-logo/50'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <i className={`fa-solid ${addr.tag.toLowerCase() === 'rumah' ? 'fa-house' : addr.tag.toLowerCase() === 'kantor' ? 'fa-building' : 'fa-thumbtack'} text-rc-logo`}></i>
                                                <span className="text-xs font-bold uppercase text-rc-main">{addr.tag}</span>
                                                {addr.is_primary && <span className="text-[8px] bg-rc-logo text-rc-bg px-1.5 py-0.5 rounded uppercase font-black">Utama</span>}
                                            </div>
                                            {selectedAddress?.id === addr.id && <i className="fa-solid fa-circle-check text-rc-logo"></i>}
                                        </div>
                                        <div className="font-bold text-rc-main text-sm">{addr.receiver_name}</div>
                                        <div className="text-xs text-rc-muted mb-1">{addr.phone_number}</div>
                                        <div className="text-xs text-rc-muted line-clamp-2">{addr.full_address}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
