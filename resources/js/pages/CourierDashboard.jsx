import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon issue in react
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function CourierDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Admin Data
    const [staffs, setStaffs] = useState([]);

    // Staff Data (Misi Aktif)
    const [pickups, setPickups] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [availablePickups, setAvailablePickups] = useState([]);
    const [earnings, setEarnings] = useState(0);

    const [withdrawn, setWithdrawn] = useState(0);

    // withdrawal state
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawBank, setWithdrawBank] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    // failed delivery state
    const [failModalOpen, setFailModalOpen] = useState(false);
    const [failOrderId, setFailOrderId] = useState(null);
    const [failReason, setFailReason] = useState('');
    const [stats, setStats] = useState({ completed: 0, punctuality: 100, rating: 5.0 });

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const res = await axios.get('/api/user');
            const r = res.data.role;
            if (r !== 'admin_kurir' && r !== 'kurir_staff' && r !== 'super_admin') {
                navigate('/dashboard', { replace: true });
                return;
            }
            setUser(res.data);
            setActiveTab(r === 'admin_kurir' || r === 'super_admin' ? 'employees' : 'missions');
            fetchData(r);
        } catch (e) {
            navigate('/login');
        }
    };

    const fetchData = async (r) => {
        setLoading(true);
        try {
            if (r === 'admin_kurir' || r === 'super_admin') {
                const [staffRes, taskRes] = await Promise.all([
                    axios.get('/api/courier/staffs'),
                    axios.get('/api/courier/tasks')
                ]);
                setStaffs(staffRes.data);
                setPickups(taskRes.data.pickups || []);
                setAvailablePickups(taskRes.data.available_pickups || []);
            } else if (r === 'kurir_staff') {
                const taskRes = await axios.get('/api/courier/tasks');
                setPickups(taskRes.data.pickups || []);
                setDeliveries(taskRes.data.deliveries || []);
                setAvailablePickups(taskRes.data.available_pickups || []);
                setEarnings(taskRes.data.earnings || 0);
                setWithdrawn(taskRes.data.withdrawn || 0);
                if (taskRes.data.stats) setStats(taskRes.data.stats);
            }
        } catch (e) {
            console.error("Gagal load data courier portal", e);
        } finally {
            setLoading(false);
        }
    };

    const handleTakeTask = async (id) => {
        try {
            await axios.post(`/api/courier/take-task/${id}`);
            alert('Berhasil mengambil tugas!');
            fetchData(user.role);
        } catch (e) {
            alert(e.response?.data?.message || 'Gagal mengambil tugas.');
        }
    };

    const handlePickup = async (id) => {
        try {
            await axios.post(`/api/courier/pickup/${id}`);
            alert('Sukses konfirmasi penjemputan!');
            fetchData(user.role);
        } catch (e) {
            alert(e.response?.data?.message || 'Gagal update.');
        }
    };

    const handlePickupAll = async () => {
        if (!window.confirm('Yakin ingin mengambil semua paket ini?')) return;
        try {
            await Promise.all(pickups.map(p =>
                axios.post(`/api/courier/pickup/${p.id}`)
            ));
            alert('Semua paket berhasil diambil!');
            fetchData(user.role);
        } catch (e) { alert('Gagal mengambil sebagian atau seluruh paket.'); fetchData(user.role); }
    };

    const handleDeliver = async (id, isFailed = false) => {
        if (!isFailed && !window.confirm("Selesaikan pengantaran paket ini?")) return;
        try {
            if (isFailed) {
                await axios.post(`/api/courier/deliver/${id}`, { status: 'failed_delivery', note: failReason });
                setFailModalOpen(false);
                setFailReason('');
                setFailOrderId(null);
                alert("Status gagal kirim dicatat.");
            } else {
                await axios.post(`/api/courier/deliver/${id}`);
                alert("Pengantaran Selesai!");
            }
            fetchData(user.role);
        } catch (e) {
            alert(e.response?.data?.message || 'Gagal update.');
        }
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        setIsWithdrawing(true);
        try {
            await axios.post('/api/withdrawals', {
                amount: withdrawAmount,
                type: 'courier',
                bank_info: withdrawBank
            });
            alert("Penarikan dana berhasil diajukan!");
            setWithdrawAmount('');
            setWithdrawBank('');
            fetchData(user.role);
        } catch (e) {
            alert(e.response?.data?.message || "Gagal menarik dana");
        } finally {
            setIsWithdrawing(false);
        }
    };

    if (loading && !user) return (
        <div className="bg-[#0b0c10] min-h-screen p-4 md:p-6 lg:p-8 text-rc-main">
            <div className="max-w-7xl mx-auto">
                <div className="h-24 bg-rc-card rounded-2xl animate-pulse mb-8 border-[0.5px] border-rc-main/10"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-rc-card rounded-xl animate-pulse border-[0.5px] border-rc-main/10"></div>)}
                </div>
            </div>
        </div>
    );

    const isAdmin = user.role === 'admin_kurir' || user.role === 'super_admin';

    return (
        <div className="bg-rc-bg min-h-screen font-sans text-rc-main pb-20">
            {/* Header */}
            <header className="bg-rc-card border-b-[0.5px] border-rc-main/20 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-4 justify-between items-center text-center md:text-left">
                    <h1 className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 uppercase tracking-widest flex items-center justify-center md:justify-start gap-3">
                        <i className="fa-solid fa-truck-fast text-green-500"></i> PORTAL KURIR {isAdmin ? 'ADMIN' : 'STAFF'}
                    </h1>
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <div className="flex items-center gap-3 text-left">
                            <div className="w-10 h-10 rounded-full bg-rc-bg border-[0.5px] border-rc-main/20 flex items-center justify-center overflow-hidden">
                                {user?.profile_photo_url ? (
                                    <img src={user.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <i className="fa-solid fa-user-astronaut text-rc-muted"></i>
                                )}
                            </div>
                            <div className="hidden md:block">
                                <p className="text-xs font-bold text-rc-main uppercase">{user?.name}</p>
                                <p className="text-[10px] text-green-500 uppercase font-black">{isAdmin ? 'Admin Area' : 'Staff Lapangan'}</p>
                            </div>
                        </div>
                        <Link to="/dashboard" className="text-[10px] font-bold text-rc-main bg-rc-bg border-[0.5px] border-rc-main/10 px-5 py-2.5 rounded-md hover:bg-rc-main hover:text-rc-bg transition uppercase">
                            <i className="fa-solid fa-arrow-left mr-2"></i> Toko
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 mt-8 flex flex-col md:flex-row gap-8 items-start">
                {/* Mobile Menu Toggle (Header-like) */}
                <div className="w-full md:hidden mb-4 flex items-center justify-between">
                    <button onClick={() => setIsSidebarOpen(true)} className="bg-rc-card border-[0.5px] border-rc-main/10 p-3 rounded-xl flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-rc-main shadow-sm">
                        <i className="fa-solid fa-bars text-green-500"></i> MENU
                    </button>
                    <h2 className="text-xs font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Pusat Navigasi</h2>
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
                        <h2 className="text-xs font-black uppercase text-green-500 tracking-widest flex items-center gap-2">
                            <i className="fa-solid fa-truck-fast"></i> KURIR PANEL
                        </h2>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-rc-muted hover:text-rc-main w-8 h-8 flex items-center justify-center rounded-full bg-rc-card border-[0.5px] border-rc-main/10">
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>

                    <div className="flex flex-col bg-rc-card border-[0.5px] border-rc-main/10 p-2 rounded-2xl shadow-inner relative gap-2 flex-grow overflow-y-auto no-scrollbar">
                        {isAdmin ? (
                            <>
                                <button onClick={() => { setActiveTab('employees'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'employees' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                    <i className="fa-solid fa-users w-5 text-center"></i> <span>Karyawan</span>
                                </button>
                                <button onClick={() => { setActiveTab('packages'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'packages' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                    <i className="fa-solid fa-box w-5 text-center"></i> <span>Paket</span>
                                </button>
                                <button onClick={() => { setActiveTab('address'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'address' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                    <i className="fa-solid fa-map-location-dot w-5 text-center"></i> <span>Alamat</span>
                                </button>
                                <button onClick={() => { setActiveTab('profit'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'profit' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                    <i className="fa-solid fa-chart-line w-5 text-center"></i> <span>Laba</span>
                                </button>
                                <div className="h-[0.5px] bg-rc-main/10 w-full my-2"></div>
                                <button onClick={() => { setActiveTab('scan'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'scan' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                    <i className="fa-solid fa-qrcode w-5 text-center"></i> <span>Scan Paket</span>
                                </button>
                                <button onClick={() => { setActiveTab('performance'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'performance' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                    <i className="fa-solid fa-chart-simple w-5 text-center"></i> <span>Kinerja Admin</span>
                                </button>
                                <button onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'profile' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                    <i className="fa-solid fa-id-badge w-5 text-center"></i> <span>Profil</span>
                                </button>
                                <button onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'settings' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                    <i className="fa-solid fa-gear w-5 text-center"></i> <span>Pengaturan</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => { setActiveTab('missions'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'missions' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                    <i className="fa-solid fa-truck-fast w-5 text-center"></i> <span>Misi Saya</span>
                                </button>
                                <button onClick={() => { setActiveTab('pool'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'pool' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                    <i className="fa-solid fa-boxes-packing w-5 text-center"></i> <span>Daftar Paket</span>
                                </button>
                                <button onClick={() => { setActiveTab('scan'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'scan' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                    <i className="fa-solid fa-qrcode w-5 text-center"></i> <span>Scan Paket</span>
                                </button>
                                <button onClick={() => { setActiveTab('salary'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'salary' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                    <i className="fa-solid fa-wallet w-5 text-center"></i> <span>Dompet</span>
                                </button>
                                <button onClick={() => { setActiveTab('performance'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'performance' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                    <i className="fa-solid fa-star w-5 text-center"></i> <span>Kinerja Staff</span>
                                </button>
                                <button onClick={() => { setActiveTab('penalties'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'penalties' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                    <i className="fa-solid fa-triangle-exclamation w-5 text-center text-red-500"></i> <span>Penalti</span>
                                </button>
                                <div className="h-[0.5px] bg-rc-main/10 w-full my-2"></div>
                                <button onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'profile' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                    <i className="fa-solid fa-id-badge w-5 text-center"></i> <span>Profil</span>
                                </button>
                                <button onClick={() => { setActiveTab('help'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'help' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                    <i className="fa-solid fa-headset w-5 text-center"></i> <span>Pusat Bantuan</span>
                                </button>
                                <button onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-5 py-4 font-bold tracking-widest text-[11px] uppercase whitespace-nowrap rounded-xl transition-all duration-300 w-full justify-start ${activeTab === 'settings' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-rc-muted hover:text-rc-main hover:bg-rc-bg'}`}>
                                    <i className="fa-solid fa-gear w-5 text-center"></i> <span>Pengaturan</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-grow min-w-0 w-full">

                    {/* Tab: Employees */}
                    {isAdmin && activeTab === 'employees' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {staffs.map(s => (
                                    <div key={s.id} className="bg-rc-card border-[0.5px] border-rc-main/10 p-5 rounded-2xl flex flex-col items-center">
                                        <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center text-2xl font-bold mb-3 border border-green-500/20">
                                            <i className="fa-solid fa-user-astronaut"></i>
                                        </div>
                                        <h3 className="font-bold text-rc-main uppercase">{s.name}</h3>
                                        <p className="text-[10px] text-rc-muted mb-4">{s.email}</p>
                                        <button className="bg-rc-bg border-[0.5px] border-rc-main/10 text-[10px] font-bold text-rc-main px-4 py-1.5 rounded uppercase hover:bg-rc-main hover:text-rc-bg transition">Tinjau Log Aktif</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab: Courier Packages (Admin) */}
                    {isAdmin && activeTab === 'packages' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-rc-card rounded-2xl border-[0.5px] border-rc-main/10 overflow-hidden shadow-xl">
                                <table className="w-full text-left">
                                    <thead className="bg-rc-main/5 text-[10px] font-black uppercase text-rc-muted tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Nomor Pesanan</th>
                                            <th className="px-6 py-4">Dari Toko</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Petugas Jemput</th>
                                            <th className="px-6 py-4 text-right">Tugaskan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs font-bold text-rc-main">
                                        {(availablePickups.concat(pickups)).length > 0 ? (availablePickups.concat(pickups)).map(p => (
                                            <tr key={p.id} className="border-t border-rc-main/5 hover:bg-rc-main/5 transition-colors">
                                                <td className="px-6 py-4 font-mono text-[10px] text-green-500">#{p.order_number}</td>
                                                <td className="px-6 py-4 uppercase text-[10px]">{p.shop?.nama_toko}</td>
                                                <td className="px-6 py-4 uppercase text-[9px]">
                                                    <span className={`px-2 py-1 rounded ${p.status === 'ready_for_pickup' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'}`}>{p.status}</span>
                                                </td>
                                                <td className="px-6 py-4 text-[10px] text-rc-muted">
                                                    {p.pickupCourier ? p.pickupCourier.name : <span className="italic text-red-500/50">Menunggu Kurir...</span>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <select
                                                        className="bg-rc-bg border border-rc-main/10 text-[9px] p-1 rounded outline-none focus:border-green-500"
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                axios.post(`/api/courier/assign/${p.id}`, { pickup_courier_id: e.target.value })
                                                                    .then(() => { alert('Berhasil menugaskan kurir!'); fetchData(user.role); })
                                                                    .catch(err => alert(err.response?.data?.message || 'Gagal'));
                                                            }
                                                        }}
                                                        value={p.pickup_courier_id || ''}
                                                    >
                                                        <option value="">Pilih Kurir...</option>
                                                        {staffs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-10 text-center text-rc-muted opacity-50 uppercase tracking-widest font-bold">Tidak ada paket yang menunggu penugasan.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Tab: Courier Addresses (Admin) */}
                    {isAdmin && activeTab === 'address' && (
                        <p className="text-rc-muted text-xs font-bold p-10 bg-rc-card/50 text-center rounded">KELOLA ALAMAT KANTOR CABANG DI SINI (DALAM PENGEMBANGAN)</p>
                    )}

                    {/* Tab: Profit (Admin) */}
                    {isAdmin && activeTab === 'profit' && (
                        <div className="bg-gradient-to-br from-green-500/10 to-transparent p-10 rounded-2xl border-[0.5px] border-green-500/30">
                            <h3 className="text-sm font-black uppercase text-green-500 mb-2 tracking-widest">Estimasi Margin Penjemputan & Pengantaran</h3>
                            <p className="text-4xl font-light tracking-tighter text-rc-main">Rp 0</p>
                            <p className="text-[10px] text-rc-muted mt-2">Disedot otomatis dari jumlah paket yang telah selesai (2K per paket tugas).</p>
                        </div>
                    )}

                    {/* Tab: Courier Missions (Staff) */}
                    {!isAdmin && activeTab === 'missions' && (
                        <div className="space-y-10 animate-fade-in">
                            {/* PICKUPS */}
                            <div className="mb-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-2"><i className="fa-solid fa-box"></i> Misi Penjemputan Toko</h3>
                                    {pickups.length > 0 && (
                                        <button onClick={handlePickupAll} className="bg-yellow-500 text-black px-4 py-2 rounded-lg text-[10px] font-bold uppercase shadow-lg hover:bg-yellow-400 transition flex items-center gap-2">
                                            <i className="fa-solid fa-truck-pickup"></i> Ambil Semua
                                        </button>
                                    )}
                                </div>
                                {pickups.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {pickups.map(p => (
                                            <div key={p.id} className="bg-rc-card p-5 rounded-2xl border-[0.5px] border-rc-main/10 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 blur-xl rounded-full"></div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="text-[10px] font-black uppercase text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">Misi Jemput</div>
                                                    <div className="text-[10px] text-rc-muted font-bold">#{p.order_number}</div>
                                                </div>
                                                <p className="font-bold text-sm text-rc-main mb-1"><i className="fa-solid fa-shop text-rc-muted"></i> {p.shop?.nama_toko}</p>
                                                <p className="text-xs text-rc-muted mb-4 h-12 overflow-hidden text-ellipsis line-clamp-2"><i className="fa-solid fa-location-dot"></i> {p.shop?.alamat_toko}</p>

                                                {p.shop?.latitude && p.shop?.longitude && (
                                                    <div className="w-full h-32 rounded-lg overflow-hidden border-[0.5px] border-yellow-500/30 mb-4 z-10 relative">
                                                        <MapContainer center={[p.shop.latitude, p.shop.longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                                            <TileLayer
                                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                            />
                                                            <Marker position={[p.shop.latitude, p.shop.longitude]}>
                                                                <Popup>Lokasi Toko: {p.shop?.nama_toko}</Popup>
                                                            </Marker>
                                                        </MapContainer>
                                                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${p.shop.latitude},${p.shop.longitude}`} target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 z-[9999] bg-white text-blue-600 text-[9px] font-bold uppercase px-2 py-1 rounded shadow-lg border border-blue-500/20 hover:bg-blue-50 flex items-center gap-1">
                                                            <i className="fa-solid fa-diamond-turn-right"></i> Rute Navigasi
                                                        </a>
                                                    </div>
                                                )}

                                                {p.status === 'picking_up' ? (
                                                    <button disabled className="w-full bg-rc-bg text-rc-muted font-bold text-[10px] px-4 py-2 border-[0.5px] border-rc-main/10 rounded uppercase">Paket Sudah di Tangan Anda</button>
                                                ) : (
                                                    <button onClick={() => handlePickup(p.id)} className="w-full bg-yellow-500 text-black font-bold text-[10px] px-4 py-2 rounded shadow-lg uppercase hover:bg-yellow-400 transition">Konfirmasi Paket Diambil</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-xs text-rc-muted bg-rc-card p-5 rounded-xl border-[0.5px] border-rc-main/10">Bebas Tugas Penjemputan Saat Ini.</p>}
                            </div>

                            {/* DELIVERIES */}
                            <div>
                                <h3 className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2"><i className="fa-solid fa-house-chimney"></i> Misi Pengantaran Pembeli</h3>
                                {deliveries.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {deliveries.map(d => (
                                            <div key={d.id} className="bg-rc-card p-5 rounded-2xl border-[0.5px] border-rc-main/10 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 blur-xl rounded-full"></div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="text-[10px] font-black uppercase text-blue-500 bg-blue-500/10 px-2 py-1 rounded">Misi Antar</div>
                                                    <div className="text-[10px] text-rc-muted font-bold">#{d.order_number}</div>
                                                </div>
                                                <p className="font-bold text-sm text-rc-main mb-1"><i className="fa-solid fa-user text-rc-muted"></i> {d.user?.name}</p>
                                                <p className="text-xs text-rc-muted mb-4 h-12 overflow-hidden text-ellipsis line-clamp-2"><i className="fa-solid fa-map-pin"></i> {d.address_info}</p>

                                                {d.shipping_latitude && d.shipping_longitude && (
                                                    <div className="w-full h-32 rounded-lg overflow-hidden border-[0.5px] border-rc-logo/30 mb-4 z-10 relative">
                                                        <MapContainer center={[d.shipping_latitude, d.shipping_longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                                            <TileLayer
                                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                            />
                                                            <Marker position={[d.shipping_latitude, d.shipping_longitude]}>
                                                                <Popup>Lokasi Tujuan: {d.user?.name}</Popup>
                                                            </Marker>
                                                        </MapContainer>
                                                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${d.shipping_latitude},${d.shipping_longitude}`} target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 z-[9999] bg-white text-blue-600 text-[9px] font-bold uppercase px-2 py-1 rounded shadow-lg border border-blue-500/20 hover:bg-blue-50 flex items-center gap-1">
                                                            <i className="fa-solid fa-diamond-turn-right"></i> Rute Navigasi
                                                        </a>
                                                    </div>
                                                )}

                                                <button onClick={() => handleDeliver(d.id)} className="w-full bg-blue-500 text-white font-bold text-[10px] px-4 py-2 mb-2 rounded shadow-lg uppercase hover:bg-blue-400 transition">Selesaikan Pengantaran (DITERIMA)</button>
                                                <button onClick={() => { setFailOrderId(d.id); setFailModalOpen(true); }} className="w-full bg-rc-bg text-red-500 font-bold text-[10px] px-4 py-2 border-[0.5px] border-red-500/20 rounded shadow-lg uppercase hover:bg-red-500/10 transition">Gagal Kirim (Return)</button>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-xs text-rc-muted bg-rc-card p-5 rounded-xl border-[0.5px] border-rc-main/10">Bebas Tugas Pengantaran Saat Ini.</p>}
                            </div>
                        </div>
                    )}

                    {/* Tab: Pool Paket (Tersedia untuk Diambil) */}
                    {activeTab === 'pool' && (
                        <div className="space-y-6 animate-fade-in w-full">
                            <div className="bg-gradient-to-r from-rc-card to-rc-bg p-8 rounded-2xl border-[0.5px] border-rc-main/10 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tighter text-rc-main">Pool Paket Menunggu Jemputan</h2>
                                    <p className="text-xs text-rc-muted mt-1 uppercase font-bold tracking-widest">Silakan pilih paket yang ingin Anda ambil untuk dikirim ke gudang.</p>
                                </div>
                                <div className="bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20 text-green-500 font-black text-[10px] uppercase tracking-widest animate-pulse">
                                    {availablePickups.length} Paket Tersedia
                                </div>
                            </div>

                            {availablePickups.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {availablePickups.map(p => (
                                        <div key={p.id} className="bg-rc-card p-6 rounded-3xl border-[0.5px] border-rc-main/10 hover:border-green-500/30 transition-all group relative overflow-hidden">
                                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-colors"></div>

                                            <div className="flex justify-between items-start mb-6">
                                                <div className="w-12 h-12 bg-rc-bg rounded-2xl flex items-center justify-center border border-rc-main/10 text-rc-muted text-xl shadow-inner"><i className="fa-solid fa-box-open"></i></div>
                                                <div className="text-right">
                                                    <div className="text-[10px] font-black text-rc-muted uppercase tracking-widest">Nomor Pesanan</div>
                                                    <div className="text-xs font-mono font-bold text-rc-main">#{p.order_number}</div>
                                                </div>
                                            </div>

                                            <div className="space-y-4 mb-8">
                                                <div>
                                                    <div className="text-[9px] font-black text-rc-muted uppercase tracking-widest mb-1 opacity-50">Lokasi Penjemputan</div>
                                                    <p className="font-bold text-xs text-rc-main flex items-center gap-2"><i className="fa-solid fa-shop text-green-500"></i> {p.shop?.nama_toko}</p>
                                                    <p className="text-[10px] text-rc-muted mt-1 line-clamp-1"><i className="fa-solid fa-location-dot"></i> {p.shop?.alamat_toko}</p>
                                                </div>

                                                <div className="pt-4 border-t border-rc-main/5 flex justify-between items-center">
                                                    <div>
                                                        <div className="text-[9px] font-black text-rc-muted uppercase tracking-widest mb-1 opacity-50">Ongkos Jemput</div>
                                                        <p className="font-black text-sm text-green-500">Rp 2.000</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[9px] font-black text-rc-muted uppercase tracking-widest mb-1 opacity-50">Layanan</div>
                                                        <p className="text-[10px] font-bold text-rc-main uppercase tracking-widest">{p.shipping_service}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleTakeTask(p.id)}
                                                className="w-full bg-gradient-to-tr from-green-600 to-emerald-500 text-black font-black text-[10px] py-4 rounded-xl shadow-lg shadow-green-500/10 hover:shadow-green-500/30 hover:-translate-y-1 transition-all uppercase tracking-widest"
                                            >
                                                <i className="fa-solid fa-hand-holding-box mr-2"></i> Ambil Tugas Ini
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-32 bg-rc-card border border-rc-main/10 rounded-3xl text-center px-6">
                                    <div className="w-24 h-24 bg-rc-bg rounded-full flex items-center justify-center text-rc-muted/20 mb-6 text-5xl border border-rc-main/5 shadow-inner"><i className="fa-solid fa-boxes-packing"></i></div>
                                    <h3 className="text-rc-main font-black tracking-widest uppercase mb-2">Pool Paket Kosong</h3>
                                    <p className="text-xs text-rc-muted max-w-xs leading-relaxed">Saat ini tidak ada paket yang menunggu untuk dijemput. Silakan periksa kembali beberapa saat lagi.</p>
                                </div>
                            )}
                        </div>
                    )}


                    {/* Tab: Courier Salary (Staff) */}
                    {!isAdmin && activeTab === 'salary' && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-green-500/10 to-transparent p-10 rounded-2xl border-[0.5px] border-green-500/30">
                                <h3 className="text-sm font-black uppercase text-green-500 mb-2 tracking-widest">Saldo Pendapatan Mutlak Anda</h3>
                                <p className="text-5xl font-black tracking-tighter text-rc-main"><span className="text-2xl font-normal text-rc-muted">Rp</span> {new Intl.NumberFormat('id-ID').format(earnings - withdrawn)}</p>
                                <p className="text-[10px] text-rc-muted mt-4 font-bold uppercase">Total Penghasilan: Rp {new Intl.NumberFormat('id-ID').format(earnings)} | Ditarik: Rp {new Intl.NumberFormat('id-ID').format(withdrawn)}</p>
                            </div>

                            <div className="bg-rc-card p-6 rounded-2xl border-[0.5px] border-rc-main/10 shadow-lg">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-rc-muted mb-6 flex items-center gap-2"><i className="fa-solid fa-money-bill-transfer"></i> Tarik Dana Ke Rekening</h4>
                                <form onSubmit={handleWithdraw}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-rc-muted mb-1">Nominal Tarik (Rp)</label>
                                            <input required type="number" min="10000" max={earnings - withdrawn} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="w-full bg-rc-bg p-3 border-[0.5px] border-rc-main/10 rounded-lg outline-none focus:border-green-500 text-xs text-rc-main" placeholder="Min. 10000" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-rc-muted mb-1">Informasi Bank / E-Wallet</label>
                                            <input required type="text" value={withdrawBank} onChange={e => setWithdrawBank(e.target.value)} className="w-full bg-rc-bg p-3 border-[0.5px] border-rc-main/10 rounded-lg outline-none focus:border-green-500 text-xs text-rc-main" placeholder="Contoh: BCA 1234567890 a.n Sutejo" />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={isWithdrawing || (earnings - withdrawn) < 10000} className="mt-4 bg-green-500 text-black font-bold text-xs px-6 py-3 rounded-lg shadow-lg uppercase hover:bg-green-400 transition w-full sm:w-auto disabled:opacity-50">
                                        {isWithdrawing ? 'Memproses...' : 'Ajukan Penarikan'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Tab: Scan Paket */}
                    {activeTab === 'scan' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-rc-card p-10 rounded-2xl border-[0.5px] border-rc-main/10 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent"></div>
                                <i className="fa-solid fa-qrcode text-6xl text-green-500 mb-6 block"></i>
                                <h2 className="text-xl font-black uppercase text-rc-main mb-2">Scan QR / Barcode Paket</h2>
                                <p className="text-xs text-rc-muted mb-8 max-w-sm mx-auto">Gunakan kamera perangkat Anda untuk memindai kode paket guna mempercepat pembaruan status pengiriman.</p>
                                <button className="bg-green-500 text-black font-black uppercase px-10 py-4 rounded-xl shadow-lg hover:bg-green-400 transition-all flex items-center gap-3 mx-auto">
                                    <i className="fa-solid fa-camera"></i> Aktifkan Kamera
                                </button>
                                <div className="mt-10 pt-10 border-t border-rc-main/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-rc-bg rounded-xl border border-rc-main/5 text-left">
                                        <h4 className="text-[10px] font-black uppercase text-green-500 mb-1">Panduan Scan</h4>
                                        <p className="text-[10px] text-rc-muted leading-relaxed">Pastikan cahaya cukup dan kode paket berada di dalam bingkai pemindai.</p>
                                    </div>
                                    <div className="p-4 bg-rc-bg rounded-xl border border-rc-main/5 text-left">
                                        <h4 className="text-[10px] font-black uppercase text-blue-500 mb-1">Auto-Update</h4>
                                        <p className="text-[10px] text-rc-muted leading-relaxed">Status paket akan otomatis berubah menjadi "Sedang Dikirim" setelah scan berhasil.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Performance (Kinerja) */}
                    {activeTab === 'performance' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-rc-card p-8 rounded-2xl border-[0.5px] border-rc-main/10 text-center">
                                    <h4 className="text-[10px] font-black uppercase text-rc-muted mb-2 tracking-widest">Kepuasan Pelanggan</h4>
                                    <div className="text-4xl font-black text-yellow-400">{stats.rating.toFixed(1)}<span className="text-sm">/5.0</span></div>
                                    <div className="flex justify-center gap-1 mt-2 text-yellow-400 text-[10px]">
                                        {[...Array(Math.floor(stats.rating))].map((_, i) => <i key={i} className="fa-solid fa-star"></i>)}
                                        {stats.rating % 1 > 0 && <i className="fa-solid fa-star-half-stroke"></i>}
                                    </div>
                                </div>
                                <div className="bg-rc-card p-8 rounded-2xl border-[0.5px] border-rc-main/10 text-center">
                                    <h4 className="text-[10px] font-black uppercase text-rc-muted mb-2 tracking-widest">Ketepatan Waktu</h4>
                                    <div className="text-4xl font-black text-green-400">{stats.punctuality}<span className="text-sm">%</span></div>
                                    <p className="text-[10px] text-rc-muted mt-2 uppercase font-bold text-green-500/80">
                                        {stats.punctuality >= 90 ? 'Sangat Tepat Waktu' : stats.punctuality >= 75 ? 'Cukup Tepat Waktu' : 'Perlu Peningkatan'}
                                    </p>
                                </div>
                                <div className="bg-rc-card p-8 rounded-2xl border-[0.5px] border-rc-main/10 text-center">
                                    <h4 className="text-[10px] font-black uppercase text-rc-muted mb-2 tracking-widest">Total Selesai</h4>
                                    <div className="text-4xl font-black text-blue-400">{new Intl.NumberFormat('id-ID').format(stats.completed)}</div>
                                    <p className="text-[10px] text-rc-muted mt-2 uppercase font-bold">Paket Terantar / Terjemput</p>
                                </div>
                            </div>
                            <div className="bg-rc-card p-6 rounded-2xl border-[0.5px] border-rc-main/10 italic text-[11px] text-rc-muted text-center uppercase tracking-widest opacity-50">
                                Data kinerja dihitung berdasarkan 30 hari terakhir aktivitas Anda.
                            </div>
                        </div>
                    )}

                    {/* Tab: Penalties (Penalti) */}
                    {activeTab === 'penalties' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-rc-card p-10 rounded-2xl border-[0.5px] border-red-500/20 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent"></div>
                                <i className="fa-solid fa-shield-virus text-6xl text-red-500 mb-6 block"></i>
                                <h2 className="text-xl font-black uppercase text-rc-main mb-2">Rekam Jejak Pelanggaran</h2>
                                <p className="text-xs text-rc-muted mb-8 max-w-sm mx-auto">Tetap patuhi Standar Operasional Prosedur (SOP) untuk menghindari denda dan pembekuan akun.</p>

                                <div className="text-left space-y-4">
                                    <div className="p-4 bg-rc-bg/50 rounded-xl border border-red-500/10 flex justify-between items-center">
                                        <div>
                                            <h4 className="text-[11px] font-black text-rc-main uppercase">Skor Poin Penalti</h4>
                                            <p className="text-[10px] text-rc-muted uppercase">Batas Maksimal: 10 Poin</p>
                                        </div>
                                        <div className="text-2xl font-black text-rc-main">0</div>
                                    </div>
                                    <p className="text-[10px] text-rc-muted text-center uppercase font-bold tracking-widest mt-4">Bersih dari riwayat pelanggaran aktif.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Profile (Profil) */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-rc-card p-10 rounded-2xl border-[0.5px] border-rc-main/10 relative overflow-hidden">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-full border-4 border-green-500/20 p-1">
                                            <div className="w-full h-full rounded-full bg-rc-bg flex items-center justify-center overflow-hidden">
                                                {user?.profile_photo_url ? (
                                                    <img src={user.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <i className="fa-solid fa-user-astronaut text-4xl text-rc-muted"></i>
                                                )}
                                            </div>
                                        </div>
                                        <button className="absolute bottom-0 right-0 w-10 h-10 bg-green-500 text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition border-4 border-rc-card">
                                            <i className="fa-solid fa-camera text-sm"></i>
                                        </button>
                                    </div>
                                    <div className="text-center md:text-left flex-grow">
                                        <h2 className="text-2xl font-black text-rc-main uppercase tracking-tighter mb-1">{user?.name}</h2>
                                        <p className="text-xs text-rc-muted font-bold uppercase tracking-widest mb-4">{user?.role === 'admin_kurir' ? 'Koordinator Wilayah' : 'Staff Ekspedisi Lapangan'}</p>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                            <div className="px-4 py-2 bg-rc-bg rounded-lg border border-rc-main/10 text-[10px] font-bold text-rc-muted uppercase"><i className="fa-solid fa-envelope mr-1 text-green-500"></i> {user?.email}</div>
                                            <div className="px-4 py-2 bg-rc-bg rounded-lg border border-rc-main/10 text-[10px] font-bold text-rc-muted uppercase"><i className="fa-solid fa-phone mr-1 text-green-500"></i> {user?.phone || 'Belum diatur'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Help (Pusat Bantuan) */}
                    {activeTab === 'help' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-rc-card p-10 rounded-2xl border-[0.5px] border-rc-main/10 text-center">
                                <i className="fa-solid fa-headset text-6xl text-green-500 mb-6 block"></i>
                                <h2 className="text-xl font-black uppercase text-rc-main mb-2">Butuh Bantuan, {user?.name.split(' ')[0]}?</h2>
                                <p className="text-xs text-rc-muted mb-8 max-w-sm mx-auto">Tim support kami siap membantu kendala aplikasi, paket, maupun dompet penarikan Anda.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                    <a href="https://wa.me/628123456789" target="_blank" rel="noopener noreferrer" className="p-6 bg-rc-bg rounded-2xl border border-rc-main/5 hover:border-green-500/50 transition flex items-center gap-4 group">
                                        <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center text-xl group-hover:bg-green-500 group-hover:text-black transition-colors"><i className="fa-brands fa-whatsapp"></i></div>
                                        <div>
                                            <h4 className="text-xs font-black text-rc-main uppercase">WhatsApp Support</h4>
                                            <p className="text-[10px] text-rc-muted uppercase">Respon Cepat 24 Jam</p>
                                        </div>
                                    </a>
                                    <div className="p-6 bg-rc-bg rounded-2xl border border-rc-main/5 hover:border-blue-500/50 transition flex items-center gap-4 group cursor-pointer">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl group-hover:bg-blue-500 group-hover:text-white transition-colors"><i className="fa-solid fa-book-open"></i></div>
                                        <div>
                                            <h4 className="text-xs font-black text-rc-main uppercase">Buku Panduan</h4>
                                            <p className="text-[10px] text-rc-muted uppercase">Pelajari SOP Kurir</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Settings (Pengaturan) */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-rc-card p-8 rounded-2xl border-[0.5px] border-rc-main/10">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-green-500 mb-8 border-l-4 border-green-500 pl-4">Konfigurasi Akun & Keamanan</h3>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-rc-bg/50 rounded-xl border border-rc-main/5 hover:border-rc-main/20 transition">
                                        <div>
                                            <h4 className="text-xs font-bold text-rc-main uppercase">Notifikasi Real-time</h4>
                                            <p className="text-[10px] text-rc-muted uppercase mt-0.5">Dapatkan info paket baru masuk</p>
                                        </div>
                                        <div className="w-12 h-6 bg-green-500/20 rounded-full relative p-1 cursor-pointer">
                                            <div className="w-4 h-4 bg-green-500 rounded-full shadow-lg ml-auto"></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-rc-bg/50 rounded-xl border border-rc-main/5 hover:border-rc-main/20 transition">
                                        <div>
                                            <h4 className="text-xs font-bold text-rc-main uppercase">Ganti Kata Sandi</h4>
                                            <p className="text-[10px] text-rc-muted uppercase mt-0.5">Terakhir diubah 2 bulan lalu</p>
                                        </div>
                                        <i className="fa-solid fa-chevron-right text-rc-muted"></i>
                                    </div>
                                    <button className="w-full py-4 text-xs font-black uppercase tracking-widest text-red-500 bg-red-500/5 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/20">
                                        Keluar Sesi Perangkat Lain
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Fail Modal */}
            {failModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-rc-card border-[0.5px] border-red-500/30 rounded-xl max-w-sm w-full p-6 shadow-2xl relative">
                        <button onClick={() => { setFailModalOpen(false); setFailOrderId(null); }} className="absolute top-4 right-4 text-rc-muted hover:text-white transition"><i className="fa-solid fa-xmark"></i></button>
                        <h2 className="text-lg font-black uppercase text-red-500 mb-2 mt-2">Pelaporan Gagal Kirim</h2>
                        <p className="text-xs text-rc-muted mb-6">Ceritakan kendala di lapangan sehingga paket tidak bisa diserahkan ke pembeli.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-rc-muted uppercase mb-2">Alasan</label>
                                <textarea required value={failReason} onChange={(e) => setFailReason(e.target.value)} rows="3" className="w-full bg-rc-bg p-3 border-[0.5px] border-rc-main/10 rounded-lg outline-none text-xs text-rc-main focus:border-red-500" placeholder="Contoh: Alamat pembeli bodong, rumah dikunci tidak ada orang, dll..."></textarea>
                            </div>
                            <button onClick={() => handleDeliver(failOrderId, true)} disabled={!failReason} className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase py-3 rounded-lg shadow-lg disabled:opacity-50 transition">Konfirmasi Gagal</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
