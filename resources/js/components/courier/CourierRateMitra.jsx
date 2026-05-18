import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, MessageSquare, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CourierRateMitra({ user }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await axios.post('/api/courier/mitra-review', { rating, comment });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengirim penilaian');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-rc-card border border-rc-main/10 p-10 rounded-[3rem] text-center shadow-2xl">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-xl font-black text-rc-main uppercase tracking-tighter mb-2">Penilaian Terkirim Secara Anonim</h3>
                <p className="text-[10px] font-bold text-rc-muted uppercase tracking-widest max-w-xs mx-auto">Terima kasih atas masukannya. Identitas Anda dirahasiakan sepenuhnya demi keamanan Anda.</p>
                <button onClick={() => setSuccess(false)} className="mt-8 text-[10px] font-black text-rc-logo uppercase tracking-[0.2em] hover:underline">Kirim Penilaian Lagi</button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-10">
            <div className="bg-rc-card p-10 rounded-[3rem] border border-rc-main/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-3xl rounded-full"></div>
                
                <div className="relative z-10">
                    <h3 className="text-2xl font-black text-rc-main uppercase tracking-tighter mb-2">Evaluasi Kinerja Mitra</h3>
                    <p className="text-[10px] font-black text-rc-muted uppercase tracking-[0.2em] mb-10">Beri masukan untuk {user?.mitra_name || 'Atasan Anda'}</p>

                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl mb-8 flex items-start gap-4">
                        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
                        <p className="text-[10px] font-bold text-blue-500 uppercase leading-relaxed">
                            Sistem ini bersifat <strong className="underline">ANONIM</strong>. Atasan Anda tidak akan pernah tahu siapa yang memberikan rating atau komentar ini. Gunakan untuk kemajuan bersama.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <label className="text-[10px] font-black text-rc-muted uppercase tracking-widest block mb-4">Rating Kepuasan Management</label>
                            <div className="flex gap-4">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <button 
                                        key={num} 
                                        type="button"
                                        onClick={() => setRating(num)}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${rating >= num ? 'bg-yellow-500 text-rc-bg shadow-lg shadow-yellow-500/20 scale-110' : 'bg-rc-bg text-rc-muted border border-rc-main/10 opacity-50'}`}
                                    >
                                        <Star className={`w-6 h-6 ${rating >= num ? 'fill-current' : ''}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-rc-muted uppercase tracking-widest block mb-4">Ulasan / Keluhan (Misal: Gaji Terlambat, Alat Rusak, dll)</label>
                            <div className="relative">
                                <MessageSquare className="absolute top-4 left-4 w-4 h-4 text-rc-muted" />
                                <textarea 
                                    className="w-full bg-rc-bg border border-rc-main/10 rounded-2xl p-4 pl-12 text-xs font-bold text-rc-main outline-none focus:border-rc-logo transition-all"
                                    placeholder="Tuliskan alasan Anda secara jujur di sini..."
                                    rows="5"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    required
                                ></textarea>
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>}

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-rc-logo text-rc-bg py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-rc-logo/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Mengirim...' : 'Kirim Penilaian Anonim'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
