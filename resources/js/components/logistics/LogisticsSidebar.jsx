import React from 'react';
import { 
    Barcode, Warehouse, Radar, Users, 
    Star, Wallet, Settings, Home, X, UserCheck, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LogisticsSidebar({ activeTab, setActiveTab, isOpen, setIsOpen, userRole }) {
    const menuItems = [
        { id: 'receive', label: 'Penerimaan', icon: Barcode, roles: ['super_admin', 'admin_logistik', 'sortir_logistik', 'logistik_internal'] },
        { id: 'assign', label: 'Penyortiran', icon: Warehouse, roles: ['super_admin', 'admin_logistik', 'sortir_logistik'] },
        { id: 'logs', label: 'Radar Log', icon: Radar, roles: ['super_admin', 'admin_logistik', 'sortir_logistik', 'logistik_internal', 'logistik_external'] },
        { id: 'employees', label: 'Karyawan', icon: UserCheck, roles: ['super_admin', 'admin_logistik'] },
        { id: 'performance', label: 'Kinerja', icon: Star, roles: ['super_admin', 'admin_logistik', 'sortir_logistik', 'logistik_internal', 'logistik_external'] },
        { id: 'aspirasi', label: 'Aspirasi Staff', icon: Shield, roles: ['super_admin', 'admin_logistik'] },
        { id: 'salary', label: 'Dompet & Gaji', icon: Wallet, roles: ['sortir_logistik', 'logistik_internal', 'logistik_external'] },
        { id: 'settings', label: 'Pengaturan', icon: Settings, roles: ['super_admin', 'admin_logistik'] },
    ];

    const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-rc-card border-r border-rc-main/10 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-col`}>
                <div className="p-6 border-b border-rc-main/10 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-500 rounded-lg shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                            <Warehouse className="w-5 h-5 text-rc-bg" />
                        </div>
                        <span className="font-black text-rc-main tracking-tighter text-lg uppercase">Logistik Portal</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="md:hidden text-rc-muted hover:text-rc-main">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {filteredItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === item.id 
                                ? 'bg-teal-500 text-rc-bg shadow-[0_0_20px_rgba(20,184,166,0.2)] scale-105 z-10' 
                                : 'text-rc-muted hover:bg-rc-main/5 hover:text-rc-main'}`}
                        >
                            <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-rc-bg' : 'text-teal-500/70'}`} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-rc-main/10 bg-rc-card shrink-0">
                    <Link to="/dashboard" className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-rc-muted hover:bg-red-500/10 hover:text-red-500 transition-all duration-300">
                        <Home className="w-4 h-4" />
                        Dashboard Utama
                    </Link>
                </div>
            </aside>
        </>
    );
}
