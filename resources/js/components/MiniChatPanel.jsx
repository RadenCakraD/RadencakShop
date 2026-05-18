import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, User, Store, Circle } from 'lucide-react';
import useSWR from 'swr';

const fetcher = url => axios.get(url).then(res => res.data);

export default function MiniChatPanel({ isOpen, onClose }) {
    const [activeRoom, setActiveRoom] = useState(null);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    const { data: rawRoomsData, mutate: mutateRooms } = useSWR(isOpen ? '/api/chat' : null, fetcher);
    const rooms = rawRoomsData?.chats || [];

    const { data: rawMessagesData, mutate: mutateMessages } = useSWR(activeRoom ? `/api/chat/${activeRoom.id}` : null, fetcher);
    const messages = rawMessagesData?.messages || [];

    useEffect(() => {
        if (messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || !activeRoom) return;

        setSending(true);
        const originalText = inputText;
        setInputText('');

        try {
            const res = await axios.post(`/api/chat/${activeRoom.id}/message`, {
                message: originalText,
                as_shop: activeRoom.is_seller
            });

            mutateMessages(prev => ({
                ...prev,
                messages: [...(prev?.messages || []), res.data.data]
            }), false);
        } catch (e) {
            setInputText(originalText);
        } finally {
            setSending(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    className="fixed right-6 bottom-6 w-96 h-[600px] bg-[#0b0c10] border border-white/10 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-rc-logo/10 flex items-center justify-center text-rc-logo">
                                <MessageCircle size={18} />
                            </div>
                            <h3 className="text-xs font-black uppercase text-white tracking-widest">Chat Hub</h3>
                        </div>
                        <button onClick={onClose} className="text-rc-muted hover:text-white p-2">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Rooms List */}
                        {!activeRoom ? (
                            <div className="w-full flex flex-col bg-black/20">
                                <div className="p-4 overflow-y-auto no-scrollbar">
                                    {rooms.map(room => (
                                        <button 
                                            key={room.id}
                                            onClick={() => setActiveRoom(room)}
                                            className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all mb-2 text-left"
                                        >
                                            <div className="relative">
                                                <img 
                                                    src={room.target_avatar?.startsWith('http') ? room.target_avatar : `/storage/${room.target_avatar}`} 
                                                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                                                    onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${room.target_name}`}
                                                />
                                                <Circle size={8} className="absolute bottom-0 right-0 text-emerald-500 fill-emerald-500 border border-black rounded-full" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-[10px] font-black text-white uppercase truncate">{room.target_name}</span>
                                                    <span className="text-[8px] text-rc-muted font-bold">{room.latest_time}</span>
                                                </div>
                                                <p className="text-[9px] text-rc-muted truncate font-bold uppercase tracking-wider">{room.latest_message}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Message View */
                            <div className="w-full flex flex-col h-full bg-black/40">
                                <div className="p-3 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
                                    <button onClick={() => setActiveRoom(null)} className="text-rc-muted hover:text-white">
                                        <ArrowLeft size={16} />
                                    </button>
                                    <div className="flex-1">
                                        <h4 className="text-[10px] font-black text-white uppercase">{activeRoom.target_name}</h4>
                                        <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest">Online</span>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                                    {messages.map((msg, i) => {
                                        const isMine = activeRoom.is_seller ? msg.sender_type === 'shop' : msg.sender_type === 'user';
                                        return (
                                            <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] p-3 rounded-2xl text-[10px] font-bold ${isMine ? 'bg-rc-logo text-black rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none'}`}>
                                                    {msg.message}
                                                    <div className={`text-[8px] mt-1 opacity-60 ${isMine ? 'text-black' : 'text-rc-muted'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form onSubmit={handleSendMessage} className="p-4 bg-white/5 flex gap-2">
                                    <input 
                                        type="text"
                                        value={inputText}
                                        onChange={e => setInputText(e.target.value)}
                                        placeholder="Ketik pesan..."
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold text-white outline-none focus:border-rc-logo"
                                    />
                                    <button type="submit" disabled={sending} className="w-10 h-10 bg-rc-logo rounded-xl flex items-center justify-center text-black shadow-lg">
                                        <Send size={16} />
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function ArrowLeft(props) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
    );
}
