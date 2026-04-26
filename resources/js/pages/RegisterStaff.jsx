import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterStaff() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', password_confirmation: '', role: 'kurir_staff' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/register-staff', formData);
            alert("Pendaftaran berhasil! Akun Anda sedang diverifikasi. Silakan login.");
            navigate('/login');
        } catch (e) {
            alert(e.response?.data?.message || "Pendaftaran gagal");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-rc-bg min-h-screen text-rc-main flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-rc-logo/10 rounded-full blur-[120px]"></div>
            
            <div className="w-full max-w-md bg-rc-card/50 backdrop-blur-md p-8 rounded-2xl border-[0.5px] border-rc-main/10 shadow-2xl relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-rc-main uppercase tracking-widest mb-2"><i className="fa-solid fa-id-badge text-rc-logo mr-2"></i> Pendaftaran Mitra</h1>
                    <p className="text-xs text-rc-muted">Bergabunglah sebagai mitra kurir, logistik, atau staf toko di Radencak Shop.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="text-[10px] font-bold text-rc-muted uppercase mb-1.5 block tracking-widest">Nama Lengkap</label>
                        <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main text-xs font-bold p-3 rounded-xl outline-none focus:border-rc-logo transition" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-rc-muted uppercase mb-1.5 block tracking-widest">Alamat Email</label>
                        <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main text-xs font-bold p-3 rounded-xl outline-none focus:border-rc-logo transition" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-rc-muted uppercase mb-1.5 block tracking-widest">Tipe Mitra (Role)</label>
                        <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main text-xs font-bold p-3 rounded-xl outline-none focus:border-rc-logo transition">
                            <option value="kurir_staff">Mitra Kurir Pengantar (Driver)</option>
                            <option value="admin_kurir">Admin Ekspedisi (Kurir)</option>
                            <option value="logistik_staff">Staf Gudang Logistik</option>
                            <option value="admin_logistik">Admin Logistik Pusat</option>
                            <option value="shop_staff">Staf Toko (SPG/SPB)</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-rc-muted uppercase mb-1.5 block tracking-widest">Kata Sandi</label>
                            <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main text-xs font-bold p-3 rounded-xl outline-none focus:border-rc-logo transition" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-rc-muted uppercase mb-1.5 block tracking-widest">Konfirmasi Sandi</label>
                            <input type="password" required value={formData.password_confirmation} onChange={e => setFormData({...formData, password_confirmation: e.target.value})} className="w-full bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main text-xs font-bold p-3 rounded-xl outline-none focus:border-rc-logo transition" />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-rc-logo text-rc-bg font-black uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-yellow-400 transition shadow-[0_0_15px_rgba(255,204,0,0.3)] mt-4">
                        {loading ? 'Memproses...' : 'Daftar Sekarang'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-[10px] uppercase font-bold text-rc-muted hover:text-rc-logo transition">Sudah punya akun? Masuk</Link>
                </div>
            </div>
        </div>
    );
}
