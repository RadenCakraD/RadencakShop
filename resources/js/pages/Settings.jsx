import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon issue in react
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition, onPositionChange }) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            if (onPositionChange) onPositionChange(e.latlng.lat, e.latlng.lng);
            map.flyTo(e.latlng, map.getZoom());
        },
        locationfound(e) {
            setPosition(e.latlng);
            if (onPositionChange) onPositionChange(e.latlng.lat, e.latlng.lng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    useEffect(() => {
        if (!position) map.locate();
        else map.flyTo(position, map.getZoom()); // fly to new position when position changes from outside
    }, [map, position]);

    return position === null ? null : (
        <Marker 
            position={position} 
            draggable={true} 
            eventHandlers={{ 
                dragend: (e) => {
                    const newPos = e.target.getLatLng();
                    setPosition(newPos);
                    if (onPositionChange) onPositionChange(newPos.lat, newPos.lng);
                } 
            }}
        ></Marker>
    );
}

export default function Settings() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('alamat_saya');
    const [addresses, setAddresses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ id: null, tag: 'Rumah', receiver_name: '', phone_number: '', full_address: '', note: '', latitude: null, longitude: null, region_id: '' });
    const [mapPosition, setMapPosition] = useState(null);
    const [mapSearchQuery, setMapSearchQuery] = useState('');
    const [isSearchingMap, setIsSearchingMap] = useState(false);
    const [regions, setRegions] = useState([]);
    const [user, setUser] = useState(null);
    const [accountFormData, setAccountFormData] = useState({ name: '', email: '', no_hp: '', alamat: '', avatar: null, password: '', password_confirmation: '' });
    const [updatingAccount, setUpdatingAccount] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);

    useEffect(() => {
        axios.get('/api/regions').then(res => setRegions(res.data)).catch(e => console.error(e));
    }, []);

    useEffect(() => {
        if (mapPosition) {
            setFormData(prev => ({ ...prev, latitude: mapPosition.lat, longitude: mapPosition.lng }));
        }
    }, [mapPosition]);

    const [complaints, setComplaints] = useState([]);
    const [complaintForm, setComplaintForm] = useState({ subject: '', message: '' });
    const [submittingComplaint, setSubmittingComplaint] = useState(false);

    useEffect(() => {
        fetchUserInfo();
        if(activeTab === 'alamat_saya') fetchAddresses();
        if(activeTab === 'pengaduan') fetchComplaints();
    }, [activeTab]);

    const fetchUserInfo = async () => {
        try {
            const res = await axios.get('/api/user');
            setUser(res.data);
            setAccountFormData({
                name: res.data.name || '',
                email: res.data.email || '',
                no_hp: res.data.no_hp || '',
                alamat: res.data.alamat || '',
                avatar: null,
                password: '',
                password_confirmation: ''
            });
            if (res.data.avatar) setAvatarPreview(`/storage/${res.data.avatar}`);
        } catch (e) {}
    };

    const handleUpdateAccount = async (e) => {
        e.preventDefault();
        setUpdatingAccount(true);
        const data = new FormData();
        data.append('name', accountFormData.name);
        data.append('email', accountFormData.email);
        data.append('no_hp', accountFormData.no_hp);
        data.append('alamat', accountFormData.alamat);
        if (accountFormData.avatar) data.append('avatar', accountFormData.avatar);
        if (accountFormData.password) {
            data.append('password', accountFormData.password);
            data.append('password_confirmation', accountFormData.password_confirmation);
        }

        try {
            const res = await axios.post('/api/user/update', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Informasi akun berhasil diperbarui!");
            fetchUserInfo();
        } catch (e) {
            alert(e.response?.data?.message || "Gagal memperbarui profil");
        } finally {
            setUpdatingAccount(false);
        }
    };

    const fetchComplaints = async () => {
        try {
            const res = await axios.get('/api/complaints');
            setComplaints(res.data);
        } catch (e) {}
    };

    const handleSubmitComplaint = async (e) => {
        e.preventDefault();
        setSubmittingComplaint(true);
        try {
            await axios.post('/api/complaints', complaintForm);
            alert("Pengaduan berhasil dikirim!");
            setComplaintForm({ subject: '', message: '' });
            fetchComplaints();
        } catch (e) {
            alert("Gagal mengirim pengaduan");
        } finally {
            setSubmittingComplaint(false);
        }
    };

    const fetchAddresses = async () => {
        try {
            const res = await axios.get('/api/addresses');
            setAddresses(res.data);
        } catch (e) {}
    };

    const handleMapSearch = async (e) => {
        e.preventDefault();
        if (!mapSearchQuery) return;
        setIsSearchingMap(true);
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}`);
            if (res.data && res.data.length > 0) {
                const loc = res.data[0];
                const newPos = { lat: parseFloat(loc.lat), lng: parseFloat(loc.lon) };
                setMapPosition(newPos);
                handleReverseGeocode(newPos.lat, newPos.lng);
            } else {
                alert('Lokasi tidak ditemukan');
            }
        } catch (e) {
            console.error("Gagal mencari lokasi", e);
        } finally {
            setIsSearchingMap(false);
        }
    };

    const handleReverseGeocode = async (lat, lng) => {
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (res.data && res.data.display_name) {
                setFormData(prev => ({ ...prev, full_address: res.data.display_name }));
            }
        } catch (e) {
            console.error("Gagal menarik nama alamat dari map", e);
        }
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
                        { id: 'alamat_saya', label: 'Alamat Pengiriman', icon: 'fa-map-location-dot' },
                        { id: 'informasi_akun', label: 'Informasi Akun', icon: 'fa-user-gear' },
                        { id: 'bahasa', label: 'Bahasa', icon: 'fa-language' },
                        { id: 'bantuan_cs', label: 'Bantuan CS', icon: 'fa-headset' },
                        { id: 'pengaduan', label: 'Pusat Pengaduan', icon: 'fa-triangle-exclamation' }
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
                    
                    {activeTab === 'informasi_akun' && user && (
                        <div className="animate-fade-in space-y-6">
                            <div className="bg-rc-card p-6 md:p-10 rounded-xl border-[0.5px] border-rc-main/10 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-rc-logo/5 rounded-full blur-2xl"></div>
                                <h3 className="text-xl font-bold uppercase text-rc-main mb-2 relative z-10">Profil & Identitas</h3>
                                <p className="text-xs text-rc-muted mb-8 relative z-10 uppercase tracking-widest font-black opacity-60">Lengkapi data diri Anda untuk mempermudah koordinasi kurir.</p>

                                 <form onSubmit={handleUpdateAccount} className="relative z-10">
                                    <div className="flex flex-col md:flex-row gap-10 items-start">
                                        {/* Avatar Section Mini */}
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-24 h-24 rounded-2xl bg-rc-bg border-[0.5px] border-rc-main/10 overflow-hidden flex items-center justify-center group relative cursor-pointer shadow-inner">
                                                {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <i className="fa-solid fa-user text-2xl text-rc-muted opacity-30"></i>}
                                                <input type="file" accept="image/*" onChange={e => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setAccountFormData({ ...accountFormData, avatar: file });
                                                        setAvatarPreview(URL.createObjectURL(file));
                                                    }
                                                }} className="absolute inset-0 opacity-0 cursor-pointer" title="Ubah Foto" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <i className="fa-solid fa-camera text-white text-xs"></i>
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-black text-rc-muted uppercase tracking-[0.2em] opacity-50">Foto Profil</span>
                                        </div>

                                        <div className="flex-1 w-full space-y-8">
                                            {/* Baris 1: Identitas Dasar */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-rc-muted uppercase tracking-widest flex items-center gap-2">
                                                        <i className="fa-solid fa-id-card text-blue-500"></i> Nama Lengkap
                                                    </label>
                                                    <input type="text" value={accountFormData.name} onChange={e => setAccountFormData({ ...accountFormData, name: e.target.value })} placeholder="Masukkan nama asli Anda" className="w-full bg-rc-bg border-[0.5px] border-rc-main/10 text-rc-main text-xs font-bold p-4 rounded-2xl outline-none focus:border-rc-logo transition focus:bg-rc-logo/5" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-rc-muted uppercase tracking-widest flex items-center gap-2">
                                                        <i className="fa-solid fa-envelope text-pink-500"></i> Alamat Email
                                                    </label>
                                                    <input type="email" value={accountFormData.email} onChange={e => setAccountFormData({ ...accountFormData, email: e.target.value })} placeholder="email@contoh.com" className="w-full bg-rc-bg border-[0.5px] border-rc-main/10 text-rc-main text-xs font-bold p-4 rounded-2xl outline-none focus:border-rc-logo transition focus:bg-rc-logo/5" />
                                                </div>
                                            </div>

                                            {/* Baris 2: Kontak & Keamanan */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-rc-muted uppercase tracking-widest flex items-center gap-2">
                                                        <i className="fa-brands fa-whatsapp text-green-500"></i> Nomor WhatsApp
                                                    </label>
                                                    <input type="tel" value={accountFormData.no_hp} onChange={e => setAccountFormData({ ...accountFormData, no_hp: e.target.value })} placeholder="Cth: 081234..." className="w-full bg-rc-bg border-[0.5px] border-rc-main/10 text-rc-main text-xs font-bold p-4 rounded-2xl outline-none focus:border-rc-logo transition focus:bg-rc-logo/5" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-rc-muted uppercase tracking-widest flex items-center gap-2">
                                                        <i className="fa-solid fa-user-tag text-purple-500"></i> Username ID
                                                    </label>
                                                    <div className="w-full bg-rc-main/5 border-[0.5px] border-rc-main/5 text-rc-muted text-xs font-bold p-4 rounded-2xl cursor-not-allowed opacity-60">
                                                        @{user.username}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="h-[0.5px] w-full bg-rc-main/5"></div>

                                            {/* Sesi Kata Sandi */}
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-rc-main uppercase tracking-widest flex items-center gap-2 opacity-50">
                                                    <i className="fa-solid fa-lock"></i> Keamanan Akun (Ganti Sandi)
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <input type="password" value={accountFormData.password} onChange={e => setAccountFormData({ ...accountFormData, password: e.target.value })} placeholder="Kata Sandi Baru" className="w-full bg-rc-bg border-[0.5px] border-rc-main/10 text-rc-main text-xs font-bold p-4 rounded-2xl outline-none focus:border-rc-logo transition focus:bg-rc-logo/5" />
                                                    <input type="password" value={accountFormData.password_confirmation} onChange={e => setAccountFormData({ ...accountFormData, password_confirmation: e.target.value })} placeholder="Ulangi Sandi Baru" className="w-full bg-rc-bg border-[0.5px] border-rc-main/10 text-rc-main text-xs font-bold p-4 rounded-2xl outline-none focus:border-rc-logo transition focus:bg-rc-logo/5" />
                                                </div>
                                            </div>

                                            <button type="submit" disabled={updatingAccount} className="bg-rc-logo text-rc-bg text-[10px] font-black uppercase tracking-[0.2em] px-10 py-5 rounded-2xl hover:shadow-xl hover:shadow-rc-logo/20 transition-all disabled:opacity-50 w-full md:w-fit">
                                                {updatingAccount ? 'Sedang Memproses...' : 'Simpan Perubahan Akun'}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'alamat_saya' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="bg-rc-card p-6 md:p-10 rounded-xl border-[0.5px] border-rc-main/10 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-rc-logo/5 rounded-full blur-2xl"></div>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10 gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold uppercase text-rc-main mb-1">Buku Alamat</h3>
                                        <p className="text-xs text-rc-muted">Kelola alamat domisili pengiriman logistik Anda.</p>
                                    </div>
                                    <button onClick={() => { setFormData({id: null, tag: 'Rumah', receiver_name: '', phone_number: '', full_address: '', note: '', latitude: null, longitude: null, region_id: ''}); setMapPosition(null); setShowModal(true); }} className="bg-rc-logo text-rc-bg text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:shadow-lg hover:shadow-rc-logo/30 transition-all">
                                        <i className="fa-solid fa-plus"></i> Tambah Alamat
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                    {addresses.length === 0 ? (
                                        <div onClick={() => { setFormData({id: null, tag: 'Rumah', receiver_name: '', phone_number: '', full_address: '', note: '', latitude: null, longitude: null, region_id: ''}); setMapPosition(null); setShowModal(true); }} className="col-span-full py-16 border-2 border-dashed border-rc-main/20 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-rc-logo hover:bg-rc-logo/5 transition group">
                                            <i className="fa-solid fa-map-location-dot text-4xl text-rc-muted mb-4 opacity-50 group-hover:text-rc-logo transition"></i>
                                            <p className="text-sm font-bold uppercase text-rc-main mb-1">Belum Ada Alamat</p>
                                            <p className="text-[10px] text-rc-muted">Klik untuk menambahkan lokasi baru.</p>
                                        </div>
                                    ) : addresses.map((addr) => (
                                        <div key={addr.id} className={`p-5 rounded-xl border-[0.5px] ${addr.is_primary ? 'border-rc-logo bg-rc-logo/5' : 'border-rc-main/10 bg-rc-bg/50'} relative group`}>
                                            {addr.is_primary ? <div className="absolute top-4 right-4 bg-rc-logo text-rc-bg text-[9px] font-black uppercase px-2 py-1 rounded shadow-lg">Utama</div> : null}
                                            <div className="flex items-center gap-2 mb-3">
                                                <i className={`fa-solid ${addr.tag.toLowerCase() === 'rumah' ? 'fa-house' : addr.tag.toLowerCase() === 'kantor' ? 'fa-building' : 'fa-thumbtack'} text-rc-logo`}></i>
                                                <span className="text-sm font-bold uppercase">{addr.tag}</span>
                                            </div>
                                            <h4 className="font-bold text-rc-main uppercase">{addr.receiver_name}</h4>
                                            <p className="text-xs text-rc-muted font-bold tracking-widest mb-2">{addr.phone_number}</p>
                                            <p className="text-xs text-rc-muted font-medium mb-1 line-clamp-2">{addr.full_address}</p>
                                            {addr.region ? (
                                                <div className="flex items-center gap-1.5 mt-2 mb-1">
                                                    <i className="fa-solid fa-earth-asia text-[10px] text-blue-500"></i>
                                                    <span className="text-[10px] font-black uppercase text-blue-500 tracking-wider">Wilayah: {addr.region.name}</span>
                                                </div>
                                            ) : null}
                                            {addr.note ? <p className="text-[10px] text-teal-400 font-bold bg-teal-400/10 px-2 py-1 rounded w-fit italic mt-2">"{addr.note}"</p> : null}
                                            <div className="mt-5 flex gap-2">
                                                {!addr.is_primary ? (
                                                    <button onClick={() => handleSetPrimary(addr.id)} className="text-[10px] uppercase font-bold text-rc-logo hover:text-white hover:bg-rc-logo border-[0.5px] border-rc-logo/30 px-3 py-1.5 rounded transition">Pilih Utama</button>
                                                ) : null}
                                                <button onClick={() => { setFormData(addr); setMapPosition(addr.latitude ? { lat: addr.latitude, lng: addr.longitude } : null); setShowModal(true); }} className="text-[10px] uppercase font-bold text-rc-muted hover:text-rc-main px-3 py-1.5 border-[0.5px] border-rc-main/10 hover:border-rc-main/30 rounded transition">Edit</button>
                                                <button onClick={() => handleDelete(addr.id)} className="text-[10px] uppercase font-bold text-red-500 hover:text-white hover:bg-red-500 px-3 py-1.5 border-[0.5px] border-red-500/30 rounded transition">Hapus</button>
                                            </div>
                                        </div>
                                    ))}
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

                    {activeTab === 'pengaduan' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="bg-rc-card p-10 rounded-xl border-[0.5px] border-red-500/30 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl"></div>
                                <h3 className="text-xl font-bold uppercase text-rc-main mb-2 relative z-10 flex items-center gap-2">
                                    <i className="fa-solid fa-triangle-exclamation text-red-500"></i> Buat Pengaduan Laporan
                                </h3>
                                <p className="text-xs text-rc-muted mb-8 max-w-xl relative z-10">Laporkan masalah pesanan, kurir, atau kendala sistem. Tim investigasi kami akan merespons maksimal 1x24 Jam kerja.</p>
                                
                                <form onSubmit={handleSubmitComplaint} className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                    <div className="col-span-full md:col-span-1">
                                        <label className="text-[10px] font-bold text-rc-muted uppercase mb-1.5 block tracking-widest">Subjek Laporan</label>
                                        <select required value={complaintForm.subject} onChange={e => setComplaintForm({...complaintForm, subject: e.target.value})} className="w-full bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main text-xs font-bold p-3 rounded-xl outline-none focus:border-red-500 transition focus:bg-red-500/5">
                                            <option value="" className="bg-zinc-900 text-white">-- Pilih Topik --</option>
                                            <option value="Paket Rusak/Hilang" className="bg-zinc-900 text-white">Paket Rusak / Hilang di Perjalanan</option>
                                            <option value="Kurir Bermasalah" className="bg-zinc-900 text-white">Kurir Tidak Sopan / Fiktif</option>
                                            <option value="Penipuan Toko" className="bg-zinc-900 text-white">Indikasi Penipuan / Barang Palsu</option>
                                            <option value="Sistem Error" className="bg-zinc-900 text-white">Sistem Error / Bug Aplikasi</option>
                                            <option value="Lainnya" className="bg-zinc-900 text-white">Lainnya...</option>
                                        </select>
                                    </div>
                                    <div className="col-span-full">
                                        <label className="text-[10px] font-bold text-rc-muted uppercase mb-1.5 block tracking-widest">Detail Kronologi (Beserta Order ID jika ada)</label>
                                        <textarea required value={complaintForm.message} onChange={e => setComplaintForm({...complaintForm, message: e.target.value})} rows="4" placeholder="Ceritakan kronologi secara rinci..." className="w-full bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main text-xs font-bold p-3 rounded-xl outline-none focus:border-red-500 transition focus:bg-red-500/5 resize-none"></textarea>
                                    </div>
                                    <div className="col-span-full">
                                        <button type="submit" disabled={submittingComplaint} className="w-full md:w-auto bg-red-600 text-white text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-xl hover:bg-red-500 transition-colors shadow-lg shadow-red-500/30 disabled:opacity-50">
                                            {submittingComplaint ? 'Mengirim...' : 'Kirim Laporan Resmi'}
                                        </button>
                                    </div>
                                </form>

                                <h4 className="text-sm font-bold text-rc-main uppercase border-b-[0.5px] border-rc-main/10 pb-3 mb-4"><i className="fa-solid fa-clock-rotate-left mr-2"></i> Riwayat Pengaduan Anda</h4>
                                <div className="space-y-4">
                                    {complaints.length === 0 ? (
                                        <div className="text-center py-6 text-xs text-rc-muted uppercase font-bold tracking-widest">Belum ada laporan pengaduan.</div>
                                    ) : (
                                        complaints.map(c => (
                                            <div key={c.id} className="p-5 border-[0.5px] border-rc-main/10 bg-rc-bg/50 rounded-xl relative group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h5 className="font-bold text-sm text-rc-main">{c.subject}</h5>
                                                    <span className={`text-[9px] uppercase font-black px-2 py-1 rounded shadow-sm ${c.status === 'open' ? 'bg-yellow-500 text-black' : c.status === 'in_progress' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
                                                        {c.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-rc-muted leading-relaxed line-clamp-2">{c.message}</p>
                                                <p className="text-[10px] text-rc-muted/50 mt-3 uppercase font-bold">{new Date(c.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'})}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* Address Form Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-fade-in">
                    <div className="bg-rc-bg border-[0.5px] border-rc-main/20 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl relative shadow-black/50 flex flex-col max-h-[95vh]">
                        <div className="bg-rc-card p-4 sm:p-5 border-b-[0.5px] border-rc-main/10 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-sm md:text-base font-black uppercase tracking-widest text-rc-main flex items-center gap-2">
                                <i className="fa-solid fa-map-pin text-rc-logo"></i> {formData.id ? 'Edit Radar Lokasi' : 'Radar Alamat Baru'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-rc-muted hover:text-red-500 transition w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/10"><i className="fa-solid fa-xmark text-lg"></i></button>
                        </div>
                        <div className="overflow-y-auto no-scrollbar flex-grow p-4 sm:p-6">
                            <form onSubmit={handleSaveAddress} className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                                
                                {/* KIRI: PETA */}
                                <div className="flex flex-col h-full">
                                <label className="text-[10px] font-bold text-rc-muted uppercase mb-1.5 flex items-center gap-2 tracking-widest">
                                    <i className="fa-solid fa-map-pin text-rc-logo"></i> Titik Lokasi Google Maps
                                    {mapPosition && <span className="text-green-500 font-bold ml-auto"><i className="fa-solid fa-check"></i> Tersimpan</span>}
                                </label>
                                
                                {/* PENCARIAN MAP */}
                                <div className="flex gap-2 mb-2">
                                    <input 
                                        type="text" 
                                        placeholder="Cari Kota, Jalan, atau Gedung..." 
                                        value={mapSearchQuery} 
                                        onChange={(e) => setMapSearchQuery(e.target.value)}
                                        onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleMapSearch(e); } }}
                                        className="w-full bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main text-xs font-bold p-2.5 rounded-lg outline-none focus:border-rc-logo transition focus:bg-rc-logo/5"
                                    />
                                    <button type="button" onClick={handleMapSearch} disabled={isSearchingMap} className="bg-rc-logo text-rc-bg px-4 py-2.5 rounded-lg text-xs font-bold uppercase transition hover:opacity-80 disabled:opacity-50">
                                        {isSearchingMap ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-magnifying-glass"></i>}
                                    </button>
                                </div>

                                <div className="w-full h-64 md:h-96 lg:h-[450px] lg:flex-grow rounded-2xl overflow-hidden border-[0.5px] border-rc-logo/30 relative shadow-inner">
                                    <MapContainer center={mapPosition || [-6.2088, 106.8456]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <LocationMarker position={mapPosition} setPosition={setMapPosition} onPositionChange={handleReverseGeocode} />
                                    </MapContainer>
                                    <div className="absolute bottom-2 left-2 right-2 z-10 flex justify-center pointer-events-none">
                                        <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border-[0.5px] border-white/20 text-[10px] uppercase font-bold text-white tracking-widest pointer-events-auto text-center">
                                            {mapPosition ? 'Lokasi Ditandai (Bisa Digeser / Drag)' : 'Klik Peta untuk Menandai Lokasi'}
                                        </div>
                                    </div>
                                </div>
                                </div>

                                {/* KANAN: FORMULIR */}
                                <div className="space-y-5 lg:pl-4 lg:border-l-[0.5px] border-rc-main/10 flex flex-col justify-center">
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
                                        <label className="text-[10px] font-bold text-rc-muted uppercase mb-1.5 block tracking-widest">Wilayah Layanan (Region)</label>
                                        <select value={formData.region_id || ''} onChange={e => setFormData({...formData, region_id: e.target.value})} required className="w-full bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main text-xs font-bold p-3 rounded-xl outline-none focus:border-rc-logo transition focus:bg-rc-logo/5">
                                            <option value="" disabled>-- Pilih Wilayah / Negara --</option>
                                            {regions.map(r => (
                                                <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                                            ))}
                                        </select>
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

                                    <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest text-xs lg:text-sm py-4 lg:py-5 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all mt-8 shadow-md shadow-black/20">
                                        {formData.id ? 'Perbarui Koordinat & Alamat' : 'Simpan Koordinat Baru'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
