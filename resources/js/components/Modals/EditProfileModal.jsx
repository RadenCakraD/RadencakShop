import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function EditProfileModal({ isOpen, onClose, shopData, onSuccess }) {
    if (!isOpen) return null;

    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        nama_toko: '',
        deskripsi_toko: ''
    });

    const [avatarFile, setAvatarFile] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);

    // Pre-fill ketika modal dibuka
    useEffect(() => {
        if (shopData) {
            // Karena di sistem lama nama toko ada embel-embel ' Raden' di myToko.js
            // Di API nama_toko harusnya murni
            setFormData({
                nama_toko: shopData.nama_toko || '',
                deskripsi_toko: shopData.deskripsi_toko || ''
            });
        }
    }, [shopData]);

    const handleInput = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('nama_toko', formData.nama_toko);
        data.append('deskripsi_toko', formData.deskripsi_toko);
        if (avatarFile) data.append('foto_profil', avatarFile);
        if (bannerFile) data.append('banner_toko', bannerFile);

        try {
            // Sesuai dengan rute lama di myToko.js 
            await axios.post('/api/shop/profile', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onSuccess(); // Triggers reload
            onClose();
        } catch (err) {
            const errDetail = err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : '';
            alert("Gagal menyimpan profil: " + (err.response?.data?.message || err.message) + "\n" + errDetail);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in font-sans">
            <div className="bg-gradient-to-tr from-rc-card/50 to-rc-bg backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[0.5px] border-rc-main/10 relative w-full max-w-lg overflow-hidden">
                
                <div className="flex justify-between items-center p-8 border-b border-rc-main/10">
                    <div>
                        <h2 className="text-xl font-light tracking-widest text-rc-main uppercase">TATA PROFIL TOKO</h2>
                        <p className="text-[9px] font-light tracking-widest text-rc-muted mt-1 uppercase">Personalisasikan identitas bisnismu</p>
                    </div>
                    <button onClick={onClose} className="text-rc-muted hover:text-red-500 transition-colors text-2xl leading-none font-light">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    
                    <div className="group relative">
                        <label className="text-[10px] font-light tracking-[0.2em] text-rc-muted uppercase block mb-2 group-focus-within:text-rc-logo transition-colors">Nama Entitas Toko *</label>
                        <div className="relative">
                            <i className="fa-solid fa-shop absolute left-4 top-1/2 -translate-y-1/2 text-rc-muted group-focus-within:text-rc-logo transition-colors"></i>
                            <input 
                                type="text" 
                                name="nama_toko" 
                                value={formData.nama_toko} 
                                onChange={handleInput} 
                                required 
                                className="w-full bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl pl-12 pr-4 py-4 text-sm font-light tracking-wide text-rc-main focus:outline-none focus:border-rc-logo transition-all" 
                            />
                        </div>
                    </div>

                    <div className="group relative">
                        <label className="text-[10px] font-light tracking-[0.2em] text-rc-muted uppercase block mb-2 group-focus-within:text-rc-logo transition-colors">Deskripsi & Visi Toko</label>
                        <div className="relative">
                            <i className="fa-solid fa-feather absolute left-4 top-4 text-rc-muted group-focus-within:text-rc-logo transition-colors"></i>
                            <textarea 
                                name="deskripsi_toko" 
                                value={formData.deskripsi_toko} 
                                onChange={handleInput} 
                                rows="3" 
                                className="w-full bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl pl-12 pr-4 py-4 text-sm font-light tracking-wide text-rc-main focus:outline-none focus:border-rc-logo transition-all"
                                placeholder="Ceritakan keistimewaan tokomu..."
                            ></textarea>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="group relative">
                            <label className="text-[9px] font-light tracking-[0.2em] text-rc-muted uppercase block mb-2 transition-colors">Logo Avatar</label>
                            <div className="flex flex-col gap-2">
                                <label className="w-full bg-rc-bg/50 border-[0.5px] border-rc-main/20 hover:border-rc-logo/30 rounded-2xl px-4 py-3 text-center cursor-pointer transition-all group-hover:bg-rc-logo/5">
                                    <i className="fa-solid fa-camera text-rc-muted group-hover:text-rc-logo block text-xl mb-1"></i>
                                    <span className="text-[9px] font-light tracking-widest text-rc-muted uppercase truncate block">
                                        {avatarFile ? avatarFile.name : 'PILIH FILE'}
                                    </span>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => setAvatarFile(e.target.files[0])} 
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                        <div className="group relative">
                            <label className="text-[9px] font-light tracking-[0.2em] text-rc-muted uppercase block mb-2 transition-colors">Wallpaper Banner</label>
                            <div className="flex flex-col gap-2">
                                <label className="w-full bg-rc-bg/50 border-[0.5px] border-rc-main/20 hover:border-rc-logo/30 rounded-2xl px-4 py-3 text-center cursor-pointer transition-all group-hover:bg-rc-logo/5">
                                    <i className="fa-solid fa-image text-rc-muted group-hover:text-rc-logo block text-xl mb-1"></i>
                                    <span className="text-[9px] font-light tracking-widest text-rc-muted uppercase truncate block">
                                        {bannerFile ? bannerFile.name : 'PILIH FILE'}
                                    </span>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => setBannerFile(e.target.files[0])} 
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-4 border-t border-rc-main/10">
                        <button type="button" onClick={onClose} className="px-8 py-3 rounded-full text-[10px] font-light tracking-widest text-rc-muted uppercase hover:text-rc-main transition-colors">BATAL</button>
                        <button type="submit" disabled={loading} className="px-10 py-3 rounded-full text-[10px] font-light tracking-widest text-rc-bg bg-rc-logo hover:bg-yellow-400 transition-all uppercase shadow-[0_0_15px_rgba(255,215,0,0.2)] flex items-center gap-3">
                            {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-check"></i>}
                            {loading ? 'MENYIMPAN' : 'SIMPAN PERUBAHAN'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
