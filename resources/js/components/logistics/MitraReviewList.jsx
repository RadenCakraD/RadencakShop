import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, MessageSquare, Shield, Clock } from 'lucide-react';

export default function MitraReviewList() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await axios.get('/api/courier/mitra-reviews');
                setReviews(res.data);
            } catch (e) { }
            finally { setLoading(false); }
        };
        fetchReviews();
    }, []);

    if (loading) return (
        <div className="py-20 text-center animate-pulse">
            <p className="text-[10px] font-black text-rc-muted uppercase tracking-widest">Memuat Masukan Staff...</p>
        </div>
    );

    return (
        <div className="space-y-10">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-black text-rc-main uppercase tracking-tighter flex items-center gap-3">
                        <Shield className="w-6 h-6 text-blue-500" />
                        Aspirasi & Keluhan Staff
                    </h3>
                    <p className="text-[10px] font-bold text-rc-muted uppercase tracking-widest mt-1">Umpan balik anonim dari personel lapangan Anda</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.length > 0 ? reviews.map((r) => (
                    <div key={r.id} className="bg-rc-card border border-rc-main/10 p-8 rounded-[2.5rem] shadow-xl hover:border-blue-500/30 transition-all flex flex-col group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-1.5 text-yellow-500">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-current' : 'opacity-20'}`} />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 text-[9px] font-bold text-rc-muted uppercase tracking-tighter">
                                <Clock className="w-3 h-3" />
                                {new Date(r.created_at).toLocaleDateString('id-ID')}
                            </div>
                        </div>

                        <div className="flex-1 bg-rc-bg p-5 rounded-2xl border border-rc-main/5 relative">
                            <MessageSquare className="absolute -top-3 -left-3 w-8 h-8 text-blue-500/10 group-hover:text-blue-500/20 transition-colors" />
                            <p className="text-xs font-bold text-rc-main italic leading-relaxed">"{r.comment}"</p>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 text-[10px] font-black">?</div>
                            <p className="text-[9px] font-black text-rc-muted uppercase tracking-widest">Dikirim oleh {r.staff_name}</p>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-20 bg-rc-card rounded-[2.5rem] border border-rc-main/10 text-center">
                        <p className="text-[10px] font-black text-rc-muted uppercase tracking-widest">Belum ada aspirasi staff yang masuk</p>
                    </div>
                )}
            </div>
        </div>
    );
}
