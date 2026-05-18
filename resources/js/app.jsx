import './bootstrap';
import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';

// Global Components
import RadenAI from './components/RadenAI';
import CustomContextMenu from './components/CustomContextMenu';
import NotificationWatcher from './components/NotificationWatcher';

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
const VerifyEmail = lazy(() => import('./pages/Auth/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));
const TwoFactorChallenge = lazy(() => import('./pages/Auth/TwoFactorChallenge'));

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

const LayoutWrapper = ({ children }) => {
    const location = useLocation();
    const hideOnPaths = [
        '/login', '/daftar', '/daftar-mitra', '/verifikasi-email', 
        '/lupa-password', '/reset-password', '/2fa-challenge'
    ];
    const shouldHide = hideOnPaths.includes(location.pathname);

    return (
        <>
            {children}
            {!shouldHide && (
                <>
                    <RadenAI />
                    <CustomContextMenu />
                    <NotificationWatcher />
                </>
            )}
        </>
    );
};

export default function App() {
    const [isMaintenance, setIsMaintenance] = React.useState(false);

    React.useEffect(() => {
        axios.get('/api/global-settings')
            .then(res => {
                if (res.data.site_name) {
                    document.title = res.data.site_name;
                }
            })
            .catch(err => console.error("Failed to load global config", err));

        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 503 && error.response?.data?.maintenance) {
                    if (window.location.pathname !== '/login') {
                        setIsMaintenance(true);
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => axios.interceptors.response.eject(interceptor);
    }, []);

    return (
        <BrowserRouter>
            {isMaintenance ? (
                <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center p-4 font-sans">
                    <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                        <i className="fa-solid fa-person-digging text-5xl"></i>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-white mb-3">Sistem Dalam Perbaikan</h1>
                    <p className="text-zinc-400 text-sm max-w-md leading-relaxed font-medium">
                        Sistem saat ini sedang dinonaktifkan untuk pemeliharaan rutin atau perbaikan. Mohon kembali beberapa saat lagi.
                    </p>
                    <button onClick={() => window.location.href = '/login'} className="mt-12 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-rc-logo transition-all px-4 py-2 rounded-lg hover:bg-rc-logo/10">
                        <i className="fa-solid fa-shield-halved mr-2"></i> Akses Khusus Admin
                    </button>
                </div>
            ) : (
                <Suspense fallback={<LoadingScreen />}>
                    <LayoutWrapper>
                    <Routes>
                        {/* Rute Auth */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/daftar" element={<Register />} />
                        <Route path="/daftar-mitra" element={<RegisterStaff />} />
                        <Route path="/verifikasi-email" element={<VerifyEmail />} />
                        <Route path="/lupa-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/2fa-challenge" element={<TwoFactorChallenge />} />

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
                </LayoutWrapper>
            </Suspense>
            )}
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
