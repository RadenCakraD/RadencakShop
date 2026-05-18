import React, { useState } from 'react';
import axios from 'axios';
import { X, UserPlus, Shield, Truck, Warehouse, Lock, Mail, User, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddStaffModal({ isOpen, onClose, onSuccess, defaultRole }) {
    const [loading, setLoading] = useState(false);
    const [regions, setRegions] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        no_hp: '',
        password: '',
        role: defaultRole || 'admin_staff',
        region_id: ''
    });

    React.useEffect(() => {
        if (isOpen) {
            axios.get('/api/regions-public').then(res => setRegions(res.data));
            if (defaultRole) setFormData(prev => ({ ...prev, role: defaultRole }));
        }
    }, [isOpen, defaultRole]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/admin/staff/create', formData);
            toast.success(`${formData.role.replace('_', ' ').toUpperCase()} berhasil direkrut!`);
            onSuccess();
            onClose();
            setFormData({ name: '', email: '', no_hp: '', password: '', role: defaultRole || 'admin_staff', region_id: '' });
        } catch (e) {
            toast.error(e.response?.data?.message || "Gagal mendaftarkan staff");
        } finally {
            setLoading(false);
        }
    };

    const roleInfo = {
        admin_staff: { label: 'Admin Staff', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        sortir_logistik: { label: 'Sortir Logistik', icon: Warehouse, color: 'text-orange-600', bg: 'bg-orange-600/10' },
        logistik_internal: { label: 'Logistik Internal', icon: Truck, color: 'text-orange-400', bg: 'bg-orange-400/10' },
        logistik_external: { label: 'Logistik External', icon: Truck, color: 'text-orange-700', bg: 'bg-orange-700/10' },
        kurir_staff: { label: 'Staff Kurir', icon: Truck, color: 'text-teal-500', bg: 'bg-teal-500/10' },
        kurir: { label: 'Kurir Lapangan', icon: Truck, color: 'text-teal-600', bg: 'bg-teal-600/10' },
        sortir_kurir: { label: 'Sortir Kurir', icon: Warehouse, color: 'text-teal-400', bg: 'bg-teal-400/10' },
    };

    const currentRole = roleInfo[formData.role] || roleInfo.admin_staff;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-rc-bg/80 backdrop-blur-xl animate-fade-in">
            <div className="bg-rc-card w-full max-w-5xl rounded-[3rem] border border-rc-logo/30 shadow-[0_0_100px_rgba(255,204,0,0.15)] relative overflow-hidden flex flex-col md:flex-row">
                
                {/* Left Side: Info (Visible on Desktop) */}
                <div className="hidden md:flex md:w-1/3 bg-rc-bg/50 border-r border-rc-main/10 p-12 flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <currentRole.icon className="w-64 h-64 -ml-20 -mt-10" />
                    </div>
                    <div className="relative z-10">
                        <div className={`w-16 h-16 ${currentRole.bg} rounded-2xl flex items-center justify-center ${currentRole.color} mb-8 border border-current/20`}>
                            <currentRole.icon className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-black text-rc-main uppercase tracking-tighter leading-none mb-4">
                            Rekrutmen<br />{currentRole.label}
                        </h2>
                        <p className="text-xs text-rc-muted font-bold uppercase tracking-widest leading-relaxed">
                            Pastikan data personel yang didaftarkan sudah benar sesuai dengan dokumen resmi untuk menjaga integritas operasional.
                        </p>
                    </div>
                    <div className="relative z-10 flex items-center gap-3 text-[10px] font-black uppercase text-rc-logo tracking-widest">
                        <div className="w-2 h-2 rounded-full bg-rc-logo animate-ping"></div>
                        Otoritas Super Admin
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="flex-1 p-8 md:p-16">
                    <div className="flex justify-between items-center mb-10 md:hidden">
                        <h3 className="text-xl font-black text-rc-main uppercase tracking-tighter">Rekrut {currentRole.label}</h3>
                        <button onClick={onClose} className="p-2 text-rc-muted hover:text-rc-main transition-colors"><X className="w-6 h-6" /></button>
                    </div>
                    <button onClick={onClose} className="hidden md:block absolute top-10 right-10 p-2 text-rc-muted hover:text-rc-main transition-colors"><X className="w-8 h-8" /></button>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-rc-muted px-2 tracking-widest">Nama Lengkap Personel</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rc-muted group-focus-within:text-rc-logo transition-colors" />
                                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-12 pr-4 py-5 bg-rc-bg border border-rc-main/10 rounded-2xl text-xs font-bold text-rc-main outline-none focus:border-rc-logo focus:ring-4 focus:ring-rc-logo/10 transition-all" placeholder="Masukkan nama lengkap..." />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-rc-muted px-2 tracking-widest">Alamat Email Resmi</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rc-muted group-focus-within:text-rc-logo transition-colors" />
                                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-12 pr-4 py-5 bg-rc-bg border border-rc-main/10 rounded-2xl text-xs font-bold text-rc-main outline-none focus:border-rc-logo focus:ring-4 focus:ring-rc-logo/10 transition-all" placeholder="email@radencak.com" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-rc-muted px-2 tracking-widest">Nomor WhatsApp Aktif</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rc-muted group-focus-within:text-rc-logo transition-colors" />
                                    <input type="text" required value={formData.no_hp} onChange={e => setFormData({...formData, no_hp: e.target.value})} className="w-full pl-12 pr-4 py-5 bg-rc-bg border border-rc-main/10 rounded-2xl text-xs font-bold text-rc-main outline-none focus:border-rc-logo focus:ring-4 focus:ring-rc-logo/10 transition-all" placeholder="0812xxxxxxx" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-rc-muted px-2 tracking-widest">Kata Sandi Akses</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rc-muted group-focus-within:text-rc-logo transition-colors" />
                                    <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full pl-12 pr-4 py-5 bg-rc-bg border border-rc-main/10 rounded-2xl text-xs font-bold text-rc-main outline-none focus:border-rc-logo focus:ring-4 focus:ring-rc-logo/10 transition-all" placeholder="••••••••" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-rc-muted px-2 tracking-widest">Wilayah Penugasan / Penempatan</label>
                            <div className="relative group">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rc-muted group-focus-within:text-rc-logo transition-colors z-10" />
                                <select required value={formData.region_id} onChange={e => setFormData({...formData, region_id: e.target.value})} className="w-full pl-12 pr-4 py-5 bg-rc-bg border border-rc-main/10 rounded-2xl text-xs font-bold text-rc-main outline-none focus:border-rc-logo focus:ring-4 focus:ring-rc-logo/10 transition-all appearance-none cursor-pointer">
                                    <option value="">Pilih Wilayah Kerja...</option>
                                    {regions.map(r => <option key={r.id} value={r.id}>{r.name} ({r.country})</option>)}
                                </select>
                            </div>
                        </div>

                        {!defaultRole && (
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-rc-muted px-2 tracking-widest text-center block">Tentukan Peran / Departemen</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {Object.entries(roleInfo).map(([id, info]) => (
                                        <button 
                                            key={id} 
                                            type="button" 
                                            onClick={() => setFormData({...formData, role: id})}
                                            className={`p-6 border rounded-[2rem] flex flex-col items-center gap-3 transition-all ${formData.role === id ? 'bg-rc-logo/10 border-rc-logo text-rc-logo shadow-[0_0_30px_rgba(255,204,0,0.2)]' : 'bg-rc-bg border-rc-main/10 text-rc-muted hover:border-rc-main/20'}`}
                                        >
                                            <info.icon className="w-6 h-6" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">{info.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-4">
                            <button disabled={loading} type="submit" className="w-full bg-rc-logo text-rc-bg py-6 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(255,204,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                                {loading ? 'MENDAFTARKAN PERSONEL...' : 'KONFIRMASI PENDAFTARAN'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
