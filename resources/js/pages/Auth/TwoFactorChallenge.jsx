import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function TwoFactorChallenge() {
    const navigate = useNavigate();
    const location = useLocation();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    
    // Get login credentials from location state to retry verify-2fa
    const { email, username } = location.state || {};

    useEffect(() => {
        if (!email || !username) {
            navigate('/login');
        }
    }, [email, username, navigate]);

    const handleChange = (e, index) => {
        const value = e.target.value;
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`).focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpCode = otp.join('');
        if (otpCode.length < 6) {
            toast.error('Masukkan 6 digit kode 2FA');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('/api/verify-2fa', { 
                email, 
                username, 
                otp: otpCode 
            });
            
            if (response.data.token) {
                localStorage.setItem('auth_token', response.data.token);
                toast.success('Login Berhasil!');
                navigate('/dashboard');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Kode 2FA salah atau kadaluarsa.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-rc-bg py-12 px-4 sm:px-6 lg:px-8 text-rc-main relative overflow-hidden font-sans">
            <div className="max-w-md w-full z-10 bg-rc-card p-10 sm:p-14 rounded-2xl border-[1px] border-rc-main/20 relative">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-xl bg-rc-bg border-[1px] border-rc-main/20 flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-shield-halved text-3xl text-rc-logo"></i>
                    </div>
                    <h2 className="text-3xl font-bold text-rc-main uppercase">
                        OTENTIKASI <span className="text-rc-logo">2-FA</span>
                    </h2>
                    <p className="mt-3 text-[10px] text-rc-muted font-bold uppercase">
                        Keamanan tambahan aktif. Masukkan kode OTP yang baru saja kami kirim ke email Anda.
                    </p>
                </div>

                <form className="space-y-8" onSubmit={handleSubmit}>
                    <div className="flex justify-between gap-2">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                id={`otp-${index}`}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleChange(e, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                className="w-12 h-14 text-center text-xl font-bold bg-rc-bg border-[1px] border-rc-main/20 rounded-lg text-rc-main focus:outline-none focus:border-rc-logo transition-colors"
                            />
                        ))}
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
                                <span className="flex items-center gap-3">VERIFIKASI & MASUK <i className="fa-solid fa-right-to-bracket"></i></span>
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
