import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Truck, Menu, Search, Plus, ShieldCheck, Users, Star
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import CourierSidebar from '../components/courier/CourierSidebar';
import AddStaffModal from '../components/Modals/AddStaffModal';

// Modular Components
import CourierOverview from '../components/courier/CourierOverview';
import CourierMissions from '../components/courier/CourierMissions';
import CourierPool from '../components/courier/CourierPool';
import CourierScan from '../components/courier/CourierScan';
import CourierSalary from '../components/courier/CourierSalary';
import CourierPerformance from '../components/courier/CourierPerformance';
import { CourierPenalties, CourierHelp, CourierProfile, CourierSettings } from '../components/courier/CourierMisc';
import CourierRateMitra from '../components/courier/CourierRateMitra';
import CourierAdminTabs from '../components/courier/CourierAdminTabs';

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
    const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);

    // Admin Data
    const [staffs, setStaffs] = useState([]);

    // Staff Data (Misi Aktif)
    const [pickups, setPickups] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [availablePickups, setAvailablePickups] = useState([]);
    const [incomingToHub, setIncomingToHub] = useState([]);
    const [atHub, setAtHub] = useState([]);
    const [waitingLogistics, setWaitingLogistics] = useState([]);
    const [earnings, setEarnings] = useState(0);
    const [withdrawn, setWithdrawn] = useState(0);
    const [stats, setStats] = useState({ completed: 0, punctuality: 100, rating: 5.0 });

    // Success delivery / pickup state
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [successOrderId, setSuccessOrderId] = useState(null);
    const [successType, setSuccessType] = useState('pickup');
    const [proofImage, setProofImage] = useState(null);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const res = await axios.get('/api/user');
            const r = res.data.role;
            const status = res.data.status;
            if (r !== 'admin_kurir' && r !== 'kurir_staff' && r !== 'sortir_kurir' && r !== 'kurir' && r !== 'super_admin' && r !== 'admin_staff') {
                navigate('/dashboard', { replace: true }); return;
            }
            if (!['super_admin', 'admin_staff'].includes(r) && status !== 'active') {
                navigate('/dashboard', { replace: true }); return;
            }
            setUser(res.data);
            setActiveTab(r === 'admin_kurir' || r === 'super_admin' ? 'employees' : (r === 'kurir' ? 'missions' : 'pool'));
            fetchData(r);
        } catch (e) { navigate('/login'); }
    };

    const fetchData = async (role) => {
        setLoading(true);
        const r = role || user?.role;
        try {
            const taskRes = await axios.get('/api/courier/tasks');
            setPickups(taskRes.data.pickups || []);
            setDeliveries(taskRes.data.deliveries || []);
            setAvailablePickups(taskRes.data.available_pickups || []);
            setIncomingToHub(taskRes.data.incoming_to_hub || []);
            setAtHub(taskRes.data.at_hub || []);
            setWaitingLogistics(taskRes.data.waiting_logistics || []);
            setEarnings(taskRes.data.earnings || 0);
            setWithdrawn(taskRes.data.withdrawn || 0);
            if (taskRes.data.stats) setStats(taskRes.data.stats);

            if (r === 'admin_kurir' || r === 'super_admin' || r === 'admin_staff') {
                const staffRes = await axios.get('/api/user/staff');
                setStaffs(staffRes.data);
            }
        } catch (e) {} finally { setLoading(false); }
    };

    const handleTakeTask = async (id) => {
        setLoading(true);
        try {
            await axios.post(`/api/courier/take-task/${id}`);
            fetchData();
        } catch (e) { alert(e.response?.data?.message || 'Gagal mengambil tugas.'); }
        finally { setLoading(false); }
    };

    const handleAssignTask = async (orderId, staffId) => {
        if (!staffId) return alert("Pilih kurir terlebih dahulu!");
        setLoading(true);
        try {
            await axios.post(`/api/courier/assign/${orderId}`, { pickup_courier_id: staffId });
            fetchData();
        } catch (e) { alert(e.response?.data?.message || 'Gagal menugaskan kurir.'); }
        finally { setLoading(false); }
    };

    const handlePickup = async (id) => {
        setSuccessOrderId(id);
        setSuccessType('pickup');
        setSuccessModalOpen(true);
    };

    const handleDeliver = async (id) => {
        setSuccessOrderId(id);
        setSuccessType('delivery');
        setSuccessModalOpen(true);
    };

    const handleConfirmSuccess = async () => {
        setLoading(true);
        const formData = new FormData();
        if (proofImage) formData.append('proof_image', proofImage);
        formData.append('status', 'success');
        try {
            const endpoint = successType === 'pickup' ? `/api/courier/pickup/${successOrderId}` : `/api/courier/deliver/${successOrderId}`;
            await axios.post(endpoint, formData);
            setSuccessModalOpen(false);
            setProofImage(null);
            fetchData();
        } catch (e) { alert(e.response?.data?.message || 'Gagal konfirmasi.'); }
        finally { setLoading(false); }
    };

    const handleStaffStatus = async (id, status) => {
        if (!window.confirm(`Yakin ingin ${status === 'active' ? 'menerima' : 'menolak'} staff ini?`)) return;
        try {
            await axios.post(`/api/user/staff/${id}/status`, { status });
            fetchData();
        } catch (e) { alert(e.response?.data?.message || 'Gagal update status staff'); }
    };

    if (loading && !user) return (
        <div className="bg-rc-bg min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-black text-rc-muted uppercase tracking-[0.3em] animate-pulse">Menghubungkan Radar...</p>
            </div>
        </div>
    );

    const isAdmin = user?.role === 'admin_kurir' || user?.role === 'super_admin' || user?.role === 'admin_staff';

    return (
        <div className="bg-rc-bg min-h-screen flex font-sans text-rc-main">
            <CourierSidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                isOpen={isSidebarOpen} 
                setIsOpen={setIsSidebarOpen}
                userRole={user?.role}
            />

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Top Header */}
                <header className="h-20 bg-rc-card/50 backdrop-blur-xl border-b border-rc-main/10 flex items-center justify-between px-8 shrink-0 z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-rc-muted hover:text-rc-main">
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="hidden md:block">
                            <h2 className="text-sm font-black text-rc-main uppercase tracking-widest flex items-center gap-2">
                                <span className="p-1.5 bg-green-500/10 rounded-md"><Truck className="w-4 h-4 text-green-500" /></span>
                                Radar Kurir Operasional
                            </h2>
                            <div className="flex items-center gap-3 mt-0.5">
                                <p className="text-[10px] text-rc-muted font-bold uppercase tracking-wider">{user?.mitra_name || 'Radencak Express'}</p>
                                {isAdmin && user?.rating > 0 && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 rounded-full">
                                        <Star className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                                        <span className="text-[9px] font-black text-yellow-600">{parseFloat(user?.rating || 0).toFixed(1)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-rc-bg rounded-xl border border-rc-main/10">
                            <Search className="w-4 h-4 text-rc-muted" />
                            <input type="text" placeholder="Cari Tugas / Resi..." className="bg-transparent border-none outline-none text-xs text-rc-main w-48 font-medium" />
                        </div>
                        <div className="flex items-center gap-3 pl-6 border-l border-rc-main/10">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-black text-rc-main uppercase">{user?.name}</p>
                                <p className="text-[10px] text-green-500 uppercase font-black">{isAdmin ? 'Admin Wilayah' : 'Staff Lapangan'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-rc-bg border border-rc-main/10 flex items-center justify-center overflow-hidden shadow-inner">
                                {user?.avatar ? <img src={user.avatar.startsWith('http') ? user.avatar : `/storage/${user.avatar}`} className="w-full h-full object-cover" alt="Profile" /> : <Users className="w-5 h-5 text-rc-muted" />}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Summary Cards for Staff */}
                            {!isAdmin && (activeTab === 'missions' || activeTab === 'salary') && (
                                <CourierOverview stats={stats} earnings={earnings} withdrawn={withdrawn} />
                            )}

                            {/* Missions Tab */}
                            {!isAdmin && activeTab === 'missions' && (
                                <CourierMissions pickups={pickups} deliveries={deliveries} handlePickup={handlePickup} handleDeliver={handleDeliver} />
                            )}

                            {/* Pool Tab / Packages List */}
                            {(activeTab === 'pool' || activeTab === 'packages') && (
                                <CourierPool 
                                    isAdmin={isAdmin} 
                                    availablePickups={availablePickups} 
                                    incomingToHub={incomingToHub}
                                    atHub={atHub}
                                    waitingLogistics={waitingLogistics}
                                    handleTakeTask={handleTakeTask} 
                                    staffs={staffs} 
                                    handleAssignTask={handleAssignTask} 
                                    fetchData={fetchData}
                                />
                            )}

                            {/* Employees Tab (Admin) */}
                            {isAdmin && activeTab === 'employees' && (
                                <div className="space-y-10">
                                    <div className="flex justify-between items-center bg-rc-card p-8 rounded-3xl border border-rc-main/10 relative overflow-hidden shadow-2xl">
                                        <div className="relative z-10">
                                            <h3 className="text-xl font-black uppercase text-rc-main tracking-tighter">Personel Lapangan</h3>
                                            <p className="text-[10px] font-black text-rc-muted uppercase tracking-[0.2em] mt-1">Database Kurir & Staff Aktif</p>
                                        </div>
                                        <button 
                                            onClick={() => setIsAddStaffModalOpen(true)}
                                            className="bg-green-500 text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-green-500/20 hover:scale-105 transition-all flex items-center gap-2 relative z-10"
                                        >
                                            <Plus className="w-4 h-4" /> Tambah Kurir Baru
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {staffs.map(s => (
                                            <div key={s.id} className={`bg-rc-card border border-rc-main/10 p-8 rounded-[2.5rem] flex flex-col group hover:border-green-500/30 transition-all duration-500 shadow-lg ${s.status === 'rejected' ? 'grayscale opacity-60' : ''}`}>
                                                <div className="flex items-start justify-between mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-rc-bg border border-rc-main/10 flex items-center justify-center text-rc-muted group-hover:scale-110 group-hover:bg-green-500/10 group-hover:text-green-500 transition-all duration-500">
                                                            <Truck className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-rc-main uppercase text-[12px] tracking-tight">{s.name}</h4>
                                                            <p className="text-[9px] text-rc-muted font-bold uppercase">{s.role?.replace('_', ' ') || 'STAFF'}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${s.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{s.status}</div>
                                                </div>

                                                {s.status === 'active' && (
                                                    <div className="p-4 bg-rc-bg/50 rounded-2xl border border-rc-main/5 mb-6">
                                                        <label className="text-[8px] font-black text-rc-muted uppercase tracking-widest mb-2 block flex items-center gap-1">
                                                            Gaji Per Paket (IDR)
                                                        </label>
                                                        <input 
                                                            type="number" 
                                                            defaultValue={s.salary_per_package} 
                                                            onBlur={async (e) => {
                                                                try {
                                                                    await axios.post(`/api/courier/staff/${s.id}/salary`, { salary_per_package: e.target.value });
                                                                    fetchData();
                                                                } catch (e) { alert("Gagal update gaji"); }
                                                            }}
                                                            className="bg-transparent border-none outline-none text-rc-main font-black text-lg w-full"
                                                        />
                                                    </div>
                                                )}

                                                <div className="flex gap-2 w-full mt-auto">
                                                    {(s.status === 'pending' || s.status === 'rejected') && (
                                                        <button onClick={() => handleStaffStatus(s.id, 'active')} className="flex-1 bg-green-500 text-black text-[9px] font-black py-3 rounded-xl uppercase tracking-tighter shadow-lg shadow-green-500/20">
                                                            {s.status === 'pending' ? 'Terima' : 'Aktifkan'}
                                                        </button>
                                                    )}
                                                    {s.status !== 'rejected' && (
                                                        <button onClick={() => handleStaffStatus(s.id, 'rejected')} className="flex-1 bg-rc-bg border border-red-500/30 text-red-500 text-[9px] font-black py-3 rounded-xl uppercase hover:bg-red-500/10 transition-all tracking-tighter">
                                                            {s.status === 'pending' ? 'Tolak' : 'Pecat'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Performance Tab */}
                            {activeTab === 'performance' && (
                                <CourierPerformance stats={stats} user={user} />
                            )}

                            {/* Courier Specific Tabs */}
                            {activeTab === 'scan' && <CourierScan />}
                            {activeTab === 'salary' && <CourierSalary earnings={earnings} withdrawn={withdrawn} />}
                            {activeTab === 'penalties' && <CourierPenalties />}
                            {activeTab === 'help' && <CourierHelp />}
                            {activeTab === 'evaluate-mitra' && <CourierRateMitra user={user} />}
                            {activeTab === 'profile' && <CourierProfile user={user} />}
                            {activeTab === 'settings' && <CourierSettings />}

                            {/* Admin Specific Tabs */}
                            {(activeTab === 'address' || activeTab === 'profit' || activeTab === 'aspirasi') && (
                                <CourierAdminTabs activeTab={activeTab} user={user} />
                            )}

                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Modal Konfirmasi Keberhasilan (Proof Upload) */}
            {successModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-rc-card border border-rc-main/10 p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl"
                    >
                        <h3 className="text-lg font-black uppercase text-rc-main tracking-widest mb-2 flex items-center gap-3">
                            <ShieldCheck className="w-6 h-6 text-green-500" /> Bukti {successType === 'pickup' ? 'Penjemputan' : 'Pengantaran'}
                        </h3>
                        <p className="text-xs text-rc-muted mb-8 uppercase font-bold tracking-widest">Silakan unggah foto paket sebagai bukti validasi.</p>
                        
                        <div className="space-y-6">
                            <div className="w-full aspect-video bg-rc-bg border border-dashed border-rc-main/20 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
                                {proofImage ? (
                                    <img src={URL.createObjectURL(proofImage)} className="w-full h-full object-cover" alt="Proof" />
                                ) : (
                                    <>
                                        <Truck className="w-8 h-8 text-rc-muted/20 mb-2" />
                                        <p className="text-[10px] font-black text-rc-muted uppercase">Ketuk untuk Ambil Foto</p>
                                    </>
                                )}
                                <input type="file" capture="environment" accept="image/*" onChange={(e) => setProofImage(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setSuccessModalOpen(false)} className="flex-1 bg-rc-main/5 text-rc-main border border-rc-main/10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Batal</button>
                                <button onClick={handleConfirmSuccess} className="flex-1 bg-green-500 text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-green-500/20">Konfirmasi</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            <AddStaffModal 
                isOpen={isAddStaffModalOpen} 
                onClose={() => setIsAddStaffModalOpen(false)} 
                onSuccess={() => fetchData()} 
                defaultRole="kurir_staff"
            />
        </div>
    );
}
