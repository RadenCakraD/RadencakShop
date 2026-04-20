import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AddProductModal({ isOpen, onClose, onSuccess, initialProduct = null }) {
    if (!isOpen) return null;

    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([]);
    const [variants, setVariants] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [deletedImageIds, setDeletedImageIds] = useState([]);
    
    const [formData, setFormData] = useState({
        nama_produk: '', kategori: 'Elektronik', kondisi: 'baru', 
        berat: '', harga_dasar: '', harga_jual: '', stok: '', deskripsi: ''
    });

    useEffect(() => {
        if (initialProduct) {
            setFormData({
                nama_produk: initialProduct.nama_produk || '',
                kategori: initialProduct.kategori || 'Elektronik',
                kondisi: initialProduct.kondisi || 'baru',
                berat: initialProduct.berat || '',
                harga_dasar: initialProduct.harga_dasar || '',
                harga_jual: initialProduct.harga_jual || '',
                stok: initialProduct.stok || '',
                deskripsi: initialProduct.deskripsi || ''
            });

            if (initialProduct.variants) {
                setVariants(initialProduct.variants.map((v, i) => ({
                    id: v.id || Date.now() + i,
                    nama: v.nama_jenis || '',
                    harga_asli: v.harga_asli || '',
                    harga_jual: v.harga_jual || '',
                    stok: v.stok || '',
                    imageFile: null,
                    existingImage: v.image_url
                })));
            } else {
                setVariants([]);
            }

            if (initialProduct.images) {
                setExistingImages(initialProduct.images);
            }
            setImages([]); 
        } else {
            setFormData({
                nama_produk: '', kategori: 'Elektronik', kondisi: 'baru', 
                berat: '', harga_dasar: '', harga_jual: '', stok: '', deskripsi: ''
            });
            setVariants([]);
            setImages([]);
            setExistingImages([]);
            setDeletedImageIds([]);
        }

        // PHYSICAL RESET: Ensure input file is empty on mount/change
        const fileInput = document.getElementById('product-image-input');
        if (fileInput) fileInput.value = '';

        return () => {
            // Cleanup on Unmount
            setImages([]);
            setExistingImages([]);
            setDeletedImageIds([]);
            const fileInput = document.getElementById('product-image-input');
            if (fileInput) fileInput.value = '';
        };
    }, [initialProduct, isOpen]);

    const handleInput = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setImages((prev) => [...prev, ...files]);
    };
    
    const removeImage = (index) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleRemoveExistingImage = (id) => {
        setDeletedImageIds((prev) => [...prev, id]);
        setExistingImages((prev) => prev.filter((img) => img.id !== id));
    };

    const addVariantRow = () => {
        setVariants([...variants, { id: Date.now(), nama: '', harga_asli: '', harga_jual: '', stok: '', imageFile: null }]);
    };

    const updateVariant = (id, field, value) => {
        setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    const removeVariant = (id) => setVariants(variants.filter(v => v.id !== id));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        
        images.forEach((file) => data.append('images[]', file));
        deletedImageIds.forEach((id) => data.append('deleted_image_ids[]', id));
        
        if (variants.length === 0 && initialProduct) {
             data.append('clear_variants', 1);
        }

        variants.forEach((v, index) => {
            data.append(`variants[${index}][nama]`, v.nama);
            if (v.harga_asli) data.append(`variants[${index}][harga_asli]`, v.harga_asli);
            data.append(`variants[${index}][harga_jual]`, v.harga_jual);
            data.append(`variants[${index}][stok]`, v.stok);
            if (v.imageFile) data.append(`variants[${index}][image]`, v.imageFile);
        });

        const url = initialProduct 
            ? `/api/shop/product/update/${initialProduct.id}` 
            : '/api/shop/product/add';

        try {
            await axios.post(url, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onSuccess();
            onClose();
        } catch (err) {
            alert("Gagal menyimpan produk. Cek form.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto font-sans">
            <div className="bg-rc-bg rounded-xl shadow-2xl shadow-rc-logo/20 border-[0.5px] border-rc-main/30 w-full max-w-4xl my-8 overflow-hidden flex flex-col max-h-full">
                
                <div className="flex justify-between items-center p-6 border-b-[0.5px] border-rc-main/20 flex-shrink-0 bg-rc-card sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-rc-logo flex items-center gap-2">
                        <i className="fa-solid fa-box-open"></i> {initialProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                    </h2>
                    <button onClick={onClose} className="text-rc-muted hover:text-red-500 transition text-2xl leading-none">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden text-rc-main">
                    <div className="p-6 overflow-y-auto space-y-6">
                        
                        <div className="space-y-2">
                            <label className="font-semibold text-rc-main block">Foto Produk</label>
                            <div className="flex flex-wrap gap-4 items-start">
                                {existingImages.map((img) => (
                                    <div key={img.id} className="relative w-20 h-20 rounded-lg overflow-hidden border-[0.5px] border-rc-main/30 shadow-sm">
                                        <img src={`/storage/${img.image_url}`} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => handleRemoveExistingImage(img.id)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-80 hover:opacity-100">&times;</button>
                                    </div>
                                ))}
                                {images.map((img, i) => (
                                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border-[0.5px] border-rc-main/30 shadow-sm">
                                        <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-80 hover:opacity-100">&times;</button>
                                    </div>
                                ))}
                                <label className="w-20 h-20 border-[2px] border-dashed border-rc-main/30 hover:border-rc-logo rounded-lg flex items-center justify-center cursor-pointer bg-rc-card hover:bg-rc-bg transition text-rc-logo">
                                    <i className="fa-solid fa-plus text-xl"></i>
                                    <input id="product-image-input" type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-semibold text-rc-muted block mb-1 uppercase">Nama Produk</label>
                                <input type="text" name="nama_produk" value={formData.nama_produk} onChange={handleInput} required className="w-full bg-rc-card border-[0.5px] border-rc-main/30 rounded-lg px-4 py-2 focus:ring-1 focus:ring-rc-logo focus:border-rc-logo outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-rc-muted block mb-1 uppercase">Kategori</label>
                                    <select name="kategori" value={formData.kategori} onChange={handleInput} className="w-full bg-rc-card border-[0.5px] border-rc-main/30 rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-rc-logo">
                                        <option value="Elektronik">Elektronik</option>
                                        <option value="Pakaian">Pakaian</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-rc-muted block mb-1 uppercase">Kondisi</label>
                                    <select name="kondisi" value={formData.kondisi} onChange={handleInput} className="w-full bg-rc-card border-[0.5px] border-rc-main/30 rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-rc-logo">
                                        <option value="baru">Baru</option>
                                        <option value="bekas">Bekas</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-rc-muted block mb-1 uppercase">Harga Coret</label>
                                <input type="number" name="harga_dasar" value={formData.harga_dasar} onChange={handleInput} className="w-full bg-rc-card border-[0.5px] border-rc-main/30 rounded-lg px-4 py-2 focus:ring-1 focus:ring-rc-logo outline-none" placeholder="100000" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-rc-logo block mb-1 uppercase">Harga Jual Asli *</label>
                                <input type="number" name="harga_jual" value={formData.harga_jual} onChange={handleInput} required className="w-full bg-rc-card border-[1px] border-rc-logo rounded-lg px-4 py-2 focus:ring-1 focus:ring-rc-logo outline-none" placeholder="90000" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-rc-muted block mb-1 uppercase">Stok</label>
                                <input type="number" name="stok" value={formData.stok} onChange={handleInput} required className="w-full bg-rc-card border-[0.5px] border-rc-main/30 rounded-lg px-4 py-2 outline-none focus:border-rc-logo" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-rc-muted block mb-1 uppercase">Berat (Gram)</label>
                                <input type="number" name="berat" value={formData.berat} onChange={handleInput} required className="w-full bg-rc-card border-[0.5px] border-rc-main/30 rounded-lg px-4 py-2 outline-none focus:border-rc-logo" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-rc-muted block mb-1 uppercase">Deskripsi</label>
                            <textarea name="deskripsi" value={formData.deskripsi} onChange={handleInput} required rows="4" className="w-full bg-rc-card border-[0.5px] border-rc-main/30 rounded-lg px-4 py-2 focus:ring-1 focus:ring-rc-logo outline-none"></textarea>
                        </div>

                        <div className="bg-rc-card p-6 rounded-xl border-[0.5px] border-rc-main/30">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="font-bold text-rc-main">Variasi Produk (Opsional)</h3>
                                    <p className="text-xs text-rc-muted">Tambahkan ukuran, warna, spek berbeda beserta harganya</p>
                                </div>
                                <button type="button" onClick={addVariantRow} className="text-rc-logo font-bold bg-rc-logo/10 hover:bg-rc-logo hover:text-rc-bg px-4 py-2 rounded-lg border-[0.5px] border-rc-logo transition text-sm flex items-center gap-2">
                                    <i className="fa-solid fa-plus"></i> Varian
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {variants.map((v, idx) => (
                                    <div key={v.id} className="relative bg-rc-bg p-4 rounded-lg border-[0.5px] border-rc-main/20 flex flex-col md:flex-row gap-4 items-end">
                                        <button type="button" onClick={() => removeVariant(v.id)} className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700">&times;</button>
                                        
                                        <div className="w-16 h-16 bg-rc-card border-[1px] border-dashed border-rc-main/50 rounded-md flex-shrink-0 relative overflow-hidden group cursor-pointer">
                                            {v.imageFile ? (
                                                <img src={URL.createObjectURL(v.imageFile)} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-rc-muted group-hover:text-rc-logo"><i className="fa-solid fa-camera"></i></div>
                                            )}
                                            <input type="file" onChange={(e) => updateVariant(v.id, 'imageFile', e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        </div>

                                        <div className="flex-1 w-full">
                                            <label className="text-xs text-rc-muted mb-1 block">Nama Varian</label>
                                            <input type="text" value={v.nama} onChange={(e) => updateVariant(v.id, 'nama', e.target.value)} required className="w-full bg-rc-card border-[0.5px] border-rc-main/30 rounded px-3 py-1.5 focus:border-rc-logo outline-none" />
                                        </div>
                                        <div className="w-full md:w-32">
                                            <label className="text-xs text-rc-muted mb-1 block">Harga Coret</label>
                                            <input type="number" value={v.harga_asli} onChange={(e) => updateVariant(v.id, 'harga_asli', e.target.value)} className="w-full bg-rc-card border-[0.5px] border-rc-main/30 rounded px-3 py-1.5 outline-none focus:border-rc-logo" />
                                        </div>
                                        <div className="w-full md:w-32">
                                            <label className="text-xs text-rc-logo font-bold mb-1 block">Harga Jual *</label>
                                            <input type="number" value={v.harga_jual} onChange={(e) => updateVariant(v.id, 'harga_jual', e.target.value)} required className="w-full bg-rc-card border-[1px] border-rc-logo rounded px-3 py-1.5 focus:ring-1 focus:ring-rc-logo outline-none" />
                                        </div>
                                        <div className="w-full md:w-24">
                                            <label className="text-xs text-rc-muted mb-1 block">Stok *</label>
                                            <input type="number" value={v.stok} onChange={(e) => updateVariant(v.id, 'stok', e.target.value)} required className="w-full bg-rc-card border-[0.5px] border-rc-main/30 rounded px-3 py-1.5 outline-none focus:border-rc-logo" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                    
                    <div className="p-6 border-t-[0.5px] border-rc-main/20 bg-rc-card flex justify-end gap-3 flex-shrink-0 sticky bottom-0 z-10">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg font-bold text-rc-main bg-rc-bg border-[0.5px] border-rc-main/30 hover:bg-rc-main/10 transition">Batal</button>
                        <button type="submit" disabled={loading} className="px-8 py-2.5 rounded-lg font-bold text-rc-bg bg-rc-logo shadow-lg hover:bg-yellow-400 transition flex items-center gap-2">
                            {loading ? <><i className="fa-solid fa-spinner fa-spin"></i> Menyimpan...</> : 'Simpan Produk'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
