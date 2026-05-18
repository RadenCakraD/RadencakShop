import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SwitchAccountModal({ isOpen, onClose, currentUsername }) {
    const navigate = useNavigate();
    const savedAccounts = JSON.parse(localStorage.getItem('saved_accounts') || '[]');

    if (!isOpen) return null;

    const handleSwitch = (account) => {
        localStorage.setItem('auth_token', account.token);
        onClose();
        // Force refresh to reload all context/data
        window.location.href = '/profile';
    };

    const handleRemove = (e, username) => {
        e.stopPropagation();
        const filtered = savedAccounts.filter(acc => acc.username !== username);
        localStorage.setItem('saved_accounts', JSON.stringify(filtered));
        // Simple and robust way to refresh state
        window.location.reload();
    };

    const getRoleBadgeStyle = (role) => {
        switch (role) {
            case 'super_admin':
                return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
            case 'admin_staff':
                return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
            case 'admin_kurir':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            case 'kurir_staff':
                return 'bg-green-500/10 text-green-400 border-green-500/30';
            case 'admin_logistik':
                return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
            case 'logistik_staff':
                return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
            case 'shop_owner':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
            case 'shop_staff':
                return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
            case 'user_premium':
                return 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30';
            default:
                return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
        }
    };

    const getRoleLabel = (role) => {
        return {
            'user': 'Member',
            'user_premium': 'Premium Member',
            'shop_owner': 'Pemilik Toko',
            'shop_staff': 'Staff Toko',
            'admin_kurir': 'Admin Kurir',
            'kurir_staff': 'Staff Kurir',
            'admin_logistik': 'Admin Logistik',
            'logistik_staff': 'Staff Logistik',
            'admin_staff': 'Staff Admin',
            'super_admin': 'Super Admin'
        }[role] || role;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop Blur overlay */}
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md transition-all duration-300" onClick={onClose}></div>
            
            {/* Modal Card */}
            <div className="bg-rc-bg p-8 rounded-3xl border-[0.5px] border-rc-logo/30 shadow-[0_0_50px_rgba(255,204,0,0.15)] relative w-full max-w-md transform transition-all duration-300 scale-100 z-10 overflow-hidden">
                <div className="absolute top-0 right-0 w-44 h-44 bg-rc-logo/5 rounded-full blur-3xl pointer-events-none"></div>
                
                {/* Header */}
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div>
                        <h2 className="text-lg font-black tracking-widest text-rc-main uppercase flex items-center gap-2">
                            <i className="fa-solid fa-user-gear text-rc-logo"></i> Beralih Akun
                        </h2>
                        <p className="text-[10px] text-rc-muted uppercase tracking-widest font-bold mt-1">Multi-Sesi Terenkripsi Lokal</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-full bg-rc-main/5 border border-rc-main/10 flex items-center justify-center text-rc-muted hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all duration-300"
                    >
                        <i className="fa-solid fa-xmark text-sm"></i>
                    </button>
                </div>

                {/* Account List */}
                <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-1 relative z-10">
                    {savedAccounts.length === 0 ? (
                        <div className="text-center py-12 bg-rc-main/5 rounded-2xl border border-dashed border-rc-main/10">
                            <i className="fa-solid fa-user-shield text-4xl mb-4 text-rc-muted animate-pulse"></i>
                            <p className="text-xs font-bold uppercase tracking-widest text-rc-muted">Tidak ada akun tersimpan</p>
                            <p className="text-[9px] text-rc-muted/50 uppercase font-medium mt-1">Simpan beberapa sesi untuk beralih instan</p>
                        </div>
                    ) : (
                        savedAccounts.map((acc, idx) => {
                            const isCurrent = acc.username === currentUsername;
                            const avatarUrl = acc.avatar 
                                ? (acc.avatar.startsWith('http') ? acc.avatar : `/storage/${acc.avatar}`)
                                : `https://ui-avatars.com/api/?name=${urlencode(acc.username)}&background=27272a&color=FFCC00&bold=true`;

                            return (
                                <div 
                                    key={idx} 
                                    onClick={() => !isCurrent && handleSwitch(acc)}
                                    className={`group flex items-center justify-between p-4 rounded-2xl border-[0.5px] transition-all duration-300 ${
                                        isCurrent 
                                            ? 'border-rc-logo bg-rc-logo/5 shadow-[0_0_15px_rgba(255,204,0,0.05)] cursor-default' 
                                            : 'border-rc-main/10 hover:border-rc-logo/50 hover:bg-rc-card hover:shadow-lg cursor-pointer transform hover:-translate-y-[2px]'
                                    }`}
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        {/* Avatar Container */}
                                        <div className={`relative w-12 h-12 rounded-xl overflow-hidden border flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                                            isCurrent ? 'border-rc-logo scale-105' : 'border-rc-main/10 group-hover:scale-105'
                                        }`}>
                                            <img src={avatarUrl} className="w-full h-full object-cover" />
                                            {isCurrent && (
                                                <div className="absolute inset-0 bg-rc-logo/10 flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-rc-logo animate-ping"></div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Meta */}
                                        <div className="text-left min-w-0 flex-1">
                                            <p className={`text-sm font-bold uppercase tracking-wide truncate ${isCurrent ? 'text-rc-logo' : 'text-rc-main'}`}>
                                                {acc.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="text-[9px] text-rc-muted font-bold tracking-wider lowercase">
                                                    @{acc.username}
                                                </span>
                                                {acc.role && (
                                                    <span className={`text-[8px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getRoleBadgeStyle(acc.role)}`}>
                                                        {getRoleLabel(acc.role)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Action Button */}
                                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                        {isCurrent ? (
                                            <span className="text-[8px] font-black bg-rc-logo/15 text-rc-logo border border-rc-logo/30 px-2 py-1 rounded-lg uppercase tracking-wider">Aktif</span>
                                        ) : (
                                            <button 
                                                onClick={(e) => handleRemove(e, acc.username)}
                                                className="w-8 h-8 rounded-xl bg-rc-main/5 hover:bg-red-500/10 text-rc-muted hover:text-red-500 border border-transparent hover:border-red-500/30 flex items-center justify-center transition-all duration-300 md:opacity-0 md:group-hover:opacity-100"
                                                title="Hapus Akun Tersimpan"
                                            >
                                                <i className="fa-solid fa-trash-can text-xs"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="mt-8 pt-6 border-t border-rc-main/10 relative z-10">
                    <button 
                        onClick={() => {
                            localStorage.removeItem('auth_token');
                            navigate('/login');
                        }}
                        className="w-full py-4 rounded-2xl bg-rc-main/5 border-[0.5px] border-rc-main/20 text-rc-main hover:border-rc-logo hover:text-rc-logo hover:bg-rc-logo/5 transition-all duration-300 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 group"
                    >
                        <i className="fa-solid fa-plus-circle text-sm group-hover:scale-110 transition-transform"></i> Tambah Akun Baru
                    </button>
                    <p className="text-center text-[9px] text-rc-muted font-bold uppercase mt-4 tracking-widest opacity-40">
                        Keamanan sesi disimpan di penyimpanan lokal browser Anda
                    </p>
                </div>
            </div>
        </div>
    );
}

// Simple helper to avoid crash if urlencode is not defined
function urlencode(str) {
    return encodeURIComponent(str || '');
}
