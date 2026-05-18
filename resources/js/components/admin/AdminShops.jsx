import React from 'react';
import { Search, Warehouse, MapPin, ShieldCheck, Clock } from 'lucide-react';

export default function AdminShops({ shopsList, searchShops, setSearchShops, handleMitraAction, pageShops, totalPagesShops, fetchShops }) {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex bg-rc-card p-2 rounded-xl border border-rc-main/10 items-center">
                <Search className="mx-3 text-rc-muted w-4 h-4" />
                <input
                    type="text"
                    placeholder="Cari nama toko atau pemilik..."
                    value={searchShops}
                    onChange={(e) => setSearchShops(e.target.value)}
                    className="bg-transparent outline-none text-sm font-medium flex-1 text-rc-main"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {shopsList.map((shop) => (
                    <div key={shop.id} className="bg-rc-card rounded-2xl border border-rc-main/10 p-6 hover:border-rc-logo/30 transition-all duration-300 group shadow-lg">
                        <div className="flex gap-6">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-rc-bg border border-rc-main/10 relative">
                                <img src={shop.full_logo_url} className="w-full h-full object-cover" alt="" />
                                <div className="absolute top-1 right-1">
                                    {shop.is_verified ? (
                                        <div className="bg-rc-logo p-1 rounded-full shadow-lg" title="Toko Raden Terverifikasi">
                                            <ShieldCheck className="w-3 h-3 text-rc-bg" />
                                        </div>
                                    ) : (
                                        <div className="bg-rc-muted p-1 rounded-full shadow-lg" title="Toko Reguler">
                                            <Clock className="w-3 h-3 text-rc-bg" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-sm font-black text-rc-main uppercase tracking-tight group-hover:text-rc-logo transition-colors">{shop.nama_toko}</h3>
                                        <p className="text-[10px] text-rc-muted font-bold uppercase tracking-widest flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {shop.region?.name || 'Wilayah Belum Diatur'}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${shop.is_verified ? 'bg-rc-logo text-rc-bg' : 'bg-rc-main/10 text-rc-muted'}`}>
                                        {shop.is_verified ? 'RADEN' : 'REGULER'}
                                    </span>
                                </div>
                                <div className="space-y-2 mt-4 pt-4 border-t border-rc-main/5">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                        <span className="text-rc-muted">Pemilik</span>
                                        <span className="text-rc-main">{shop.user?.name}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                        <span className="text-rc-muted">Bergabung</span>
                                        <span className="text-rc-main">{new Date(shop.created_at).toLocaleDateString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-8">
                <button disabled={pageShops <= 1} onClick={() => fetchShops(pageShops - 1)} className="px-6 py-2 bg-rc-card text-rc-main text-xs font-black uppercase tracking-widest rounded-xl border border-rc-main/10 disabled:opacity-50 hover:bg-rc-logo hover:text-rc-bg transition-all">Sebelumnya</button>
                <span className="text-rc-muted text-xs font-bold uppercase tracking-widest">Halaman {pageShops} dari {totalPagesShops}</span>
                <button disabled={pageShops >= totalPagesShops} onClick={() => fetchShops(pageShops + 1)} className="px-6 py-2 bg-rc-card text-rc-main text-xs font-black uppercase tracking-widest rounded-xl border border-rc-main/10 disabled:opacity-50 hover:bg-rc-logo hover:text-rc-bg transition-all">Berikutnya</button>
            </div>
        </div>
    );
}
