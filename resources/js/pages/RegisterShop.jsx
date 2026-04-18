import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterShop() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nama_toko: '',
        url_toko: '',
        alamat_toko: '',
        no_telepon: '',
        kurir: ['jne', 'jnt', 'sicepat'] // default kurir
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const kurirOptions = [
        { id: 'jne', name: 'JNE Express' },
        { id: 'jnt', name: 'J&T Express' },
        { id: 'sicepat', name: 'SiCepat' },
        { id: 'gosend', name: 'GoSend' },
        { id: 'grab', name: 'GrabExpress' },
    ];

    const handleChange = (e) => {
        let val = e.target.value;
        if (e.target.name === 'url_toko') {
            val = val.toLowerCase().replace(/[^a-z0-9]/g, '');
        }
        setFormData({ ...formData, [e.target.name]: val });
        setError(null);
    };

    const handleKurirToggle = (id) => {
        setFormData(prev => ({
            ...prev,
            kurir: prev.kurir.includes(id) 
                ? prev.kurir.filter(k => k !== id) 
                : [...prev.kurir, id]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.kurir.length === 0) {
            setError("Pilih minimal satu layanan kurir untuk pengiriman.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await axios.post('/api/shop/register', formData);
            alert("Toko berhasil didirikan! Selamat datang, Bos.");
            navigate('/toko', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mendaftar toko. Pastikan semua field terisi dengan benar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-rc-bg py-12 px-4 sm:px-6 lg:px-8 text-rc-main font-sans overflow-x-hidden relative">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rc-logo/5 rounded-full blur-[150px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rc-logo/5 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="max-w-2xl w-full z-10 bg-gradient-to-tr from-rc-card/40 to-rc-bg/80 backdrop-blur-2xl p-8 sm:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[0.5px] border-rc-main/10 relative my-10">
                
                <div className="text-center mb-10">
                    <Link to="/dashboard" className="inline-block hover:scale-105 transition-transform duration-300">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rc-logo/20 to-transparent border-[0.5px] border-rc-logo/50 flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                            <i className="fa-solid fa-shop text-3xl text-rc-logo"></i>
                        </div>
                    </Link>
                    <h2 className="text-3xl font-light tracking-wide text-rc-main uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                        BUKA <span className="font-bold text-rc-logo">TOKO</span>
                    </h2>
                    <p className="mt-3 text-[10px] text-rc-muted/80 font-light tracking-[0.3em] uppercase">
                        Raih Kesempatan Bisnis Premium RadenCak
                    </p>
                </div>

                <form className="space-y-8" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-500/10 backdrop-blur-md border-[0.5px] border-red-500/50 p-4 rounded-2xl shadow-inner animate-shake">
                            <p className="text-xs text-red-400 font-light tracking-widest uppercase flex items-center gap-3">
                                <i className="fa-solid fa-triangle-exclamation"></i> {error}
                            </p>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Section 1: Identitas */}
                        <div className="space-y-6">
                            <div className="group relative">
                                <label className="block text-[10px] uppercase font-light tracking-[0.2em] mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Nama Entitas Toko *</label>
                                <div className="relative">
                                    <i className="fa-solid fa-store text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                    <input 
                                        name="nama_toko" 
                                        type="text" 
                                        required 
                                        value={formData.nama_toko} 
                                        onChange={handleChange}
                                        className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl placeholder-rc-muted/30 text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-all font-light tracking-wide text-sm shadow-inner" 
                                        placeholder="Butik Mewah Raden" 
                                    />
                                </div>
                            </div>

                            <div className="group relative">
                                <label className="block text-[10px] uppercase font-light tracking-[0.2em] mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">URL Unik Navigasi *</label>
                                <div className="relative">
                                    <i className="fa-solid fa-link text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                    <input 
                                        name="url_toko" 
                                        type="text" 
                                        required 
                                        value={formData.url_toko} 
                                        onChange={handleChange}
                                        className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl placeholder-rc-muted/30 text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-all font-light tracking-wide text-sm shadow-inner" 
                                        placeholder="butikmewahraden" 
                                    />
                                </div>
                                <p className="text-[9px] text-rc-muted/50 mt-2 ml-2 tracking-widest uppercase">radencak.com/toko/{formData.url_toko || 'url'}</p>
                            </div>

                            <div className="group relative">
                                <label className="block text-[10px] uppercase font-light tracking-[0.2em] mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Nomor Bisnis (WA) *</label>
                                <div className="relative">
                                    <i className="fa-solid fa-phone text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                    <input 
                                        name="no_telepon" 
                                        type="tel" 
                                        required 
                                        value={formData.no_telepon} 
                                        onChange={handleChange}
                                        className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl placeholder-rc-muted/30 text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-all font-light tracking-wide text-sm shadow-inner" 
                                        placeholder="081234567890" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Lokasi & Kurir */}
                        <div className="space-y-6">
                            <div className="group relative">
                                <label className="block text-[10px] uppercase font-light tracking-[0.2em] mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Alamat Markas Toko *</label>
                                <div className="relative">
                                    <i className="fa-solid fa-location-dot text-rc-muted absolute left-4 top-4 group-focus-within:text-rc-logo transition-colors"></i>
                                    <textarea 
                                        name="alamat_toko" 
                                        required 
                                        rows="4"
                                        value={formData.alamat_toko} 
                                        onChange={handleChange}
                                        className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl placeholder-rc-muted/30 text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-all font-light tracking-wide text-sm resize-none shadow-inner" 
                                        placeholder="Jl. Raden No. 1, Kota Mewah, Indonesia" 
                                    />
                                </div>
                            </div>

                            <div className="group relative">
                                <label className="block text-[10px] uppercase font-light tracking-[0.2em] mb-3 text-rc-muted group-focus-within:text-rc-logo transition-colors">Layanan Pengiriman *</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {kurirOptions.map(k => (
                                        <button 
                                            key={k.id}
                                            type="button"
                                            onClick={() => handleKurirToggle(k.id)}
                                            className={`px-4 py-2.5 rounded-xl text-[10px] font-light tracking-widest uppercase border-[0.5px] transition-all duration-300 flex items-center justify-between ${formData.kurir.includes(k.id) ? 'bg-rc-logo/10 border-rc-logo text-rc-logo shadow-[0_0_10px_rgba(255,215,0,0.1)]' : 'bg-transparent border-rc-main/10 text-rc-muted hover:border-rc-main/30'}`}
                                        >
                                            {k.name}
                                            {formData.kurir.includes(k.id) && <i className="fa-solid fa-check text-[8px]"></i>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button 
                            type="submit" 
                            disabled={loading || !formData.nama_toko || !formData.url_toko || !formData.alamat_toko || !formData.no_telepon}
                            className="group relative w-full flex justify-center py-5 px-4 text-[10px] font-light tracking-[0.2em] uppercase rounded-full text-rc-bg bg-rc-logo hover:bg-yellow-400 focus:outline-none shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed items-center gap-3 overflow-hidden"
                        >
                            {loading ? (
                                <i className="fa-solid fa-circle-notch fa-spin text-lg"></i>
                            ) : (
                                <>
                                    <span className="relative z-10 flex items-center gap-3">BANGUN TOKO IMPIAN <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i></span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
