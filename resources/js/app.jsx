import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';

import ShopDashboard from './pages/ShopDashboard';
import ProductDetail from './pages/ProductDetail';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';
import PublicShop from './pages/PublicShop';
import Chat from './pages/Chat'; // Komponen Chat Realtime
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Information from './pages/Information';
import RegisterShop from './pages/RegisterShop';
import CourierDashboard from './pages/CourierDashboard';
import LogisticsPortal from './pages/LogisticsPortal';

// Set up Axios default interceptors for auth
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers.Accept = 'application/json';
    return config;
});

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Rute Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/daftar" element={<Register />} />

                {/* Profil Toko Publik */}
                <Route path="/toko/:id" element={<PublicShop />} />

                {/* Chat Hub */}
                <Route path="/chat" element={<Chat />} />

                {/* Transaksi Pembeli */}
                <Route path="/keranjang" element={<Cart />} />
                <Route path="/pembayaran" element={<Checkout />} />

                {/* Profil dan Informasi */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/pengaturan" element={<Settings />} />
                <Route path="/informasi" element={<Information />} />

                {/* Beranda Global */}
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Home />} />

                {/* Toko Saya Dashboard */}
                <Route path="/toko" element={<ShopDashboard />} />
                <Route path="/daftar-toko" element={<RegisterShop />} />

                {/* Produk Detail */}
                <Route path="/product/:slug" element={<ProductDetail />} />

                {/* Admin, Kurir, Logistik Dashboard */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/kurir" element={<CourierDashboard />} />
                <Route path="/logistik" element={<LogisticsPortal />} />

                {/* Fallback */}
                <Route path="*" element={<Home />} />
            </Routes>
            <Toaster position="bottom-right" toastOptions={{
                style: {
                    background: '#18181b',
                    color: '#e2e8f0',
                    border: '1px solid rgba(255, 204, 0, 0.3)',
                },
                success: {
                    iconTheme: { primary: '#FFCC00', secondary: '#18181b' },
                },
            }} />
        </BrowserRouter>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(<App />);
}
