import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function CourierDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [shippedOrders, setShippedOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const checkAccess = async () => {
        try {
            const res = await axios.get('/api/user');
            // Mock: Anggap kurir punya role = 'kurir', jika belum diimplement di backend,
            // kita ijinkan admin atau kurir masuk.
            if (res.data.role !== 'admin' && res.data.role !== 'kurir') {
                navigate('/dashboard', { replace: true });
                return;
            }
            setUser(res.data);
            fetchShippedOrders();
        } catch (e) {
            navigate('/login');
        }
    };

    const fetchShippedOrders = async () => {
        try {
            const res = await axios.get('/api/admin/shipped-orders');
            setShippedOrders(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAccess();
    }, []);

    const markAsDelivered = async (orderId) => {
        if(!window.confirm("Konfirmasi paket telah diterima pelanggan?")) return;
        try {
            const res = await axios.post(`/api/admin/orders/${orderId}/delivered`);
            alert(res.data.message);
            fetchShippedOrders();
        } catch(e) {
            alert("Gagal memperbarui status pengiriman.");
        }
    };

    if (loading) return <div className="min-h-screen bg-rc-bg flex items-center justify-center"><i className="fa-solid fa-circle-notch fa-spin text-4xl text-rc-logo"></i></div>;

    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    return (
        <div className="bg-rc-bg min-h-screen font-sans text-rc-main pb-10">
            {/* Header Kurir */}
            <header className="bg-rc-bg border-b-[0.5px] border-rc-main/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-lg font-bold text-blue-400 uppercase flex items-center gap-2">
                        <i className="fa-solid fa-truck-fast"></i> LOGISTIK & KURIR
                    </h1>
                    <div className="flex gap-4 items-center">
                        <span className="text-xs font-semibold text-rc-main"><i className="fa-solid fa-user-helmet-safety text-rc-muted mr-1"></i> {user?.name}</span>
                        <Link to="/dashboard" className="text-[10px] sm:text-xs font-bold bg-rc-card hover:bg-rc-main hover:text-rc-bg text-rc-main px-5 py-2 border-[0.5px] border-rc-main/10 rounded-md transition-colors uppercase flex items-center gap-2">
                            <i className="fa-solid fa-home"></i> Dasbor Utama
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-8">
                
                {/* Status Hero */}
                <div className="bg-rc-card p-6 md:p-10 rounded-xl border-[0.5px] border-rc-main/20 relative overflow-hidden">
                    <i className="fa-solid fa-map-location-dot absolute -right-5 -bottom-5 text-8xl text-rc-muted/10"></i>
                    <h2 className="text-xs font-bold uppercase text-rc-muted mb-2">Tugas Hari Ini</h2>
                    <div className="flex items-end gap-3">
                        <span className="text-5xl lg:text-6xl font-bold text-blue-400">{shippedOrders.length}</span>
                        <span className="text-sm font-bold uppercase text-rc-muted pb-1">Paket Siap Antar</span>
                    </div>
                </div>

                {/* List Paket */}
                <div className="space-y-4">
                    {shippedOrders.length === 0 ? (
                        <div className="text-center py-20 bg-rc-card/20 rounded-xl border-[0.5px] border-rc-main/10">
                            <i className="fa-solid fa-box-open-full text-4xl text-rc-muted mb-4 block"></i>
                            <p className="text-xs uppercase font-bold text-rc-muted">TIDAK ADA PAKET UNTUK DIKIRIM HARI INI</p>
                        </div>
                    ) : (
                        shippedOrders.map(order => (
                            <div key={order.id} className="bg-rc-card border-[0.5px] border-rc-main/20 p-5 md:p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-rc-main/5 transition-colors">
                                
                                {/* Info Peta & Tujuan */}
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-10 h-10 rounded-md bg-blue-500/10 border-[0.5px] border-blue-500/30 flex items-center justify-center shrink-0">
                                        <i className="fa-solid fa-location-pin text-blue-400"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-rc-main uppercase">{order.user.name}</h3>
                                        <p className="text-xs text-rc-muted font-medium mt-1 flex items-start gap-2 max-w-sm"><i className="fa-solid fa-map mt-0.5"></i> {order.user.alamat}</p>
                                        <p className="text-[10px] text-rc-main/50 font-bold mt-2 uppercase"><i className="fa-solid fa-store text-rc-logo mr-1"></i> Dari: {order.shop.nama_toko}</p>
                                    </div>
                                </div>
                                
                                {/* Harga & Aksi */}
                                <div className="flex flex-col md:items-end gap-3 w-full md:w-auto border-t-[0.5px] border-rc-main/10 md:border-t-0 pt-4 md:pt-0">
                                    <div className="text-xl font-bold text-rc-logo">{formatRp(order.total_amount)}</div>
                                    <button 
                                        onClick={() => markAsDelivered(order.id)}
                                        className="w-full md:w-auto bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-md text-xs uppercase font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <i className="fa-solid fa-check-circle"></i> Selesaikan Antaran
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </main>
        </div>
    );
}
