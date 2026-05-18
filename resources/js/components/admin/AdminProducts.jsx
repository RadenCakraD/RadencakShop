import React, { useState } from 'react';
import { Bolt, Search, Save, CheckCircle2, Clock, ShieldAlert, Timer, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminProducts({ 
    products, 
    searchFlashSale, 
    setSearchFlashSale, 
    flashSaleDrafts, 
    setFlashSaleDrafts, 
    handleBulkFlashSale, 
    isSavingFlashSale,
    pageProducts,
    totalPagesProducts,
    fetchProducts
}) {
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [filterTab, setFilterTab] = useState('all'); // all, active, inactive

    const handleDraftToggle = (id, currentStatus) => {
        const newStatus = flashSaleDrafts[id] !== undefined ? !flashSaleDrafts[id] : !currentStatus;
        const newDrafts = { ...flashSaleDrafts, [id]: newStatus };
        
        // If the new status is the same as the original status, remove it from drafts
        if (newStatus === currentStatus) {
            delete newDrafts[id];
        }
        
        setFlashSaleDrafts(newDrafts);
    };

    const handleSelectAll = (activate) => {
        const newDrafts = { ...flashSaleDrafts };
        products.forEach(p => {
            const isExpired = p.flash_sale_end && new Date(p.flash_sale_end) < new Date();
            const originalStatus = p.is_flash_sale && !isExpired;
            if (activate) {
                if (!originalStatus) newDrafts[p.id] = true;
                else delete newDrafts[p.id];
            } else {
                if (originalStatus) newDrafts[p.id] = false;
                else delete newDrafts[p.id];
            }
        });
        setFlashSaleDrafts(newDrafts);
    };

    const hasDrafts = Object.keys(flashSaleDrafts).length > 0;

    const filteredProducts = products.filter(p => {
        const isExpired = p.flash_sale_end && new Date(p.flash_sale_end) < new Date();
        const isActive = p.is_flash_sale && !isExpired;
        if (filterTab === 'active') return isActive;
        if (filterTab === 'inactive') return !isActive;
        return true;
    });

    const onSaveClick = () => {
        const isAnyActivating = Object.values(flashSaleDrafts).some(v => v === true);
        if (isAnyActivating && (!startTime || !endTime)) {
            alert("Silakan atur waktu mulai dan berakhir flash sale untuk produk yang akan diaktifkan.");
            return;
        }
        setIsConfirmOpen(true);
    };

    const confirmSave = () => {
        handleBulkFlashSale(startTime, endTime);
        setIsConfirmOpen(false);
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleString('id-ID', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Timer Global Settings */}
            <div className="bg-rc-card p-8 rounded-[2rem] border border-rc-logo/30 shadow-2xl relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rc-logo/5 rounded-full blur-2xl"></div>
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-rc-logo/10 rounded-2xl text-rc-logo">
                            <Timer className="w-8 h-8 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase text-rc-main tracking-widest">Pengaturan Waktu Global</h3>
                            <p className="text-[10px] text-rc-muted font-bold uppercase tracking-widest">Tentukan periode flash sale untuk produk terpilih.</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-end gap-4 w-full lg:w-auto">
                        <div className="flex flex-col gap-2 w-full sm:w-auto">
                            <label className="text-[10px] font-black uppercase text-rc-muted px-2">Waktu Mulai</label>
                            <input 
                                type="datetime-local" 
                                value={startTime} 
                                onChange={e => setStartTime(e.target.value)}
                                className="bg-rc-bg border-2 border-rc-main/10 p-4 rounded-2xl text-xs font-black text-rc-main outline-none focus:border-rc-logo transition-all w-full"
                            />
                        </div>
                        <div className="flex flex-col gap-2 w-full sm:w-auto">
                            <label className="text-[10px] font-black uppercase text-rc-muted px-2">Waktu Berakhir</label>
                            <input 
                                type="datetime-local" 
                                value={endTime} 
                                min={startTime}
                                onChange={e => setEndTime(e.target.value)}
                                className="bg-rc-bg border-2 border-rc-main/10 p-4 rounded-2xl text-xs font-black text-rc-main outline-none focus:border-rc-logo transition-all w-full"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => {
                                    const now = new Date();
                                    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                                    
                                    const toLocalISO = (date) => {
                                        const offset = date.getTimezoneOffset() * 60000;
                                        const localISOTime = (new Date(date - offset)).toISOString().slice(0, 16);
                                        return localISOTime;
                                    };

                                    setStartTime(toLocalISO(now));
                                    setEndTime(toLocalISO(tomorrow));
                                }}
                                className="bg-rc-logo/10 text-rc-logo p-4 rounded-2xl hover:bg-rc-logo hover:text-rc-bg transition-all"
                                title="Set 24 Jam"
                            >
                                <Clock className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => { setStartTime(''); setEndTime(''); }}
                                className="bg-red-500/10 text-red-500 p-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                                title="Hapus Waktu"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Control Header & Tabs */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex-1 w-full relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rc-muted" />
                        <input 
                            type="text" 
                            placeholder="Cari produk..." 
                            value={searchFlashSale}
                            onChange={(e) => setSearchFlashSale(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-rc-bg border border-rc-main/10 rounded-xl text-xs font-bold text-rc-main outline-none focus:border-rc-logo transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleSelectAll(true)} className="px-4 py-2 bg-rc-main/10 text-rc-main text-[9px] font-black uppercase rounded-lg hover:bg-rc-logo hover:text-rc-bg transition-all">Aktifkan Semua Hal.</button>
                        <button onClick={() => handleSelectAll(false)} className="px-4 py-2 bg-rc-main/10 text-rc-main text-[9px] font-black uppercase rounded-lg hover:bg-red-500 hover:text-white transition-all">Nonaktifkan Semua Hal.</button>
                    </div>
                    <div className="flex bg-rc-card p-1 rounded-xl border border-rc-main/10">
                        <button onClick={() => setFilterTab('all')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterTab === 'all' ? 'bg-rc-logo text-rc-bg' : 'text-rc-muted'}`}>Semua</button>
                        <button onClick={() => setFilterTab('active')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterTab === 'active' ? 'bg-green-500 text-white' : 'text-rc-muted'}`}>Aktif</button>
                        <button onClick={() => setFilterTab('inactive')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterTab === 'inactive' ? 'bg-rc-main/20 text-rc-main' : 'text-rc-muted'}`}>Belum Aktif</button>
                    </div>
                    {hasDrafts && (
                        <button 
                            onClick={onSaveClick}
                            disabled={isSavingFlashSale}
                            className="w-full md:w-auto bg-rc-logo text-rc-bg px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" /> {isSavingFlashSale ? 'MEMPROSES...' : 'SIMPAN PERUBAHAN'}
                        </button>
                    )}
                </div>
            </div>

            {/* Product List - Mobile: Swipeable Cards, Desktop: Table */}
            <div className="md:hidden space-y-4">
                <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-black uppercase text-rc-muted tracking-widest">Geser untuk melihat ({filteredProducts.length})</p>
                    <div className="flex gap-1">
                        <div className="w-4 h-1 bg-rc-logo rounded-full"></div>
                        <div className="w-1 h-1 bg-rc-main/20 rounded-full"></div>
                    </div>
                </div>
                <div className="overflow-hidden">
                    <motion.div 
                        drag="x"
                        dragConstraints={{ right: 0, left: -(filteredProducts.length * 280) }}
                        className="flex gap-4 pb-10 px-2 cursor-grab active:cursor-grabbing"
                        style={{ width: 'max-content' }}
                    >
                        {filteredProducts.map((p, idx) => {
                            const isExpired = p.flash_sale_end && new Date(p.flash_sale_end) < new Date();
                            const originalStatus = p.is_flash_sale && !isExpired;
                            const isDraftActive = flashSaleDrafts[p.id] !== undefined ? flashSaleDrafts[p.id] : originalStatus;
                            return (
                                <motion.div 
                                    key={p.id} 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex-shrink-0 w-[280px] bg-rc-card border border-rc-main/10 rounded-3xl p-6 relative overflow-hidden group shadow-xl"
                                >
                                    {isDraftActive && <div className="absolute top-0 right-0 w-24 h-24 bg-rc-logo/5 blur-3xl rounded-full"></div>}
                                    <div className="flex gap-4 mb-6">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-rc-bg border border-rc-main/10 relative shrink-0">
                                            <img src={p.primary_image} className="w-full h-full object-cover" alt="" />
                                            {isDraftActive && <div className="absolute inset-0 bg-rc-logo/10 animate-pulse"></div>}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-black text-rc-main uppercase text-[11px] leading-tight mb-1 line-clamp-2">{p.nama_produk}</h4>
                                            <p className="text-[9px] text-rc-muted font-bold uppercase tracking-widest truncate">{p.shop?.nama_toko}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[9px] font-black text-rc-muted uppercase mb-1">Harga Jual</p>
                                            <p className="text-sm font-black text-rc-logo tracking-tighter">Rp {p.harga_jual?.toLocaleString()}</p>
                                        </div>
                                        {p.is_flash_sale && (
                                            <div className="text-right">
                                                {p.flash_sale_end && new Date(p.flash_sale_end) < new Date() ? (
                                                    <span className="text-[8px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded">EXPIRED</span>
                                                ) : (
                                                    <>
                                                        <p className="text-[7px] font-black text-green-500 uppercase">Hingga</p>
                                                        <p className="text-[9px] font-bold text-rc-main">{formatDateTime(p.flash_sale_end)}</p>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => handleDraftToggle(p.id, originalStatus)}
                                            className={`w-12 h-6 rounded-full relative transition-all duration-300 ${isDraftActive ? 'bg-rc-logo' : 'bg-rc-main/20'}`}
                                        >
                                            <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 ${isDraftActive ? 'right-0.5 bg-rc-bg' : 'left-0.5 bg-rc-muted'}`}></div>
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-rc-card border border-rc-main/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-rc-bg border-b border-rc-main/10 text-[10px] uppercase text-rc-muted tracking-[0.2em]">
                            <tr>
                                <th className="p-5 font-black">Produk</th>
                                <th className="p-5 font-black text-center">Periode</th>
                                <th className="p-5 font-black">Harga</th>
                                <th className="p-5 font-black text-center">Flash Sale</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs text-rc-main">
                            {filteredProducts.map((p, i) => {
                                const isExpired = p.flash_sale_end && new Date(p.flash_sale_end) < new Date();
                                const originalStatus = p.is_flash_sale && !isExpired;
                                const isDraftActive = flashSaleDrafts[p.id] !== undefined ? flashSaleDrafts[p.id] : originalStatus;
                                return (
                                    <tr key={p.id} className={`${i % 2 === 0 ? 'bg-rc-card' : 'bg-rc-card/50'} border-b border-rc-main/5 hover:bg-rc-main/5 transition-colors group`}>
                                        <td className="p-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-rc-bg border border-rc-main/10 relative">
                                                    <img src={p.primary_image} className="w-full h-full object-cover" alt="" />
                                                    {isDraftActive && <div className="absolute inset-0 bg-rc-logo/20 animate-pulse"></div>}
                                                </div>
                                                <div>
                                                    <p className="font-black text-rc-main uppercase tracking-tight line-clamp-1">{p.nama_produk}</p>
                                                    <p className="text-[10px] text-rc-muted font-bold uppercase tracking-widest">{p.shop?.nama_toko}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-center">
                                            {p.is_flash_sale ? (
                                                <div className={`text-[10px] font-bold uppercase flex flex-col items-center ${p.flash_sale_end && new Date(p.flash_sale_end) < new Date() ? 'text-red-500 opacity-60' : 'text-green-500'}`}>
                                                    <span className={p.flash_sale_end && new Date(p.flash_sale_end) < new Date() ? 'line-through' : ''}>{formatDateTime(p.flash_sale_start)}</span>
                                                    <span className="text-[8px] opacity-50">S/D</span>
                                                    <span className={p.flash_sale_end && new Date(p.flash_sale_end) < new Date() ? 'line-through' : ''}>{formatDateTime(p.flash_sale_end)}</span>
                                                    {p.flash_sale_end && new Date(p.flash_sale_end) < new Date() && (
                                                        <span className="text-[7px] font-black text-red-500 bg-red-500/10 px-1 py-0.5 rounded mt-0.5">BERAKHIR</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-rc-muted opacity-30 text-[9px] font-black uppercase">Belum Diatur</span>
                                            )}
                                        </td>
                                        <td className="p-5 font-black text-rc-logo">Rp {p.harga_jual?.toLocaleString()}</td>
                                        <td className="p-5">
                                            <div className="flex justify-center">
                                                <button 
                                                    onClick={() => handleDraftToggle(p.id, originalStatus)}
                                                    className={`w-14 h-7 rounded-full relative transition-all duration-300 shadow-inner ${isDraftActive ? 'bg-rc-logo' : 'bg-rc-main/20'}`}
                                                >
                                                    <div className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-300 shadow-md ${isDraftActive ? 'right-1 bg-rc-bg' : 'left-1 bg-rc-muted'}`}></div>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-8">
                <button disabled={pageProducts <= 1} onClick={() => fetchProducts(pageProducts - 1)} className="px-6 py-2 bg-rc-card text-rc-main text-xs font-black uppercase tracking-widest rounded-xl border border-rc-main/10 disabled:opacity-50 hover:bg-rc-logo hover:text-rc-bg transition-all">Sebelumnya</button>
                <span className="text-rc-muted text-xs font-bold uppercase tracking-widest">Halaman {pageProducts} dari {totalPagesProducts}</span>
                <button disabled={pageProducts >= totalPagesProducts} onClick={() => fetchProducts(pageProducts + 1)} className="px-6 py-2 bg-rc-card text-rc-main text-xs font-black uppercase tracking-widest rounded-xl border border-rc-main/10 disabled:opacity-50 hover:bg-rc-logo hover:text-rc-bg transition-all">Berikutnya</button>
            </div>

            {/* Confirmation Modal */}
            {isConfirmOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-rc-bg/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-rc-card w-full max-w-md p-10 rounded-[2.5rem] border border-rc-logo/30 shadow-[0_0_50px_rgba(255,204,0,0.2)] text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-rc-logo animate-pulse"></div>
                        <div className="w-20 h-20 bg-rc-logo/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-rc-logo/20">
                            <ShieldAlert className="w-10 h-10 text-rc-logo" />
                        </div>
                        <h3 className="text-xl font-black text-rc-main uppercase tracking-tighter mb-4">Konfirmasi Perubahan</h3>
                        <p className="text-xs text-rc-muted font-bold uppercase tracking-widest leading-relaxed mb-10">
                            Anda akan memperbarui status flash sale untuk produk yang dipilih. Pastikan waktu mulai dan berakhir sudah benar untuk menghindari kesalahan sistem.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setIsConfirmOpen(false)} className="px-6 py-4 bg-rc-bg border border-rc-main/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-rc-muted hover:text-rc-main transition-all">Batal</button>
                            <button onClick={confirmSave} className="px-6 py-4 bg-rc-logo text-rc-bg rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rc-logo/20 hover:scale-105 transition-all">Ya, Simpan!</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
