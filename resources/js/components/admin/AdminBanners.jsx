import React from 'react';
import { ImageIcon, Plus, Save, Trash2, GripVertical } from 'lucide-react';

export default function AdminBanners({ 
    banners, 
    newBanner, 
    setNewBanner, 
    handleCreateBanner, 
    handleDeleteBanner, 
    handleUpdateBanner,
    editBannerId,
    setEditBannerId,
    uploading,
    draggedIdx,
    setDraggedIdx,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    hasUnsavedReorder,
    saveReorder,
    isSavingReorder
}) {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header with Reorder Save Button */}
            <div className="flex justify-between items-center bg-rc-card p-4 rounded-xl border border-rc-main/10">
                <div>
                    <h3 className="text-sm font-black text-rc-main uppercase tracking-widest">Manajemen Banner</h3>
                    <p className="text-[10px] text-rc-muted uppercase font-bold tracking-wider">Tarik dan lepas untuk mengatur urutan tampil</p>
                </div>
                {hasUnsavedReorder && (
                    <button 
                        onClick={saveReorder} 
                        disabled={isSavingReorder}
                        className="bg-rc-logo text-rc-bg px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg animate-bounce"
                    >
                        {isSavingReorder ? 'Menyimpan...' : 'Simpan Urutan Baru'}
                    </button>
                )}
            </div>

            {/* Form Add/Edit */}
            <div className="bg-rc-card p-6 rounded-2xl border border-rc-main/10">
                <h4 className="text-[10px] font-black text-rc-muted uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Plus className="w-3 h-3" /> {editBannerId ? 'Edit Banner' : 'Tambah Banner Baru'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="lg:col-span-1">
                        <label className="block text-[10px] font-black text-rc-muted uppercase tracking-wider mb-2">Pilih Gambar (WebP Recommended)</label>
                        <input 
                            type="file" 
                            onChange={e => setNewBanner({ ...newBanner, image: e.target.files[0] })}
                            className="w-full bg-rc-bg border border-rc-main/10 p-2 rounded-xl text-[10px] text-rc-muted outline-none file:bg-rc-main/10 file:border-0 file:text-rc-main file:text-[10px] file:font-black file:uppercase file:px-3 file:py-1 file:mr-2 file:rounded-lg cursor-pointer"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-rc-muted uppercase tracking-wider mb-2">Judul (Opsional)</label>
                        <input 
                            type="text" 
                            value={newBanner.title} 
                            onChange={e => setNewBanner({ ...newBanner, title: e.target.value })}
                            className="w-full bg-rc-bg border border-rc-main/10 p-2 text-xs rounded-xl text-rc-main outline-none focus:border-rc-logo transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-rc-muted uppercase tracking-wider mb-2">Deskripsi (Opsional)</label>
                        <input 
                            type="text" 
                            value={newBanner.description} 
                            onChange={e => setNewBanner({ ...newBanner, description: e.target.value })}
                            className="w-full bg-rc-bg border border-rc-main/10 p-2 text-xs rounded-xl text-rc-main outline-none focus:border-rc-logo transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={editBannerId ? handleUpdateBanner : handleCreateBanner} 
                            disabled={uploading}
                            className="flex-1 bg-rc-logo text-rc-bg font-black text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-yellow-400 transition-all shadow-lg"
                        >
                            {uploading ? 'PROSES...' : editBannerId ? 'UPDATE BANNER' : 'SIMPAN BANNER'}
                        </button>
                        {editBannerId && (
                            <button 
                                onClick={() => { setEditBannerId(null); setNewBanner({ title: '', description: '', image: null }); }}
                                className="px-4 bg-rc-main/10 text-rc-muted rounded-xl hover:bg-rc-main/20"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Banner List (Draggable) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banners.map((b, idx) => (
                    <div 
                        key={b.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={`bg-rc-card rounded-2xl border border-rc-main/10 overflow-hidden group cursor-grab active:cursor-grabbing transition-all duration-300 ${draggedIdx === idx ? 'opacity-30 scale-95 border-rc-logo' : 'opacity-100 hover:border-rc-logo/30 shadow-lg'}`}
                    >
                        <div className="relative aspect-[16/9]">
                            <img src={b.full_url} className="w-full h-full object-cover" alt={b.title} />
                            <div className="absolute top-3 left-3 bg-rc-bg/80 backdrop-blur-md p-2 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <GripVertical className="w-4 h-4 text-rc-logo" />
                            </div>
                            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditBannerId(b.id); setNewBanner({ title: b.title || '', description: b.description || '', image: null }); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="p-2 bg-blue-500 rounded-lg text-white hover:bg-blue-600 transition-all"><Plus className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteBanner(b.id)} className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div className="p-4 bg-rc-bg/50">
                            <h5 className="text-xs font-black text-rc-main uppercase truncate mb-1">{b.title || 'TANPA JUDUL'}</h5>
                            <p className="text-[10px] text-rc-muted truncate">{b.description || 'Tidak ada deskripsi'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function X(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
