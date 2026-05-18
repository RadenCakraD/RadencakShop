import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Save, Percent, ShieldCheck, Truck, Warehouse, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettings() {
    const [config, setConfig] = useState({
        site_name: 'Radencak Shop',
        maintenance_mode: false,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/settings');
            const data = res.data;
            setConfig({
                site_name: data.site_name || 'Radencak Shop',
                maintenance_mode: data.maintenance_mode == '1',
            });
            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...config,
                maintenance_mode: config.maintenance_mode ? '1' : '0'
            };
            await axios.post('/api/admin/settings', payload);
            toast.success("Pengaturan berhasil disimpan!");
            fetchConfig();
        } catch (e) {
            toast.error("Gagal menyimpan pengaturan");
        }
    };

    if (loading) return <div className="py-20 text-center animate-pulse uppercase text-xs font-black tracking-widest text-rc-muted">Sinkronisasi Konfigurasi...</div>;

    return (
        <div className="space-y-10 animate-fade-in">
            <form onSubmit={handleSave} className="space-y-10">
                
                {/* Removed Financial & Tax Section */}

                {/* Section: Platform Identity */}
                <div className="bg-rc-card p-8 md:p-12 rounded-[2.5rem] border border-rc-main/10 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-10 border-b border-rc-main/5 pb-6">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                            <Globe className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-rc-main uppercase tracking-tighter">Identitas & Status</h3>
                            <p className="text-[10px] text-rc-muted font-bold uppercase tracking-widest">Informasi publik dan status operasional sistem.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-rc-muted tracking-[0.2em] block">Nama Platform</label>
                            <input value={config.site_name} onChange={e => setConfig({...config, site_name: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-5 rounded-2xl text-sm font-black text-rc-main outline-none focus:border-rc-logo transition-all" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-rc-muted tracking-[0.2em] block">Maintenance Mode</label>
                            <div className="flex items-center gap-4 p-4 bg-rc-bg rounded-2xl border border-rc-main/10">
                                <button type="button" onClick={() => setConfig({...config, maintenance_mode: !config.maintenance_mode})} className={`w-14 h-7 rounded-full relative transition-all duration-300 ${config.maintenance_mode ? 'bg-red-500' : 'bg-rc-main/20'}`}>
                                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300 ${config.maintenance_mode ? 'right-1' : 'left-1'}`}></div>
                                </button>
                                <span className={`text-[10px] font-black uppercase ${config.maintenance_mode ? 'text-red-500' : 'text-rc-muted'}`}>
                                    {config.maintenance_mode ? 'Sistem Non-Aktif' : 'Sistem Aktif (Normal)'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6">
                    <button type="submit" className="bg-rc-logo text-rc-bg px-12 py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,204,0,0.3)] hover:scale-105 transition-all flex items-center gap-3">
                        <Save className="w-5 h-5" /> Simpan Konfigurasi Global
                    </button>
                </div>

            </form>
        </div>
    );
}
