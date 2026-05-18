import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import EditUserSettingsModal from '../components/Modals/EditUserSettingsModal';
import SwitchAccountModal from '../components/Modals/SwitchAccountModal';

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [primaryAddress, setPrimaryAddress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
    const [savedAccountsCount, setSavedAccountsCount] = useState(0);

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
                avatar: userRes.data.full_avatar_url,
                email: userRes.data.email,
                role: userRes.data.role
            };
            const existingIdx = savedAccounts.findIndex(acc => acc.username === currentAcc.username);
            if (existingIdx !== -1) {
                savedAccounts[existingIdx] = currentAcc;
            } else {
                savedAccounts.push(currentAcc);
            }
            localStorage.setItem('saved_accounts', JSON.stringify(savedAccounts));
            setSavedAccountsCount(savedAccounts.length);
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

    const getRoleDetails = (role) => {
        const roles = {
            'super_admin': { label: 'Super Admin', clearance: 'Root Level Clearance', color: 'from-yellow-500 to-amber-600', icon: 'fa-crown' },
            'admin_staff': { label: 'Staff Admin', clearance: 'Level 4 Access', color: 'from-amber-500 to-orange-600', icon: 'fa-shield-halved' },
            'shop_owner': { label: 'Pemilik Toko', clearance: 'Merchant Level Clearance', color: 'from-blue-500 to-indigo-600', icon: 'fa-store' },
            'shop_staff': { label: 'Staff Toko', clearance: 'Merchant Access', color: 'from-cyan-500 to-blue-600', icon: 'fa-briefcase' },
            'admin_kurir': { label: 'Admin Kurir', clearance: 'Logistics Supervisor', color: 'from-emerald-500 to-teal-600', icon: 'fa-truck-ramp-box' },
            'kurir_staff': { label: 'Kurir Lapangan', clearance: 'Logistics Operator', color: 'from-green-500 to-emerald-600', icon: 'fa-truck' },
            'sortir_kurir': { label: 'Sortir Kurir', clearance: 'Hub Operator', color: 'from-teal-500 to-green-600', icon: 'fa-boxes-packing' },
            'admin_logistik': { label: 'Admin Logistik', clearance: 'Supply Chain Supervisor', color: 'from-orange-500 to-red-600', icon: 'fa-warehouse' },
            'sortir_logistik': { label: 'Sortir Logistik', clearance: 'Supply Chain Operator', color: 'from-rose-500 to-orange-600', icon: 'fa-box-open' },
            'logistik_internal': { label: 'Logistik Internal', clearance: 'Fleet Operator', color: 'from-indigo-500 to-purple-600', icon: 'fa-dolly' },
            'logistik_external': { label: 'Logistik Eksternal', clearance: 'Partner Fleet Operator', color: 'from-purple-500 to-pink-600', icon: 'fa-truck-arrow-right' },
            'user_premium': { label: 'Premium Member', clearance: 'Priority Tier', color: 'from-yellow-400 to-amber-500', icon: 'fa-circle-up' },
            'user': { label: 'Member', clearance: 'Standard Tier', color: 'from-zinc-500 to-zinc-600', icon: 'fa-user' }
        };
        return roles[role] || { label: role, clearance: 'General Access', color: 'from-zinc-500 to-zinc-600', icon: 'fa-user' };
    };

    if (loading) return (
        <div className="bg-rc-bg min-h-screen pb-16 font-sans flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rc-logo/5 blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-rc-logo/5 blur-[120px] pointer-events-none"></div>
            <div className="w-full max-w-2xl bg-rc-card/60 backdrop-blur-xl p-10 rounded-[2.5rem] border-[0.5px] border-rc-main/10 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-rc-logo/5 via-transparent to-transparent pointer-events-none"></div>
                <div className="flex flex-col items-center gap-6 mb-8 w-full animate-pulse">
                    <div className="w-28 h-28 bg-rc-bg/80 rounded-[2rem] border-[0.5px] border-rc-main/20 flex items-center justify-center relative">
                        <i className="fa-solid fa-spinner-third fa-spin text-rc-logo text-3xl"></i>
                    </div>
                    <div className="w-44 h-8 bg-rc-bg/80 rounded-xl border-[0.5px] border-rc-main/20"></div>
                    <div className="w-24 h-4 bg-rc-bg/80 rounded-lg border-[0.5px] border-rc-main/20"></div>
                </div>
                <div className="space-y-4 w-full animate-pulse">
                    <div className="w-full h-16 bg-rc-bg/80 rounded-2xl border-[0.5px] border-rc-main/20"></div>
                    <div className="w-full h-16 bg-rc-bg/80 rounded-2xl border-[0.5px] border-rc-main/20"></div>
                </div>
            </div>
        </div>
    );

    if (!user) return null;

    const roleDetails = getRoleDetails(user.role);
    const memberSince = user.created_at 
        ? new Date(user.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) 
        : 'Baru Bergabung';

    return (
        <div className="bg-rc-bg min-h-screen text-rc-main font-sans pb-28 overflow-x-hidden relative">
            
            {/* Glowing Decorative Radial Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rc-logo/5 blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none"></div>
            <div className="absolute top-[35%] right-[10%] w-[35%] h-[35%] rounded-full bg-teal-500/3 blur-[100px] pointer-events-none"></div>

            {/* Premium Sticky Navbar */}
            <nav className="sticky top-0 z-50 bg-rc-bg/75 backdrop-blur-xl border-b border-rc-main/10 shadow-sm transition-all duration-300">
                <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
                    <motion.button 
                        onClick={() => navigate(-1)} 
                        whileHover={{ x: -4 }}
                        whileTap={{ scale: 0.95 }}
                        className="group flex items-center gap-3 text-xs font-bold tracking-widest uppercase text-rc-muted hover:text-rc-main transition-colors duration-300"
                    >
                        <i className="fa-solid fa-arrow-left-long text-rc-logo text-sm transition-transform group-hover:-translate-x-1"></i> Kembali
                    </motion.button>
                    <div className="flex items-center gap-3 bg-rc-card/50 px-4 py-1.5 rounded-full border border-rc-main/15">
                        <div className="w-2 h-2 rounded-full bg-rc-logo animate-pulse"></div>
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-rc-muted">COMMAND CENTER</span>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 pt-10 relative z-10">
                
                {/* Hero Profile Manifest */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative mb-12 bg-gradient-to-br from-rc-card/90 via-rc-card/75 to-rc-bg/40 border border-rc-main/15 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden"
                >
                    {/* Visual Accents */}
                    <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-rc-logo/10 via-transparent to-transparent pointer-events-none rounded-bl-full"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-1 bg-gradient-to-r from-transparent via-rc-logo/30 to-transparent"></div>

                    <div className="flex flex-col lg:flex-row items-center lg:items-end gap-10">
                        
                        {/* Avatar Showcase */}
                        <div className="relative group">
                            <motion.div 
                                whileHover={{ scale: 1.03, rotate: 1 }}
                                className="relative w-44 h-44 md:w-52 md:h-52 rounded-[2.5rem] p-1.5 bg-gradient-to-tr from-rc-main/20 via-rc-logo to-rc-main/10 shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden flex items-center justify-center cursor-pointer"
                                onClick={() => setIsEditModalOpen(true)}
                            >
                                <div className="w-full h-full rounded-[2.2rem] bg-rc-card overflow-hidden relative">
                                    <img 
                                        src={user.full_avatar_url} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                        alt={user.username}
                                    />
                                    {/* Glass Overlay on Hover */}
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <i className="fa-solid fa-camera text-rc-logo text-3xl drop-shadow-md"></i>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Floating Indicator */}
                            <div className="absolute -top-3 -right-3 bg-gradient-to-r from-rc-logo to-yellow-500 text-rc-bg px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 shadow-lg tracking-widest border border-rc-bg">
                                <i className="fa-solid fa-sparkles"></i> ACTIVE
                            </div>
                        </div>

                        {/* Profile Info Details */}
                        <div className="flex-1 text-center lg:text-left space-y-6">
                            <div className="space-y-3">
                                <span className="text-[10px] font-bold tracking-[0.3em] text-rc-muted uppercase block">IDENTITAS DIVERIFIKASI</span>
                                <h1 className="text-4xl md:text-6xl font-black text-rc-main uppercase tracking-tight leading-none drop-shadow-sm">
                                    {user.name || user.username}
                                </h1>
                                
                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
                                    <span className="bg-rc-bg/80 border border-rc-main/15 px-3.5 py-1.5 rounded-xl text-xs font-bold text-rc-muted uppercase flex items-center gap-2.5 shadow-sm">
                                        <i className="fa-solid fa-at text-rc-logo"></i> {user.username}
                                    </span>

                                    <span className={`bg-gradient-to-r ${roleDetails.color} text-white px-4 py-1.5 rounded-xl text-xs font-bold uppercase flex items-center gap-2 shadow-lg border border-white/10`}>
                                        <i className={`fa-solid ${roleDetails.icon} text-white/90`}></i> 
                                        {roleDetails.label}
                                    </span>

                                    {user.status === 'pending' && (
                                        <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 animate-pulse">
                                            <i className="fa-solid fa-circle-dot animate-ping text-[8px] mr-0.5"></i> Pending Review
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Custom Portals Trigger Hub */}
                            <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-2">
                                <motion.button 
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsEditModalOpen(true)} 
                                    className="px-6 py-3.5 bg-rc-logo text-rc-bg hover:bg-yellow-400 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 shadow-[0_5px_15px_rgba(255,215,0,0.15)]"
                                >
                                    <i className="fa-solid fa-user-gear text-sm"></i> Pengaturan Akun
                                </motion.button>
                                
                                {/* Admin Portal */}
                                {['super_admin', 'admin_staff'].includes(user.role) && (
                                    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                                        <Link to="/admin" className="px-6 py-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-rc-bg rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2.5">
                                            <i className="fa-solid fa-user-shield text-sm"></i> Portal Admin
                                        </Link>
                                    </motion.div>
                                )}

                                {/* Logistics Portal */}
                                {['super_admin', 'admin_staff', 'admin_logistik', 'sortir_logistik', 'logistik_internal', 'logistik_external'].includes(user.role) && (
                                    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                                        <Link to="/logistik" className="px-6 py-3.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-rc-bg rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2.5">
                                            <i className="fa-solid fa-warehouse text-sm"></i> Portal Logistik
                                        </Link>
                                    </motion.div>
                                )}

                                {/* Courier Portal */}
                                {['super_admin', 'admin_staff', 'admin_kurir', 'kurir_staff', 'sortir_kurir'].includes(user.role) && (
                                    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                                        <Link to="/kurir" className="px-6 py-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-rc-bg rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2.5">
                                            <i className="fa-solid fa-truck text-sm"></i> Portal Kurir
                                        </Link>
                                    </motion.div>
                                )}

                                {/* Shop Portal */}
                                {['super_admin', 'admin_staff', 'shop_owner', 'shop_staff'].includes(user.role) && (
                                    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                                        <Link to="/toko" className="px-6 py-3.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-rc-bg rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2.5">
                                            <i className="fa-solid fa-store text-sm"></i> Dashboard Niaga
                                        </Link>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Subtitle / Divider Section */}
                <div className="flex items-center gap-4 mb-8">
                    <span className="h-[1px] bg-rc-main/10 flex-1"></span>
                    <span className="text-[10px] font-bold tracking-[0.4em] text-rc-muted uppercase shrink-0">Ringkasan Sistem</span>
                    <span className="h-[1px] bg-rc-main/10 flex-1"></span>
                </div>

                {/* Information Modules Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Primary Info Cards */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Horizontal Info Widgets */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            
                            {/* Card: Email */}
                            <motion.div 
                                whileHover={{ y: -4 }}
                                className="bg-rc-card/75 border border-rc-main/15 rounded-2xl p-6 hover:border-rc-logo/30 transition-all duration-300 relative overflow-hidden flex items-center gap-5 shadow-lg group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-rc-logo/5 flex items-center justify-center text-rc-logo border border-rc-logo/15 group-hover:bg-rc-logo group-hover:text-rc-bg transition-colors duration-300">
                                    <i className="fa-solid fa-envelope-open-text text-lg"></i>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-[9px] font-bold text-rc-muted uppercase tracking-widest block">EMAIL VERIFIKASI</span>
                                    <span className="text-sm font-bold text-rc-main truncate block mt-0.5" title={user.email}>{user.email}</span>
                                </div>
                            </motion.div>

                            {/* Card: WhatsApp */}
                            <motion.div 
                                whileHover={{ y: -4 }}
                                className="bg-rc-card/75 border border-rc-main/15 rounded-2xl p-6 hover:border-rc-logo/30 transition-all duration-300 relative overflow-hidden flex items-center gap-5 shadow-lg group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-teal-500/5 flex items-center justify-center text-teal-400 border border-teal-500/15 group-hover:bg-teal-500 group-hover:text-rc-bg transition-colors duration-300">
                                    <i className="fa-solid fa-phone-volume text-lg"></i>
                                </div>
                                <div>
                                    <span className="text-[9px] font-bold text-rc-muted uppercase tracking-widest block">NOMOR SELULER</span>
                                    <span className="text-sm font-bold text-rc-main block mt-0.5">{user.no_hp || 'Belum Ditentukan'}</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Card: Address manifest (Styled like Boarding Pass) */}
                        <motion.div 
                            whileHover={{ y: -4 }}
                            className="bg-gradient-to-br from-rc-card to-rc-card/80 border border-rc-main/15 rounded-[2rem] p-8 shadow-xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-12 w-20 h-20 bg-rc-logo/5 rounded-full blur-xl pointer-events-none"></div>
                            
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-rc-main/10">
                                <h3 className="text-xs font-bold text-rc-muted uppercase tracking-widest flex items-center gap-3">
                                    <i className="fa-solid fa-map-location-dot text-rc-logo text-sm"></i> Manifest Domisili Pengiriman
                                </h3>
                                <Link to="/pengaturan" className="text-[10px] bg-rc-logo/10 text-rc-logo border border-rc-logo/30 px-3.5 py-1.5 rounded-lg hover:bg-rc-logo hover:text-rc-bg transition uppercase font-black tracking-widest">
                                    Kelola Alamat
                                </Link>
                            </div>
                            
                            {primaryAddress ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-xl font-black text-rc-main uppercase tracking-tight">{primaryAddress.receiver_name}</h4>
                                            <span className="bg-rc-logo text-rc-bg px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">{primaryAddress.tag}</span>
                                        </div>
                                        <span className="text-[10px] font-mono bg-rc-bg px-2.5 py-1 rounded border border-rc-main/10 text-rc-muted tracking-tight">
                                            HP: {primaryAddress.phone_number}
                                        </span>
                                    </div>
                                    
                                    {/* Geographical Hierarchies */}
                                    <div className="flex flex-wrap gap-2 py-1">
                                        {primaryAddress.district && (
                                            <span className="bg-rc-main/5 text-rc-muted border border-rc-main/10 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                Kec. {primaryAddress.district}
                                            </span>
                                        )}
                                        {primaryAddress.regency && (
                                            <span className="bg-rc-main/5 text-rc-muted border border-rc-main/10 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                {primaryAddress.regency}
                                            </span>
                                        )}
                                        {primaryAddress.province && (
                                            <span className="bg-rc-main/5 text-rc-muted border border-rc-main/10 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                Prov. {primaryAddress.province}
                                            </span>
                                        )}
                                    </div>

                                    <div className="bg-rc-bg/50 p-5 rounded-2xl border border-rc-main/10">
                                        <p className="text-sm font-semibold text-rc-main/90 leading-relaxed">
                                            {primaryAddress.full_address}
                                        </p>
                                        {primaryAddress.note && (
                                            <div className="mt-3 flex items-start gap-2.5 text-[11px] text-teal-400 bg-teal-500/5 border border-teal-500/10 px-3.5 py-2 rounded-xl italic">
                                                <i className="fa-solid fa-quote-left text-[9px] mt-0.5 text-teal-500/70 shrink-0"></i>
                                                <p className="font-medium">"{primaryAddress.note}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 space-y-4">
                                    <div className="w-14 h-14 rounded-full bg-rc-main/5 border border-rc-main/10 flex items-center justify-center mx-auto text-rc-muted">
                                        <i className="fa-solid fa-map-pin text-xl"></i>
                                    </div>
                                    <p className="text-sm font-bold text-rc-muted max-w-sm mx-auto leading-relaxed">
                                        Anda belum menetapkan alamat utama untuk penjemputan logistik.
                                    </p>
                                    <Link to="/pengaturan" className="inline-block px-6 py-2.5 bg-rc-main/5 border border-rc-main/15 text-rc-main hover:bg-rc-logo hover:text-rc-bg hover:border-rc-logo rounded-xl text-xs font-black uppercase transition-all">
                                        Tambah Alamat Sekarang
                                    </Link>
                                </div>
                            )}
                        </motion.div>

                        {/* Interactive Dynamic Stats Panel */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: 'Otoritas Akun', value: roleDetails.clearance, sub: 'Security Grade', icon: 'fa-user-shield', color: 'text-amber-400' },
                                { label: 'Sesi Tersimpan', value: `${savedAccountsCount} Sesi`, sub: 'Multi Account', icon: 'fa-repeat', color: 'text-blue-400' },
                                { label: 'Status Member', value: user.role === 'user_premium' ? 'Premium Gold' : 'Standar', sub: 'Priority Tier', icon: 'fa-circle-up', color: 'text-yellow-400' },
                                { label: 'Terdaftar Sejak', value: memberSince, sub: 'Verified User', icon: 'fa-calendar-day', color: 'text-emerald-400' },
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-rc-card/45 border border-rc-main/10 p-5 rounded-2xl hover:bg-rc-card/75 transition-colors relative overflow-hidden">
                                    <div className="absolute top-3 right-3 text-rc-muted/20 text-lg">
                                        <i className={`fa-solid ${stat.icon}`}></i>
                                    </div>
                                    <span className="text-[9px] font-bold text-rc-muted uppercase tracking-wider block">{stat.label}</span>
                                    <span className="text-sm font-black text-rc-main block mt-2 tracking-tight">{stat.value}</span>
                                    <span className="text-[9px] font-medium text-rc-muted/80 block mt-0.5">{stat.sub}</span>
                                </div>
                            ))}
                        </div>

                    </div>

                    {/* Navigation Sidebar Controls */}
                    <div className="lg:col-span-4 space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="bg-rc-card border border-rc-main/15 rounded-3xl p-6 shadow-xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-rc-logo/3 rounded-full blur-xl pointer-events-none"></div>
                            
                            <h3 className="text-xs font-bold uppercase tracking-widest text-rc-muted mb-6 pb-4 border-b border-rc-main/10 flex items-center justify-between">
                                <span>Akses Konsol</span>
                                <i className="fa-solid fa-server text-[10px] text-rc-logo"></i>
                            </h3>
                            
                            <div className="space-y-3">
                                {[
                                    { to: '/keranjang', icon: 'fa-cart-shopping', label: 'Keranjang Belanja', desc: 'Item siap check-out', badge: 'Active' },
                                    { to: '/chat', icon: 'fa-comment-dots', label: 'Komunikasi Internal', desc: 'Pesan masuk & CS', badge: 'Online' },
                                    { to: '/informasi', icon: 'fa-receipt', label: 'Faktur & Transaksi', desc: 'Riwayat pesanan niaga', badge: 'Verified' },
                                ].map((item, idx) => (
                                    <Link 
                                        key={idx} 
                                        to={item.to} 
                                        className="flex items-center justify-between p-4 rounded-2xl bg-rc-bg/50 border border-rc-main/10 hover:border-rc-logo/30 hover:bg-rc-card transition-all group relative overflow-hidden"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-rc-main/5 flex items-center justify-center group-hover:text-rc-logo group-hover:bg-rc-logo/5 transition-colors text-rc-main shrink-0 border border-rc-main/10">
                                                <i className={`fa-solid ${item.icon} text-md`}></i>
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-xs font-black uppercase text-rc-main group-hover:text-rc-logo transition-colors block leading-tight">{item.label}</span>
                                                <span className="text-[9px] font-medium text-rc-muted block mt-0.5 truncate">{item.desc}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-rc-main/10 space-y-3">
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsSwitchModalOpen(true)} 
                                    className="w-full py-4 rounded-xl bg-rc-logo/5 border border-rc-logo/30 text-rc-logo hover:bg-rc-logo hover:text-rc-bg transition-all text-xs font-black uppercase flex items-center justify-center gap-2.5 tracking-widest shadow-sm"
                                >
                                    <i className="fa-solid fa-repeat text-sm"></i> Beralih Identitas
                                </motion.button>
                                
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleLogout} 
                                    className="w-full py-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-black uppercase flex items-center justify-center gap-2.5 tracking-widest shadow-sm"
                                >
                                    <i className="fa-solid fa-power-off text-sm"></i> Terminasi Sesi
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </main>

            {/* Modal Handlers */}
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

