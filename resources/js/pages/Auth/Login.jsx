import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Perintah User: Email lalu Username lalu Password
    const [credentials, setCredentials] = useState({ email: '', username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/login', credentials);
            
            if (response.data.token || response.data.access_token) {
                const tokenString = response.data.token || response.data.access_token;
                localStorage.setItem('auth_token', tokenString);

                // Save to multi-account list
                const userData = response.data.user || { username: credentials.username };
                const savedAccounts = JSON.parse(localStorage.getItem('saved_accounts') || '[]');
                const newAccount = {
                    token: tokenString,
                    username: userData.username,
                    name: userData.name || userData.username,
                    avatar: userData.avatar,
                    email: userData.email || credentials.email
                };

                // Filter out existing same username and add new one
                const filteredAccounts = savedAccounts.filter(acc => acc.username !== newAccount.username);
                filteredAccounts.push(newAccount);
                localStorage.setItem('saved_accounts', JSON.stringify(filteredAccounts));
                
                const from = location.state?.from?.pathname || "/dashboard";
                setTimeout(() => navigate(from, { replace: true }), 100);
            } else {
                setError("Format token respons tidak dikenali dari server.");
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal login. Periksa kembali email, username, dan password Anda.');
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
                        LAKUKAN <span className="text-rc-logo">LOGIN</span>
                    </h2>
                    <p className="mt-3 text-[10px] text-rc-muted font-bold uppercase">
                        Belum tergabung? <Link to="/daftar" className="text-rc-logo hover:opacity-80 transition-opacity uppercase border-b-[2px] border-rc-logo/30 hover:border-rc-logo pb-0.5 ml-1">Daftar</Link>
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-500/10 border-[1px] border-red-500/50 p-4 rounded-lg">
                            <p className="text-xs text-red-500 font-bold uppercase"><i className="fa-solid fa-triangle-exclamation mr-2"></i> {error}</p>
                        </div>
                    )}
                    
                    <div className="space-y-5">
                        <div className="group relative">
                            <label className="block text-xs uppercase font-bold mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Alamat Email Aktif *</label>
                            <div className="relative">
                                <i className="fa-solid fa-envelope text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                <input name="email" type="email" required value={credentials.email} onChange={handleChange}
                                    className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg border-[1px] border-rc-main/20 rounded-lg placeholder-rc-muted text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-colors font-bold text-sm" 
                                    placeholder="nama@email.com" />
                            </div>
                        </div>
                        <div className="group relative">
                            <label className="block text-xs uppercase font-bold mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Nama Pengguna *</label>
                            <div className="relative">
                                <i className="fa-solid fa-at text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                <input name="username" type="text" required value={credentials.username} onChange={handleChange}
                                    className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg border-[1px] border-rc-main/20 rounded-lg placeholder-rc-muted text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-colors font-bold text-sm" 
                                    placeholder="Username Unik" />
                            </div>
                        </div>
                        <div className="group relative">
                            <label className="block text-xs uppercase font-bold mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Sandi Rahasia *</label>
                            <div className="relative">
                                <i className="fa-solid fa-lock text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                <input name="password" type="password" required value={credentials.password} onChange={handleChange}
                                    className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg border-[1px] border-rc-main/20 rounded-lg placeholder-rc-muted text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-colors font-bold text-sm" 
                                    placeholder="••••••••" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center">
                            <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 bg-transparent border-[1px] border-rc-main/50 rounded cursor-pointer appearance-none checked:bg-rc-logo relative" />
                            <label htmlFor="remember-me" className="ml-3 block text-[10px] uppercase text-rc-muted cursor-pointer font-bold">Ingat Sesi Saya</label>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button type="submit" disabled={loading}
                            className="w-full flex justify-center py-4 px-4 text-xs font-bold uppercase rounded-lg text-rc-bg bg-rc-logo hover:opacity-80 focus:outline-none transition-opacity duration-300 disabled:opacity-50 gap-3"
                        >
                            {loading ? (
                                <i className="fa-solid fa-circle-notch fa-spin text-lg"></i>
                            ) : (
                                <span className="flex items-center gap-3">MASUK PORTAL <i className="fa-solid fa-right-to-bracket"></i></span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
