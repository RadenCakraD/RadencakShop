import './bootstrap';
import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';

// Global Components
import RadenAI from './components/RadenAI';
import CustomContextMenu from './components/CustomContextMenu';

// Lazy load pages for code splitting
const ShopDashboard = lazy(() => import('./pages/ShopDashboard'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PublicShop = lazy(() => import('./pages/PublicShop'));
const Chat = lazy(() => import('./pages/Chat'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Information = lazy(() => import('./pages/Information'));
const RegisterShop = lazy(() => import('./pages/RegisterShop'));
const CourierDashboard = lazy(() => import('./pages/CourierDashboard'));
const LogisticsPortal = lazy(() => import('./pages/LogisticsPortal'));
const FlashSale = lazy(() => import('./pages/FlashSale'));
const RegisterStaff = lazy(() => import('./pages/RegisterStaff'));

// Loading Fallback
const LoadingScreen = () => (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

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
            <Suspense fallback={<LoadingScreen />}>
                <Routes>
                    {/* Rute Auth */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/daftar" element={<Register />} />
                    <Route path="/daftar-mitra" element={<RegisterStaff />} />

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
                    <Route path="/flash-sale" element={<FlashSale />} />

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
                <RadenAI />
                <CustomContextMenu />
            </Suspense>
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
