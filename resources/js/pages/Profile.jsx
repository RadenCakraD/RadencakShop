import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import EditUserSettingsModal from '../components/Modals/EditUserSettingsModal';
import SwitchAccountModal from '../components/Modals/SwitchAccountModal';

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [primaryAddress, setPrimaryAddress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);


    const fetchUser = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            navigate('/login');
            return;
        }
        try {
            const [userRes, addrRes] = await Promise.all([
                axios.get('/api/user', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('/api/addresses', {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: [] }))
            ]);
            setUser(userRes.data);
            const primary = addrRes.data.find(a => a.is_primary) || addrRes.data[0];
            setPrimaryAddress(primary);

            // Auto-save current account to saved_accounts if not exists
            const savedAccounts = JSON.parse(localStorage.getItem('saved_accounts') || '[]');
            const currentAcc = {
                token: token,
                username: userRes.data.username,
                name: userRes.data.name || userRes.data.username,
                avatar: userRes.data.avatar,
                email: userRes.data.email
            };
            if (!savedAccounts.find(acc => acc.username === currentAcc.username)) {
                savedAccounts.push(currentAcc);
                localStorage.setItem('saved_accounts', JSON.stringify(savedAccounts));
            }
        } catch (err) {
            console.error("Gagal memuat profil", err);
            if (err.response?.status === 401) {
                localStorage.removeItem('auth_token');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [navigate]);

    const handleLogout = async () => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                await axios.post('/api/logout', {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (err) {
                console.error('Logout API failed', err);
            }
        }
        localStorage.removeItem('auth_token');
        navigate('/login');
    };

    if (loading) return (
        <div className="bg-rc-bg min-h-screen pb-16 font-sans flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-rc-card p-8 rounded-2xl animate-pulse border-[0.5px] border-rc-main/10">
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="w-24 h-24 bg-rc-bg rounded-xl border-[0.5px] border-rc-main/10"></div>
                    <div className="w-32 h-6 bg-rc-bg rounded border-[0.5px] border-rc-main/10"></div>
                </div>
                <div className="space-y-4">
                    <div className="w-full h-12 bg-rc-bg rounded border-[0.5px] border-rc-main/10"></div>
                    <div className="w-full h-12 bg-rc-bg rounded border-[0.5px] border-rc-main/10"></div>
                    <div className="w-full h-12 bg-rc-bg rounded border-[0.5px] border-rc-main/10"></div>
                </div>
            </div>
        </div>
    );
    if (!user) return null;

    return (
        <div className="bg-rc-bg min-h-screen text-rc-main font-sans pb-24 overflow-x-hidden relative">

            {/* Premium Navbar */}
            <nav className="sticky top-0 z-50 bg-rc-bg border-b-[0.5px] border-rc-main/20">
                <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="group flex items-center gap-3 text-xs font-bold uppercase text-rc-muted hover:text-rc-main transition-colors duration-300">
                        <i className="fa-solid fa-arrow-left-long"></i> KEMBALI
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rc-logo animate-ping"></div>
                        <span className="text-xs uppercase font-bold text-rc-muted">Command Center</span>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 pt-12">

                {/* Hero Profile Section */}
                <div className="relative mb-16 h-full flex flex-col md:flex-row items-center md:items-end gap-10">
                    <div className="relative group">
                        <div className="relative w-44 h-44 md:w-56 md:h-56 rounded-2xl border-[1px] border-rc-main/20 bg-rc-card overflow-hidden flex items-center justify-center">
                            {user.avatar ? (
                                <img src={`/storage/${user.avatar}`} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center gap-3 opacity-20">
                                    <i className="fa-solid fa-user-shield text-7xl"></i>
                                    <span className="text-xs uppercase font-bold">No Avatar</span>
                                </div>
                            )}
                        </div>
                        {user.role === 'admin' && (
                            <div className="absolute -top-4 -right-4 bg-rc-logo text-rc-bg px-4 py-1.5 rounded text-xs font-bold flex items-center gap-2 shadow-sm">
                                <i className="fa-solid fa-crown"></i> SUPERIOR
                            </div>
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="space-y-1">
                            <h2 className="text-4xl md:text-6xl font-bold text-rc-main uppercase">
                                {user.name || user.username}
                            </h2>
                            <div className="flex items-center justify-center md:justify-start gap-4">
                                <span className="bg-rc-bg border-[1px] border-rc-main/20 px-3 py-1 rounded text-xs font-bold text-rc-muted uppercase flex items-center gap-2">
                                    <i className="fa-solid fa-at text-rc-main"></i> {user.username}
                                </span>
                                <span className="bg-rc-logo text-rc-bg px-3 py-1 rounded text-xs font-bold uppercase flex items-center gap-2">
                                    <i className="fa-solid fa-shield-halved"></i> {user.role}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                            <button onClick={() => setIsEditModalOpen(true)} className="px-8 py-3 bg-rc-logo text-rc-bg hover:bg-yellow-400 rounded text-xs font-bold uppercase transition-colors flex items-center gap-2">
                                <i className="fa-solid fa-sliders"></i> PENGATURAN AKUN
                            </button>
                            <Link to="/toko" className="px-8 py-3 bg-rc-bg border-[1px] border-rc-main/20 text-rc-main hover:border-rc-logo rounded text-xs font-bold uppercase transition-colors flex items-center gap-2">
                                <i className="fa-solid fa-store"></i> DASHBOARD NIAGA
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Info Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                    {/* Primary Info Cards */}
                    <div className="md:col-span-8 space-y-6">

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Card: Email */}
                            <div className="bg-rc-card border-[0.5px] border-rc-main/20 rounded-xl p-8 hover:border-rc-logo transition-colors relative overflow-hidden">
                                <h4 className="text-xs font-bold text-rc-muted uppercase mb-4">Email Terdaftar</h4>
                                <p className="text-lg font-bold text-rc-main truncate">{user.email}</p>
                            </div>

                            {/* Card: WhatsApp */}
                            <div className="bg-rc-card border-[0.5px] border-rc-main/20 rounded-xl p-8 hover:border-rc-logo transition-colors relative overflow-hidden">
                                <h4 className="text-xs font-bold text-rc-muted uppercase mb-4">Nomor Seluler</h4>
                                <p className="text-lg font-bold text-rc-main">{user.no_hp || 'Not Set'}</p>
                            </div>
                        </div>

                        {/* Card: Address Large */}
                        <div className="bg-rc-card border-[0.5px] border-rc-main/20 rounded-xl p-8 hover:border-rc-logo transition-colors relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-xs font-bold text-rc-muted uppercase flex items-center gap-3">
                                    <i className="fa-solid fa-location-dot text-rc-logo"></i> Titik Lokasi Pengiriman
                                </h4>
                                <Link to="/pengaturan" className="text-[10px] bg-rc-logo/10 text-rc-logo border border-rc-logo/30 px-3 py-1 rounded hover:bg-rc-logo hover:text-rc-bg transition uppercase font-bold">
                                    Kelola
                                </Link>
                            </div>
                            
                            {primaryAddress ? (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <h5 className="text-lg font-bold text-rc-main uppercase">{primaryAddress.receiver_name}</h5>
                                        <span className="bg-rc-logo text-rc-bg px-2 py-0.5 rounded text-[10px] font-black uppercase">{primaryAddress.tag}</span>
                                    </div>
                                    <p className="text-sm font-bold text-rc-muted mb-2">{primaryAddress.phone_number}</p>
                                    <p className="text-sm font-medium text-rc-main leading-relaxed max-w-xl">
                                        {primaryAddress.full_address}
                                    </p>
                                    {primaryAddress.note && <p className="text-[10px] text-teal-400 font-bold bg-teal-400/10 px-2 py-1 rounded w-fit italic mt-2">"{primaryAddress.note}"</p>}
                                </div>
                            ) : (
                                <p className="text-sm font-bold text-rc-muted leading-relaxed max-w-xl">
                                    Anda belum menetapkan alamat domisili utama untuk pengiriman logistik.
                                </p>
                            )}
                        </div>

                    </div>

                    {/* Navigation Sidebar */}
                    <div className="md:col-span-4 space-y-6">
                        <div className="bg-rc-bg border-[0.5px] border-rc-main/20 rounded-xl p-8 relative overflow-hidden">
                            <h3 className="text-xs font-bold uppercase text-rc-muted mb-6 pb-4 border-b border-rc-main/20">Akses Navigasi</h3>
                            <div className="space-y-2">
                                {[
                                    { to: '/keranjang', icon: 'fa-cart-shopping', label: 'Keranjang Belanja' },
                                    { to: '/chat', icon: 'fa-comment-dots', label: 'Pesan Masuk' },
                                    { to: '/informasi', icon: 'fa-receipt', label: 'Riwayat Pesanan' },
                                ].map((item, idx) => (
                                    <Link key={idx} to={item.to} className="flex items-center justify-between p-4 rounded-lg bg-rc-card border-[1px] border-transparent hover:border-rc-logo transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 flex items-center justify-center group-hover:text-rc-logo transition-colors text-rc-main">
                                                <i className={`fa-solid ${item.icon}`}></i>
                                            </div>
                                            <span className="text-xs font-bold uppercase text-rc-main">{item.label}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-rc-main/20 space-y-3">
                                <button onClick={() => setIsSwitchModalOpen(true)} className="w-full py-4 rounded bg-rc-logo/10 border-[1px] border-rc-logo/50 text-rc-logo hover:bg-rc-logo hover:text-rc-bg transition-colors text-xs font-bold uppercase flex items-center justify-center gap-2">
                                    <i className="fa-solid fa-repeat"></i> Beralih Akun
                                </button>
                                <button onClick={handleLogout} className="w-full py-4 rounded bg-red-500/10 border-[1px] border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-xs font-bold uppercase flex items-center justify-center gap-2">
                                    <i className="fa-solid fa-power-off"></i> Terminasi Sesi
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            <EditUserSettingsModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                userData={user}
                onSuccess={fetchUser}
            />

            <SwitchAccountModal
                isOpen={isSwitchModalOpen}
                onClose={() => setIsSwitchModalOpen(false)}
                currentUsername={user.username}
            />

        </div>
    );
}
