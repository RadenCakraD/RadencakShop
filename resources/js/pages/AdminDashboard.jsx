import React, { useState, useEffect, Component } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#ffdcd1', color: 'red' }}>
          <h2>Something went wrong in AdminDashboard.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [banners, setBanners] = useState([]);
    const [products, setProducts] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Banner form state
    const [newBanner, setNewBanner] = useState({ title: '', description: '', link_url: '', image: null });
    const [editBannerId, setEditBannerId] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    // Drag & Drop State
    const [draggedIdx, setDraggedIdx] = useState(null);

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        try {
            const res = await axios.get('/api/user');
            if (res.data.role !== 'admin') {
                navigate('/dashboard', { replace: true });
                return;
            }
            setUser(res.data);
            fetchData();
        } catch (e) {
            navigate('/login');
        }
    };

    const fetchData = async () => {
        try {
            const [benRes, prodRes, usersRes, vouchersRes] = await Promise.all([
                axios.get('/api/admin/banners'),
                axios.get('/api/admin/products'),
                axios.get('/api/admin/users'),
                axios.get('/api/vouchers')
            ]);
            setBanners(benRes.data);
            setProducts(prodRes.data);
            setUsersList(usersRes.data);
            setVouchers(vouchersRes.data);
        } catch (e) {
            console.error("Gagal load data admin", e);
        } finally {
            setLoading(false);
        }
    };

    const handleBannerFile = (e) => setNewBanner({ ...newBanner, image: e.target.files[0] });

    const handleUploadBanner = async (e) => {
        e.preventDefault();
        if (!editBannerId && !newBanner.image) return alert("Pilih gambar dahulu!");

        setUploading(true);
        const data = new FormData();
        if (newBanner.image instanceof File) {
            data.append('image', newBanner.image);
        }
        if (newBanner.title) data.append('title', newBanner.title);
        if (newBanner.description) data.append('description', newBanner.description);
        if (newBanner.link_url) data.append('link_url', newBanner.link_url);

        try {
            if (editBannerId) {
                await axios.post(`/api/admin/banners/${editBannerId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await axios.post('/api/admin/banners', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            setNewBanner({ title: '', description: '', link_url: '', image: null });
            setEditBannerId(null);
            fetchData();
        } catch (e) {
            console.error(e);
            alert("Gagal memproses banner");
        } finally {
            setUploading(false);
        }
    };

    const handleEditBanner = (b) => {
        setEditBannerId(b.id);
        setNewBanner({
            title: b.title || '',
            description: b.description || '',
            link_url: b.link_url || '',
            image: null
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditBannerId(null);
        setNewBanner({ title: '', description: '', link_url: '', image: null });
    };

    // Drag and Drop Logic
    const handleDragStart = (e, index) => {
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = "move";
        // Optionally set data transfer
    };

    const handleDragEnter = (e, index) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === index) return;
        
        const newBanners = [...banners];
        const draggedItem = newBanners[draggedIdx];
        newBanners.splice(draggedIdx, 1);
        newBanners.splice(index, 0, draggedItem);
        
        setDraggedIdx(index);
        setBanners(newBanners);
    };

    const handleDragEnd = async (e) => {
        e.preventDefault();
        setDraggedIdx(null);
        
        // Save new order to backend
        const ordered_ids = banners.map(b => b.id);
        try {
            await axios.post('/api/admin/banners/reorder', { ordered_ids });
        } catch(error) {
            console.error("Gagal menyimpan posisi", error);
        }
    };

    const handleDeleteBanner = async (id) => {
        if (!window.confirm("Hapus banner ini?")) return;
        try {
            await axios.delete(`/api/admin/banners/${id}`);
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleFlashSale = async (id) => {
        try {
            await axios.post(`/api/admin/products/${id}/flash-sale`);
            fetchData(); // Refresh UI to match DB
        } catch (e) {
            console.error(e);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        if(!window.confirm(`Ubah role pengguna ini menjadi ${newRole}?`)) return;
        try {
            const res = await axios.put(`/api/admin/users/${userId}/role`, { role: newRole });
            alert(res.data.message);
            fetchData();
        } catch(e) {
            alert(e.response?.data?.message || "Gagal mengubah role pengguna");
        }
    };

    // Voucher handling
    const [newVoucher, setNewVoucher] = useState({
        nama_voucher: '', code: '', type: 'percentage', value: '', min_purchase: '', valid_until: '', kuota: ''
    });

    const handleCreateVoucher = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/vouchers', newVoucher);
            alert("Voucher Global berhasil dibuat");
            setNewVoucher({ nama_voucher: '', code: '', type: 'percentage', value: '', min_purchase: '', valid_until: '', kuota: '' });
            fetchData();
        } catch (e) {
            alert(e.response?.data?.message || "Gagal memproses voucher");
        }
    };

    const handleDeleteVoucher = async (id) => {
        if (!window.confirm("Hapus voucher ini?")) return;
        try {
            await axios.delete(`/api/vouchers/${id}`);
            fetchData();
        } catch (e) {
            alert("Gagal menghapus voucher");
        }
    };

    if (loading) return <div className="text-center p-10 text-rc-main bg-rc-bg min-h-screen">Loading Admin...</div>;

    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    return (
      <ErrorBoundary>
        <div className="bg-rc-bg min-h-screen font-sans text-rc-main pb-10">

            {/* Header */}
            <header className="bg-rc-bg border-b-[0.5px] border-rc-main/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-lg font-bold text-blue-400 uppercase flex items-center gap-2">
                        <i className="fa-solid fa-shield-halved"></i> COMMAND CENTER
                    </h1>
                    <div className="flex gap-4 items-center">
                        <span className="text-xs font-semibold text-rc-main"><i className="fa-solid fa-user-tie text-blue-400 mr-2"></i> {user?.name}</span>
                        <Link to="/dashboard" className="text-[10px] sm:text-xs font-bold bg-rc-card hover:bg-rc-main hover:text-rc-bg text-rc-main px-5 py-2 border-[0.5px] border-rc-main/10 rounded-md transition-colors uppercase">
                            Beranda Global
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
                
                {/* Banner Section */}
                <section className="bg-rc-card p-6 md:p-10 rounded-xl border-[0.5px] border-rc-main/20">
                    <h2 className="text-sm font-bold uppercase border-b-[0.5px] border-rc-main/20 pb-4 mb-6 flex items-center gap-2 text-rc-main">
                        <i className="fa-solid fa-images text-blue-400"></i> MANAJEMEN SPANDUK ELEKTRONIK
                    </h2>

                    <div className="mb-6 bg-blue-500/10 p-4 rounded-md flex gap-3 text-xs md:text-sm font-medium text-blue-300">
                        <i className="fa-solid fa-circle-info mt-0.5"></i>
                        <div>
                            <span className="font-bold text-blue-400">CATATAN UKURAN:</span><br/>
                            Ukuran bingkai kontainer banner di Beranda Publik dibatasi maksimal <strong>Lebar 1280px × Tinggi 350px</strong> di layar PC/Desktop. Disarankan desain berukuran persis <strong>1280 x 350 pixel</strong> (Format Landscape).
                        </div>
                    </div>
                    
                    <form onSubmit={handleUploadBanner} className="flex flex-col md:flex-row gap-4 items-end mb-10 bg-rc-bg p-6 rounded-lg border-[0.5px] border-rc-main/10">
                        <div className="flex-1 w-full">
                            <label className="block text-xs uppercase font-bold text-rc-muted mb-2">Titel Publikasi</label>
                            <input type="text" value={newBanner.title} onChange={e => setNewBanner({...newBanner, title: e.target.value})} className="w-full text-sm bg-rc-card border-[0.5px] border-rc-main/20 px-3 py-2.5 text-rc-main focus:outline-none focus:border-blue-400 rounded-md font-medium" placeholder="Kampanye Super Mega Sale" />
                            <label className="block text-xs uppercase font-bold text-rc-muted mb-2 mt-4">Deskripsi Utama</label>
                            <input type="text" value={newBanner.description} onChange={e => setNewBanner({...newBanner, description: e.target.value})} className="w-full text-sm bg-rc-card border-[0.5px] border-rc-main/20 px-3 py-2.5 text-rc-main focus:outline-none focus:border-blue-400 rounded-md font-medium" placeholder="Enjoy your shopping!" />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-xs uppercase font-bold text-rc-muted mb-2">File Visual Utama {editBannerId && '(Biarkan kosong jika tidak ingin diubah)'}</label>
                            <input type="file" accept="image/*" onChange={handleBannerFile} className="w-full text-xs bg-rc-card border-[0.5px] border-rc-main/20 px-2 py-2 text-rc-main focus:outline-none file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:bg-blue-500 file:text-white file:font-bold file:cursor-pointer rounded-md" />
                        </div>
                        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
                            {editBannerId && (
                                <button type="button" onClick={handleCancelEdit} className="w-full bg-rc-card border-[0.5px] border-rc-main/20 hover:bg-rc-main hover:text-rc-bg text-rc-main px-8 py-2.5 text-xs font-bold rounded-md transition-colors uppercase">
                                    BATAL
                                </button>
                            )}
                            <button type="submit" disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 text-xs font-bold rounded-md transition-colors uppercase">
                                {uploading ? 'MEMPROSES...' : editBannerId ? 'SIMPAN PERUBAHAN' : 'PUBLIKASIKAN'}
                            </button>
                        </div>
                    </form>

                    {banners.length === 0 ? (
                        <div className="text-center text-rc-muted py-8 text-sm border-[0.5px] border-rc-main/20 p-4 rounded-md bg-rc-bg">Belum ada banner terpasang.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {banners.map((b, idx) => (
                                <div 
                                    key={b.id} 
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, idx)}
                                    onDragEnter={(e) => handleDragEnter(e, idx)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => e.preventDefault()}
                                    className={`relative group overflow-hidden rounded-md border-[0.5px] border-rc-main/20 bg-rc-bg cursor-move ${draggedIdx === idx ? 'opacity-50' : 'opacity-100'}`}
                                >
                                    <img src={`/storage/${b.image_url}`} alt={b.title} className="w-full h-36 object-cover pointer-events-none" />
                                    <div className="absolute inset-x-0 bottom-0 bg-black/80 p-3 pointer-events-none">
                                        <div className="text-[10px] uppercase font-bold text-white truncate">{b.title || 'TANPA JUDUL'}</div>
                                        {b.description && <div className="text-[9px] text-gray-300 mt-1 truncate">{b.description}</div>}
                                    </div>
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <button onClick={() => handleEditBanner(b)} className="bg-yellow-600 hover:bg-yellow-500 text-white w-7 h-7 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <i className="fa-solid fa-pen text-xs"></i>
                                        </button>
                                        <button onClick={() => handleDeleteBanner(b.id)} className="bg-red-600 hover:bg-red-500 text-white w-7 h-7 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <i className="fa-solid fa-trash-can text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Product Management Section (Flash Sale Toggle) */}
                <section className="bg-rc-card p-6 md:p-10 rounded-xl border-[0.5px] border-rc-main/20">
                    <h2 className="text-sm font-bold uppercase border-b-[0.5px] border-rc-main/20 pb-4 mb-6 flex items-center gap-2 text-rc-main">
                        <i className="fa-solid fa-bolt text-rc-logo"></i> PENGAWASAN FLASH SALE
                    </h2>
                    
                    <div className="overflow-x-auto rounded-lg border-[0.5px] border-rc-main/20 bg-rc-bg">
                        <table className="min-w-full divide-y-[0.5px] divide-rc-main/20">
                            <thead className="bg-rc-card/50">
                                <tr className="text-left text-xs font-bold text-rc-muted uppercase">
                                    <th className="px-6 py-4">Produk</th>
                                    <th className="px-6 py-4">Toko</th>
                                    <th className="px-6 py-4">Harga / Stok</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-[0.5px] divide-rc-main/20">
                                {products.map((prod) => (
                                    <tr key={prod.id} className="hover:bg-rc-card transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-rc-main uppercase">{prod.nama_produk}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-semibold text-rc-muted uppercase">{prod.shop?.nama_toko}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-rc-logo">
                                            {formatRp(prod.harga_jual)} <span className="text-[10px] text-rc-muted ml-2">STOK: {prod.stok}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => handleToggleFlashSale(prod.id)}
                                                className={`px-4 py-1.5 rounded text-[10px] font-bold transition-colors uppercase ${prod.is_flash_sale ? 'bg-rc-logo text-rc-bg' : 'bg-rc-card border-[0.5px] border-rc-main/20 text-rc-muted hover:bg-rc-main hover:text-rc-bg'}`}
                                            >
                                                {prod.is_flash_sale ? 'AKTIF' : 'NONAKTIF'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* User Management Section */}
                <section className="bg-rc-card p-6 md:p-10 rounded-xl border-[0.5px] border-rc-main/20">
                    <h2 className="text-sm font-bold uppercase border-b-[0.5px] border-rc-main/20 pb-4 mb-6 flex items-center gap-2 text-rc-main">
                        <i className="fa-solid fa-users-gear text-purple-400"></i> MANAJEMEN PENGGUNA
                    </h2>
                    
                    <div className="overflow-x-auto rounded-lg border-[0.5px] border-rc-main/20 bg-rc-bg">
                        <table className="min-w-full divide-y-[0.5px] divide-rc-main/20">
                            <thead className="bg-rc-card/50">
                                <tr className="text-left text-xs font-bold text-rc-muted uppercase">
                                    <th className="px-6 py-4">Pengguna</th>
                                    <th className="px-6 py-4">Kontak</th>
                                    <th className="px-6 py-4 text-center">Hak Akses / Role</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-[0.5px] divide-rc-main/20">
                                {usersList.map((u) => {
                                    const isSuperAdmin = u.email === 'radencakstudio@gmail.com';
                                    return (
                                        <tr key={u.id} className="hover:bg-rc-card transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-rc-main uppercase">{u.name}</div>
                                                <div className="text-xs font-medium text-rc-muted mt-1 uppercase">@{u.username}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-rc-muted">{u.email}</td>
                                            <td className="px-6 py-4 text-center">
                                                {isSuperAdmin ? (
                                                    <span className="px-3 py-1.5 rounded text-[10px] font-bold bg-red-600 text-white uppercase inline-block">
                                                        Super Admin
                                                    </span>
                                                ) : (
                                                    <select 
                                                        value={u.role} 
                                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                        className={`appearance-none text-center outline-none cursor-pointer px-3 py-1.5 rounded text-[10px] font-bold transition-colors uppercase border-[0.5px] 
                                                            ${u.role === 'admin' ? 'bg-blue-600 text-white border-blue-500' : 
                                                            u.role === 'toko' ? 'bg-rc-logo text-rc-bg border-rc-logo' : 
                                                            u.role === 'kurir' ? 'bg-green-600 text-white border-green-500' : 
                                                            'bg-rc-card text-rc-muted border-rc-main/20 hover:bg-rc-main hover:text-rc-bg'}`}
                                                    >
                                                        <option className="bg-rc-bg text-rc-main uppercase" value="user">USER (REGULER)</option>
                                                        <option className="bg-rc-bg text-rc-main uppercase" value="toko">TOKO / SELLER</option>
                                                        <option className="bg-rc-bg text-rc-main uppercase" value="kurir">KURIR (LOGISTIK)</option>
                                                        <option className="bg-rc-bg text-rc-main uppercase" value="admin">ADMIN (STAF)</option>
                                                    </select>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Vouchers Section */}
                <section className="bg-rc-card p-6 md:p-10 rounded-xl border-[0.5px] border-rc-main/20">
                    <h2 className="text-sm font-bold uppercase border-b-[0.5px] border-rc-main/20 pb-4 mb-6 flex items-center gap-2 text-rc-main">
                        <i className="fa-solid fa-tags text-green-400"></i> MASTER VOUCHER PLATFORM LINTAS TOKO
                    </h2>
                    
                    <form onSubmit={handleCreateVoucher} className="bg-rc-bg p-6 rounded-lg border-[0.5px] border-rc-main/10 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-2">
                            <label className="block text-[10px] uppercase font-bold text-rc-muted mb-1">Nama Voucher</label>
                            <input type="text" required value={newVoucher.nama_voucher} onChange={e => setNewVoucher({...newVoucher, nama_voucher: e.target.value})} className="w-full p-2 bg-rc-card border-[0.5px] border-rc-main/20 text-rc-main focus:outline-none rounded text-xs" placeholder="Promo Lebaran" />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-rc-muted mb-1">Kode Spesifik</label>
                            <input type="text" required value={newVoucher.code} onChange={e => setNewVoucher({...newVoucher, code: e.target.value})} className="w-full p-2 bg-rc-card border-[0.5px] border-rc-main/20 text-rc-main focus:outline-none rounded text-xs uppercase placeholder-normal" placeholder="LEBARAN26" />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-rc-muted mb-1">Batas Kuota Pemakaian</label>
                            <input type="number" min="1" required value={newVoucher.kuota} onChange={e => setNewVoucher({...newVoucher, kuota: e.target.value})} className="w-full p-2 bg-rc-card border-[0.5px] border-rc-main/20 text-rc-main focus:outline-none rounded text-xs" placeholder="100" />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-rc-muted mb-1">Format Potongan</label>
                            <select value={newVoucher.type} onChange={e => setNewVoucher({...newVoucher, type: e.target.value})} className="w-full p-2 bg-rc-card border-[0.5px] border-rc-main/20 text-rc-main focus:outline-none rounded text-xs uppercase font-bold">
                                <option value="percentage">Persentase (%)</option>
                                <option value="fixed">Rupiah (Rp)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-rc-muted mb-1">Nilai Potongan</label>
                            <input type="number" min="0" required value={newVoucher.value} onChange={e => setNewVoucher({...newVoucher, value: e.target.value})} className="w-full p-2 bg-rc-card border-[0.5px] border-rc-main/20 text-rc-main focus:outline-none rounded text-xs" placeholder={newVoucher.type === 'percentage' ? 'Ex: 10' : 'Ex: 50000'} />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-rc-muted mb-1">Min. Belanja (Rp)</label>
                            <input type="number" min="0" required value={newVoucher.min_purchase} onChange={e => setNewVoucher({...newVoucher, min_purchase: e.target.value})} className="w-full p-2 bg-rc-card border-[0.5px] border-rc-main/20 text-rc-main focus:outline-none rounded text-xs" placeholder="0 = Tanpa Syarat" />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-rc-muted mb-1">Batas Kedaluwarsa</label>
                            <input type="date" required value={newVoucher.valid_until} onChange={e => setNewVoucher({...newVoucher, valid_until: e.target.value})} className="w-full p-2 bg-rc-card border-[0.5px] border-rc-main/20 text-rc-main focus:outline-none rounded text-xs uppercase" />
                        </div>
                        <div className="lg:col-span-4 mt-2">
                            <button type="submit" className="w-full  bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 text-xs font-bold rounded-md transition-colors uppercase shadow-sm">
                                BUAT VOUCHER EKSLUSIF
                            </button>
                        </div>
                    </form>

                    {vouchers.length === 0 ? (
                        <div className="text-center text-rc-muted py-8 text-sm border-[0.5px] border-rc-main/20 p-4 rounded-md bg-rc-bg font-medium">Belum ada Promosi Platform Global tercetak.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {vouchers.map(v => (
                                <div key={v.id} className="relative group p-4 rounded-md border-[0.5px] border-rc-main/20 bg-rc-bg flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-sm font-bold text-rc-main uppercase">{v.nama_voucher}</div>
                                            <div className="bg-rc-card border-[0.5px] border-rc-main/10 px-2 py-1 rounded text-[10px] font-bold text-green-400">
                                                {v.type === 'percentage' ? `${v.value}% OFF` : formatRp(v.value)}
                                            </div>
                                        </div>
                                        <code className="bg-rc-card text-rc-logo font-mono text-xs px-2 py-1 rounded border-[0.5px] border-rc-logo/30">{v.code}</code>
                                        <div className="mt-3 text-[10px] font-medium text-rc-muted/80 flex flex-col gap-1 uppercase">
                                            <span>MIN. BELANJA: {formatRp(v.min_purchase)}</span>
                                            <span>SISA KUOTA: {v.kuota} TRANSAKSI</span>
                                            <span>BERLAKU S/D: {new Date(v.valid_until).toLocaleDateString('id-ID')}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteVoucher(v.id)} className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white w-7 h-7 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <i className="fa-solid fa-trash-can text-xs"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
      </ErrorBoundary>
    );
}
