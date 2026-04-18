import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({ 
        email: '', 
        username: '',
        country_code: '+62',
        nohp: '',
        password: '', 
        password_confirmation: '' 
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.password_confirmation) {
            setError({ message: "Konfirmasi password tidak cocok dengan password yang dimasukkan." });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/register', formData);
            if (response.data.token || response.data.access_token) {
                const tokenString = response.data.token || response.data.access_token;
                localStorage.setItem('auth_token', tokenString);
                setTimeout(() => navigate('/dashboard', { replace: true }), 100);
            } else {
                alert("Registrasi berhasil! Silakan login untuk melanjutkan.");
                navigate('/login');
            }
        } catch (err) {
            if (err.response?.data?.errors) {
                const errorMessages = Object.values(err.response.data.errors).flat().join(' ');
                setError({ message: errorMessages });
            } else {
                setError({ message: err.response?.data?.message || 'Gagal mendaftar. Silakan coba beberapa saat lagi.' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-rc-bg py-12 px-4 sm:px-6 lg:px-8 text-rc-main relative overflow-hidden font-sans">
            <div className="max-w-md w-full z-10 bg-rc-card p-10 sm:p-14 rounded-2xl border-[1px] border-rc-main/20 relative">
                
                <div className="text-center mb-10">
                    <Link to="/dashboard" className="inline-block hover:opacity-80 transition-opacity duration-300">
                        <div className="w-16 h-16 rounded-xl bg-rc-bg border-[1px] border-rc-main/20 flex items-center justify-center mx-auto mb-4">
                            <i className="fa-solid fa-store text-3xl text-rc-logo"></i>
                        </div>
                    </Link>
                    <h2 className="text-3xl font-bold text-rc-main uppercase">
                        BUAT <span className="text-rc-logo">AKUN</span>
                    </h2>
                    <p className="mt-3 text-[10px] text-rc-muted font-bold uppercase">
                        Sudah terdaftar? <Link to="/login" className="text-rc-logo hover:opacity-80 uppercase border-b-[2px] border-rc-logo/30 hover:border-rc-logo pb-0.5 ml-1 transition-opacity">Masuk</Link>
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-500/10 border-[1px] border-red-500/50 p-4 rounded-lg">
                            <p className="text-xs text-red-500 font-bold uppercase"><i className="fa-solid fa-triangle-exclamation mr-2"></i> {error.message}</p>
                        </div>
                    )}
                    
                    <div className="space-y-5">
                        <div className="group relative">
                            <label className="block text-xs uppercase font-bold mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Username Identitas *</label>
                            <div className="relative">
                                <i className="fa-solid fa-user text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                <input name="username" type="text" required value={formData.username} onChange={handleChange}
                                    className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg border-[1px] border-rc-main/20 rounded-lg placeholder-rc-muted text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-colors font-bold text-sm" 
                                    placeholder="Username Unik" />
                            </div>
                        </div>

                        <div className="group relative">
                            <label className="block text-xs uppercase font-bold mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Alamat Email *</label>
                            <div className="relative">
                                <i className="fa-solid fa-envelope text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                <input name="email" type="email" required value={formData.email} onChange={handleChange}
                                    className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg border-[1px] border-rc-main/20 rounded-lg placeholder-rc-muted text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-colors font-bold text-sm" 
                                    placeholder="nama@email.com" />
                            </div>
                        </div>
                        
                        <div className="group relative">
                            <label className="block text-xs uppercase font-bold mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Whatsapp *</label>
                            <div className="flex gap-2">
                                <select name="country_code" value={formData.country_code} onChange={handleChange}
                                    className="appearance-none rounded-lg relative block w-[80px] text-center bg-rc-bg border-[1px] border-rc-main/20 text-rc-main focus:outline-none focus:border-rc-logo transition-colors cursor-pointer text-xs font-bold">
                                    <option value="+62">ID +62</option>
                                    <option value="+60">MY +60</option>
                                    <option value="+65">SG +65</option>
                                </select>
                                <div className="relative flex-1">
                                    <i className="fa-solid fa-phone text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                    <input name="nohp" type="tel" required value={formData.nohp} onChange={handleChange}
                                        className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg border-[1px] border-rc-main/20 rounded-lg placeholder-rc-muted text-rc-main focus:outline-none focus:border-rc-logo transition-colors font-bold text-sm" 
                                        placeholder="81234567890" />
                                </div>
                            </div>
                        </div>

                        <div className="group relative">
                            <label className="block text-xs uppercase font-bold mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Sandi Rahasia *</label>
                            <div className="relative">
                                <i className="fa-solid fa-lock text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                <input name="password" type="password" required value={formData.password} onChange={handleChange}
                                    className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg border-[1px] border-rc-main/20 rounded-lg placeholder-rc-muted text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-colors font-bold text-sm" 
                                    placeholder="Min 8 Karakter" />
                            </div>
                        </div>

                        <div className="group relative">
                            <label className="block text-xs uppercase font-bold mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Konfirmasi Sandi *</label>
                            <div className="relative">
                                <i className="fa-solid fa-shield-check text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                <input name="password_confirmation" type="password" required value={formData.password_confirmation} onChange={handleChange}
                                    className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg border-[1px] border-rc-main/20 rounded-lg placeholder-rc-muted text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-colors font-bold text-sm" 
                                    placeholder="Ketik Ulang Sandi" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button type="submit" disabled={loading}
                            className="w-full flex justify-center py-4 px-4 text-xs font-bold uppercase rounded-lg text-rc-bg bg-rc-logo hover:opacity-80 focus:outline-none transition-opacity duration-300 disabled:opacity-50 gap-3"
                        >
                            {loading ? (
                                <i className="fa-solid fa-circle-notch fa-spin text-lg"></i>
                            ) : (
                                <span className="flex items-center gap-3">DAFTAR SEKARANG <i className="fa-solid fa-user-plus"></i></span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
