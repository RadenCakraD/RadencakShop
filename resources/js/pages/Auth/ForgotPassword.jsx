import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', username: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/forgot-password', formData);
            toast.success('Kode reset telah dikirim ke email Anda!');
            // Redirect to reset password page with email and username state
            navigate('/reset-password', { state: { email: formData.email, username: formData.username } });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal mengirim kode reset.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-rc-bg py-12 px-4 sm:px-6 lg:px-8 text-rc-main relative overflow-hidden font-sans">
            <div className="max-w-md w-full z-10 bg-rc-card p-10 sm:p-14 rounded-2xl border-[1px] border-rc-main/20 relative">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-xl bg-rc-bg border-[1px] border-rc-main/20 flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-key text-3xl text-rc-logo"></i>
                    </div>
                    <h2 className="text-3xl font-bold text-rc-main uppercase">
                        LUPA <span className="text-rc-logo">SANDI</span>
                    </h2>
                    <p className="mt-3 text-[10px] text-rc-muted font-bold uppercase">
                        Masukkan email dan username Anda untuk memverifikasi kepemilikan akun.
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="group relative">
                        <label className="block text-xs uppercase font-bold mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Alamat Email Terdaftar *</label>
                        <div className="relative">
                            <i className="fa-solid fa-envelope text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                            <input 
                                type="email" 
                                required 
                                value={formData.email} 
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg border-[1px] border-rc-main/20 rounded-lg placeholder-rc-muted text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-colors font-bold text-sm" 
                                placeholder="nama@email.com" 
                            />
                        </div>
                    </div>

                    <div className="group relative">
                        <label className="block text-xs uppercase font-bold mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Username Akun *</label>
                        <div className="relative">
                            <i className="fa-solid fa-at text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                            <input 
                                type="text" 
                                required 
                                value={formData.username} 
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg border-[1px] border-rc-main/20 rounded-lg placeholder-rc-muted text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-colors font-bold text-sm" 
                                placeholder="Username Anda" 
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-4 px-4 text-xs font-bold uppercase rounded-lg text-rc-bg bg-rc-logo hover:opacity-80 focus:outline-none transition-opacity duration-300 disabled:opacity-50 gap-3"
                        >
                            {loading ? (
                                <i className="fa-solid fa-circle-notch fa-spin text-lg"></i>
                            ) : (
                                <span className="flex items-center gap-3">KIRIM KODE RESET <i className="fa-solid fa-paper-plane"></i></span>
                            )}
                        </button>
                    </div>

                    <div className="text-center mt-6">
                        <Link to="/login" className="text-[10px] text-rc-muted font-bold uppercase hover:text-rc-logo transition-colors">
                            <i className="fa-solid fa-arrow-left mr-2"></i> Kembali ke Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
