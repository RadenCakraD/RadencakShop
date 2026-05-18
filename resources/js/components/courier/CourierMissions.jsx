import React from 'react';
import { Package, Truck, MapPin, ArrowUpRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';

export default function CourierMissions({ pickups, deliveries, handlePickup, handleDeliver }) {
    return (
        <div className="space-y-12">
            {/* Pickup Missions */}
            <div>
                <h3 className="text-sm font-black uppercase text-rc-main tracking-[0.2em] mb-6 flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    Misi Penjemputan Toko
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pickups.map(p => (
                        <div key={p.id} className="bg-rc-card border border-rc-main/10 rounded-3xl p-6 hover:shadow-2xl transition-all duration-500 group overflow-hidden">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">Pick-up</p>
                                    <h4 className="font-bold text-rc-main text-sm">#{p.order_number}</h4>
                                </div>
                                <div className="p-2 bg-rc-bg rounded-lg border border-rc-main/10 group-hover:border-yellow-500/30 transition-colors">
                                    <Package className="w-4 h-4 text-rc-muted group-hover:text-yellow-500" />
                                </div>
                            </div>
                            
                            <div className="space-y-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-rc-muted shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[11px] font-bold text-rc-main leading-tight mb-0.5 uppercase">{p.shop?.nama_toko}</p>
                                        <p className="text-[10px] font-bold text-rc-logo leading-tight mb-0.5"><i className="fa-solid fa-map-pin mr-1"></i>Kec. {p.origin_district || '-'}, Prov. {p.origin_province || '-'}</p>
                                        <p className="text-[10px] text-rc-muted leading-tight">{p.shop?.alamat_toko}</p>
                                    </div>
                                </div>
                            </div>

                            {p.shop?.latitude && p.shop?.longitude && (
                                <div className="space-y-3 mb-6">
                                    <div className="w-full h-32 rounded-2xl overflow-hidden border border-rc-main/5 relative">
                                        <MapContainer center={[p.shop.latitude, p.shop.longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <Marker position={[p.shop.latitude, p.shop.longitude]} />
                                        </MapContainer>
                                        <div className="absolute top-2 right-2 z-[1000] bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[8px] font-bold text-white border border-white/10 uppercase tracking-tighter">
                                            {p.shop.latitude.toString().slice(0, 8)}, {p.shop.longitude.toString().slice(0, 8)}
                                        </div>
                                    </div>
                                    <a 
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${p.shop.latitude},${p.shop.longitude}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-rc-bg border border-rc-main/10 rounded-xl text-[10px] font-black text-rc-main uppercase hover:bg-rc-logo hover:text-rc-bg transition-all"
                                    >
                                        <MapPin className="w-3.5 h-3.5" /> Buka Navigasi (Google Maps)
                                    </a>
                                </div>
                            )}

                            <button onClick={() => handlePickup(p.id)} className="w-full bg-yellow-500 text-black font-black text-[10px] py-4 rounded-2xl uppercase tracking-widest shadow-lg shadow-yellow-500/10 hover:scale-[1.02] active:scale-95 transition-all">
                                Konfirmasi Diambil
                            </button>
                        </div>
                    ))}
                    {pickups.length === 0 && <div className="col-span-full py-16 text-center text-rc-muted uppercase font-black text-[10px] border border-dashed border-rc-main/10 rounded-3xl">Radar Bersih (Tidak ada jemputan)</div>}
                </div>
            </div>

            {/* Delivery Missions */}
            <div>
                <h3 className="text-sm font-black uppercase text-rc-main tracking-[0.2em] mb-6 flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    Misi Pengantaran Pembeli
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {deliveries.map(d => (
                        <div key={d.id} className="bg-rc-card border border-rc-main/10 rounded-3xl p-6 hover:shadow-2xl transition-all duration-500 group overflow-hidden">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Delivery</p>
                                    <h4 className="font-bold text-rc-main text-sm">#{d.order_number}</h4>
                                </div>
                                <div className="p-2 bg-rc-bg rounded-lg border border-rc-main/10 group-hover:border-blue-500/30 transition-colors">
                                    <Truck className="w-4 h-4 text-rc-muted group-hover:text-blue-500" />
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-rc-muted shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[11px] font-bold text-rc-main leading-tight mb-0.5 uppercase">{d.user?.name}</p>
                                        <p className="text-[10px] font-bold text-blue-500 leading-tight mb-0.5"><i className="fa-solid fa-map-pin mr-1"></i>Kec. {d.destination_district || '-'}, Prov. {d.destination_province || '-'}</p>
                                        <p className="text-[10px] text-rc-muted leading-tight">{d.address_info}</p>
                                    </div>
                                </div>
                            </div>

                            {d.shipping_latitude && d.shipping_longitude && (
                                <div className="w-full h-32 rounded-2xl overflow-hidden border border-rc-main/5 mb-6 relative">
                                    <MapContainer center={[d.shipping_latitude, d.shipping_longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <Marker position={[d.shipping_latitude, d.shipping_longitude]} />
                                    </MapContainer>
                                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${d.shipping_latitude},${d.shipping_longitude}`} target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 z-[1000] bg-rc-bg/80 backdrop-blur-md p-1.5 rounded-lg border border-rc-main/10">
                                        <ArrowUpRight className="w-3.5 h-3.5 text-rc-main" />
                                    </a>
                                </div>
                            )}

                            <button onClick={() => handleDeliver(d.id)} className="w-full bg-blue-500 text-white font-black text-[10px] py-4 rounded-2xl uppercase tracking-widest shadow-lg shadow-blue-500/10 hover:scale-[1.02] active:scale-95 transition-all">
                                Konfirmasi Terantar
                            </button>
                        </div>
                    ))}
                    {deliveries.length === 0 && <div className="col-span-full py-16 text-center text-rc-muted uppercase font-black text-[10px] border border-dashed border-rc-main/10 rounded-3xl">Antrian Bersih (Semua terkirim)</div>}
                </div>
            </div>
        </div>
    );
}
