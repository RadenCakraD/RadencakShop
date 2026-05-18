import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Globe, Plus, Edit2, Trash2, Save, X, Percent, Truck, Wallet, RefreshCw, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminRegions() {
    const [regions, setRegions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRegion, setEditingRegion] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        country: 'Indonesia',
        type: 'Nasional',
        code: 'ID',
        cross_island_fee: 0,
        export_tax_rate: 0,
        import_tax_rate: 0,
        service_fee: 1000,
        shipping_fee_santai: 0,
        shipping_fee_cepat: 0,
        logistics_fee_regular: 0,
        courier_fee_regular: 0,
        logistics_fee_fast: 0,
        courier_fee_fast: 0,
        currency_code: 'IDR',
        currency_symbol: 'Rp',
        islands: [], // [{ id, name, provinces: [{ id, name, regencies: [{ id, name, districts: [{id, name}] }] }] }]
    });

    // States for Multi-Select Options
    const [islInput, setIslInput] = useState('');
    const [provInputs, setProvInputs] = useState({});
    const [regInputs, setRegInputs] = useState({});
    const [distInputs, setDistInputs] = useState({});

    useEffect(() => {
        fetchRegions();
    }, []);

    const fetchRegions = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/regions');
            setRegions(res.data);
        } catch (e) {
            toast.error("Gagal mengambil data wilayah");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (region = null) => {
        if (region) {
            setEditingRegion(region);
            setFormData({ 
                ...region, 
                islands: region.islands || [], 
                regencies: region.regencies || [], 
                districts: region.districts || [] 
            });
        } else {
            setEditingRegion(null);
            setFormData({
                name: '',
                country: 'Indonesia',
                type: 'Nasional',
                code: 'ID',
                cross_island_fee: 0,
                export_tax_rate: 0,
                import_tax_rate: 0,
                service_fee: 1000,
                shipping_fee_santai: 0,
                shipping_fee_cepat: 0,
                logistics_fee_regular: 0,
                courier_fee_regular: 0,
                logistics_fee_fast: 0,
                courier_fee_fast: 0,
                currency_code: 'IDR',
                currency_symbol: 'Rp',
                islands: [],
                regencies: [],
                districts: [],
            });
        }
        setIsModalOpen(true);
    };

    // Hierarchical Add/Remove Helpers
    const handleAddIsland = () => {
        if (!islInput.trim()) return;
        const newIsl = { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), name: islInput.trim(), provinces: [] };
        setFormData(prev => ({ ...prev, islands: [...prev.islands, newIsl] }));
        setIslInput('');
    };

    const handleRemoveIsland = (id) => {
        setFormData(prev => ({ ...prev, islands: prev.islands.filter(i => i.id !== id) }));
    };

    const handleAddProvince = (islId) => {
        const val = provInputs[islId] || '';
        if (!val.trim()) return;
        const newProv = { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), name: val.trim(), regencies: [] };
        setFormData(prev => ({
            ...prev,
            islands: prev.islands.map(i => {
                if (i.id === islId) return { ...i, provinces: [...(i.provinces || []), newProv] };
                return i;
            })
        }));
        setProvInputs(prev => ({ ...prev, [islId]: '' }));
    };

    const handleRemoveProvince = (islId, provId) => {
        setFormData(prev => ({
            ...prev,
            islands: prev.islands.map(i => {
                if (i.id === islId) return { ...i, provinces: i.provinces.filter(p => p.id !== provId) };
                return i;
            })
        }));
    };

    const handleAddRegency = (islId, provId) => {
        const val = regInputs[provId] || '';
        if (!val.trim()) return;
        const newReg = { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), name: val.trim(), districts: [] };
        setFormData(prev => ({
            ...prev,
            islands: prev.islands.map(i => {
                if (i.id === islId) {
                    return { ...i, provinces: i.provinces.map(p => {
                        if (p.id === provId) return { ...p, regencies: [...(p.regencies || []), newReg] };
                        return p;
                    })};
                }
                return i;
            })
        }));
        setRegInputs(prev => ({ ...prev, [provId]: '' }));
    };

    const handleRemoveRegency = (islId, provId, regId) => {
        setFormData(prev => ({
            ...prev,
            islands: prev.islands.map(i => {
                if (i.id === islId) {
                    return { ...i, provinces: i.provinces.map(p => {
                        if (p.id === provId) return { ...p, regencies: p.regencies.filter(r => r.id !== regId) };
                        return p;
                    })};
                }
                return i;
            })
        }));
    };

    const handleAddDistrict = (islId, provId, regId) => {
        const val = distInputs[regId] || '';
        if (!val.trim()) return;
        const newDist = { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), name: val.trim() };
        setFormData(prev => ({
            ...prev,
            islands: prev.islands.map(i => {
                if (i.id === islId) {
                    return { ...i, provinces: i.provinces.map(p => {
                        if (p.id === provId) {
                            return { ...p, regencies: p.regencies.map(r => {
                                if (r.id === regId) return { ...r, districts: [...(r.districts || []), newDist] };
                                return r;
                            })};
                        }
                        return p;
                    })};
                }
                return i;
            })
        }));
        setDistInputs(prev => ({ ...prev, [regId]: '' }));
    };

    const handleRemoveDistrict = (islId, provId, regId, distId) => {
        setFormData(prev => ({
            ...prev,
            islands: prev.islands.map(i => {
                if (i.id === islId) {
                    return { ...i, provinces: i.provinces.map(p => {
                        if (p.id === provId) {
                            return { ...p, regencies: p.regencies.map(r => {
                                if (r.id === regId) return { ...r, districts: r.districts.filter(d => d.id !== distId) };
                                return r;
                            })};
                        }
                        return p;
                    })};
                }
                return i;
            })
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let finalName = formData.name;
            if (!finalName) {
                finalName = formData.country;
                if (finalName.length > 100) finalName = finalName.substring(0, 97) + '...';
            }

            const payload = { ...formData, name: finalName };

            if (editingRegion) {
                await axios.put(`/api/regions/${editingRegion.id}`, payload);
                toast.success("Wilayah berhasil diperbarui");
            } else {
                await axios.post('/api/regions', payload);
                toast.success("Wilayah baru ditambahkan");
            }
            setIsModalOpen(false);
            fetchRegions();
        } catch (e) {
            toast.error("Gagal menyimpan data");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Hapus wilayah ini? Ini akan berdampak pada perhitungan biaya di wilayah tersebut.")) return;
        try {
            await axios.delete(`/api/regions/${id}`);
            toast.success("Wilayah dihapus");
            fetchRegions();
        } catch (e) {
            toast.error("Gagal hapus wilayah");
        }
    };

    // Group regions by country
    const groupedRegions = regions.reduce((acc, region) => {
        const country = region.country || 'Lainnya';
        if (!acc[country]) acc[country] = [];
        acc[country].push(region);
        return acc;
    }, {});

    const handleBulkSync = async (country) => {
        const firstRegion = groupedRegions[country][0];
        if (!firstRegion) return;
        
        if (!confirm(`Terapkan pengaturan (Pajak, Biaya, Ongkir) dari wilayah ${firstRegion.name} ke SELURUH wilayah di ${country}?`)) return;

        try {
            await axios.post('/api/admin/regions/bulk-sync', {
                country: country,
                cross_island_fee: firstRegion.cross_island_fee,
                export_tax_rate: firstRegion.export_tax_rate,
                import_tax_rate: firstRegion.import_tax_rate,
                service_fee: firstRegion.service_fee,
                logistics_fee_regular: firstRegion.logistics_fee_regular,
                courier_fee_regular: firstRegion.courier_fee_regular,
                logistics_fee_fast: firstRegion.logistics_fee_fast,
                courier_fee_fast: firstRegion.courier_fee_fast,
                currency_code: firstRegion.currency_code,
                currency_symbol: firstRegion.currency_symbol,
            });
            toast.success(`Berhasil menyamakan harga untuk seluruh wilayah di ${country}`);
            fetchRegions();
        } catch (e) {
            toast.error("Gagal menyamakan harga");
        }
    };

    if (loading) return <div className="py-20 text-center animate-pulse uppercase text-xs font-black tracking-widest text-rc-muted">Sinkronisasi Wilayah...</div>;

    return (
        <div className="space-y-12 animate-fade-in">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-rc-logo/10 rounded-2xl text-rc-logo">
                        <Globe className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-rc-main uppercase tracking-tighter">Pengaturan Wilayah & Pajak</h3>
                        <p className="text-[10px] text-rc-muted font-bold uppercase tracking-widest">Kelola pajak, biaya layanan, dan ongkir per wilayah.</p>
                    </div>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-rc-logo text-rc-bg px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Tambah Wilayah
                </button>
            </div>

            {Object.keys(groupedRegions).map(country => (
                <div key={country} className="space-y-6">
                    <div className="flex items-center justify-between border-b border-rc-main/10 pb-4">
                        <div className="flex items-center gap-4">
                            <div className="px-4 py-1 bg-rc-main/5 rounded-full border border-rc-main/10 text-[10px] font-black text-rc-logo uppercase tracking-[0.2em]">
                                Negara: {country}
                            </div>
                            <span className="text-[9px] text-rc-muted font-bold uppercase">{groupedRegions[country].length} Wilayah</span>
                        </div>
                        
                        <button 
                            onClick={() => handleBulkSync(country)}
                            className="flex items-center gap-2 px-4 py-2 bg-rc-main/5 border border-rc-main/10 rounded-xl text-[9px] font-black uppercase text-rc-muted hover:text-rc-logo hover:border-rc-logo transition-all"
                        >
                            <RefreshCw className="w-3 h-3" /> Samakan Harga di {country}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groupedRegions[country].map(region => (
                            <div key={region.id} className="bg-rc-card p-6 rounded-[2rem] border border-rc-main/10 relative group overflow-hidden hover:border-rc-logo/30 transition-all shadow-xl">
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button onClick={() => handleOpenModal(region)} className="p-2 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all">
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDelete(region.id)} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-rc-main/5 flex items-center justify-center text-rc-logo font-black text-xl border border-rc-main/10">
                                        {region.code}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-rc-main uppercase tracking-tighter">{region.name && region.name !== region.country && region.name !== `Wilayah ${region.country}` && !region.name.includes(',') ? `${region.name} (${region.country})` : region.country}</h4>
                                        <p className="text-[10px] text-rc-muted font-bold uppercase tracking-widest">{region.type}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-rc-bg rounded-xl border border-rc-main/5">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-rc-muted uppercase tracking-widest">
                                            <Percent className="w-3 h-3" /> Harga Beda Pulau
                                        </div>
                                        <span className="text-sm font-black text-rc-logo">{region.currency_symbol} {region.cross_island_fee?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-rc-bg rounded-xl border border-rc-main/5">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-rc-muted uppercase tracking-widest">
                                            <ArrowUpRight className="w-3 h-3" /> Pajak Ekspor
                                        </div>
                                        <span className="text-sm font-black text-blue-400">{region.export_tax_rate}%</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-rc-bg rounded-xl border border-rc-main/5">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-rc-muted uppercase tracking-widest">
                                            <ArrowDownLeft className="w-3 h-3" /> Pajak Impor
                                        </div>
                                        <span className="text-sm font-black text-purple-400">{region.import_tax_rate}%</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-rc-bg rounded-xl border border-rc-main/5">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-rc-muted uppercase tracking-widest">
                                            <Wallet className="w-3 h-3" /> Biaya Layanan
                                        </div>
                                        <span className="text-sm font-black text-rc-main">{region.currency_symbol} {region.service_fee?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-rc-bg rounded-xl border border-rc-main/5">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-rc-muted uppercase tracking-widest">
                                            <Truck className="w-3 h-3" /> Ongkir Cepat
                                        </div>
                                        <span className="text-sm font-black text-rc-main">{region.currency_symbol} {region.shipping_fee_cepat?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-rc-bg rounded-xl border border-rc-main/5">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-rc-muted uppercase tracking-widest">
                                            <Truck className="w-3 h-3 opacity-50" /> Ongkir Reguler
                                        </div>
                                        <span className="text-sm font-black text-rc-main">{region.currency_symbol} {region.shipping_fee_santai?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {regions.length === 0 && (
                <div className="py-20 bg-rc-card rounded-[2.5rem] border border-rc-main/10 flex flex-col items-center justify-center text-center opacity-50">
                    <Globe className="w-12 h-12 text-rc-muted mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-rc-muted">Belum ada wilayah yang terdaftar.</p>
                </div>
            )}

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-rc-card w-full max-w-6xl rounded-[2.5rem] border border-rc-main/20 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-rc-main/10 flex justify-between items-center bg-rc-bg">
                            <h3 className="text-2xl font-black text-rc-main uppercase tracking-tighter">
                                {editingRegion ? 'Edit Wilayah' : 'Tambah Wilayah Baru'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-rc-main/5 rounded-2xl transition-all">
                                <X className="w-6 h-6 text-rc-muted" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-8 max-h-[85vh] overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-8">
                                {/* Left Column: Basic Info */}
                                <div className="space-y-8">
                                    <div className="space-y-6">
                                        <h5 className="text-xs font-black text-rc-logo uppercase tracking-widest border-b border-rc-logo/20 pb-2">Informasi Dasar</h5>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-rc-muted tracking-widest">Negara</label>
                                        <input required value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-xl text-sm font-bold text-rc-main outline-none focus:border-rc-logo" placeholder="Contoh: Indonesia" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-rc-muted tracking-widest">Kode Wilayah</label>
                                            <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-xl text-sm font-bold text-rc-main outline-none focus:border-rc-logo" placeholder="ID-JKT" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-rc-muted tracking-widest">Tipe</label>
                                            <input required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-xl text-sm font-bold text-rc-main outline-none focus:border-rc-logo" placeholder="Nasional / Regional" />
                                        </div>
                                    </div>

                                    </div>
                                </div>

                                {/* Right Column: Financial & Setup Info */}
                                <div className="space-y-10">
                                    <h5 className="text-xs font-black text-rc-logo uppercase tracking-widest border-b border-rc-logo/20 pb-2">Biaya & Pajak</h5>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-rc-muted tracking-widest">Biaya Beda Pulau</label>
                                            <input type="number" step="0.1" required value={formData.cross_island_fee} onChange={e => setFormData({...formData, cross_island_fee: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-xl text-sm font-bold text-rc-main outline-none focus:border-rc-logo" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-rc-muted tracking-widest">Pajak Ekspor (%)</label>
                                                <input type="number" step="0.1" required value={formData.export_tax_rate} onChange={e => setFormData({...formData, export_tax_rate: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-xl text-sm font-bold text-rc-main outline-none focus:border-rc-logo" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-rc-muted tracking-widest">Pajak Impor (%)</label>
                                                <input type="number" step="0.1" required value={formData.import_tax_rate} onChange={e => setFormData({...formData, import_tax_rate: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-xl text-sm font-bold text-rc-main outline-none focus:border-rc-logo" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-rc-muted tracking-widest">Biaya Layanan</label>
                                            <input type="number" required value={formData.service_fee} onChange={e => setFormData({...formData, service_fee: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-xl text-sm font-bold text-rc-main outline-none focus:border-rc-logo" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-rc-muted tracking-widest">Ongkir Cepat (Total)</label>
                                            <input type="number" readOnly value={Number(formData.logistics_fee_fast || 0) + Number(formData.courier_fee_fast || 0)} className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-xl text-sm font-bold text-rc-main outline-none opacity-70 cursor-not-allowed" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-rc-muted tracking-widest">Ongkir Reguler (Total)</label>
                                            <input type="number" readOnly value={Number(formData.logistics_fee_regular || 0) + Number(formData.courier_fee_regular || 0)} className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-xl text-sm font-bold text-rc-main outline-none opacity-70 cursor-not-allowed" />
                                        </div>
                                    </div>
                                </div>

                                {/* Currency Info */}
                                <div className="space-y-6">
                                    <h5 className="text-xs font-black text-rc-logo uppercase tracking-widest border-b border-rc-logo/20 pb-2">Mata Uang</h5>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-rc-muted tracking-widest">Kode</label>
                                            <input required value={formData.currency_code} onChange={e => setFormData({...formData, currency_code: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-xl text-sm font-bold text-rc-main outline-none focus:border-rc-logo" placeholder="IDR" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-rc-muted tracking-widest">Simbol</label>
                                            <input required value={formData.currency_symbol} onChange={e => setFormData({...formData, currency_symbol: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-xl text-sm font-bold text-rc-main outline-none focus:border-rc-logo" placeholder="Rp" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h5 className="text-xs font-black text-rc-logo uppercase tracking-widest border-b border-rc-logo/20 pb-2">Biaya Mitra (Per Paket)</h5>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-rc-muted tracking-widest">Mitra Logistik (Reguler)</label>
                                            <input type="number" required value={formData.logistics_fee_regular} onChange={e => setFormData({...formData, logistics_fee_regular: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-xl text-sm font-bold text-rc-main outline-none focus:border-rc-logo" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-rc-muted tracking-widest">Mitra Kurir (Reguler)</label>
                                            <input type="number" required value={formData.courier_fee_regular} onChange={e => setFormData({...formData, courier_fee_regular: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-xl text-sm font-bold text-rc-main outline-none focus:border-rc-logo" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-rc-muted tracking-widest">Mitra Logistik (Cepat)</label>
                                            <input type="number" required value={formData.logistics_fee_fast} onChange={e => setFormData({...formData, logistics_fee_fast: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-xl text-sm font-bold text-rc-main outline-none focus:border-rc-logo" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-rc-muted tracking-widest">Mitra Kurir (Cepat)</label>
                                            <input type="number" required value={formData.courier_fee_fast} onChange={e => setFormData({...formData, courier_fee_fast: e.target.value})} className="w-full bg-rc-bg border border-rc-main/10 p-4 rounded-xl text-sm font-bold text-rc-main outline-none focus:border-rc-logo" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Full Width Coverage Selection - Only if Indonesia */}
                            {formData.country.toLowerCase() === 'indonesia' && (
                                <div className="p-8 bg-rc-main/5 border border-rc-logo/30 rounded-3xl space-y-8 mt-6">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-rc-logo/20 pb-4">
                                        <div>
                                            <h5 className="text-sm font-black text-rc-logo uppercase tracking-widest">Input Cakupan Wilayah Manual</h5>
                                            <p className="text-[11px] font-bold text-rc-muted uppercase tracking-wider mt-1">Struktur Wilayah (Pulau &rarr; Provinsi &rarr; Kabupaten &rarr; Kecamatan)</p>
                                        </div>
                                        {/* Add Island Input */}
                                        <div className="flex gap-2 w-full md:w-auto">
                                            <input 
                                                type="text"
                                                value={islInput}
                                                onChange={e => setIslInput(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddIsland(); } }}
                                                placeholder="Ketik nama pulau..."
                                                className="w-full md:w-64 bg-rc-bg border border-rc-main/10 p-3 rounded-xl text-sm font-bold text-rc-main outline-none focus:border-rc-logo"
                                            />
                                            <button type="button" onClick={handleAddIsland} className="bg-rc-logo text-rc-bg px-6 rounded-xl text-[10px] font-black uppercase hover:scale-105 transition-transform shadow-lg">Tambah</button>
                                        </div>
                                    </div>
                                    
                                    {/* Island Grid List */}
                                    <div className="grid grid-cols-1 gap-8">
                                        {formData.islands.map(isl => (
                                            <div key={isl.id} className="bg-rc-bg border-2 border-rc-logo/50 rounded-[2rem] p-8 shadow-xl relative overflow-hidden flex flex-col">
                                                <div className="flex justify-between items-center mb-8 pb-4 border-b border-rc-logo/30">
                                                    <h6 className="font-black text-rc-main text-lg uppercase flex items-center gap-3 tracking-tighter">
                                                        <div className="w-3 h-3 rounded-full bg-rc-logo shadow-[0_0_15px_rgba(var(--rc-logo),0.8)]"></div> PULAU {isl.name}
                                                    </h6>
                                                    <button type="button" onClick={() => handleRemoveIsland(isl.id)} className="text-rc-muted hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-all"><X className="w-6 h-6" /></button>
                                                </div>
                                                
                                                <div className="space-y-6 flex-1">
                                                    {/* Add Province Input */}
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text"
                                                            value={provInputs[isl.id] || ''}
                                                            onChange={e => setProvInputs(prev => ({ ...prev, [isl.id]: e.target.value }))}
                                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddProvince(isl.id); } }}
                                                            placeholder={`Ketik provinsi di ${isl.name}...`}
                                                            className="flex-1 bg-rc-main/5 border border-rc-main/20 p-3.5 rounded-xl text-xs font-bold text-rc-main outline-none focus:border-rc-logo"
                                                        />
                                                        <button type="button" onClick={() => handleAddProvince(isl.id)} className="bg-rc-logo text-rc-bg px-5 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-transform">Tambah Provinsi</button>
                                                    </div>

                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                        {isl.provinces?.map(prov => (
                                                            <div key={prov.id} className="bg-rc-main/5 border border-rc-main/10 rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col">
                                                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-rc-main/20">
                                                                    <h6 className="font-black text-rc-main text-sm uppercase flex items-center gap-3">
                                                                        <div className="w-2.5 h-2.5 rounded-full bg-rc-logo/50"></div> PROV. {prov.name}
                                                                    </h6>
                                                                    <button type="button" onClick={() => handleRemoveProvince(isl.id, prov.id)} className="text-rc-muted hover:text-red-500 transition-all"><X className="w-5 h-5" /></button>
                                                                </div>
                                                                
                                                                <div className="space-y-6 flex-1">
                                                                    {/* Add Regency Input */}
                                                                    <div className="flex gap-2">
                                                                        <input 
                                                                            type="text"
                                                                            value={regInputs[prov.id] || ''}
                                                                            onChange={e => setRegInputs(prev => ({ ...prev, [prov.id]: e.target.value }))}
                                                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddRegency(isl.id, prov.id); } }}
                                                                            placeholder={`Ketik kabupaten/kota di ${prov.name}...`}
                                                                            className="flex-1 bg-rc-bg border border-rc-main/20 p-3 rounded-lg text-[10px] font-bold text-rc-main outline-none focus:border-blue-500"
                                                                        />
                                                                        <button type="button" onClick={() => handleAddRegency(isl.id, prov.id)} className="bg-blue-500 text-white px-4 rounded-lg text-[9px] font-black uppercase shadow-md hover:bg-blue-400">Tambah Kab/Kota</button>
                                                                    </div>

                                                                    {/* Regency List */}
                                                                    <div className="space-y-4">
                                                                        {prov.regencies?.map(reg => (
                                                                            <div key={reg.id} className="bg-rc-bg border-l-4 border-blue-500 border-y border-r border-rc-main/10 rounded-xl p-4 shadow-sm">
                                                                                <div className="flex justify-between items-center mb-4 pb-2 border-b border-rc-main/5">
                                                                                    <h6 className="font-black text-blue-500 text-[11px] uppercase flex items-center gap-2">
                                                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> {reg.name}
                                                                                    </h6>
                                                                                    <button type="button" onClick={() => handleRemoveRegency(isl.id, prov.id, reg.id)} className="text-rc-muted hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                                                                                </div>

                                                                                <div className="pl-2 space-y-3">
                                                                                    {/* Add District Input */}
                                                                                    <div className="flex gap-2">
                                                                                        <input 
                                                                                            type="text"
                                                                                            value={distInputs[reg.id] || ''}
                                                                                            onChange={e => setDistInputs(prev => ({ ...prev, [reg.id]: e.target.value }))}
                                                                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddDistrict(isl.id, prov.id, reg.id); } }}
                                                                                            placeholder={`Kecamatan...`}
                                                                                            className="flex-1 bg-rc-main/5 border border-rc-main/10 p-2 rounded-md text-[10px] font-bold text-rc-main outline-none focus:border-emerald-500"
                                                                                        />
                                                                                        <button type="button" onClick={() => handleAddDistrict(isl.id, prov.id, reg.id)} className="bg-emerald-500 text-white px-3 rounded-md text-[9px] font-black uppercase shadow hover:bg-emerald-400">Tambah Kec</button>
                                                                                    </div>

                                                                                    {/* District List (Badges) */}
                                                                                    {reg.districts && reg.districts.length > 0 && (
                                                                                        <div className="flex flex-wrap gap-2 pt-2">
                                                                                            {reg.districts.map(dist => (
                                                                                                <div key={dist.id} className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-md text-[9px] font-black border border-emerald-500/20 group">
                                                                                                    {dist.name}
                                                                                                    <button type="button" onClick={() => handleRemoveDistrict(isl.id, prov.id, reg.id, dist.id)} className="text-emerald-600/50 group-hover:text-red-500 transition-colors ml-1"><X className="w-3 h-3" /></button>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {formData.islands.length === 0 && (
                                        <div className="py-12 border-2 border-dashed border-rc-main/10 rounded-2xl flex items-center justify-center">
                                            <p className="text-[10px] font-black uppercase text-rc-muted tracking-widest">Belum ada pulau yang ditambahkan.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-rc-main/10">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-rc-muted hover:text-rc-main transition-all"
                                >
                                    Batalkan
                                </button>
                                <button 
                                    type="submit"
                                    className="bg-rc-logo text-rc-bg px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" /> {editingRegion ? 'Simpan Perubahan' : 'Daftarkan Wilayah'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
