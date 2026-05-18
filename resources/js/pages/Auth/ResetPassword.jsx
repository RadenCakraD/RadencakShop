import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [formData, setFormData] = useState({
        email: location.state?.email || '',
        username: location.state?.username || '',
        password: '',
        password_confirmation: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!formData.email || !formData.username) {
            navigate('/lupa-password');
        }
    }, [formData.email, formData.username, navigate]);

    const handleOtpChange = (e, index) => {
        const value = e.target.value;
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`).focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpCode = otp.join('');
        
        if (otpCode.length < 6) {
            toast.error('Masukkan 6 digit kode OTP');
            return;
        }

        if (formData.password !== formData.password_confirmation) {
            toast.error('Konfirmasi sandi tidak cocok');
            return;
        }

        setLoading(true);
        try {
            await axios.post('/api/reset-password', {
                ...formData,
                otp: otpCode
            });
            toast.success('Sandi berhasil diatur ulang! Silakan login.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal mengatur ulang sandi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-rc-bg py-12 px-4 sm:px-6 lg:px-8 text-rc-main relative overflow-hidden font-sans">
            <div className="max-w-md w-full z-10 bg-rc-card p-10 sm:p-14 rounded-2xl border-[1px] border-rc-main/20 relative">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-xl bg-rc-bg border-[1px] border-rc-main/20 flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-lock-open text-3xl text-rc-logo"></i>
                    </div>
                    <h2 className="text-3xl font-bold text-rc-main uppercase">
                        ATUR ULANG <span className="text-rc-logo">SANDI</span>
                    </h2>
                    <p className="mt-3 text-[10px] text-rc-muted font-bold uppercase">
                        Masukkan kode OTP dan buat sandi baru Anda.
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <label className="block text-xs uppercase font-bold text-rc-muted text-center mb-4">Masukkan Kode OTP</label>
                        <div className="flex justify-between gap-2">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`otp-${index}`}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleOtpChange(e, index)}
                                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                    className="w-11 h-12 text-center text-lg font-bold bg-rc-bg border-[1px] border-rc-main/20 rounded-lg text-rc-main focus:outline-none focus:border-rc-logo transition-colors"
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-5 pt-4">
                        <div className="group relative">
                            <label className="block text-xs uppercase font-bold mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Sandi Baru *</label>
                            <div className="relative">
                                <i className="fa-solid fa-lock text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    required 
                                    value={formData.password} 
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className="appearance-none block w-full pl-12 pr-12 py-4 bg-rc-bg border-[1px] border-rc-main/20 rounded-lg placeholder-rc-muted text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-colors font-bold text-sm" 
                                    placeholder="Minimal 8 Karakter" 
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-rc-muted hover:text-rc-logo transition-colors"
                                >
                                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        <div className="group relative">
                            <label className="block text-xs uppercase font-bold mb-2 text-rc-muted group-focus-within:text-rc-logo transition-colors">Konfirmasi Sandi Baru *</label>
                            <div className="relative">
                                <i className="fa-solid fa-shield-check text-rc-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-rc-logo transition-colors"></i>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    required 
                                    value={formData.password_confirmation} 
                                    onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})}
                                    className="appearance-none block w-full pl-12 pr-12 py-4 bg-rc-bg border-[1px] border-rc-main/20 rounded-lg placeholder-rc-muted text-rc-main focus:outline-none focus:ring-0 focus:border-rc-logo transition-colors font-bold text-sm" 
                                    placeholder="Ulangi Sandi Baru" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-4 px-4 text-xs font-bold uppercase rounded-lg text-rc-bg bg-rc-logo hover:opacity-80 focus:outline-none transition-opacity duration-300 disabled:opacity-50 gap-3"
                        >
                            {loading ? (
                                <i className="fa-solid fa-circle-notch fa-spin text-lg"></i>
                            ) : (
                                <span className="flex items-center gap-3">SIMPAN SANDI BARU <i className="fa-solid fa-floppy-disk"></i></span>
                            )}
                        </button>
                    </div>

                    <div className="text-center mt-6">
                        <Link to="/login" className="text-[10px] text-rc-muted font-bold uppercase hover:text-rc-logo transition-colors">
                            <i className="fa-solid fa-arrow-left mr-2"></i> Kembali ke Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
