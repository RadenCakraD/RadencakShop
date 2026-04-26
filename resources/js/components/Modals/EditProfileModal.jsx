import React, { useState, useEffect } from 'react';
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

export default function EditProfileModal({ isOpen, onClose, shopData, onSuccess }) {
    if (!isOpen) return null;

    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        nama_toko: '',
        deskripsi_toko: '',
        alamat_toko: '',
        latitude: null,
        longitude: null
    });

    const [avatarFile, setAvatarFile] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);

    const [mapPosition, setMapPosition] = useState(null);
    const [mapSearchQuery, setMapSearchQuery] = useState('');
    const [isSearchingMap, setIsSearchingMap] = useState(false);

    // Pre-fill ketika modal dibuka
    useEffect(() => {
        if (shopData) {
            setFormData({
                nama_toko: shopData.nama_toko || '',
                deskripsi_toko: shopData.deskripsi_toko || '',
                alamat_toko: shopData.alamat_toko || '',
                latitude: shopData.latitude || null,
                longitude: shopData.longitude || null
            });
            if (shopData.latitude && shopData.longitude) {
                setMapPosition({ lat: parseFloat(shopData.latitude), lng: parseFloat(shopData.longitude) });
            }
        }
    }, [shopData]);

    useEffect(() => {
        if (mapPosition) {
            setFormData(prev => ({ ...prev, latitude: mapPosition.lat, longitude: mapPosition.lng }));
        }
    }, [mapPosition]);

    const handleInput = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
                setFormData(prev => ({ ...prev, alamat_toko: res.data.display_name }));
            }
        } catch (e) {
            console.error("Gagal menarik nama alamat dari map", e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('nama_toko', formData.nama_toko);
        data.append('deskripsi_toko', formData.deskripsi_toko);
        data.append('alamat_toko', formData.alamat_toko);
        if (formData.latitude) data.append('latitude', formData.latitude);
        if (formData.longitude) data.append('longitude', formData.longitude);
        if (avatarFile) data.append('foto_profil', avatarFile);
        if (bannerFile) data.append('banner_toko', bannerFile);

        try {
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-fade-in font-sans">
            <div className="bg-gradient-to-tr from-rc-card/95 to-rc-bg backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[0.5px] border-rc-main/10 relative w-full max-w-5xl flex flex-col max-h-[95vh] overflow-hidden">
                
                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-rc-main/10 flex-shrink-0">
                    <div>
                        <h2 className="text-sm md:text-base font-black tracking-widest text-rc-main uppercase flex items-center gap-2">
                            <i className="fa-solid fa-store text-rc-logo"></i> TATA PROFIL TOKO & LOKASI
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-rc-muted hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/10"><i className="fa-solid fa-xmark text-lg"></i></button>
                </div>

                <div className="overflow-y-auto no-scrollbar flex-grow p-4 sm:p-6">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                        
                        {/* KIRI: PETA */}
                        <div className="flex flex-col h-full">
                            <label className="text-[10px] font-bold text-rc-muted uppercase mb-1.5 flex items-center gap-2 tracking-widest">
                                <i className="fa-solid fa-map-pin text-rc-logo"></i> Titik Lokasi Google Maps Toko
                                {mapPosition && <span className="text-green-500 font-bold ml-auto"><i className="fa-solid fa-check"></i> Tersimpan</span>}
                            </label>
                            
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
                            
                            <div>
                                <label className="text-[10px] font-bold tracking-[0.2em] text-rc-muted uppercase block mb-2">Nama Entitas Toko *</label>
                                <div className="relative">
                                    <i className="fa-solid fa-shop absolute left-4 top-1/2 -translate-y-1/2 text-rc-muted"></i>
                                    <input 
                                        type="text" 
                                        name="nama_toko" 
                                        value={formData.nama_toko} 
                                        onChange={handleInput} 
                                        required 
                                        className="w-full bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-xl pl-12 pr-4 py-3 text-xs font-bold text-rc-main focus:outline-none focus:border-rc-logo transition-all" 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold tracking-[0.2em] text-rc-muted uppercase block mb-2">Alamat Toko Lengkap *</label>
                                <div className="relative">
                                    <i className="fa-solid fa-location-dot absolute left-4 top-4 text-rc-muted"></i>
                                    <textarea 
                                        name="alamat_toko" 
                                        value={formData.alamat_toko} 
                                        onChange={handleInput} 
                                        required
                                        rows="3" 
                                        className="w-full bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-xl pl-12 pr-4 py-3 text-xs font-bold text-rc-main focus:outline-none focus:border-rc-logo transition-all"
                                        placeholder="Jalan, Gedung, Patokan..."
                                    ></textarea>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold tracking-[0.2em] text-rc-muted uppercase block mb-2">Deskripsi & Visi Toko</label>
                                <div className="relative">
                                    <i className="fa-solid fa-feather absolute left-4 top-4 text-rc-muted"></i>
                                    <textarea 
                                        name="deskripsi_toko" 
                                        value={formData.deskripsi_toko} 
                                        onChange={handleInput} 
                                        rows="2" 
                                        className="w-full bg-rc-bg/50 border-[0.5px] border-rc-main/20 rounded-xl pl-12 pr-4 py-3 text-xs font-bold text-rc-main focus:outline-none focus:border-rc-logo transition-all"
                                        placeholder="Ceritakan keistimewaan tokomu..."
                                    ></textarea>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-bold tracking-[0.2em] text-rc-muted uppercase block mb-2 text-center">Ganti Logo Avatar</label>
                                    <label className="w-full bg-rc-bg/50 border-[0.5px] border-rc-main/20 hover:border-rc-logo/30 rounded-xl px-4 py-3 text-center cursor-pointer transition-all flex flex-col items-center">
                                        <i className="fa-solid fa-camera text-rc-muted text-lg mb-1"></i>
                                        <span className="text-[8px] font-bold tracking-widest text-rc-muted uppercase truncate block w-full">
                                            {avatarFile ? avatarFile.name : 'PILIH FILE'}
                                        </span>
                                        <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0])} className="hidden" />
                                    </label>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold tracking-[0.2em] text-rc-muted uppercase block mb-2 text-center">Ganti Wallpaper Banner</label>
                                    <label className="w-full bg-rc-bg/50 border-[0.5px] border-rc-main/20 hover:border-rc-logo/30 rounded-xl px-4 py-3 text-center cursor-pointer transition-all flex flex-col items-center">
                                        <i className="fa-solid fa-image text-rc-muted text-lg mb-1"></i>
                                        <span className="text-[8px] font-bold tracking-widest text-rc-muted uppercase truncate block w-full">
                                            {bannerFile ? bannerFile.name : 'PILIH FILE'}
                                        </span>
                                        <input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files[0])} className="hidden" />
                                    </label>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-rc-logo to-yellow-500 text-rc-bg font-black uppercase tracking-widest text-xs lg:text-sm py-4 lg:py-5 rounded-xl hover:shadow-lg hover:shadow-yellow-500/30 transition-all mt-4 shadow-md disabled:opacity-50">
                                {loading ? <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> : <i className="fa-solid fa-check mr-2"></i>}
                                {loading ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
