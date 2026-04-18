import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function EditUserSettingsModal({ isOpen, onClose, userData, onSuccess }) {
    if (!isOpen) return null;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        no_hp: '',
        alamat: ''
    });
    const [avatarFile, setAvatarFile] = useState(null);

    useEffect(() => {
        if (userData) {
            setFormData({
                name: userData.name || '',
                no_hp: userData.no_hp || '',
                alamat: userData.alamat || ''
            });
        }
    }, [userData]);

    const handleInput = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('name', formData.name);
        data.append('no_hp', formData.no_hp);
        data.append('alamat', formData.alamat);
        if (avatarFile) data.append('avatar', avatarFile);

        try {
            const token = localStorage.getItem('auth_token');
            await axios.post('/api/user/profile', data, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            onSuccess(); 
            onClose();
        } catch (err) {
            alert("Gagal memperbarui profil: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in font-sans">
            <div className="bg-gradient-to-tr from-rc-card/50 to-rc-bg backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[0.5px] border-rc-main/10 relative w-full max-w-lg overflow-hidden">
                
                <div className="flex justify-between items-center p-8 border-b border-rc-main/10">
                    <div>
                        <h2 className="text-xl font-light tracking-widest text-rc-main uppercase">PENGATURAN AKUN</h2>
                        <p className="text-[9px] font-light tracking-widest text-rc-muted mt-1 uppercase">Perbarui data personal Anda</p>
                    </div>
                    <button onClick={onClose} className="text-rc-muted hover:text-red-500 transition-colors text-2xl leading-none font-light">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    
                    <div className="group relative">
                        <label className="text-[10px] font-light tracking-[0.2em] text-rc-muted uppercase block mb-2 group-focus-within:text-rc-logo transition-colors">Nama Lengkap</label>
                        <div className="relative">
                            <i className="fa-solid fa-user-vneck absolute left-4 top-1/2 -translate-y-1/2 text-rc-muted group-focus-within:text-rc-logo transition-colors"></i>
                            <input 
                                type="text" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleInput} 
                                required 
                                className="w-full bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl pl-12 pr-4 py-4 text-sm font-light tracking-wide text-rc-main focus:outline-none focus:border-rc-logo transition-all" 
                            />
                        </div>
                    </div>

                    <div className="group relative">
                        <label className="text-[10px] font-light tracking-[0.2em] text-rc-muted uppercase block mb-2 group-focus-within:text-rc-logo transition-colors">Nomor HP</label>
                        <div className="relative">
                            <i className="fa-solid fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-rc-muted group-focus-within:text-rc-logo transition-colors"></i>
                            <input 
                                type="text" 
                                name="no_hp" 
                                value={formData.no_hp} 
                                onChange={handleInput} 
                                className="w-full bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl pl-12 pr-4 py-4 text-sm font-light tracking-wide text-rc-main focus:outline-none focus:border-rc-logo transition-all" 
                            />
                        </div>
                    </div>

                    <div className="group relative">
                        <label className="text-[10px] font-light tracking-[0.2em] text-rc-muted uppercase block mb-2 group-focus-within:text-rc-logo transition-colors">Alamat Pengiriman</label>
                        <div className="relative">
                            <i className="fa-solid fa-map-location-dot absolute left-4 top-4 text-rc-muted group-focus-within:text-rc-logo transition-colors"></i>
                            <textarea 
                                name="alamat" 
                                value={formData.alamat} 
                                onChange={handleInput} 
                                rows="2" 
                                className="w-full bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-2xl pl-12 pr-4 py-4 text-sm font-light tracking-wide text-rc-main focus:outline-none focus:border-rc-logo transition-all"
                            ></textarea>
                        </div>
                    </div>

                    <div className="group relative">
                        <label className="text-[9px] font-light tracking-[0.2em] text-rc-muted uppercase block mb-2 transition-colors">Foto Profil Baru</label>
                        <label className="w-full bg-rc-bg/50 border-[0.5px] border-rc-main/20 hover:border-rc-logo/30 rounded-2xl px-4 py-4 text-center cursor-pointer transition-all group-hover:bg-rc-logo/5 flex items-center justify-center gap-4">
                            <i className="fa-solid fa-camera-retro text-rc-muted group-hover:text-rc-logo text-xl"></i>
                            <span className="text-[9px] font-light tracking-widest text-rc-muted uppercase truncate">
                                {avatarFile ? avatarFile.name : 'UPLOAD AVATAR BARU'}
                            </span>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => setAvatarFile(e.target.files[0])} 
                                className="hidden"
                            />
                        </label>
                    </div>

                    <div className="pt-6 flex justify-end gap-4 border-t border-rc-main/10">
                        <button type="button" onClick={onClose} className="px-8 py-3 rounded-full text-[10px] font-light tracking-widest text-rc-muted uppercase hover:text-rc-main transition-colors">BATAL</button>
                        <button type="submit" disabled={loading} className="px-10 py-3 rounded-full text-[10px] font-light tracking-widest text-rc-bg bg-rc-logo hover:bg-yellow-400 transition-all uppercase shadow-[0_0_15px_rgba(255,215,0,0.2)] flex items-center gap-3">
                            {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
                            {loading ? 'MEMPROSES' : 'SIMPAN PERUBAHAN'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
