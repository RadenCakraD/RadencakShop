import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Settings() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('alamat_saya');
    const [addresses, setAddresses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ id: null, tag: 'Rumah', receiver_name: '', phone_number: '', full_address: '', note: '' });

    useEffect(() => {
        if(activeTab === 'alamat_saya') fetchAddresses();
    }, [activeTab]);

    const fetchAddresses = async () => {
        try {
            const res = await axios.get('/api/addresses');
            setAddresses(res.data);
        } catch (e) {}
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await axios.put(`/api/addresses/${formData.id}`, formData);
            } else {
                await axios.post('/api/addresses', formData);
            }
            setShowModal(false);
            fetchAddresses();
        } catch (e) {
            alert(e.response?.data?.message || 'Gagal menyimpan');
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Hapus alamat ini?")) return;
        try {
            await axios.delete(`/api/addresses/${id}`);
            fetchAddresses();
        } catch(e) { alert("Gagal menghapus"); }
    };

    const handleSetPrimary = async (id) => {
        try {
            await axios.post(`/api/addresses/${id}/primary`);
            fetchAddresses();
        } catch(e) { alert("Gagal menjadikan utama"); }
    };

    return (
        <div className="bg-rc-bg min-h-screen text-rc-main font-sans pb-24 overflow-x-hidden relative">

            {/* Premium Navbar */}
            <nav className="sticky top-0 z-50 bg-rc-bg border-b-[0.5px] border-rc-main/20">
                <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="group flex items-center gap-3 text-xs font-bold uppercase text-rc-muted hover:text-rc-main transition-colors duration-300">
                        <i className="fa-solid fa-arrow-left-long"></i> BAWA SAYA KEMBALI
                    </button>
                    <div className="flex items-center gap-2">
                        <i className="fa-solid fa-gear text-rc-logo animate-spin-slow"></i>
                        <span className="text-xs uppercase font-bold text-rc-muted">Pusat Pengaturan</span>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 pt-12 animate-fade-in">

                {/* Hero Settings Section */}
                <div className="mb-12">
                    <h1 className="text-3xl md:text-5xl font-bold uppercase text-rc-main mb-4 tracking-tight flex items-center gap-4">
                        <i className="fa-solid fa-sliders text-rc-logo"></i> Kustomisasi
                    </h1>
                    <p className="text-sm text-rc-muted max-w-2xl">
                        Atur detail alamat pengiriman, preferensi bahasa aplikasi, hingga hubungi pusat resolusi terpadu kami kapan saja Anda membutuhkan.
                    </p>
                </div>

                {/* Tab Header */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-2 border-b-[0.5px] border-rc-main/10">
                    {[
                        { id: 'alamat_saya', label: 'Manajemen Alamat', icon: 'fa-map-location-dot' },
                        { id: 'bahasa', label: 'Preferensi Bahasa', icon: 'fa-language' },
                        { id: 'bantuan_cs', label: 'Pusat Bantuan CS', icon: 'fa-headset' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-4 flex items-center gap-3 text-xs font-bold uppercase tracking-widest transition-colors flex-shrink-0 ${activeTab === tab.id ? 'border-b-2 border-rc-logo text-rc-logo' : 'text-rc-muted hover:text-rc-main'}`}
                        >
                            <i className={`fa-solid ${tab.icon} ${activeTab === tab.id ? '' : 'opacity-50'}`}></i> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="w-full">
                    
                    {activeTab === 'alamat_saya' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="bg-rc-card p-6 md:p-10 rounded-xl border-[0.5px] border-rc-main/10 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-rc-logo/5 rounded-full blur-2xl"></div>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10 gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold uppercase text-rc-main mb-1">Buku Alamat</h3>
                                        <p className="text-xs text-rc-muted">Kelola alamat domisili pengiriman logistik Anda.</p>
                                    </div>
                                    <button onClick={() => { setFormData({id: null, tag: 'Rumah', receiver_name: '', phone_number: '', full_address: '', note: ''}); setShowModal(true); }} className="bg-rc-logo text-rc-bg text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:shadow-lg hover:shadow-rc-logo/30 transition-all">
                                        <i className="fa-solid fa-plus"></i> Tambah Alamat
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                    {addresses.length === 0 ? (
                                        <div onClick={() => { setFormData({id: null, tag: 'Rumah', receiver_name: '', phone_number: '', full_address: '', note: ''}); setShowModal(true); }} className="col-span-full py-16 border-2 border-dashed border-rc-main/20 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-rc-logo hover:bg-rc-logo/5 transition group">
                                            <i className="fa-solid fa-map-location-dot text-4xl text-rc-muted mb-4 opacity-50 group-hover:text-rc-logo transition"></i>
                                            <p className="text-sm font-bold uppercase text-rc-main mb-1">Belum Ada Alamat</p>
                                            <p className="text-[10px] text-rc-muted">Klik untuk menambahkan lokasi baru.</p>
                                        </div>
                                    ) : (
                                        addresses.map(addr => (
                                            <div key={addr.id} className={`p-5 rounded-xl border-[0.5px] ${addr.is_primary ? 'border-rc-logo bg-rc-logo/5' : 'border-rc-main/10 bg-rc-bg/50'} relative group`}>
                                                {addr.is_primary && <div className="absolute top-4 right-4 bg-rc-logo text-rc-bg text-[9px] font-black uppercase px-2 py-1 rounded shadow-lg">Utama</div>}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <i className={`fa-solid ${addr.tag.toLowerCase() === 'rumah' ? 'fa-house' : addr.tag.toLowerCase() === 'kantor' ? 'fa-building' : 'fa-thumbtack'} text-rc-logo`}></i>
                                                    <span className="text-sm font-bold uppercase">{addr.tag}</span>
                                                </div>
                                                <h4 className="font-bold text-rc-main uppercase">{addr.receiver_name}</h4>
                                                <p className="text-xs text-rc-muted font-bold tracking-widest mb-2">{addr.phone_number}</p>
                                                <p className="text-xs text-rc-muted font-medium mb-1 line-clamp-2">{addr.full_address}</p>
                                                {addr.note && <p className="text-[10px] text-teal-400 font-bold bg-teal-400/10 px-2 py-1 rounded w-fit italic mt-2">"{addr.note}"</p>}
                                                
                                                <div className="mt-5 flex gap-2">
                                                    {!addr.is_primary && (
                                                        <button onClick={() => handleSetPrimary(addr.id)} className="text-[10px] uppercase font-bold text-rc-logo hover:text-white hover:bg-rc-logo border-[0.5px] border-rc-logo/30 px-3 py-1.5 rounded transition">Pilih Utama</button>
                                                    )}
                                                    <button onClick={() => { setFormData(addr); setShowModal(true); }} className="text-[10px] uppercase font-bold text-rc-muted hover:text-rc-main px-3 py-1.5 border-[0.5px] border-rc-main/10 hover:border-rc-main/30 rounded transition">Edit</button>
                                                    <button onClick={() => handleDelete(addr.id)} className="text-[10px] uppercase font-bold text-red-500 hover:text-white hover:bg-red-500 px-3 py-1.5 border-[0.5px] border-red-500/30 rounded transition">Hapus</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bahasa' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="bg-rc-card p-10 rounded-xl border-[0.5px] border-rc-main/10 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
                                <h3 className="text-xl font-bold uppercase text-rc-main mb-2 relative z-10">Bahasa Antarmuka</h3>
                                <p className="text-xs text-rc-muted mb-6 relative z-10">Pilih bahasa yang mempermudah navigasi dan transaksi Anda di platform kami.</p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 w-full md:w-2/3">
                                    <label className="flex items-center gap-4 p-5 border-[1px] border-rc-logo bg-rc-logo/5 rounded-xl cursor-pointer hover:bg-rc-logo/10 transition">
                                        <input type="radio" checked readOnly className="accent-rc-logo w-4 h-4" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-rc-main uppercase">Bahasa Indonesia</span>
                                            <span className="text-[10px] text-rc-muted">Default Sistem (ID)</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-4 p-5 border-[1px] border-rc-main/10 bg-rc-bg rounded-xl cursor-not-allowed opacity-50 relative overflow-hidden">
                                        <div className="absolute -right-4 -top-4 w-12 h-12 bg-rc-main/5 rotate-45"></div>
                                        <input type="radio" disabled className="w-4 h-4" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-rc-muted uppercase">English UK</span>
                                            <span className="text-[10px] text-rc-main bg-rc-main/10 px-2 py-0.5 rounded tracking-widest mt-1 w-fit">SEGERA HADIR</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bantuan_cs' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="bg-rc-card p-10 rounded-xl border-[0.5px] border-rc-main/10 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl"></div>
                                <h3 className="text-xl font-bold uppercase text-rc-main mb-2 relative z-10">Halo Radencak! (Call Center)</h3>
                                <p className="text-xs text-rc-muted mb-8 max-w-xl relative z-10">Ada kendala dalam logistik, pengembalian dana pembatalan produk, atau sistem Error? Lapor segera melalui staf profesional kami.</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                    <a href="https://wa.me/6285230886080" target="_blank" className="p-8 border-[0.5px] border-green-500/30 bg-green-500/5 rounded-2xl hover:bg-green-500/10 transition flex flex-col md:flex-row items-center gap-6 group">
                                        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition shadow-green-500/20 flex-shrink-0">
                                            <i className="fa-brands fa-whatsapp text-2xl text-white"></i>
                                        </div>
                                        <div className="text-center md:text-left">
                                            <span className="block text-sm font-bold uppercase text-rc-main mb-1">WhatsApp Live Chat</span>
                                            <span className="block text-xs text-rc-muted">Respon ± 1 Menit pada Jam Operasional (09:00 - 21:00 WIB)</span>
                                        </div>
                                    </a>
                                    
                                    <a href="mailto:radencakstudio@gmail.com" className="p-8 border-[0.5px] border-blue-500/30 bg-blue-500/5 rounded-2xl hover:bg-blue-500/10 transition flex flex-col md:flex-row items-center gap-6 group">
                                        <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition shadow-blue-500/20 flex-shrink-0">
                                            <i className="fa-solid fa-envelope-open-text text-xl text-white"></i>
                                        </div>
                                        <div className="text-center md:text-left">
                                            <span className="block text-sm font-bold uppercase text-rc-main mb-1">Surat Elektronik (Email)</span>
                                            <span className="block text-xs text-rc-muted">Untuk aduan mitra logistik dan berkas administratif pencairan dana.</span>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* Address Form Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-rc-bg border-[0.5px] border-rc-main/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative shadow-black/50">
                        <div className="bg-rc-card p-5 border-b-[0.5px] border-rc-main/10 flex justify-between items-center">
                            <h2 className="text-sm md:text-base font-black uppercase tracking-widest text-rc-main flex items-center gap-2">
                                <i className="fa-solid fa-map-pin text-rc-logo"></i> {formData.id ? 'Edit Radar Lokasi' : 'Radar Alamat Baru'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-rc-muted hover:text-red-500 transition w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/10"><i className="fa-solid fa-xmark text-lg"></i></button>
                        </div>
                        <form onSubmit={handleSaveAddress} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto no-scrollbar">
                            
                            {/* GPS UI Illusion */}
                            <div className="w-full h-32 bg-[#0a2540] rounded-2xl relative overflow-hidden flex items-center justify-center border-[0.5px] border-blue-500/20 group shadow-inner">
                                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, #38bdf8 1.5px, transparent 1.5px)', backgroundSize: '15px 15px' }}></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-blue-500/20 rounded-full animate-ping"></div>
                                <i className="fa-solid fa-location-dot text-4xl text-red-500 drop-shadow-lg z-10 group-hover:-translate-y-2 transition-transform duration-300 relative">
                                    <div className="absolute -bottom-2 -left-2 w-12 h-4 bg-black/30 blur-sm rounded-full -z-10 group-hover:scale-50 transition-transform"></div>
                                </i>
                                <div className="absolute bottom-3 text-[9px] uppercase tracking-widest font-black text-blue-400 z-10 bg-black/60 backdrop-blur px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>Satelit GPS Aktif
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-rc-muted uppercase mb-1.5 block tracking-widest">Label Alamat (Tag)</label>
                                    <input type="text" value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})} placeholder="Rumah, Kantor, dll" required className="w-full bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main text-xs font-bold p-3 rounded-xl outline-none focus:border-rc-logo transition focus:bg-rc-logo/5" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-rc-muted uppercase mb-1.5 block tracking-widest">Nomor HP Penerima</label>
                                    <input type="tel" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} placeholder="Mis. 0812..." required className="w-full bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main text-xs font-bold p-3 rounded-xl outline-none focus:border-rc-logo transition focus:bg-rc-logo/5" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-rc-muted uppercase mb-1.5 block tracking-widest">Nama / Kontak Penerima</label>
                                <input type="text" value={formData.receiver_name} onChange={e => setFormData({...formData, receiver_name: e.target.value})} placeholder="Nama orang yang menerimakan paket" required className="w-full bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main text-xs font-bold p-3 rounded-xl outline-none focus:border-rc-logo transition focus:bg-rc-logo/5" />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-rc-muted uppercase mb-1.5 block tracking-widest">Deskripsi Alamat Penuh</label>
                                <textarea value={formData.full_address} onChange={e => setFormData({...formData, full_address: e.target.value})} required placeholder="Jalan, RT/RW, Dusun, Kecamatan, Kota, Kode Pos..." rows="3" className="w-full bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main text-xs font-bold p-3 rounded-xl outline-none focus:border-rc-logo transition focus:bg-rc-logo/5 resize-none"></textarea>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-rc-muted uppercase mb-1.5 block tracking-widest">Catatan / Patokan Khusus (Opsional)</label>
                                <input type="text" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} placeholder="Cth: Rumah pagar hitam, depan masjid besar" className="w-full bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main text-xs font-bold p-3 rounded-xl outline-none focus:border-rc-logo transition focus:bg-rc-logo/5" />
                            </div>

                            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all mt-6 shadow-md shadow-black/20">
                                {formData.id ? 'Perbarui Koordinat' : 'Simpan Koordinat Baru'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
