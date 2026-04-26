import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function RadenAI() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Halo! Saya Raden AI. Ada yang bisa saya bantu terkait belanja atau manajemen toko Anda?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages([...messages, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Simulasi AI Response (Bisa dihubungkan ke OpenAI/Gemini API nanti)
            setTimeout(() => {
                let aiResponse = "";
                const msg = input.toLowerCase();
                
                if (msg.includes('stok')) aiResponse = "Untuk mengecek stok, Anda bisa buka Dashboard Niaga lalu pilih menu Produk. Di sana Anda bisa edit stok masing-masing produk.";
                else if (msg.includes('order') || msg.includes('pesanan')) aiResponse = "Daftar pesanan bisa dilihat di menu Informasi atau melalui Status Pesanan di profil Anda.";
                else if (msg.includes('toko')) aiResponse = "Anda bisa mendaftarkan toko baru melalui menu Daftar Toko di dashboard.";
                else aiResponse = "Maaf, saya sedang belajar. Bisa jelaskan lebih detail pertanyaannya? Saya bisa membantu navigasi fitur di Radencak Shop.";

                setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
                setLoading(false);
            }, 1000);

            // Jika ada backend:
            // const res = await axios.post('/api/ai/chat', { message: input });
            // setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Maaf, terjadi gangguan koneksi.' }]);
            setLoading(false);
        }
    };

    return (
        <>
            {/* Elegant AI Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-8 right-8 w-12 h-12 rounded-full z-[999] shadow-lg flex items-center justify-center transition-all duration-300 border-[0.5px] ${isOpen ? 'bg-rc-bg border-rc-logo' : 'bg-rc-card border-rc-main/20 hover:border-rc-logo/50'}`}
            >
                {isOpen ? (
                    <i className="fa-solid fa-xmark text-rc-logo text-lg"></i>
                ) : (
                    <div className="flex items-center justify-center">
                        {/* Custom CSS 4-pointed Star */}
                        <div className="w-6 h-6 bg-rc-logo relative" style={{ clipPath: 'polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)' }}></div>
                    </div>
                )}
            </button>

            {/* AI Chat Window */}
            <div className={`fixed bottom-24 right-6 w-[350px] sm:w-[400px] h-[500px] z-[998] bg-rc-bg/95 backdrop-blur-xl border-[0.5px] border-rc-main/20 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden transition-all duration-500 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
                {/* Header */}
                <div className="bg-rc-logo p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-rc-bg/20 flex items-center justify-center border border-white/20">
                        <i className="fa-solid fa-wand-magic-sparkles text-white"></i>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-rc-bg uppercase tracking-widest">Raden AI</h3>
                        <p className="text-[9px] font-bold text-rc-bg/70 uppercase">Asisten Belanja Cerdas</p>
                    </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-rc-logo text-rc-bg rounded-tr-none' : 'bg-rc-card border border-rc-main/10 text-rc-main rounded-tl-none'}`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-rc-card border border-rc-main/10 p-3 rounded-2xl rounded-tl-none flex gap-1">
                                <span className="w-1.5 h-1.5 bg-rc-logo rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-rc-logo rounded-full animate-bounce delay-75"></span>
                                <span className="w-1.5 h-1.5 bg-rc-logo rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-4 bg-rc-card border-t border-rc-main/10 flex gap-2">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Tanya Raden AI..."
                        className="flex-1 bg-rc-bg border-[1px] border-rc-main/20 rounded-lg px-4 py-2 text-xs text-rc-main focus:outline-none focus:border-rc-logo transition-colors font-medium"
                    />
                    <button type="submit" className="w-10 h-10 rounded-lg bg-rc-logo text-rc-bg flex items-center justify-center hover:opacity-80 transition-opacity">
                        <i className="fa-solid fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        </>
    );
}
