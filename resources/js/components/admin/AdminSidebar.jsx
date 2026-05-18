import React from 'react';
import { 
    LayoutDashboard, Users, Ticket, Truck, Warehouse, 
    Headset, Settings, Image as ImageIcon, Bolt, Wallet,
    ShieldCheck, X, UserCheck, Home, Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminSidebar({ activeTab, setActiveTab, isOpen, setIsOpen, userRole, pendingMitraCount }) {
    const menuItems = [
        { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard, roles: ['super_admin', 'admin_staff'] },
        { id: 'banners', label: 'Banner Promo', icon: ImageIcon, roles: ['super_admin', 'admin_staff'] },
        { id: 'flash-sale', label: 'Flash Sale', icon: Bolt, roles: ['super_admin', 'admin_staff'] },
        { id: 'users', label: 'Pengguna', icon: Users, roles: ['super_admin', 'admin_staff'] },
        { id: 'employees', label: 'Karyawan', icon: UserCheck, roles: ['super_admin', 'admin_staff'] },
        { id: 'shops', label: 'Toko', icon: Warehouse, roles: ['super_admin', 'admin_staff'] },
        { id: 'regions', label: 'Pajak & Wilayah', icon: Globe, roles: ['super_admin'] },
        { id: 'mitra_requests', label: 'Persetujuan Mitra', icon: ShieldCheck, roles: ['super_admin', 'admin_staff'] },
        { id: 'couriers', label: 'Kurir', icon: Truck, roles: ['super_admin', 'admin_staff'] },
        { id: 'logistics', label: 'Logistik', icon: Warehouse, roles: ['super_admin', 'admin_staff'] },
        { id: 'withdrawals', label: 'Penarikan', icon: Wallet, roles: ['super_admin', 'admin_staff'] },
        { id: 'vouchers', label: 'Voucher', icon: Ticket, roles: ['super_admin', 'admin_staff'] },
        { id: 'complaints', label: 'Komplain', icon: Headset, roles: ['super_admin', 'admin_staff'] },
        { id: 'settings', label: 'Pengaturan', icon: Settings, roles: ['super_admin'] },
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
                        <div className="p-2 bg-rc-logo rounded-lg shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                            <ShieldCheck className="w-5 h-5 text-rc-bg" />
                        </div>
                        <span className="font-black text-rc-main tracking-tighter text-lg uppercase">Portal Admin</span>
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
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === item.id 
                                ? 'bg-rc-logo text-rc-bg shadow-[0_0_20px_rgba(255,204,0,0.2)] scale-105 z-10' 
                                : 'text-rc-muted hover:bg-rc-main/5 hover:text-rc-main'}`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-rc-bg' : 'text-rc-logo/70'}`} />
                                {item.label}
                            </div>
                            {item.id === 'mitra_requests' && pendingMitraCount > 0 && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full animate-pulse ${activeTab === item.id ? 'bg-rc-bg text-rc-logo' : 'bg-red-500 text-white'}`}>
                                    {pendingMitraCount}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-rc-main/10 bg-rc-card shrink-0">
                    <Link to="/dashboard" className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-rc-muted hover:bg-red-500/10 hover:text-red-500 transition-all duration-300">
                        <Home className="w-4 h-4" />
                        Kembali ke Toko
                    </Link>
                </div>
            </aside>
        </>
    );
}
