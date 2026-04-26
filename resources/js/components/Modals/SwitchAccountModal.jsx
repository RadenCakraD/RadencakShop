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
        // Force re-render would be better, but this is simple
        window.location.reload();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-rc-bg p-8 rounded-2xl border-[1px] border-rc-main/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative w-full max-w-md animate-fade-in z-10">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold tracking-widest text-rc-main uppercase">
                        <i className="fa-solid fa-repeat text-rc-logo mr-3"></i> Beralih Akun
                    </h2>
                    <button onClick={onClose} className="text-rc-muted hover:text-rc-main transition-colors">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {savedAccounts.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <i className="fa-solid fa-user-slash text-4xl mb-4"></i>
                            <p className="text-xs font-bold uppercase tracking-widest">Tidak ada akun tersimpan</p>
                        </div>
                    ) : (
                        savedAccounts.map((acc, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => acc.username !== currentUsername && handleSwitch(acc)}
                                className={`group flex items-center justify-between p-4 rounded-xl border-[1px] transition-all duration-300 ${acc.username === currentUsername ? 'border-rc-logo bg-rc-logo/5' : 'border-rc-main/10 hover:border-rc-logo/50 hover:bg-rc-card cursor-pointer'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-rc-card border border-rc-main/10 overflow-hidden flex items-center justify-center">
                                        {acc.avatar ? (
                                            <img src={`/storage/${acc.avatar}`} className="w-full h-full object-cover" />
                                        ) : (
                                            <i className="fa-solid fa-user text-rc-muted"></i>
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-sm font-bold uppercase tracking-wide ${acc.username === currentUsername ? 'text-rc-logo' : 'text-rc-main'}`}>
                                            {acc.name}
                                        </p>
                                        <p className="text-[10px] text-rc-muted font-bold tracking-widest uppercase">
                                            @{acc.username}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    {acc.username === currentUsername ? (
                                        <span className="text-[8px] font-black bg-rc-logo text-rc-bg px-2 py-0.5 rounded uppercase tracking-tighter">Aktif</span>
                                    ) : (
                                        <button 
                                            onClick={(e) => handleRemove(e, acc.username)}
                                            className="opacity-0 group-hover:opacity-100 text-rc-muted hover:text-red-500 transition-all text-xs p-2"
                                        >
                                            <i className="fa-solid fa-trash-can"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-rc-main/10">
                    <button 
                        onClick={() => {
                            localStorage.removeItem('auth_token');
                            navigate('/login');
                        }}
                        className="w-full py-4 rounded bg-rc-main/5 border-[1px] border-rc-main/20 text-rc-main hover:border-rc-logo hover:text-rc-logo transition-all text-xs font-bold uppercase flex items-center justify-center gap-3"
                    >
                        <i className="fa-solid fa-plus-circle"></i> Tambah Akun Baru
                    </button>
                    <p className="text-center text-[9px] text-rc-muted font-bold uppercase mt-4 tracking-widest opacity-50">
                        Keamanan sesi dienkripsi secara lokal
                    </p>
                </div>
            </div>
        </div>
    );
}
