import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function LogisticsPortal() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [packages, setPackages] = useState({ incoming: [], at_warehouse: [], delivering: [] });
    const [couriers, setCouriers] = useState([]);
    const [activeTab, setActiveTab] = useState('receive'); // receive, assign, logs
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyRole = async () => {
            try {
                const res = await axios.get('/api/user');
                const r = res.data.role;
                if(r !== 'super_admin' && r !== 'admin_logistik' && r !== 'logistik_staff') {
                   navigate('/dashboard'); return;
                }
                fetchLogisticsData();
                fetchCouriers();
            } catch(e) { navigate('/login'); }
        };
        verifyRole();
    }, []);

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

    if (loading && !stats) return <div className="min-h-screen bg-rc-bg flex items-center justify-center font-bold text-rc-logo uppercase tracking-widest"><i className="fa-solid fa-satellite-dish fa-spin mr-3"></i> Menghubungkan ke Satelit Logistik...</div>;

    return (
        <div className="bg-rc-bg min-h-screen font-sans text-rc-main pb-20">
            <header className="bg-rc-bg border-b-[0.5px] border-rc-main/20 sticky top-0 z-30 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row gap-4 justify-between items-center text-center sm:text-left">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300 uppercase italic tracking-tighter flex items-center justify-center sm:justify-start gap-2">
                        RADENCAK LOGISTICS <span className="text-[8px] sm:text-[10px] not-italic font-bold text-rc-muted border border-rc-main/20 px-2 py-0.5 rounded">v2.0</span>
                    </h1>
                    <Link to="/dashboard" className="text-[10px] font-bold bg-rc-card hover:bg-rc-main hover:text-rc-bg text-rc-main px-6 py-2 border-[0.5px] border-rc-main/10 rounded-full transition-all uppercase flex items-center gap-2 shadow-lg w-full sm:w-auto justify-center">
                        <i className="fa-solid fa-arrow-left"></i> Kembali
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-12">
                
                {/* Global Performance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-rc-card p-10 rounded-[2rem] border-[0.5px] border-rc-main/10 relative overflow-hidden group hover:border-blue-500/50 transition-all duration-500">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full group-hover:bg-blue-500/20 transition-colors"></div>
                        <h2 className="text-[10px] font-black uppercase text-rc-muted tracking-[0.2em] mb-4">Dalam Pengiriman</h2>
                        <div className="text-6xl font-black text-blue-400 tracking-tighter">{stats?.total_in_delivery || 0}</div>
                    </div>
                    <div className="bg-rc-card p-10 rounded-[2rem] border-[0.5px] border-rc-main/10 relative overflow-hidden group hover:border-yellow-500/50 transition-all duration-500">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full group-hover:bg-yellow-500/20 transition-colors"></div>
                        <h2 className="text-[10px] font-black uppercase text-rc-muted tracking-[0.2em] mb-4">Pemrosesan / Sortir</h2>
                        <div className="text-6xl font-black text-yellow-400 tracking-tighter">{stats?.total_processing || 0}</div>
                    </div>
                    <div className="bg-rc-card p-10 rounded-[2rem] border-[0.5px] border-rc-main/10 relative overflow-hidden group hover:border-green-500/50 transition-all duration-500">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-green-500/10 blur-3xl rounded-full group-hover:bg-green-500/20 transition-colors"></div>
                        <h2 className="text-[10px] font-black uppercase text-rc-muted tracking-[0.2em] mb-4">Berhasil Terantar</h2>
                        <div className="text-6xl font-black text-green-400 tracking-tighter">{stats?.total_delivered || 0}</div>
                    </div>
                </div>

                {/* Logistics Control Tabs */}
                <div className="flex border-b-[0.5px] border-rc-main/20 mt-12 mb-8 gap-6 overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveTab('receive')} className={`pb-4 font-bold tracking-widest text-xs uppercase whitespace-nowrap transition-colors relative ${activeTab === 'receive' ? 'text-teal-400' : 'text-rc-muted hover:text-rc-main/80'}`}>Penerimaan Paket {activeTab === 'receive' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-teal-400"></div>}</button>
                    <button onClick={() => setActiveTab('assign')} className={`pb-4 font-bold tracking-widest text-xs uppercase whitespace-nowrap transition-colors relative ${activeTab === 'assign' ? 'text-teal-400' : 'text-rc-muted hover:text-rc-main/80'}`}>Penyortiran & Penugasan {activeTab === 'assign' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-teal-400"></div>}</button>
                    <button onClick={() => setActiveTab('logs')} className={`pb-4 font-bold tracking-widest text-xs uppercase whitespace-nowrap transition-colors relative ${activeTab === 'logs' ? 'text-teal-400' : 'text-rc-muted hover:text-rc-main/80'}`}>Radar Log Tracking {activeTab === 'logs' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-teal-400"></div>}</button>
                </div>

                {/* Tab: Receive Packages */}
                {activeTab === 'receive' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-rc-card border-[0.5px] border-rc-main/10 rounded-2xl overflow-hidden">
                            <div className="p-6 bg-teal-500/10 border-b-[0.5px] border-rc-main/10">
                                <h3 className="text-sm font-bold text-teal-400 uppercase tracking-widest"><i className="fa-solid fa-barcode"></i> Scan Paket Masuk dari Kurir Penjemput</h3>
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
                            <div className="p-6 bg-yellow-500/10 border-b-[0.5px] border-rc-main/10">
                                <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-widest"><i className="fa-solid fa-people-carry-box"></i> Disposisi Pengiriman Ke Pembeli</h3>
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
                                            {packages.at_warehouse.map(p => {
                                                const [selectedCourier, setSelectedCourier] = useState('');
                                                return (
                                                    <tr key={p.id} className="border-b-[0.5px] border-rc-main/10">
                                                        <td className="py-4">#{p.order_number}</td>
                                                        <td className="py-4 truncate max-w-[200px]">{p.address_info}</td>
                                                        <td className="py-4">
                                                            <select value={selectedCourier} onChange={e => setSelectedCourier(e.target.value)} className="bg-rc-bg border-[0.5px] border-rc-main/20 p-2 rounded text-rc-main outline-none w-full max-w-[200px]">
                                                                <option value="">-- Pilih Kurir Area --</option>
                                                                {couriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                            </select>
                                                        </td>
                                                        <td className="py-4">
                                                            <button onClick={() => handleAssign(p.id, selectedCourier)} className="bg-yellow-500 text-black px-4 py-2 font-bold uppercase rounded text-[10px] hover:bg-yellow-400">Kirim</button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
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
            </main>
        </div>
    );
}
