import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import useSWR from 'swr';

const fetcher = url => axios.get(url).then(res => res.data);

export default function Chat() {
    const navigate = useNavigate();

    const location = useLocation();
    const discussedProduct = location.state?.discussedProduct;
    const [attachedProduct, setAttachedProduct] = useState(discussedProduct || null);

    const [activeRoom, setActiveRoom] = useState(null);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Helper untuk menangani avatar terselubung (string "null" atau empty)
    const getAvatarURL = (avatarPath, fallbackName) => {
        if (!avatarPath || avatarPath === 'null') {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName || 'A')}&background=27272a&color=FFCC00&bold=true`;
        }
        return avatarPath.startsWith('http') ? avatarPath : `/storage/${avatarPath}`;
    };

    const handleImageError = (e, fallbackName) => {
        e.target.onerror = null;
        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName || 'A')}&background=27272a&color=FFCC00&bold=true`;
    };

    // Initial check for auth
    useEffect(() => {
        if (!localStorage.getItem('auth_token')) {
            navigate('/login');
        }
    }, [navigate]);

    // Use SWR for fetching initially
    const { data: rawRoomsData, isLoading: loadingRooms, mutate: mutateRooms } = useSWR('/api/chat', fetcher, { 
        revalidateOnFocus: true
    });
    const rooms = rawRoomsData?.chats || [];

    const hasAutoSelectedRef = useRef(false);

    // Auto-select room
    useEffect(() => {
        if (rooms.length > 0 && !hasAutoSelectedRef.current) {
            if (attachedProduct) {
                const shopRoom = rooms.find(r => r.target_shop_id === attachedProduct.shop.id && !r.is_seller);
                if (shopRoom) {
                    setActiveRoom(shopRoom);
                    hasAutoSelectedRef.current = true;
                }
            } else {
                setActiveRoom(rooms[0]);
                hasAutoSelectedRef.current = true;
            }
        }
    }, [rooms, attachedProduct]);

    const { data: rawMessagesData, isLoading: loadingMessages, mutate: mutateMessages } = useSWR(activeRoom ? `/api/chat/${activeRoom.id}` : null, fetcher, { 
        revalidateOnFocus: true
    });

    // Laravel Echo Realtime Listener
    useEffect(() => {
        if (!activeRoom || !window.Echo) return;

        const channel = window.Echo.private(`chat.${activeRoom.id}`)
            .listen('MessageSent', (e) => {
                // Incoming message via WebSocket
                mutateMessages(prev => ({
                    ...prev,
                    messages: [...(prev?.messages || []), e.message]
                }), false);
                
                mutateRooms(prev => ({
                    ...prev,
                    chats: (prev?.chats || []).map(r => r.id === activeRoom.id ? { ...r, latest_message: e.message.message } : r)
                }), false);
                
                scrollToBottom();
            });

        return () => {
            channel.stopListening('MessageSent');
            window.Echo.leave(`chat.${activeRoom.id}`);
        };
    }, [activeRoom]);
    const messages = rawMessagesData?.messages || [];

    // Local Scroll logic tracking
    const prevMessagesLen = useRef(0);
    useEffect(() => {
        if (messages.length > prevMessagesLen.current) {
            scrollToBottom();
        }
        prevMessagesLen.current = messages.length;
    }, [messages]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || !activeRoom) return;

        setSending(true);
        const originalText = inputText;
        let finalMessage = inputText;
        
        if (attachedProduct) {
            finalMessage = `[PRODUCT_JSON::${JSON.stringify({slug: attachedProduct.slug, nama: attachedProduct.nama_produk, image: attachedProduct.primary_image, harga: attachedProduct.harga_jual})}] ${inputText}`;
        }
        
        setInputText(''); // optimistic clear
        setAttachedProduct(null); // clear attachment

        try {
            const res = await axios.post(`/api/chat/${activeRoom.id}/message`, {
                message: finalMessage,
                as_shop: activeRoom.is_seller
            });

            // Optimistic Updates
            mutateMessages(prev => ({
                ...prev,
                messages: [...(prev?.messages || []), res.data.data]
            }), false);
            
            mutateRooms(prev => ({
                ...prev,
                chats: (prev?.chats || []).map(r => r.id === activeRoom.id ? { ...r, latest_message: finalMessage } : r)
            }), false);

            scrollToBottom();
        } catch (e) {
            alert('Gagal mengirim pesan');
            setInputText(originalText); // revert
        } finally {
            setSending(false);
        }
    };

    const handleSelectRoom = (room) => {
        if (activeRoom?.id !== room.id) {
            setActiveRoom(null); // Force skeletal frame resetting quickly
            setAttachedProduct(null); // Clear product if switching away manually
            window.history.replaceState({}, document.title);
            setTimeout(() => setActiveRoom(room), 0);
        }
    };

    return (
        <div className="bg-rc-bg flex h-screen overflow-hidden text-rc-main font-sans">

            {/* Sidebar List Chat (Kiri) */}
            <div className={`w-full md:w-80 lg:w-96 bg-rc-bg border-r-[0.5px] border-rc-main/20 flex flex-col ${activeRoom ? 'hidden md:flex' : 'flex'}`}>
                {/* Header Profil */}
                <div className="p-5 border-b-[0.5px] border-rc-main/20 flex items-center justify-between text-rc-main">
                    <h2 className="text-xs font-bold uppercase flex items-center gap-2"><i className="fa-regular fa-comments text-rc-logo"></i> KOTAK MASUK</h2>
                    <Link to="/dashboard" className="w-8 h-8 rounded bg-rc-bg hover:bg-rc-main/10 text-rc-muted hover:text-rc-main border-[1px] border-rc-main/20 flex items-center justify-center transition-colors duration-300" title="Kembali">
                        <i className="fa-solid fa-xmark"></i>
                    </Link>
                </div>

                {/* Daftar Kontak */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loadingRooms ? (
                        <div className="flex justify-center py-10"><i className="fa-solid fa-spinner fa-spin text-rc-logo"></i></div>
                    ) : rooms.length === 0 ? (
                        <div className="text-center py-12 px-6 text-rc-muted opacity-60">
                            <i className="fa-regular fa-message text-4xl mb-3"></i>
                            <p className="text-sm">Belum ada obrolan.<br />Mulai bertransaksi dan sapa toko favorimu!</p>
                        </div>
                    ) : (
                        rooms.map(room => (
                            <div
                                key={room.id}
                                onClick={() => handleSelectRoom(room)}
                                className={`flex items-center gap-4 p-4 cursor-pointer transition-all duration-300 border-l-[2px] border-b-[0.5px] border-b-rc-main/5 ${activeRoom?.id === room.id ? 'bg-rc-logo/5 border-l-rc-logo' : 'hover:bg-rc-main/5 border-l-transparent'}`}
                            >
                                <img src={getAvatarURL(room.target_avatar, room.target_name)} onError={(e) => handleImageError(e, room.target_name)} className="w-12 h-12 rounded-full object-cover border-[0.5px] border-rc-main/20 shadow-sm" alt="Avatar" />
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-sm text-rc-main truncate">{room.target_name}</h3>
                                        <span className="text-[9px] text-rc-muted font-bold tracking-widest">{room.latest_time}</span>
                                    </div>
                                    <p className="text-xs text-rc-muted truncate flex items-center gap-2 font-bold">
                                        {room.is_seller && <span className="bg-rc-bg border border-rc-logo/50 text-rc-logo px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest">Toko Anda</span>}
                                        {room.latest_message}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Area Teks Percakapan (Kanan) */}
            <div className={`flex-1 flex flex-col relative w-full ${!activeRoom ? 'hidden md:flex bg-rc-bg border-l-[0.5px] border-rc-main/10 items-center justify-center' : 'flex'}`}>

                {!activeRoom ? (
                    <div className="text-center text-rc-muted opacity-40">
                        <i className="fa-brands fa-rocketchat text-6xl text-rc-main/10 mb-6 block"></i>
                        <p className="font-bold tracking-widest text-sm uppercase">PILIH PESAN UNTUK MEMBACA</p>
                    </div>
                ) : (
                    <>
                        {/* Header Ruang Chat */}
                        <div className="h-16 flex items-center justify-between px-6 bg-rc-bg border-b-[0.5px] border-rc-main/20 z-10">
                            <div className="flex items-center gap-4">
                                <button className="md:hidden mr-2 text-rc-muted hover:text-rc-main transition" onClick={() => setActiveRoom(null)}>
                                    <i className="fa-solid fa-arrow-left"></i>
                                </button>
                                <img src={getAvatarURL(activeRoom.target_avatar, activeRoom.target_name)} onError={(e) => handleImageError(e, activeRoom.target_name)} className="w-10 h-10 rounded border-[1px] border-rc-main/20 object-cover" alt="Avatar" />
                                <div>
                                    <h3 className="font-bold text-sm text-rc-main">
                                        {activeRoom.target_name}
                                    </h3>
                                    <span className="text-[9px] text-green-500 font-bold tracking-widest uppercase flex items-center gap-1 mt-0.5"><i className="fa-solid fa-circle text-[4px] animate-pulse"></i> AKTIF</span>
                                </div>
                            </div>
                            <Link to={activeRoom.is_seller ? '/toko' : `/toko/${activeRoom.target_shop_id}`} className="text-rc-muted hover:text-rc-main border-[1px] border-rc-main/20 hover:border-rc-main/50 bg-rc-bg px-4 py-2 rounded text-[10px] font-bold tracking-widest uppercase transition-colors duration-300 flex items-center gap-2">
                                {activeRoom.is_seller ? <><i className="fa-solid fa-store"></i> KELOLA TOKO</> : <><i className="fa-solid fa-store"></i> KUNJUNGI TOKO</>}
                            </Link>
                        </div>

                        {/* Kanvas Pesan */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-rc-bg relative">
                            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}></div>

                            {loadingMessages ? (
                                <div className="flex justify-center mt-10"><i className="fa-solid fa-circle-notch fa-spin text-rc-logo text-xl"></i></div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-rc-muted mt-10 text-xs font-bold bg-rc-bg p-4 rounded-md w-fit mx-auto border-[1px] border-rc-main/20 relative z-10">Mulai diskusi pertama Anda!</div>
                            ) : (
                                <div className="space-y-6 pb-4 relative z-10">
                                    {messages.map(msg => {
                                        const isMine = activeRoom.is_seller ? msg.sender_type === 'shop' : msg.sender_type === 'user';
                                        
                                        // Product Parsing Logic
                                        let productBox = null;
                                        let textMessage = msg.message || '';
                                        
                                        if (textMessage.startsWith('[PRODUCT_JSON::')) {
                                            const endIdx = textMessage.indexOf('] ');
                                            if (endIdx !== -1) {
                                                const jsonPart = textMessage.substring(15, endIdx);
                                                try {
                                                    const parsed = JSON.parse(jsonPart);
                                                    productBox = parsed;
                                                    textMessage = textMessage.substring(endIdx + 2).trim();
                                                } catch(e) {}
                                            }
                                        }

                                        return (
                                            <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                                <div className={`max-w-[75%] px-5 py-3 text-sm font-bold leading-relaxed border-[1px] relative rounded-xl ${isMine ? 'bg-gradient-to-br from-rc-card to-[#1a1b22] text-rc-main border-rc-logo/30 shadow-[0_5px_15px_rgba(255,204,0,0.05)]' : 'bg-rc-bg text-rc-main border-rc-main/20 shadow-sm'}`}>
                                                    
                                                    {productBox && (
                                                        <Link to={`/product/${productBox.slug}`} className={`flex items-center gap-3 p-3 mb-3 rounded-lg border-[0.5px] transition-colors ${isMine ? 'bg-black/40 border-rc-logo/20 hover:border-rc-logo/50' : 'bg-rc-card/50 border-rc-main/10 hover:border-rc-main/30'}`}>
                                                            <img src={productBox.image} alt={productBox.nama} className="w-14 h-14 object-cover rounded bg-rc-bg border-[0.5px] border-rc-main/10" />
                                                            <div className="flex flex-col overflow-hidden">
                                                                <span className="text-[9px] uppercase font-black text-rc-muted tracking-widest mb-0.5">Produk Terkait</span>
                                                                <span className="text-xs font-bold text-rc-main truncate block">{productBox.nama}</span>
                                                                <span className="text-[10px] text-rc-logo font-bold mt-1 uppercase">Rp {Number(productBox.harga || 0).toLocaleString('id-ID')}</span>
                                                            </div>
                                                            <i className="fa-solid fa-chevron-right text-rc-muted text-xs ml-auto"></i>
                                                        </Link>
                                                    )}

                                                    <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{textMessage}</div>
                                                    <span className={`text-[9px] mt-2 block tracking-widest uppercase font-bold ${isMine ? 'text-rc-muted text-right' : 'text-rc-muted/50 text-left'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Kotak Produk yang Dibahas */}
                        {attachedProduct && (
                            <div className="bg-rc-card px-6 py-3 border-t-[0.5px] border-rc-main/20 z-10 flex items-center justify-between shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
                                <div className="flex items-center gap-4">
                                    <img src={attachedProduct.primary_image} alt="Product" className="w-12 h-12 object-cover rounded border-[0.5px] border-rc-main/20" />
                                    <div>
                                        <div className="text-[10px] font-black text-rc-muted uppercase tracking-widest mb-0.5">Memulai Diskusi Produk</div>
                                        <div className="text-xs font-bold text-rc-main mb-0.5">{attachedProduct.nama_produk}</div>
                                        <div className="text-[10px] text-rc-logo font-bold uppercase">Rp {Number(attachedProduct.harga_jual).toLocaleString('id-ID')}</div>
                                    </div>
                                </div>
                                <button onClick={() => setAttachedProduct(null)} className="text-rc-muted hover:text-red-500 w-8 h-8 rounded-full hover:bg-red-500/10 flex items-center justify-center transition-colors">
                                    <i className="fa-solid fa-xmark text-lg"></i>
                                </button>
                            </div>
                        )}

                        {/* Kotak Input Teks */}
                        <div className="bg-rc-bg p-4 border-t-[0.5px] border-rc-main/20 z-10 relative">
                            <form onSubmit={handleSendMessage} className="flex gap-4 relative max-w-4xl mx-auto items-center">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    placeholder="Ketik balasan..."
                                    className="flex-1 bg-rc-bg border-[1px] border-rc-main/20 text-rc-main placeholder-rc-muted rounded-md px-6 py-3.5 focus:border-rc-logo text-sm font-bold transition-all outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputText.trim() || sending}
                                    className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-md transition-all duration-300 ${!inputText.trim() ? 'bg-rc-bg border-[1px] border-rc-main/20 text-rc-muted cursor-not-allowed' : 'bg-rc-logo text-rc-bg hover:bg-yellow-400 border-[1px] border-transparent font-bold'}`}
                                >
                                    {sending ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-paper-plane text-lg"></i>}
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>

        </div>
    );
}
