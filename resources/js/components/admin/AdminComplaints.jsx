import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Headset, CheckCircle2, AlertCircle, MessageSquare, User, Clock, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminComplaints() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/complaints');
            if (Array.isArray(res.data)) {
                setComplaints(res.data);
            } else {
                setComplaints([]);
            }
        } catch (e) {
            toast.error("Gagal mengambil data komplain");
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id) => {
        if (!confirm("Tandai komplain ini sebagai SELESAI? Pastikan solusi sudah diberikan.")) return;
        try {
            await axios.post(`/api/admin/complaints/${id}/resolve`);
            toast.success("Komplain diselesaikan");
            fetchComplaints();
        } catch (e) {
            toast.error("Gagal menyelesaikan komplain");
        }
    };

    if (loading) return <div className="py-20 text-center animate-pulse text-rc-muted uppercase text-xs font-black tracking-widest">Sinkronisasi Pusat Bantuan...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.isArray(complaints) && complaints.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-rc-card rounded-[2.5rem] border border-rc-main/10 opacity-50">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest text-rc-muted">Tidak ada pengaduan aktif saat ini.</p>
                    </div>
                ) : (
                    Array.isArray(complaints) && complaints.map(c => (
                        <div key={c.id} className="bg-rc-card p-8 rounded-[2.5rem] border border-rc-main/10 relative overflow-hidden group hover:border-rc-logo transition-all duration-500 shadow-2xl">
                            <div className="absolute top-0 right-0 p-6">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${
                                    c.status === 'resolved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse'
                                }`}>
                                    {c.status === 'resolved' ? 'Terselesaikan' : 'Butuh Perhatian'}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-rc-main/5 flex items-center justify-center text-rc-logo border border-rc-main/10">
                                    <MessageSquare className="w-7 h-7" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-rc-main uppercase tracking-tight">{c.subject}</h4>
                                    <div className="flex items-center gap-2 text-rc-muted text-[10px] font-bold uppercase tracking-widest">
                                        <User className="w-3 h-3" /> {c.user?.name} 
                                        <span className="w-1 h-1 bg-rc-muted rounded-full"></span>
                                        ID: #{c.id}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-rc-bg/50 p-6 rounded-2xl border border-rc-main/5 mb-8">
                                <p className="text-sm text-rc-main leading-relaxed italic">"{c.message}"</p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-rc-muted text-[9px] font-bold uppercase tracking-widest">
                                    <Clock className="w-3 h-3" /> {new Date(c.created_at).toLocaleString('id-ID')}
                                </div>
                                {c.status !== 'resolved' && (
                                    <button 
                                        onClick={() => handleResolve(c.id)}
                                        className="bg-rc-logo text-rc-bg px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,204,0,0.2)] flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Selesaikan
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
