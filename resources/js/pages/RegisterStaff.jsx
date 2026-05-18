import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterStaff() {
    const navigate = useNavigate();
    const [regMode, setRegMode] = useState('staff'); // default to 'staff' as per user's prompt focus
    const [formData, setFormData] = useState({ 
        name: '', 
        username: '',
        email: '', 
        password: '', 
        password_confirmation: '', 
        role: '', // will be set dynamically based on selection
        region_id: '',
        no_hp: '',
        mitra_name: '',
        parent_id: '',
        coverage_province: '',
        coverage_regency: '',
        coverage_district: ''
    });
    
    const [regions, setRegions] = useState([]);
    const [availableMitra, setAvailableMitra] = useState([]);
    const [selectedMitraType, setSelectedMitraType] = useState('mitra_kurir'); // default type for staff
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get('/api/regions-public').then(res => setRegions(res.data)).catch(e => console.error(e));
        axios.get('/api/mitra/list').then(res => setAvailableMitra(res.data)).catch(e => console.error(e));
    }, []);

    // Set default roles dynamically when mode or selected type changes
    useEffect(() => {
        if (regMode === 'mitra') {
            setFormData(prev => ({ 
                ...prev, 
                role: 'admin_kurir', // default mitra role
                parent_id: '',
                coverage_province: '',
                coverage_regency: '',
                coverage_district: ''
            }));
        } else {
            setFormData(prev => ({ 
                ...prev, 
                role: selectedMitraType === 'mitra_kurir' ? 'kurir_staff' : 'logistik_internal',
                region_id: '',
                coverage_province: '',
                coverage_regency: '',
                coverage_district: ''
            }));
        }
    }, [regMode, selectedMitraType]);

    // Update region and coverage fields when a parent Mitra is selected in staff mode
    useEffect(() => {
        if (regMode === 'staff' && formData.parent_id) {
            const parent = availableMitra.find(m => m.id == formData.parent_id);
            if (parent) {
                setFormData(prev => ({
                    ...prev,
                    region_id: parent.region_id,
                    coverage_province: parent.coverage_province || '',
                    coverage_regency: parent.coverage_regency || '',
                    coverage_district: parent.coverage_district || ''
                }));
            }
        }
    }, [formData.parent_id, regMode, availableMitra]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const isMitra = regMode === 'mitra';
            const endpoint = isMitra ? '/api/register-mitra' : '/api/register-staff';
            
            const payload = { ...formData };
            if (!isMitra) {
                // Remove coverage and mitra name for staff registration since they copy parent
                delete payload.mitra_name;
            }
            
            await axios.post(endpoint, payload);
            alert("Pendaftaran berhasil! Akun Anda sedang ditinjau. Silakan login setelah disetujui.");
            navigate('/login');
        } catch (e) {
            setError(e.response?.data?.message || "Pendaftaran gagal. Silakan periksa kembali data Anda.");
        } finally {
            setLoading(false);
        }
    };

    // Calculate regions helper for Mitra Mode
    const activeReg = regions.find(r => r.id == formData.region_id);
    const allProvinces = activeReg?.islands?.flatMap(i => i.provinces || []) || [];
    const provObj = allProvinces.find(p => p.name === formData.coverage_province);
    const regObj = provObj?.regencies?.find(r => r.name === formData.coverage_regency);

    // Selected Mitra data helper for Staff Mode
    const selectedMitraObj = availableMitra.find(m => m.id == formData.parent_id);

    return (
        <div className="min-h-screen flex items-center justify-center bg-rc-bg py-12 px-4 sm:px-6 lg:px-8 text-rc-main font-sans overflow-x-hidden relative">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rc-logo/5 rounded-full blur-[150px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rc-logo/5 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="max-w-4xl w-full z-10 bg-gradient-to-tr from-rc-card/40 to-rc-bg/80 backdrop-blur-2xl p-8 sm:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[0.5px] border-rc-main/10 relative my-10 animate-fade-in">
                
                {/* Header Section */}
                <div className="text-center mb-8">
                    <Link to="/login" className="inline-block hover:scale-105 transition-transform duration-300">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rc-logo/20 to-transparent border-[0.5px] border-rc-logo/50 flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                            <i className="fa-solid fa-id-badge text-3xl text-rc-logo"></i>
                        </div>
                    </Link>
                    <h2 className="text-3xl font-light tracking-wide text-rc-main uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                        RadenCak <span className="font-bold text-rc-logo">Kemitraan</span>
                    </h2>
                    <p className="mt-2 text-[10px] text-rc-muted/80 font-light tracking-[0.3em] uppercase">
                        Gabung sebagai mitra atasan atau lamar pekerjaan staff
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex justify-center p-1 bg-rc-bg/80 rounded-2xl border-[0.5px] border-rc-main/10 max-w-md mx-auto mb-10">
                    <button 
                        type="button"
                        onClick={() => { setRegMode('staff'); setError(null); }}
                        className={`flex-1 py-3 text-[10px] font-bold tracking-widest uppercase rounded-xl transition-all ${regMode === 'staff' ? 'bg-rc-logo text-rc-bg shadow-md' : 'text-rc-muted hover:text-rc-main'}`}
                    >
                        <i className="fa-solid fa-user-tie mr-2"></i> Lamar Sebagai Staff
                    </button>
                    <button 
                        type="button"
                        onClick={() => { setRegMode('mitra'); setError(null); }}
                        className={`flex-1 py-3 text-[10px] font-bold tracking-widest uppercase rounded-xl transition-all ${regMode === 'mitra' ? 'bg-rc-logo text-rc-bg shadow-md' : 'text-rc-muted hover:text-rc-main'}`}
                    >
                        <i className="fa-solid fa-handshake mr-2"></i> Daftar Sebagai Mitra
                    </button>
                </div>

                <form className="space-y-8" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-500/10 backdrop-blur-md border-[0.5px] border-red-500/50 p-4 rounded-2xl shadow-inner animate-shake">
                            <p className="text-xs text-red-400 font-light tracking-widest uppercase flex items-center gap-3">
                                <i className="fa-solid fa-triangle-exclamation"></i> {error}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* Kolom Kiri: Informasi Identitas Pribadi */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-bold text-rc-logo uppercase tracking-widest border-b border-rc-main/10 pb-2">
                                <i className="fa-solid fa-user-circle mr-2"></i> 1. Identitas Akun
                            </h3>
                            
                            <div className="group relative">
                                <label className="block text-[10px] uppercase font-light tracking-[0.2em] mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Nama Lengkap *</label>
                                <div className="relative">
                                    <i className="fa-solid fa-user text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                    <input 
                                        name="name" 
                                        type="text" 
                                        required 
                                        value={formData.name} 
                                        onChange={handleChange}
                                        className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl placeholder-rc-muted/30 text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-all font-light tracking-wide text-sm shadow-inner" 
                                        placeholder="Nama Lengkap Anda" 
                                    />
                                </div>
                            </div>

                            <div className="group relative">
                                <label className="block text-[10px] uppercase font-light tracking-[0.2em] mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Username Identitas *</label>
                                <div className="relative">
                                    <i className="fa-solid fa-at text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                    <input 
                                        name="username" 
                                        type="text" 
                                        required 
                                        value={formData.username} 
                                        onChange={handleChange}
                                        className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl placeholder-rc-muted/30 text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-all font-light tracking-wide text-sm shadow-inner" 
                                        placeholder="username_baru" 
                                    />
                                </div>
                            </div>

                            <div className="group relative">
                                <label className="block text-[10px] uppercase font-light tracking-[0.2em] mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Alamat Email *</label>
                                <div className="relative">
                                    <i className="fa-solid fa-envelope text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                    <input 
                                        name="email" 
                                        type="email" 
                                        required 
                                        value={formData.email} 
                                        onChange={handleChange}
                                        className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl placeholder-rc-muted/30 text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-all font-light tracking-wide text-sm shadow-inner" 
                                        placeholder="email@radencak.com" 
                                    />
                                </div>
                            </div>

                            <div className="group relative">
                                <label className="block text-[10px] uppercase font-light tracking-[0.2em] mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Nomor WhatsApp Aktif *</label>
                                <div className="relative">
                                    <i className="fa-solid fa-phone text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                    <input 
                                        name="no_hp" 
                                        type="tel" 
                                        required 
                                        value={formData.no_hp} 
                                        onChange={handleChange}
                                        className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl placeholder-rc-muted/30 text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-all font-light tracking-wide text-sm shadow-inner" 
                                        placeholder="08xxxxxxxx" 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="group relative">
                                    <label className="block text-[10px] uppercase font-light tracking-[0.2em] mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Kata Sandi *</label>
                                    <input 
                                        name="password" 
                                        type="password" 
                                        required 
                                        value={formData.password} 
                                        onChange={handleChange}
                                        className="appearance-none block w-full px-4 py-4 bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl placeholder-rc-muted/30 text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-all font-light tracking-wide text-sm shadow-inner" 
                                    />
                                </div>
                                <div className="group relative">
                                    <label className="block text-[10px] uppercase font-light tracking-[0.2em] mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Konfirmasi Sandi *</label>
                                    <input 
                                        name="password_confirmation" 
                                        type="password" 
                                        required 
                                        value={formData.password_confirmation} 
                                        onChange={handleChange}
                                        className="appearance-none block w-full px-4 py-4 bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl placeholder-rc-muted/30 text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-all font-light tracking-wide text-sm shadow-inner" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Kolom Kanan: Detail Lamaran Pekerjaan ATAU Pendaftaran Mitra Baru */}
                        <div className="space-y-6">
                            
                            {/* FLOW A: LAMAR SEBAGAI STAFF */}
                            {regMode === 'staff' && (
                                <>
                                    <h3 className="text-xs font-bold text-rc-logo uppercase tracking-widest border-b border-rc-main/10 pb-2">
                                        <i className="fa-solid fa-file-invoice mr-2"></i> 2. Form Lamaran Karyawan
                                    </h3>

                                    {/* Urutan 1: Pilih Tipe Mitra */}
                                    <div className="group relative">
                                        <label className="block text-[10px] uppercase font-light tracking-[0.2em] mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Jenis Kemitraan *</label>
                                        <div className="relative">
                                            <i className="fa-solid fa-tags text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                            <select 
                                                value={selectedMitraType}
                                                onChange={e => {
                                                    setSelectedMitraType(e.target.value);
                                                    setFormData(prev => ({ ...prev, parent_id: '', role: '' }));
                                                }}
                                                className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-all font-light tracking-wide text-sm shadow-inner"
                                            >
                                                <option value="mitra_logistik" className="bg-zinc-900 text-white">Mitra Logistik</option>
                                                <option value="mitra_kurir" className="bg-zinc-900 text-white">Mitra Kurir</option>
                                                <option value="mitra_toko" disabled className="bg-zinc-900 text-rc-muted">Mitra Toko (Masih Pengerjaan)</option>
                                                <option value="mitra_restoran" disabled className="bg-zinc-900 text-rc-muted">Mitra Restoran (Masih Pengerjaan)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Urutan 2: Pilih Mitra Atasan */}
                                    <div className="group relative">
                                        <label className="block text-[10px] uppercase font-light tracking-[0.2em] mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Pilih Mitra Tujuan *</label>
                                        <div className="relative">
                                            <i className="fa-solid fa-users text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                            <select 
                                                name="parent_id"
                                                required 
                                                value={formData.parent_id} 
                                                onChange={handleChange}
                                                className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-all font-light tracking-wide text-sm shadow-inner"
                                            >
                                                <option value="" className="bg-zinc-900 text-white">-- Pilih Mitra --</option>
                                                {availableMitra
                                                    .filter(m => {
                                                        if (selectedMitraType === 'mitra_logistik') return m.role === 'admin_logistik';
                                                        if (selectedMitraType === 'mitra_kurir') return m.role === 'admin_kurir';
                                                        return false;
                                                    })
                                                    .map(m => (
                                                        <option key={m.id} value={m.id} className="bg-zinc-900 text-white">
                                                            {m.mitra_name || m.name} ({m.region?.country || 'Indonesia'})
                                                        </option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div>

                                    {/* Urutan 3: Wilayah (Menampilkan info sesuai cakupan Mitra terpilih) */}
                                    {formData.parent_id && selectedMitraObj && (
                                        <div className="bg-rc-logo/5 border-[0.5px] border-rc-logo/30 p-5 rounded-2xl space-y-3 animate-fade-in">
                                            <h4 className="text-[10px] font-bold text-rc-logo uppercase tracking-widest flex items-center gap-2">
                                                <i className="fa-solid fa-map-location-dot"></i> Wilayah Operasional Mitra
                                            </h4>
                                            
                                            {selectedMitraType === 'mitra_logistik' ? (
                                                <div className="text-xs font-light space-y-1 text-rc-main/90">
                                                    <p className="tracking-wide"><span className="font-bold text-rc-logo uppercase text-[9px] block">Provinsi Operasional</span> {selectedMitraObj.coverage_province || 'Belum diatur'}</p>
                                                </div>
                                            ) : (
                                                <div className="text-xs font-light space-y-2 text-rc-main/90">
                                                    <div>
                                                        <span className="font-bold text-rc-logo uppercase text-[9px] block">Provinsi Operasional</span> 
                                                        <span>{selectedMitraObj.coverage_province || 'Belum diatur'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-rc-logo uppercase text-[9px] block">Kabupaten/Kota Operasional</span> 
                                                        <span>{selectedMitraObj.coverage_regency || 'Belum diatur'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-rc-logo uppercase text-[9px] block">Kecamatan Operasional</span> 
                                                        <span>{selectedMitraObj.coverage_district || 'Belum diatur'}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Urutan 4: Posisi / Peran sesuai dengan Jenis Mitra */}
                                    {formData.parent_id && (
                                        <div className="group relative animate-fade-in">
                                            <label className="block text-[10px] uppercase font-light tracking-[0.2em] mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Pilih Posisi Kerja *</label>
                                            <div className="relative">
                                                <i className="fa-solid fa-address-card text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                                <select 
                                                    name="role"
                                                    required 
                                                    value={formData.role} 
                                                    onChange={handleChange}
                                                    className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-all font-light tracking-wide text-sm shadow-inner"
                                                >
                                                    {selectedMitraType === 'mitra_logistik' ? (
                                                        <>
                                                            <option value="logistik_internal" className="bg-zinc-900 text-white">Logistik Distribusi Internal</option>
                                                            <option value="logistik_external" className="bg-zinc-900 text-white">Logistik Distribusi Eksternal</option>
                                                            <option value="sortir_logistik" className="bg-zinc-900 text-white">Staf Sortir Logistik</option>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <option value="kurir_staff" className="bg-zinc-900 text-white">Kurir Paket (Ambil dan Antar)</option>
                                                            <option value="sortir_kurir" className="bg-zinc-900 text-white">Staf Sortir Kurir</option>
                                                        </>
                                                    )}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* FLOW B: DAFTAR SEBAGAI MITRA BARU */}
                            {regMode === 'mitra' && (
                                <>
                                    <h3 className="text-xs font-bold text-rc-logo uppercase tracking-widest border-b border-rc-main/10 pb-2">
                                        <i className="fa-solid fa-handshake mr-2"></i> 2. Form Pendaftaran Kemitraan
                                    </h3>

                                    <div className="group relative">
                                        <label className="block text-[10px] uppercase font-light tracking-[0.2em] mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Negara Operasional *</label>
                                        <div className="relative">
                                            <i className="fa-solid fa-earth-asia text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                            <select 
                                                name="region_id" 
                                                required 
                                                value={formData.region_id} 
                                                onChange={e => setFormData({
                                                    ...formData,
                                                    region_id: e.target.value,
                                                    coverage_province: '',
                                                    coverage_regency: '',
                                                    coverage_district: ''
                                                })}
                                                className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-all font-light tracking-wide text-sm shadow-inner"
                                            >
                                                <option value="" className="bg-zinc-900 text-white">-- Pilih Negara --</option>
                                                {regions.map(r => <option key={r.id} value={r.id} className="bg-zinc-900 text-white">{r.country}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="group relative">
                                        <label className="block text-[10px] uppercase font-light tracking-[0.2em] mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Tipe Perusahaan Kemitraan *</label>
                                        <div className="relative">
                                            <i className="fa-solid fa-briefcase text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                            <select 
                                                name="role" 
                                                required 
                                                value={formData.role} 
                                                onChange={e => setFormData({
                                                    ...formData,
                                                    role: e.target.value,
                                                    coverage_province: '',
                                                    coverage_regency: '',
                                                    coverage_district: '',
                                                    mitra_name: ''
                                                })}
                                                className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-all font-light tracking-wide text-sm shadow-inner"
                                            >
                                                <option value="admin_kurir" className="bg-zinc-900 text-white">Mitra Kurir / Ekspedisi (Atasan)</option>
                                                <option value="admin_logistik" className="bg-zinc-900 text-white">Mitra Logistik Pusat (Atasan)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="group relative">
                                        <label className="block text-[10px] uppercase font-light tracking-[0.2em] mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Nama Perusahaan / Mitra *</label>
                                        <div className="relative">
                                            <i className="fa-solid fa-building text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                            <input 
                                                name="mitra_name" 
                                                type="text" 
                                                required 
                                                value={formData.mitra_name} 
                                                onChange={handleChange}
                                                placeholder="Cth: Radencak Express Cabang Utama" 
                                                className="appearance-none block w-full pl-12 pr-4 py-4 bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl placeholder-rc-muted/30 text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-all font-light tracking-wide text-sm shadow-inner" 
                                            />
                                        </div>
                                    </div>

                                    {/* Cakupan Wilayah Baru (Mitra Baru) */}
                                    {formData.region_id && allProvinces.length > 0 && (
                                        <div className="bg-rc-logo/5 border-[0.5px] border-rc-logo/30 p-5 rounded-2xl space-y-4 animate-fade-in">
                                            <h4 className="text-[10px] font-bold text-rc-logo uppercase tracking-widest">Atur Wilayah Tugas Perusahaan</h4>
                                            
                                            <div>
                                                <label className="text-[9px] font-bold text-rc-logo uppercase tracking-widest mb-1.5 block">Provinsi Operasional *</label>
                                                <select 
                                                    name="coverage_province"
                                                    required 
                                                    value={formData.coverage_province} 
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        coverage_province: e.target.value,
                                                        coverage_regency: '',
                                                        coverage_district: ''
                                                    })}
                                                    className="w-full bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main text-xs font-bold p-3 rounded-lg outline-none focus:border-rc-logo"
                                                >
                                                    <option value="">Pilih Provinsi</option>
                                                    {allProvinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                                </select>
                                            </div>

                                            {/* Mitra Kurir: Butuh Kabupaten & Kecamatan */}
                                            {formData.role === 'admin_kurir' && formData.coverage_province && (
                                                <>
                                                    <div>
                                                        <label className="text-[9px] font-bold text-rc-logo uppercase tracking-widest mb-1.5 block">Kabupaten/Kota Operasional *</label>
                                                        <select 
                                                            name="coverage_regency"
                                                            required 
                                                            value={formData.coverage_regency} 
                                                            onChange={e => setFormData({
                                                                ...formData,
                                                                coverage_regency: e.target.value,
                                                                coverage_district: ''
                                                            })}
                                                            className="w-full bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main text-xs font-bold p-3 rounded-lg outline-none focus:border-rc-logo"
                                                        >
                                                            <option value="">Pilih Kabupaten/Kota</option>
                                                            {provObj?.regencies?.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                                        </select>
                                                    </div>

                                                    {formData.coverage_regency && (
                                                        <div>
                                                            <label className="text-[9px] font-bold text-rc-logo uppercase tracking-widest mb-1.5 block">Kecamatan Operasional *</label>
                                                            <select 
                                                                name="coverage_district"
                                                                required 
                                                                value={formData.coverage_district} 
                                                                onChange={handleChange}
                                                                className="w-full bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main text-xs font-bold p-3 rounded-lg outline-none focus:border-rc-logo"
                                                            >
                                                                <option value="">Pilih Kecamatan</option>
                                                                {regObj?.districts?.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                                            </select>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="pt-6">
                        <button 
                            type="submit" 
                            disabled={loading || !formData.name || !formData.username || !formData.email || !formData.no_hp || (regMode === 'staff' ? !formData.parent_id : !formData.region_id)}
                            className="group relative w-full flex justify-center py-5 px-4 text-[10px] font-light tracking-[0.2em] uppercase rounded-full text-rc-bg bg-rc-logo hover:bg-yellow-400 focus:outline-none shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed items-center gap-3 overflow-hidden"
                        >
                            {loading ? (
                                <i className="fa-solid fa-circle-notch fa-spin text-lg"></i>
                            ) : (
                                <>
                                    <span className="relative z-10 flex items-center gap-3">
                                        {regMode === 'staff' ? 'Lamar Pekerjaan Staff' : 'Daftar Kemitraan Baru'} 
                                        <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center border-t border-rc-main/10 pt-6">
                    <Link to="/login" className="text-[10px] uppercase tracking-widest font-bold text-rc-muted hover:text-rc-logo transition">
                        Sudah memiliki akun? Masuk Sekarang &rarr;
                    </Link>
                </div>
            </div>
        </div>
    );
}
