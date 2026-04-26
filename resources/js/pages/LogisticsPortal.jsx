import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function LogisticsPortal() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [packages, setPackages] = useState({ incoming: [], at_warehouse: [], delivering: [] });
    const [couriers, setCouriers] = useState([]);
    const [activeTab, setActiveTab] = useState('receive'); // receive, assign, logs
    const [selectedCouriers, setSelectedCouriers] = useState({});
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [staffs, setStaffs] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const verifyRole = async () => {
            try {
                const res = await axios.get('/api/user');
                const r = res.data.role;
                if (r !== 'super_admin' && r !== 'admin_logistik' && r !== 'logistik_staff') {
                    navigate('/dashboard'); return;
                }
                setUser(res.data);
                fetchLogisticsData();
                fetchCouriers();
                if (r === 'super_admin' || r === 'admin_logistik') {
                    fetchStaffs();
                }
            } catch (e) { navigate('/login'); }
        };
        verifyRole();
    }, []);

    const fetchStaffs = async () => {
        try {
            const res = await axios.get('/api/logistics/staffs');
            setStaffs(res.data);
        } catch (e) { }
    };

    const fetchLogisticsData = async () => {
        setLoading(true);
        try {
            const statRes = await axios.get('/api/logistics/stats');
            setStats(statRes.data);
            const pkgRes = await axios.get('/api/logistics/packages');
            setPackages(pkgRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchCouriers = async () => {
        try {
            const res = await axios.get('/api/courier/staffs');
            setCouriers(res.data);
        } catch (e) {
            console.error("Courier fetch err", e);
        }
    };

    const handleReceive = async (orderId) => {
        try {
            await axios.post(`/api/logistics/receive/${orderId}`);
            alert('Sukses diterima di Gudang Logistik!');
            fetchLogisticsData();
        } catch (e) {
            alert(e.response?.data?.message || 'Gagal Menerima.');
        }
    };

    const handleReceiveAll = async () => {
        if (!packages.incoming || packages.incoming.length === 0) return;
        if (!window.confirm(`Terima semua ${packages.incoming.length} paket yang masuk?`)) return;
        try {
            await Promise.all(packages.incoming.map(p =>
                axios.post(`/api/logistics/receive/${p.id}`)
            ));
            alert('Semua paket berhasil diterima di gudang!');
            fetchLogisticsData();
        } catch (e) {
            alert('Gagal menerima sebagian atau seluruh paket.');
            fetchLogisticsData();
        }
    };


    const handleAssign = async (orderId, courierId) => {
        if (!courierId) return alert("Pilih kurir pengantar dulu!");
        try {
            await axios.post(`/api/logistics/assign/${orderId}`, { delivery_courier_id: courierId });
            alert('Sukses ditugaskan ke kurir pengantar!');
            fetchLogisticsData();
        } catch (e) {
            alert(e.response?.data?.message || 'Gagal Assign.');
        }
    };

    const handleMassAssign = async () => {
        if (!selectedCouriers['mass']) return alert('Pilih kurir untuk mass assign');
        if (!window.confirm('Yakin ingin menugaskan semua paket ke kurir ini?')) return;

        try {
            await Promise.all(packages.at_warehouse.map(p =>
                axios.post(`/api/logistics/assign/${p.id}`, { delivery_courier_id: selectedCouriers['mass'] })
            ));
            alert('Semua paket berhasil ditugaskan!');
            fetchLogisticsData();
            setSelectedCouriers(prev => ({ ...prev, mass: '' }));
        } catch (e) { alert('Gagal menugaskan sebagian atau seluruh paket.'); fetchLogisticsData(); }
    };

    if (loading && !stats) return (
        <div className="bg-[#0b0c10] min-h-screen p-4 md:p-6 lg:p-8 text-rc-main">
            <div className="max-w-7xl mx-auto">
                <div className="h-24 bg-rc-card rounded-2xl animate-pulse mb-8 border-[0.5px] border-rc-main/10"></div>
                <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 md:h-32 bg-rc-card rounded-xl animate-pulse border-[0.5px] border-rc-main/10"></div>)}
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-rc-bg min-h-screen font-sans text-rc-main pb-20">
            <header className="bg-rc-bg border-b-[0.5px] border-rc-main/20 sticky top-0 z-30 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row gap-4 justify-between items-center text-center sm:text-left">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300 uppercase italic tracking-tighter flex items-center justify-center sm:justify-start gap-2">
                        RADENCAK LOGISTICS <span className="text-[8px] sm:text-[10px] not-italic font-bold text-rc-muted border border-rc-main/20 px-2 py-0.5 rounded">v2.0</span>
                    </h1>
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between sm:justify-end">
                        <div className="flex items-center gap-3 text-left">
                            <div className="w-10 h-10 rounded-full bg-rc-bg border-[0.5px] border-rc-main/20 flex items-center justify-center overflow-hidden">
                                {user?.profile_photo_url ? (
                                    <img src={user.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <i className="fa-solid fa-user-tie text-rc-muted"></i>
                                )}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-xs font-bold text-rc-main uppercase">{user?.name}</p>
                                <p className="text-[10px] text-teal-500 uppercase font-black">{user?.role === 'logistik_staff' ? 'Staff Gudang' : 'Admin Area'}</p>
                            </div>
                        </div>
                        <Link to="/dashboard" className="text-[10px] font-bold bg-rc-card hover:bg-rc-main hover:text-rc-bg text-rc-main px-4 py-2.5 border-[0.5px] border-rc-main/10 rounded-lg transition-all uppercase flex items-center gap-2 shadow-lg">
                            <i className="fa-solid fa-arrow-left"></i> <span className="hidden sm:inline">Toko</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-12">

                {/* Global Performance Cards */}
                <div className="grid grid-cols-3 gap-3 md:gap-6">
                    <div className="bg-rc-card p-4 md:p-10 rounded-2xl md:rounded-[2rem] border-[0.5px] border-rc-main/10 relative overflow-hidden group hover:border-blue-500/50 transition-all duration-500">
                        <div className="absolute -right-8 -top-8 w-16 md:w-32 h-16 md:h-32 bg-blue-500/10 blur-2xl md:blur-3xl rounded-full group-hover:bg-blue-500/20 transition-colors"></div>
                        <h2 className="text-[7px] md:text-[10px] font-black uppercase text-rc-muted tracking-[0.1em] md:tracking-[0.2em] mb-1 md:mb-4">Dalam Pengiriman</h2>
                        <div className="text-2xl md:text-6xl font-black text-blue-400 tracking-tighter">{stats?.total_in_delivery || 0}</div>
                    </div>
                    <div className="bg-rc-card p-4 md:p-10 rounded-2xl md:rounded-[2rem] border-[0.5px] border-rc-main/10 relative overflow-hidden group hover:border-yellow-500/50 transition-all duration-500">
                        <div className="absolute -right-8 -top-8 w-16 md:w-32 h-16 md:h-32 bg-yellow-500/10 blur-2xl md:blur-3xl rounded-full group-hover:bg-yellow-500/20 transition-colors"></div>
                        <h2 className="text-[7px] md:text-[10px] font-black uppercase text-rc-muted tracking-[0.1em] md:tracking-[0.2em] mb-1 md:mb-4">Pemrosesan / Sortir</h2>
                        <div className="text-2xl md:text-6xl font-black text-yellow-400 tracking-tighter">{stats?.total_processing || 0}</div>
                    </div>
                    <div className="bg-rc-card p-4 md:p-10 rounded-2xl md:rounded-[2rem] border-[0.5px] border-rc-main/10 relative overflow-hidden group hover:border-green-500/50 transition-all duration-500">
                        <div className="absolute -right-8 -top-8 w-16 md:w-32 h-16 md:h-32 bg-green-500/10 blur-2xl md:blur-3xl rounded-full group-hover:bg-green-500/20 transition-colors"></div>
                        <h2 className="text-[7px] md:text-[10px] font-black uppercase text-rc-muted tracking-[0.1em] md:tracking-[0.2em] mb-1 md:mb-4">Berhasil Terantar</h2>
                        <div className="text-2xl md:text-6xl font-black text-green-400 tracking-tighter">{stats?.total_delivered || 0}</div>
                    </div>
                </div>

                {/* Logistics Layout Container */}
                <div className="flex flex-col md:flex-row gap-8 items-start mt-12">
                    {/* Mobile Menu Toggle (Header-like) */}
                    <div className="w-full md:hidden flex items-center justify-between">
                        <button onClick={() => setIsSidebarOpen(true)} className="bg-rc-card border-[0.5px] border-rc-main/10 p-3 rounded-xl flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-rc-main shadow-sm">
                            <i className="fa-solid fa-bars text-teal-500"></i> MENU
                        </button>
                        <h2 className="text-xs font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">Pusat Navigasi</h2>
                    </div>

                    {/* Mobile Backdrop */}
                    {isSidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        ></div>
                    )}

                    {/* Sidebar Navigation (Off-Canvas on Mobile) */}
                    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-rc-bg border-r-[0.5px] border-rc-main/10 shadow-2xl p-4 transform transition-transform duration-300 md:relative md:inset-auto md:translate-x-0 md:bg-transparent md:border-0 md:shadow-none md:p-0 md:w-64 md:flex-shrink-0 md:sticky md:top-28 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                        {/* Mobile Close Button & Header */}
                        <div className="flex justify-between items-center mb-6 md:hidden">
                            <h2 className="text-xs font-black uppercase text-teal-400 tracking-widest flex items-center gap-2">
                                <i className="fa-solid fa-warehouse"></i> LOGISTIK PANEL
                            </h2>
                            <button onClick={() => setIsSidebarOpen(false)} className="text-rc-muted hover:text-rc-main w-8 h-8 flex items-center justify-center rounded-full bg-rc-card border-[0.5px] border-rc-main/10">
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        <div className="flex flex-col bg-rc-card border-[0.5px] border-rc-main/10 p-2 rounded-2xl shadow-inner relative gap-2 flex-grow overflow-y-auto no-scrollbar">
                            <button onClick={() => { setActiveTab('receive'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'receive' ? 'bg-teal-500 text-black shadow-lg shadow-teal-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                <i className="fa-solid fa-barcode w-5 text-center"></i> <span>Penerimaan</span>
                            </button>
                            <button onClick={() => { setActiveTab('assign'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'assign' ? 'bg-teal-500 text-black shadow-lg shadow-teal-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                <i className="fa-solid fa-people-carry-box w-5 text-center"></i> <span>Penyortiran</span>
                            </button>
                            <button onClick={() => { setActiveTab('logs'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'logs' ? 'bg-teal-500 text-black shadow-lg shadow-teal-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                <i className="fa-solid fa-radar w-5 text-center"></i> <span>Radar Log</span>
                            </button>

                            <div className="h-[0.5px] bg-rc-main/10 w-full my-2"></div>

                            {(user?.role === 'super_admin' || user?.role === 'admin_logistik') && (
                                <button onClick={() => { setActiveTab('employees'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'employees' ? 'bg-teal-500 text-black shadow-lg shadow-teal-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                    <i className="fa-solid fa-users w-5 text-center"></i> <span>Daftar Karyawan</span>
                                </button>
                            )}

                            <button onClick={() => { setActiveTab('performance'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'performance' ? 'bg-teal-500 text-black shadow-lg shadow-teal-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                <i className="fa-solid fa-star w-5 text-center"></i> <span>Kinerja {user?.role === 'logistik_staff' ? 'Staff' : 'Admin'}</span>
                            </button>

                            {user?.role === 'logistik_staff' && (
                                <button onClick={() => { setActiveTab('salary'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'salary' ? 'bg-teal-500 text-black shadow-lg shadow-teal-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                    <i className="fa-solid fa-wallet w-5 text-center"></i> <span>Dompet & Gaji</span>
                                </button>
                            )}

                            <button onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'settings' ? 'bg-teal-500 text-black shadow-lg shadow-teal-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                <i className="fa-solid fa-gear w-5 text-center"></i> <span>Pengaturan</span>
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-grow min-w-0 w-full space-y-6">

                        {/* Tab: Receive Packages */}
                        {activeTab === 'receive' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-rc-card border-[0.5px] border-rc-main/10 rounded-2xl overflow-hidden">
                                    <div className="p-6 bg-teal-500/10 border-b-[0.5px] border-rc-main/10 flex justify-between items-center">
                                        <h3 className="text-sm font-bold text-teal-400 uppercase tracking-widest"><i className="fa-solid fa-barcode"></i> Scan Paket Masuk dari Kurir Penjemput</h3>
                                        {packages.incoming?.length > 0 && (
                                            <button onClick={handleReceiveAll} className="bg-teal-500 text-black px-6 py-2 rounded-xl text-[10px] font-bold uppercase shadow-lg hover:bg-teal-400 transition flex items-center gap-2">
                                                <i className="fa-solid fa-check-double"></i> Terima Semua
                                            </button>
                                        )}
                                    </div>
                                    <div className="p-6">
                                        {packages.incoming?.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {packages.incoming.map(p => (
                                                    <div key={p.id} className="border-[0.5px] border-rc-main/20 p-4 rounded-xl relative">
                                                        <div className="text-[10px] font-black text-rc-muted uppercase mb-2">Order: #{p.order_number}</div>
                                                        <div className="font-bold text-rc-main mb-4"><i className="fa-solid fa-user-astronaut text-green-500"></i> Kurir: {p.pickup_courier?.name || 'Tidak Diketahui'}</div>
                                                        <button onClick={() => handleReceive(p.id)} className="w-full bg-teal-500 text-black uppercase font-bold text-[10px] py-2 rounded hover:bg-teal-400 transition">Terima di Gudang</button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <div className="text-center py-10 text-rc-muted text-xs uppercase font-bold tracking-widest">Gudang Kosong. Menunggu Kurir...</div>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Assign Couriers */}
                        {activeTab === 'assign' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-rc-card border-[0.5px] border-rc-main/10 rounded-2xl overflow-hidden">
                                    <div className="p-6 bg-yellow-500/10 border-b-[0.5px] border-rc-main/10 flex justify-between items-center">
                                        <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-widest"><i className="fa-solid fa-people-carry-box"></i> Disposisi Pengiriman Ke Pembeli</h3>
                                        {packages.at_warehouse?.length > 0 && (
                                            <div className="flex gap-2 items-center">
                                                <select
                                                    className="bg-rc-bg border-[0.5px] border-rc-main/20 p-2 rounded text-rc-main text-xs outline-none max-w-[200px]"
                                                    value={selectedCouriers['mass'] || ''}
                                                    onChange={(e) => setSelectedCouriers({ ...selectedCouriers, mass: e.target.value })}
                                                >
                                                    <option value="">-- Pilih Kurir Massal --</option>
                                                    {couriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                                <button onClick={handleMassAssign} className="bg-yellow-500 text-black px-4 py-2 rounded-lg text-[10px] font-bold uppercase shadow-lg hover:bg-yellow-400 transition flex items-center gap-2">
                                                    <i className="fa-solid fa-truck-fast"></i> Tugaskan Semua
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 overflow-x-auto">
                                        {packages.at_warehouse?.length > 0 ? (
                                            <table className="w-full text-left">
                                                <thead className="text-[10px] uppercase text-rc-muted tracking-widest border-b-[0.5px] border-rc-main/10">
                                                    <tr>
                                                        <th className="pb-3">Order</th>
                                                        <th className="pb-3">Tujuan (Kec/Kota)</th>
                                                        <th className="pb-3">Assign Ke Kurir (Staff)</th>
                                                        <th className="pb-3">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-xs font-semibold">
                                                    {packages.at_warehouse.map(p => (
                                                        <tr key={p.id} className="border-b-[0.5px] border-rc-main/10">
                                                            <td className="py-4">#{p.order_number}</td>
                                                            <td className="py-4 truncate max-w-[200px]">{p.address_info}</td>
                                                            <td className="py-4">
                                                                <select
                                                                    className="bg-rc-bg border-[0.5px] border-rc-main/20 p-2 rounded text-rc-main outline-none w-full max-w-[200px]"
                                                                    value={selectedCouriers[p.id] || ''}
                                                                    onChange={(e) => setSelectedCouriers({ ...selectedCouriers, [p.id]: e.target.value })}
                                                                >
                                                                    <option value="">-- Pilih Kurir Area --</option>
                                                                    {couriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                                </select>
                                                            </td>
                                                            <td className="py-4">
                                                                <button
                                                                    onClick={() => handleAssign(p.id, selectedCouriers[p.id])}
                                                                    className="bg-yellow-500 text-black px-4 py-2 font-bold uppercase rounded text-[10px] hover:bg-yellow-400"
                                                                >
                                                                    Kirim
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : <div className="text-center py-10 text-rc-muted text-xs uppercase font-bold tracking-widest">Semua paket telah ditugaskan.</div>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Logs Tracking Feed */}
                        {activeTab === 'logs' && (
                            <div className="bg-rc-card rounded-[2.5rem] border-[0.5px] border-rc-main/10 overflow-hidden shadow-2xl animate-fade-in">
                                <div className="p-8 md:p-12 border-b-[0.5px] border-rc-main/10 flex justify-between items-center bg-rc-main/5">
                                    <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-4">
                                        <span className="w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                                        LOG AKTIVITAS TERKINI (GLOBAL)
                                    </h3>
                                </div>

                                <div className="p-4 md:p-8">
                                    {stats?.recent_tracks?.length > 0 ? (
                                        <div className="space-y-6">
                                            {stats.recent_tracks.map((track, i) => (
                                                <div key={i} className="flex gap-6 md:gap-10 items-start group">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-4 h-4 rounded-full bg-teal-400 border-4 border-rc-bg z-10"></div>
                                                        {i !== stats.recent_tracks.length - 1 && <div className="w-[1px] h-20 bg-gradient-to-b from-teal-400/50 to-transparent"></div>}
                                                    </div>
                                                    <div className="flex-1 pb-10 border-b border-rc-main/5 group-last:border-0">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">{track.status}</span>
                                                            <span className="text-[10px] font-bold text-rc-muted opacity-60 bg-rc-bg px-2 py-1 rounded">{new Date(track.created_at).toLocaleString('id-ID')}</span>
                                                        </div>
                                                        <h4 className="text-sm font-bold text-rc-main uppercase mb-1">Paket #{track.order?.order_number}</h4>
                                                        <p className="text-xs text-rc-muted font-medium flex items-center gap-2 mb-3">
                                                            <i className="fa-solid fa-location-dot text-red-400/50"></i> {track.location}
                                                        </p>
                                                        <div className="p-4 bg-rc-bg/50 rounded-2xl text-[11px] font-medium text-rc-muted italic border-[0.5px] border-rc-main/5 leading-relaxed">
                                                            "{track.note || 'Tidak ada catatan'}"
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-20 text-center">
                                            <i className="fa-solid fa-radar text-6xl text-rc-muted/10 mb-6 block"></i>
                                            <p className="text-xs font-black text-rc-muted uppercase tracking-[0.3em]">Menunggu Data Masuk...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tab: Scan Paket */}
                        {activeTab === 'scan' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-rc-card p-10 rounded-2xl border-[0.5px] border-rc-main/10 text-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent"></div>
                                    <i className="fa-solid fa-barcode text-6xl text-teal-500 mb-6 block"></i>
                                    <h2 className="text-xl font-black uppercase text-rc-main mb-2">Scan Inventaris & Logistik</h2>
                                    <p className="text-xs text-rc-muted mb-8 max-w-sm mx-auto">Scan barcode paket yang baru masuk atau yang akan disortir untuk update lokasi gudang secara instan.</p>
                                    <button className="bg-teal-500 text-black font-black uppercase px-10 py-4 rounded-xl shadow-lg hover:bg-teal-400 transition-all flex items-center gap-3 mx-auto">
                                        <i className="fa-solid fa-expand"></i> Mulai Scanning
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Tab: Performance (Kinerja) */}
                        {activeTab === 'performance' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-rc-card p-8 rounded-2xl border-[0.5px] border-rc-main/10">
                                        <h4 className="text-[10px] font-black uppercase text-teal-500 mb-4 tracking-widest">Efisiensi Penyortiran</h4>
                                        <div className="h-2 bg-rc-bg rounded-full overflow-hidden mb-2">
                                            <div className="h-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]" style={{ width: `${stats?.performance?.efficiency || 85}%` }}></div>
                                        </div>
                                        <p className="text-[10px] text-rc-muted uppercase font-bold text-right">{stats?.performance?.efficiency || 85}% Lebih Cepat</p>
                                    </div>
                                    <div className="bg-rc-card p-8 rounded-2xl border-[0.5px] border-rc-main/10">
                                        <h4 className="text-[10px] font-black uppercase text-blue-500 mb-4 tracking-widest">Keamanan Barang</h4>
                                        <div className="h-2 bg-rc-bg rounded-full overflow-hidden mb-2">
                                            <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${stats?.performance?.security || 99}%` }}></div>
                                        </div>
                                        <p className="text-[10px] text-rc-muted uppercase font-bold text-right">{stats?.performance?.security || 99}% Aman Terkendali</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Employees (Daftar Karyawan) */}
                        {activeTab === 'employees' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {staffs.length > 0 ? staffs.map((staff, i) => (
                                        <div key={staff.id} className="bg-rc-card p-6 rounded-2xl border-[0.5px] border-rc-main/10 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500">
                                                <i className="fa-solid fa-user-tie"></i>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-rc-main uppercase">{staff.name}</h4>
                                                <p className="text-[10px] text-rc-muted uppercase">{staff.email}</p>
                                            </div>
                                        </div>
                                    )) : <p className="text-xs text-rc-muted text-center col-span-3">Belum ada staf logistik yang terdaftar.</p>}
                                </div>
                            </div>
                        )}

                        {/* Tab: Profile (Profil) */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-rc-card p-10 rounded-[2.5rem] border-[0.5px] border-rc-main/10">
                                    <div className="flex flex-col md:flex-row items-center gap-10">
                                        <div className="w-40 h-40 rounded-full border-4 border-teal-500/20 p-1 bg-rc-bg shadow-2xl relative">
                                            <div className="w-full h-full rounded-full overflow-hidden">
                                                {user?.profile_photo_url ? (
                                                    <img src={user.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-5xl text-rc-muted bg-rc-card"><i className="fa-solid fa-user-tie"></i></div>
                                                )}
                                            </div>
                                            <button className="absolute bottom-2 right-2 w-10 h-10 bg-teal-500 text-black rounded-full shadow-lg border-4 border-rc-card flex items-center justify-center hover:scale-110 transition"><i className="fa-solid fa-pen text-xs"></i></button>
                                        </div>
                                        <div className="text-center md:text-left">
                                            <h2 className="text-3xl font-black text-rc-main tracking-tighter uppercase mb-2">{user?.name}</h2>
                                            <p className="text-xs font-bold text-teal-500 uppercase tracking-[0.3em] mb-6">ID PETUGAS: LOG-{user?.id || '000'}</p>
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <div className="bg-rc-bg px-6 py-3 rounded-xl border border-rc-main/5 text-[10px] font-bold text-rc-muted uppercase"><i className="fa-solid fa-envelope mr-2 text-teal-500"></i> {user?.email}</div>
                                                <div className="bg-rc-bg px-6 py-3 rounded-xl border border-rc-main/5 text-[10px] font-bold text-rc-muted uppercase"><i className="fa-solid fa-shield mr-2 text-teal-500"></i> {user?.role.replace('_', ' ')}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Settings (Pengaturan) */}
                        {activeTab === 'settings' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-rc-card p-10 rounded-[2.5rem] border-[0.5px] border-rc-main/10">
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-teal-500 mb-8">Preferensi Sistem Logistik</h3>
                                    <div className="space-y-4">
                                        <div className="p-6 bg-rc-bg rounded-2xl border border-rc-main/5 flex justify-between items-center group cursor-pointer hover:border-teal-500/30 transition">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-black transition"><i className="fa-solid fa-bell"></i></div>
                                                <div>
                                                    <h4 className="text-xs font-black text-rc-main uppercase">Notifikasi Gudang</h4>
                                                    <p className="text-[10px] text-rc-muted uppercase">Push update untuk paket baru</p>
                                                </div>
                                            </div>
                                            <div className="w-12 h-6 bg-teal-500 rounded-full relative p-1"><div className="w-4 h-4 bg-black rounded-full ml-auto shadow-lg"></div></div>
                                        </div>
                                        <div className="p-6 bg-rc-bg rounded-2xl border border-rc-main/5 flex justify-between items-center group cursor-pointer hover:border-rc-main/30 transition">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-rc-main/10 text-rc-muted flex items-center justify-center"><i className="fa-solid fa-lock"></i></div>
                                                <div>
                                                    <h4 className="text-xs font-black text-rc-main uppercase">Keamanan Akun</h4>
                                                    <p className="text-[10px] text-rc-muted uppercase">Ganti password & 2FA</p>
                                                </div>
                                            </div>
                                            <i className="fa-solid fa-chevron-right text-rc-muted"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
