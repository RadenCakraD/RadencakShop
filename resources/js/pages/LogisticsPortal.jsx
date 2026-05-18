import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Warehouse, Menu, Search } from 'lucide-react';

import LogisticsSidebar from '../components/logistics/LogisticsSidebar';
import AddStaffModal from '../components/Modals/AddStaffModal';

// Modular Components
import LogisticsOverview from '../components/logistics/LogisticsOverview';
import LogisticsReceive from '../components/logistics/LogisticsReceive';
import LogisticsAssign from '../components/logistics/LogisticsAssign';
import LogisticsRadar from '../components/logistics/LogisticsRadar';
import LogisticsEmployees from '../components/logistics/LogisticsEmployees';
import LogisticsPerformance from '../components/logistics/LogisticsPerformance';
import LogisticsSalary from '../components/logistics/LogisticsSalary';
import MitraReviewList from '../components/logistics/MitraReviewList';
import LogisticsSettings from '../components/logistics/LogisticsSettings';

export default function LogisticsPortal() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [packages, setPackages] = useState({ incoming: [], at_warehouse: [], delivering: [] });
    const [couriers, setCouriers] = useState([]);
    const [activeTab, setActiveTab] = useState('receive');
    const [selectedCouriers, setSelectedCouriers] = useState({});
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [staffs, setStaffs] = useState([]);
    const [user, setUser] = useState(null);
    const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);

    useEffect(() => {
        const verifyRole = async () => {
            try {
                const res = await axios.get('/api/user');
                const r = res.data.role;
                const status = res.data.status;
                const allowedRoles = ['super_admin', 'admin_staff', 'admin_logistik', 'sortir_logistik', 'logistik_internal', 'logistik_external'];
                if (!allowedRoles.includes(r)) {
                    navigate('/dashboard'); return;
                }
                if (!['super_admin', 'admin_staff'].includes(r) && status !== 'active') {
                    navigate('/dashboard'); return;
                }
                setUser(res.data);
                const initialTab = (r === 'super_admin' || r === 'admin_logistik') ? 'employees' : 
                                   (['sortir_logistik'].includes(r) ? 'receive' : 'logs');
                setActiveTab(initialTab);
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
            const res = await axios.get('/api/user/staff');
            setStaffs(res.data);
        } catch (e) { }
    };

    const fetchLogisticsData = async () => {
        setLoading(true);
        try {
            const [statRes, pkgRes, radarRes] = await Promise.all([
                axios.get('/api/logistics/stats'),
                axios.get('/api/logistics/packages'),
                axios.get('/api/logistics/radar')
            ]);
            setStats(statRes.data);
            setPackages({ ...pkgRes.data, radar: radarRes.data });
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
        } catch (e) { }
    };

    const handleReceive = async (orderId) => {
        setLoading(true);
        try {
            await axios.post(`/api/logistics/receive/${orderId}`);
            fetchLogisticsData();
        } catch (e) { alert(e.response?.data?.message || 'Gagal Menerima.'); }
        finally { setLoading(false); }
    };

    const handleAssign = async (orderId, courierId) => {
        if (!courierId) return alert("Pilih kurir pengantar dulu!");
        setLoading(true);
        try {
            await axios.post(`/api/logistics/assign/${orderId}`, { delivery_courier_id: courierId });
            fetchLogisticsData();
        } catch (e) { alert(e.response?.data?.message || 'Gagal Assign.'); }
        finally { setLoading(false); }
    };

    const handleStaffStatus = async (id, status) => {
        if (!window.confirm(`Yakin ingin ${status === 'active' ? 'menerima' : 'menolak'} staff ini?`)) return;
        try {
            await axios.post(`/api/user/staff/${id}/status`, { status });
            fetchStaffs();
        } catch (e) { alert(e.response?.data?.message || 'Gagal update status staff'); }
    };

    if (loading && !stats) return (
        <div className="bg-rc-bg min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-black text-rc-muted uppercase tracking-[0.3em] animate-pulse">Menghubungkan Gudang...</p>
            </div>
        </div>
    );

    return (
        <div className="bg-rc-bg min-h-screen flex font-sans text-rc-main">
            <LogisticsSidebar
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
                                <span className="p-1.5 bg-teal-500/10 rounded-md"><Warehouse className="w-4 h-4 text-teal-500" /></span>
                                Operasional Logistik
                            </h2>
                            <p className="text-[10px] text-rc-muted font-bold uppercase tracking-wider mt-0.5">{user?.mitra_name || 'Radencak Hub'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-rc-bg rounded-xl border border-rc-main/10">
                            <Search className="w-4 h-4 text-rc-muted" />
                            <input type="text" placeholder="Cari Resi / Paket..." className="bg-transparent border-none outline-none text-xs text-rc-main w-48 font-medium" />
                        </div>
                        <div className="flex items-center gap-3 pl-6 border-l border-rc-main/10">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-black text-rc-main uppercase">{user?.name}</p>
                                <p className="text-[10px] text-teal-500 uppercase font-black">{user?.role === 'sortir_logistik' ? 'Sortir Logistik' : 'Logistik Admin'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-rc-bg border border-rc-main/10 flex items-center justify-center overflow-hidden shadow-inner">
                                {user?.avatar ? <img src={user.avatar.startsWith('http') ? user.avatar : `/storage/${user.avatar}`} className="w-full h-full object-cover" alt="Profile" /> : <Warehouse className="w-5 h-5 text-rc-muted" />}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Dashboard Content */}
                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Stats Summary Section */}
                            {(activeTab === 'receive' || activeTab === 'assign' || activeTab === 'salary') && (
                                <LogisticsOverview stats={stats} user={user} />
                            )}

                            {/* Content based on activeTab */}
                            {activeTab === 'receive' && (
                                <LogisticsReceive packages={packages} handleReceive={handleReceive} fetchLogisticsData={fetchLogisticsData} />
                            )}

                            {activeTab === 'assign' && (
                                <LogisticsAssign
                                    packages={packages}
                                    couriers={couriers}
                                    selectedCouriers={selectedCouriers}
                                    setSelectedCouriers={setSelectedCouriers}
                                    handleAssign={handleAssign}
                                />
                            )}

                            {activeTab === 'logs' && (
                                <LogisticsRadar packages={packages} />
                            )}

                            {activeTab === 'employees' && (
                                <LogisticsEmployees staffs={staffs} handleStaffStatus={handleStaffStatus} setIsAddStaffModalOpen={setIsAddStaffModalOpen} fetchData={fetchStaffs} />
                            )}

                            {activeTab === 'performance' && (
                                <LogisticsPerformance staffs={staffs} />
                            )}

                            {activeTab === 'salary' && (
                                <LogisticsSalary />
                            )}

                            {activeTab === 'aspirasi' && (
                                <MitraReviewList />
                            )}

                            {activeTab === 'settings' && (
                                <LogisticsSettings user={user} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            <AddStaffModal
                isOpen={isAddStaffModalOpen}
                onClose={() => setIsAddStaffModalOpen(false)}
                onSuccess={fetchStaffs}
                defaultRole="sortir_logistik"
            />
        </div>
    );
}
