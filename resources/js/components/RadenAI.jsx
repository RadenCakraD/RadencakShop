import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function RadenAI() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    
    // Inisialisasi Sistem Multi-Session Chat
    const [sessions, setSessions] = useState(() => {
        const saved = localStorage.getItem('raden_ai_sessions');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch(e) {
                console.error("Gagal mem-parsing sesi obrolan Raden AI:", e);
            }
        }
        return [{
            id: 'session_default',
            title: 'Sesi Utama 🌟',
            messages: [
                { role: 'assistant', content: 'Halo! Saya **Raden AI**, Asisten Belanja Cerdas Anda. Ada yang bisa saya bantu terkait belanja atau informasi produk di Radencak Shop? 🌟' }
            ]
        }];
    });

    const [activeSessionId, setActiveSessionId] = useState(() => {
        const savedId = localStorage.getItem('raden_ai_active_session_id');
        return savedId || 'session_default';
    });

    const [showSessionMenu, setShowSessionMenu] = useState(false);

    // Sinkronisasi data ke LocalStorage
    useEffect(() => {
        localStorage.setItem('raden_ai_sessions', JSON.stringify(sessions));
    }, [sessions]);

    useEffect(() => {
        localStorage.setItem('raden_ai_active_session_id', activeSessionId);
    }, [activeSessionId]);

    // Ambil sesi aktif
    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || {
        id: 'session_default',
        title: 'Sesi Utama 🌟',
        messages: []
    };
    
    const messages = activeSession.messages;

    const setMessages = (newMessagesOrCallback) => {
        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                const newMsgs = typeof newMessagesOrCallback === 'function' 
                    ? newMessagesOrCallback(s.messages) 
                    : newMessagesOrCallback;

                // Buat judul sesi secara pintar berdasarkan chat pertama user
                let newTitle = s.title;
                if (s.title === 'Sesi Utama 🌟' || s.title.startsWith('Obrolan Baru')) {
                    const firstUserMsg = newMsgs.find(m => m.role === 'user');
                    if (firstUserMsg) {
                        newTitle = firstUserMsg.content.length > 18 
                            ? firstUserMsg.content.substring(0, 16) + '...' 
                            : firstUserMsg.content;
                    }
                }

                return { ...s, title: newTitle, messages: newMsgs };
            }
            return s;
        }));
    };

    // Fungsi Handler Sesi
    const handleNewSession = () => {
        const newSessionId = 'session_' + Date.now();
        const newSession = {
            id: newSessionId,
            title: `Obrolan Baru ${sessions.length + 1} 🌟`,
            messages: [
                { role: 'assistant', content: 'Halo! Saya **Raden AI**, Asisten Belanja Cerdas Anda. Ada yang bisa saya bantu terkait belanja atau informasi produk di Radencak Shop? 🌟' }
            ]
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSessionId);
        setShowSessionMenu(false);
        toast.success("Sesi obrolan baru dimulai! 🌟");
    };

    const handleDeleteSession = (id) => {
        if (sessions.length <= 1) {
            toast.error("Minimal harus ada satu sesi obrolan aktif!");
            return;
        }
        
        const filtered = sessions.filter(s => s.id !== id);
        setSessions(filtered);

        if (activeSessionId === id) {
            setActiveSessionId(filtered[0].id);
        }
        toast.success("Sesi obrolan berhasil dihapus! 🗑️");
    };

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [productContext, setProductContext] = useState(null);
    const chatEndRef = useRef(null);

    // Konstanta Ukuran UI
    const BUTTON_SIZE = 48;
    const [pos, setPos] = useState({
        x: window.innerWidth - 80,
        y: window.innerHeight - 100
    });

    // State untuk Mengatur Dragging Tombol AI
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const buttonStart = useRef({ x: 0, y: 0 });
    const dragDistance = useRef(0);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 1. Mendengarkan Event Konteks Produk Aktif dari ProductDetail.jsx
    useEffect(() => {
        const handleProductContext = (e) => {
            const product = e.detail;
            setProductContext(product);
            
            if (product) {
                setMessages(prev => {
                    // Hindari duplikasi pesan pembuka produk yang sama
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg && lastMsg.content.includes(product.nama_produk)) return prev;
                    
                    return [
                        ...prev,
                        { 
                            role: 'assistant', 
                            content: `Saya mendeteksi Anda sedang melihat **${product.nama_produk}**. Mode Belanja Cerdas diaktifkan! Ada yang ingin ditanyakan tentang produk ini? Saya bisa menginfokan harga, ulasan bintang, ulasan toko, atau detail deskripsinya. 🛍️✨` 
                        }
                    ];
                });
            }
        };

        window.addEventListener('raden-ai-product-context', handleProductContext);
        return () => {
            window.removeEventListener('raden-ai-product-context', handleProductContext);
        };
    }, []);

    // 2. Mengatur Posisi Tombol AI Tetap dalam Layar saat Window Resize
    useEffect(() => {
        const handleResize = () => {
            setPos(prev => ({
                x: Math.max(16, Math.min(window.innerWidth - BUTTON_SIZE - 16, prev.x)),
                y: Math.max(16, Math.min(window.innerHeight - BUTTON_SIZE - 16, prev.y))
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 3. Pointer Handlers untuk Dragging yang Super Lancar (Sangat Mulus)
    const handlePointerDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        buttonStart.current = { x: pos.x, y: pos.y };
        dragDistance.current = 0;
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        dragDistance.current = Math.sqrt(dx * dx + dy * dy);

        // Klem koordinat tombol agar tidak melewati batas viewport (padding 16px)
        const newX = Math.max(16, Math.min(window.innerWidth - BUTTON_SIZE - 16, buttonStart.current.x + dx));
        const newY = Math.max(16, Math.min(window.innerHeight - BUTTON_SIZE - 16, buttonStart.current.y + dy));

        setPos({ x: newX, y: newY });
    };

    const handlePointerUp = (e) => {
        if (isDragging) {
            setIsDragging(false);
            e.currentTarget.releasePointerCapture(e.pointerId);
            
            // Logika threshold: Jika diseret < 5px, anggap sebagai klik biasa untuk toggle panel
            if (dragDistance.current < 5) {
                setIsOpen(!isOpen);
            }
        }
    };

    // 4. Kalkulator Posisi Cerdas (Smart Position Panel) agar tidak keluar layar
    const isMobile = window.innerWidth < 640;
    const PANEL_WIDTH = isMobile ? Math.min(340, window.innerWidth - 32) : 380;
    const PANEL_HEIGHT = 480;

    // Cek belahan layar secara vertikal
    const isTopHalf = pos.y < window.innerHeight / 2;
    const panelTop = isTopHalf
        ? pos.y + BUTTON_SIZE + 12
        : pos.y - PANEL_HEIGHT - 12;

    // Tengahkan panel secara horizontal relatif terhadap tombol, lalu klem
    let panelLeft = pos.x - (PANEL_WIDTH / 2) + (BUTTON_SIZE / 2);
    panelLeft = Math.max(16, Math.min(window.innerWidth - PANEL_WIDTH - 16, panelLeft));

    // Sesuaikan titik origin animasi scale-up dari Framer Motion
    const originY = isTopHalf ? 0 : 1;
    const originX = (pos.x + BUTTON_SIZE / 2) < window.innerWidth / 2 ? 0 : 1;

    // 5. Generator Jawaban AI Cerdas Terkait Produk (Smart Assistant Logic)
    const generateAIResponse = (queryText, product) => {
        const query = queryText.toLowerCase();
        const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

        // a. Kueri Harga & Diskon
        if (query.includes('harga') || query.includes('diskon') || query.includes('promo') || query.includes('murah') || query.includes('mahal') || query.includes('bayar')) {
            const displayPrice = parseFloat(product.harga_jual || 0);
            const displayOriginal = parseFloat(product.harga_dasar || 0) > 0 ? parseFloat(product.harga_dasar) : displayPrice;
            const discount = displayOriginal > displayPrice ? Math.round(((displayOriginal - displayPrice) / displayOriginal) * 100) : 0;
            
            let response = `Berikut adalah rincian harga untuk **${product.nama_produk}**:\n\n`;
            if (discount > 0) {
                response += `🔥 **Diskon Spesial: ${discount}%**\n`;
                response += `❌ Harga Coret: ~~${formatRp(displayOriginal)}~~\n`;
                response += `✅ **Harga Asli: ${formatRp(displayPrice)}**\n\n`;
                response += `Belanja sekarang sangat hemat! Anda memotong pengeluaran hingga **${formatRp(displayOriginal - displayPrice)}**! 🛍️`;
            } else {
                response += `💰 **Harga Eksklusif: ${formatRp(displayPrice)}**\n\n`;
                response += `Produk original dengan kualitas premium yang sangat sepadan dengan nilai investasinya.`;
            }
            
            if (product.stok && parseInt(product.stok) > 0) {
                response += `\n\n📦 *Stok saat ini masih tersedia **${product.stok}** unit.*`;
            }
            return response;
        }

        // b. Kueri Ulasan / Rating / Taring
        if (query.includes('ulasan') || query.includes('review') || query.includes('rating') || query.includes('bintang') || query.includes('taring') || query.includes('bagus')) {
            const reviews = product.reviews || [];
            const totalReviews = reviews.length;
            const avgRating = totalReviews > 0 
                ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
                : '0.0';
                
            let response = `⭐ **Ulasan & Rating Produk** ⭐\n\n`;
            response += `Produk: **${product.nama_produk}**\n`;
            response += `Rating Pembeli: ⭐ **${avgRating} / 5.0** (${totalReviews} Ulasan)\n\n`;
            
            if (totalReviews > 0) {
                response += `Komentar jujur dari pembeli sebelumnya:\n`;
                const sampleReviews = reviews.filter(r => r.comment).slice(0, 3);
                if (sampleReviews.length > 0) {
                    sampleReviews.forEach((r) => {
                        const stars = "⭐".repeat(r.rating);
                        response += `• _"${r.comment}"_ (${stars} oleh ${r.user?.name || 'Pembeli'})\n`;
                    });
                } else {
                    response += `• Pembeli memberikan ulasan bintang tinggi secara keseluruhan tanpa ulasan tertulis.\n`;
                }
            } else {
                response += `Produk ini merupakan item baru berkualitas dan belum memiliki ulasan pembeli. Jadilah yang pertama memberikan ulasan positif setelah barang sampai di rumah!`;
            }
            return response;
        }

        // c. Kueri Toko / Alamat Toko / Deskripsi Toko
        if (query.includes('toko') || query.includes('penjual') || query.includes('alamat toko') || query.includes('seller') || query.includes('deskripsi toko')) {
            const shop = product.shop;
            if (!shop) return `Maaf, saya tidak dapat menemukan data toko yang menyediakan produk ini.`;
            
            let response = `🏪 **Informasi Mitra Resmi Penjual** 🏪\n\n`;
            response += `Nama Toko: **${shop.nama_toko}**\n`;
            if (shop.shop_tier === 'raden') {
                response += `👑 **Status: Premium Merchant (Raden Seller)**\n`;
            }
            if (shop.alamat_toko) {
                response += `📍 Alamat Toko: **${shop.alamat_toko}**\n`;
            }
            if (shop.slogan) {
                response += `✨ Slogan Toko: _"${shop.slogan}"_\n`;
            }
            if (shop.deskripsi_toko) {
                response += `\n📝 **Deskripsi Toko:**\n${shop.deskripsi_toko}\n\n`;
            } else {
                response += `\n📝 Toko ini adalah mitra terverifikasi Radencak Shop yang memiliki reputasi pelayanan sangat responsif.\n\n`;
            }
            response += `Anda bisa berbelanja dengan aman karena seluruh transaksi dengan toko ini dilindungi garansi kami.`;
            return response;
        }

        // d. Kueri Deskripsi Produk / Varian / Spesifikasi
        if (query.includes('deskripsi') || query.includes('tentang') || query.includes('apa') || query.includes('detail') || query.includes('spesifikasi') || query.includes('bahan')) {
            let response = `📝 **Keterangan Eksklusif: ${product.nama_produk}** 📝\n\n`;
            
            if (product.deskripsi) {
                response += `${product.deskripsi.slice(0, 420)}`;
                if (product.deskripsi.length > 420) response += `... *(selengkapnya bisa dibaca di kolom keterangan produk)*`;
            } else {
                response += `Tidak ada deskripsi tertulis spesifik untuk produk ini.`;
            }

            if (product.variants && product.variants.length > 0) {
                response += `\n\n⚙️ **Pilihan Varian:**\n`;
                product.variants.forEach(v => {
                    response += `• **${v.nama_jenis}** (Stok: ${v.stok} unit - ${formatRp(v.harga_jual)})\n`;
                });
            }
            
            if (product.kategori) {
                response += `\n🏷️ Kategori: **${product.kategori}**`;
            }
            return response;
        }

        // e. Alamat / Link / URL Produk
        if (query.includes('alamat') || query.includes('link') || query.includes('url')) {
            const link = `${window.location.origin}/product/${product.slug}`;
            return `Tentu! Berikut adalah link alamat resmi untuk produk **${product.nama_produk}**:\n\n🔗 [Detail Produk di Radencak Shop](${link})\n\nBagikan link ini ke teman Anda agar bisa belanja hemat bersama!`;
        }

        // Fallback Default
        return `Saya mengerti Anda ingin bertanya seputar **${product.nama_produk}**.\n\nSebagai Asisten Belanja, saya bisa membagikan info berikut:\n💰 **Harga & Diskon** (ketik "harga")\n⭐ **Rating & Ulasan** (ketik "ulasan")\n🏪 **Detail Toko Penjual** (ketik "toko")\n📝 **Keterangan & Varian** (ketik "deskripsi")\n🔗 **Link Alamat Produk** (ketik "link")\n\nAda yang bisa saya bantu jelaskan?`;
    };

    // Injeksi/Pengecekan Tab ID Unik untuk mencegah tab-collision (Stateful Cache Conflict)
    const getTabId = () => {
        let tid = sessionStorage.getItem('raden_tab_id');
        if (!tid) {
            tid = 'tab_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
            sessionStorage.setItem('raden_tab_id', tid);
        }
        return tid;
    };

    // 6. Handler untuk Mengirim Pertanyaan via Form Input
    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        setInput('');
        setLoading(true);

        try {
            const response = await axios.post('/api/ai/chat', {
                message: currentInput,
                product_id: productContext ? productContext.id : null,
                tab_id: `${getTabId()}_${activeSessionId}`
            });
            
            // Jika AI berhasil memasukkan barang ke keranjang riil di DB
            if (response.data.cart_added) {
                toast.success("Barang berhasil dimasukkan ke keranjang! 🛒");
                // Dispatch event agar navbar mengupdate jumlah keranjang secara visual
                window.dispatchEvent(new CustomEvent('cart-updated'));
            }

            setMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
        } catch (err) {
            console.error("Gagal mendapatkan respons Raden AI:", err);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: "Maaf, sistem Raden AI sedang mengalami kendala koneksi lokal. Silakan coba sesaat lagi! 🔌" 
            }]);
        } finally {
            setLoading(false);
        }
    };

    // 7. Handler Khusus untuk Tombol Pertanyaan Instan
    const handleAskContext = async (text, key) => {
        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);
        
        try {
            const response = await axios.post('/api/ai/chat', {
                message: key,
                product_id: productContext ? productContext.id : null,
                tab_id: `${getTabId()}_${activeSessionId}`
            });
            
            setMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
        } catch (err) {
            console.error("Gagal mendapatkan respons Raden AI:", err);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: "Maaf, gagal memproses data otomatis dari server Raden AI." 
            }]);
        } finally {
            setLoading(false);
        }
    };

    // Interceptor khusus ketika menekan link checkout di chat
    const handleMessageClick = async (e) => {
        const anchor = e.target.closest('a');
        if (anchor && anchor.getAttribute('href') === '/checkout') {
            e.preventDefault();
            e.stopPropagation();
            
            const toastId = toast.loading("Mempersiapkan gerbang pembayaran aman...");
            
            try {
                // Ambil seluruh isi keranjang belanja dari database
                const response = await axios.get('/api/cart');
                const cartItems = response.data;
                
                if (!cartItems || cartItems.length === 0) {
                    toast.error("Keranjang belanja Anda saat ini kosong! Silakan berbelanja terlebih dahulu.", { id: toastId });
                    return;
                }
                
                // Simpan ID keranjang ke localStorage agar dikenali Checkout.jsx
                const cartIds = cartItems.map(item => item.id.toString());
                localStorage.setItem('checkout_items', JSON.stringify(cartIds));
                
                toast.success("Mengarahkan ke kasir pembayaran resmi...", { id: toastId });
                
                // Tutup panel chat AI
                setIsOpen(false);
                
                // Arahkan ke /checkout
                navigate('/checkout');
            } catch (err) {
                console.error("Gagal melakukan verifikasi keranjang belanja:", err);
                toast.error("Gagal mengaktifkan gerbang checkout otomatis. Silakan klik checkout manual dari halaman Keranjang.", { id: toastId });
            }
        }
    };

    // Helper untuk Merender Format Pesanan dengan Tag HTML Aman (Konversi Tag Sederhana)
    const renderMessageContent = (text) => {
        if (!text) return null;
        
        return text.split('\n').map((line, i) => {
            let processedLine = line
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
                
            // Ganti pola markdown gambar ke HTML terlebih dahulu (merender gambar produk premium)
            processedLine = processedLine.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="w-full max-w-[220px] h-auto object-cover rounded-xl my-2 border border-zinc-800 shadow-[0_8px_30px_rgba(0,0,0,0.5)] block hover:scale-102 transition-transform duration-300" />');
            
            // Ganti pola markdown teks ke HTML
            processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            processedLine = processedLine.replace(/_(.*?)_/g, '<em>$1</em>');
            processedLine = processedLine.replace(/~~(.*?)~~/g, '<del>$1</del>');
            
            processedLine = processedLine.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
                if (url === '/checkout') {
                    return `<a href="${url}" class="block w-full text-center bg-rc-logo hover:bg-yellow-400 text-rc-bg font-extrabold uppercase py-3.5 px-4 rounded-xl mt-3 mb-2 shadow-[0_4px_20px_rgba(255,215,0,0.25)] transition-all duration-300 transform active:scale-98 flex items-center justify-center gap-2 hover:no-underline select-none pointer-events-auto cursor-pointer"><i class="fa-solid fa-credit-card"></i> ${text}</a>`;
                }
                
                // Jika tautan produk atau tautan umum lainnya, ubah menjadi tombol outline premium
                const icon = url.startsWith('/product/') ? 'fa-circle-info' : 'fa-arrow-up-right-from-square';
                return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="block w-full text-center bg-rc-card hover:bg-zinc-800 text-rc-logo border border-rc-logo/30 font-extrabold uppercase py-2.5 px-4 rounded-xl mt-2 mb-2 transition-all duration-300 transform active:scale-98 flex items-center justify-center gap-2 hover:no-underline select-none pointer-events-auto cursor-pointer"><i class="fa-solid ${icon}"></i> ${text}</a>`;
            });
            
            return (
                <div key={i} dangerouslySetInnerHTML={{ __html: processedLine }} className={i > 0 ? "mt-1" : ""} />
            );
        });
    };

    return (
        <>
            {/* Elegant Floating AI Button */}
            <motion.button 
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    position: 'fixed',
                    left: pos.x,
                    top: pos.y,
                    bottom: 'auto',
                    right: 'auto',
                    touchAction: 'none'
                }}
                className={`w-12 h-12 rounded-full z-[999] shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center justify-center border-[0.5px] transition-[background-color,border-color] duration-300 cursor-grab active:cursor-grabbing ${isOpen ? 'bg-rc-bg border-rc-logo' : 'bg-rc-card border-rc-main/20 hover:border-rc-logo/50'}`}
            >
                {isOpen ? (
                    <i className="fa-solid fa-xmark text-rc-logo text-lg animate-fade-in"></i>
                ) : (
                    <div className="flex items-center justify-center animate-fade-in">
                        <div className="w-6 h-6 bg-rc-logo relative" style={{ clipPath: 'polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)' }}></div>
                    </div>
                )}
            </motion.button>

            {/* AI Chat Window with Smart Relative Placement */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0, originX, originY }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        style={{
                            position: 'fixed',
                            left: panelLeft,
                            top: panelTop,
                            width: PANEL_WIDTH,
                            height: PANEL_HEIGHT,
                            bottom: 'auto',
                            right: 'auto'
                        }}
                        className="z-[998] bg-rc-bg/95 backdrop-blur-xl border-[0.5px] border-rc-main/20 rounded-2xl shadow-[0_10px_50px_-10px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-rc-logo p-3 flex items-center justify-between select-none relative z-50 shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-rc-bg/25 flex items-center justify-center border border-white/20">
                                    <i className="fa-solid fa-wand-magic-sparkles text-white text-sm"></i>
                                </div>
                                <div className="hidden min-[360px]:block">
                                    <h3 className="text-[10px] font-black text-rc-bg uppercase tracking-wider leading-none">Raden AI</h3>
                                    <p className="text-[6.5px] font-black text-rc-bg/75 uppercase mt-0.5 tracking-wider">Asisten Cerdas</p>
                                </div>
                            </div>

                            {/* Dropdown Selector & Plus Button */}
                            <div className="flex items-center gap-1.5 ml-auto">
                                <button 
                                    onClick={() => setShowSessionMenu(!showSessionMenu)}
                                    className="bg-rc-bg/20 hover:bg-rc-bg/30 text-white font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all max-w-[110px] truncate"
                                >
                                    <span className="truncate">{activeSession.title}</span>
                                    <i className={`fa-solid fa-chevron-down text-[7px] transition-transform ${showSessionMenu ? 'rotate-180' : ''}`}></i>
                                </button>

                                <button 
                                    onClick={handleNewSession}
                                    title="Mulai Sesi Obrolan Baru"
                                    className="w-7 h-7 bg-rc-bg/20 hover:bg-rc-bg/35 active:scale-95 text-white rounded-lg flex items-center justify-center border border-white/10 transition-all"
                                >
                                    <i className="fa-solid fa-plus text-xs"></i>
                                </button>
                            </div>
                        </div>

                        {/* Session Menu Overlay */}
                        <AnimatePresence>
                            {showSessionMenu && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-[48px] left-0 right-0 mx-3 mt-1 bg-zinc-900 border border-rc-logo/20 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.8)] z-[999] overflow-hidden flex flex-col max-h-[220px]"
                                >
                                    <div className="bg-zinc-800 px-3 py-1.5 border-b border-rc-logo/10 flex items-center justify-between shrink-0">
                                        <span className="text-[8px] font-black text-rc-logo uppercase tracking-widest">Daftar Sesi Obrolan</span>
                                        <button 
                                            onClick={() => setShowSessionMenu(false)}
                                            className="text-rc-logo/60 hover:text-rc-logo text-xs"
                                        >
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    </div>
                                    <div className="overflow-y-auto py-1 custom-scrollbar flex-1">
                                        {sessions.map((s) => (
                                            <div 
                                                key={s.id}
                                                className={`group px-3 py-2 flex items-center justify-between gap-2 border-b border-zinc-800 last:border-0 hover:bg-rc-logo/5 transition-colors cursor-pointer ${s.id === activeSessionId ? 'bg-rc-logo/10' : ''}`}
                                                onClick={() => {
                                                    setActiveSessionId(s.id);
                                                    setShowSessionMenu(false);
                                                }}
                                            >
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <i className={`fa-solid ${s.id === activeSessionId ? 'fa-circle-dot text-rc-logo' : 'fa-circle text-zinc-600'} text-[8px]`}></i>
                                                    <span className={`text-[10px] truncate font-extrabold ${s.id === activeSessionId ? 'text-rc-logo' : 'text-zinc-400'}`}>
                                                        {s.title}
                                                    </span>
                                                </div>
                                                
                                                {/* Delete Button (Only allow delete if there is more than 1 session) */}
                                                {sessions.length > 1 && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // prevent switching session when deleting
                                                            handleDeleteSession(s.id);
                                                        }}
                                                        className="w-5 h-5 rounded-md hover:bg-red-500/10 text-zinc-500 hover:text-red-500 flex items-center justify-center transition-colors"
                                                        title="Hapus Sesi"
                                                    >
                                                        <i className="fa-regular fa-trash-can text-[10px]"></i>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Active Product Context Banner */}
                        {productContext && (
                            <div className="mx-4 mt-3 p-2.5 bg-rc-card/50 backdrop-blur-md border border-rc-logo/30 rounded-xl flex items-center gap-3 relative overflow-hidden shrink-0 shadow-[0_4px_15px_-5px_rgba(255,204,0,0.1)] select-none">
                                <div className="absolute inset-0 bg-gradient-to-r from-rc-logo/5 to-transparent opacity-60 pointer-events-none"></div>
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-rc-main/10 flex-shrink-0 bg-rc-bg">
                                    <img 
                                        src={
                                            productContext.images?.[0]?.image_url
                                                ? (productContext.images[0].image_url.startsWith('http') 
                                                    ? productContext.images[0].image_url 
                                                    : `/storage/${productContext.images[0].image_url}`)
                                                : "/logo_web/no-product.png"
                                        } 
                                        className="w-full h-full object-cover" 
                                        alt="Product"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <span className="inline-flex items-center gap-0.5 bg-rc-logo/10 text-rc-logo text-[7px] font-black px-1 py-0.5 rounded-sm uppercase tracking-wider">
                                            <i className="fa-solid fa-sparkles text-[6px]"></i> Belanja Cerdas
                                        </span>
                                    </div>
                                    <h4 className="text-[10px] font-extrabold text-rc-main truncate uppercase tracking-wide leading-tight">
                                        {productContext.nama_produk}
                                    </h4>
                                    <p className="text-[8px] text-rc-muted font-bold flex items-center gap-0.5 uppercase">
                                        <i className="fa-solid fa-store text-rc-logo/70"></i> {productContext.shop?.nama_toko || 'Toko Resmi'}
                                    </p>
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setProductContext(null);
                                    }} 
                                    className="p-1 rounded-full hover:bg-rc-main/10 text-rc-muted hover:text-red-500 transition-colors"
                                    title="Bersihkan Konteks Belanja"
                                >
                                    <i className="fa-solid fa-circle-xmark text-xs"></i>
                                </button>
                            </div>
                        )}

                        {/* Messages Container */}
                        <div 
                            onClick={handleMessageClick}
                            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
                        >
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-rc-logo text-rc-bg rounded-tr-none' : 'bg-rc-card border border-rc-main/10 text-rc-main rounded-tl-none'}`}>
                                        {renderMessageContent(msg.content)}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-rc-card border border-rc-main/10 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                                        <span className="w-1.5 h-1.5 bg-rc-logo rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-rc-logo rounded-full animate-bounce [animation-delay:0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-rc-logo rounded-full animate-bounce [animation-delay:0.3s]"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Quick Context Prompt Chips */}
                        {productContext && (
                            <div className="px-4 py-2 border-t border-rc-main/10 flex gap-2 overflow-x-auto custom-scrollbar shrink-0 bg-rc-card/25 select-none scrollbar-thin">
                                {[
                                    { icon: "fa-tag", text: "Berapa harganya?", key: "harga" },
                                    { icon: "fa-star", text: "Bagaimana ulasan?", key: "ulasan" },
                                    { icon: "fa-store", text: "Tentang toko?", key: "toko" },
                                    { icon: "fa-circle-info", text: "Minta deskripsi", key: "deskripsi" }
                                ].map((chip) => (
                                    <button
                                        key={chip.key}
                                        type="button"
                                        onClick={() => handleAskContext(chip.text, chip.key)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-rc-bg border border-rc-main/10 text-[9px] font-black uppercase tracking-wider text-rc-muted hover:text-rc-logo hover:border-rc-logo/30 transition-all whitespace-nowrap active:scale-95 shadow-sm"
                                    >
                                        <i className={`fa-solid ${chip.icon} text-rc-logo/80`}></i>
                                        {chip.text}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Form */}
                        <form onSubmit={handleSend} className="p-4 bg-rc-card border-t border-rc-main/10 flex gap-2 shrink-0">
                            <input 
                                type="text" 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={productContext ? "Tanya Raden AI tentang produk ini..." : "Tanya Raden AI..."}
                                className="flex-1 bg-rc-bg border-[1px] border-rc-main/20 rounded-lg px-4 py-2 text-xs text-rc-main focus:outline-none focus:border-rc-logo transition-colors font-semibold"
                            />
                            <button type="submit" className="w-10 h-10 rounded-lg bg-rc-logo text-rc-bg flex items-center justify-center hover:opacity-85 transition-opacity active:scale-95">
                                <i className="fa-solid fa-paper-plane text-xs"></i>
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
