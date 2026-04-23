import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function CourierDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('');
    const [loading, setLoading] = useState(true);

    // Admin Data
    const [staffs, setStaffs] = useState([]);
    
    // Staff Data (Misi Aktif)
    const [pickups, setPickups] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
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
                const staffRes = await axios.get('/api/courier/staffs');
                setStaffs(staffRes.data);
            } else if (r === 'kurir_staff') {
                const taskRes = await axios.get('/api/courier/tasks');
                setPickups(taskRes.data.pickups || []);
                setDeliveries(taskRes.data.deliveries || []);
                setEarnings(taskRes.data.earnings || 0);
                setWithdrawn(taskRes.data.withdrawn || 0);
            }
        } catch (e) {
            console.error("Gagal load data courier portal", e);
        } finally {
            setLoading(false);
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

    if (loading && !user) return <div className="text-center p-20 text-rc-muted animate-pulse">Memverifikasi Identitas Kurir...</div>;

    const isAdmin = user.role === 'admin_kurir' || user.role === 'super_admin';

    return (
        <div className="bg-rc-bg min-h-screen font-sans text-rc-main pb-20">
            {/* Header */}
            <header className="bg-rc-card border-b-[0.5px] border-rc-main/20 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-4 justify-between items-center text-center md:text-left">
                    <h1 className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 uppercase tracking-widest flex items-center justify-center md:justify-start gap-3">
                        <i className="fa-solid fa-truck-fast text-green-500"></i> PORTAL KURIR {isAdmin ? 'ADMIN' : 'STAFF'}
                    </h1>
                    <Link to="/dashboard" className="text-[10px] md:text-xs font-bold text-rc-main bg-rc-bg border-[0.5px] border-rc-main/10 px-5 py-2.5 rounded-md hover:bg-rc-main hover:text-rc-bg transition uppercase w-full md:w-auto">
                        Kembali Ke Toko
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 mt-8">
                {/* Tabs */}
                <div className="flex border-b-[0.5px] border-rc-main/20 mb-8 gap-6 overflow-x-auto no-scrollbar">
                    {isAdmin ? (
                        <>
                            <button onClick={() => setActiveTab('employees')} className={`pb-4 font-bold tracking-widest text-xs uppercase whitespace-nowrap transition-colors relative ${activeTab === 'employees' ? 'text-green-500' : 'text-rc-muted hover:text-rc-main/80'}`}>Manajemen Karyawan {activeTab === 'employees' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-green-500"></div>}</button>
                            <button onClick={() => setActiveTab('packages')} className={`pb-4 font-bold tracking-widest text-xs uppercase whitespace-nowrap transition-colors relative ${activeTab === 'packages' ? 'text-green-500' : 'text-rc-muted hover:text-rc-main/80'}`}>Pengaturan Paket {activeTab === 'packages' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-green-500"></div>}</button>
                            <button onClick={() => setActiveTab('address')} className={`pb-4 font-bold tracking-widest text-xs uppercase whitespace-nowrap transition-colors relative ${activeTab === 'address' ? 'text-green-500' : 'text-rc-muted hover:text-rc-main/80'}`}>Alamat Kantor {activeTab === 'address' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-green-500"></div>}</button>
                            <button onClick={() => setActiveTab('profit')} className={`pb-4 font-bold tracking-widest text-xs uppercase whitespace-nowrap transition-colors relative ${activeTab === 'profit' ? 'text-green-500' : 'text-rc-muted hover:text-rc-main/80'}`}>Laba Perusahaan {activeTab === 'profit' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-green-500"></div>}</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setActiveTab('missions')} className={`pb-4 font-bold tracking-widest text-xs uppercase whitespace-nowrap transition-colors relative ${activeTab === 'missions' ? 'text-green-500' : 'text-rc-muted hover:text-rc-main/80'}`}>Misi Paket {activeTab === 'missions' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-green-500"></div>}</button>
                            <button onClick={() => setActiveTab('salary')} className={`pb-4 font-bold tracking-widest text-xs uppercase whitespace-nowrap transition-colors relative ${activeTab === 'salary' ? 'text-green-500' : 'text-rc-muted hover:text-rc-main/80'}`}>Keuntungan (Dompet) {activeTab === 'salary' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-green-500"></div>}</button>
                        </>
                    )}
                </div>

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
                    <p className="text-rc-muted text-xs font-bold p-10 bg-rc-card/50 text-center rounded">PANEL PENUGASAN (DALAM PENGEMBANGAN)</p>
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
                        <div>
                            <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-widest mb-4 flex items-center gap-2"><i className="fa-solid fa-box-open"></i> Misi Penjemputan Toko</h3>
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
                                            <p className="text-xs text-rc-muted mb-4 h-10 truncate"><i className="fa-solid fa-location-dot"></i> {p.shop?.alamat_toko}</p>
                                            
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
                                            
                                            <button onClick={() => handleDeliver(d.id)} className="w-full bg-blue-500 text-white font-bold text-[10px] px-4 py-2 mb-2 rounded shadow-lg uppercase hover:bg-blue-400 transition">Selesaikan Pengantaran (DITERIMA)</button>
                                            <button onClick={() => {setFailOrderId(d.id); setFailModalOpen(true);}} className="w-full bg-rc-bg text-red-500 font-bold text-[10px] px-4 py-2 border-[0.5px] border-red-500/20 rounded shadow-lg uppercase hover:bg-red-500/10 transition">Gagal Kirim (Return)</button>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-xs text-rc-muted bg-rc-card p-5 rounded-xl border-[0.5px] border-rc-main/10">Bebas Tugas Pengantaran Saat Ini.</p>}
                        </div>
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
            </main>

            {/* Fail Modal */}
            {failModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-rc-card border-[0.5px] border-red-500/30 rounded-xl max-w-sm w-full p-6 shadow-2xl relative">
                        <button onClick={() => {setFailModalOpen(false); setFailOrderId(null);}} className="absolute top-4 right-4 text-rc-muted hover:text-white transition"><i className="fa-solid fa-xmark"></i></button>
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
