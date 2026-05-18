import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
    const navigate = useNavigate();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [timer, setTimer] = useState(60);

    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (e, index) => {
        const value = e.target.value;
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Auto focus next
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
            toast.error('Masukkan 6 digit kode OTP');
            return;
        }

        setLoading(true);
        try {
            await axios.post('/api/verify-email', { otp: otpCode });
            toast.success('Email berhasil diverifikasi!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Kode OTP salah atau kadaluarsa.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        setResending(true);
        try {
            await axios.post('/api/resend-otp');
            toast.success('Kode OTP baru telah dikirim!');
            setTimer(60);
        } catch (err) {
            toast.error('Gagal mengirim ulang kode.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-rc-bg py-12 px-4 sm:px-6 lg:px-8 text-rc-main relative overflow-hidden font-sans">
            <div className="max-w-md w-full z-10 bg-rc-card p-10 sm:p-14 rounded-2xl border-[1px] border-rc-main/20 relative">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-xl bg-rc-bg border-[1px] border-rc-main/20 flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-envelope-circle-check text-3xl text-rc-logo"></i>
                    </div>
                    <h2 className="text-3xl font-bold text-rc-main uppercase">
                        VERIFIKASI <span className="text-rc-logo">EMAIL</span>
                    </h2>
                    <p className="mt-3 text-[10px] text-rc-muted font-bold uppercase">
                        Masukkan 6 digit kode yang kami kirimkan ke email Anda.
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

                    <div className="text-center">
                        <p className="text-[10px] text-rc-muted font-bold uppercase">
                            Tidak menerima kode?{' '}
                            {timer > 0 ? (
                                <span className="text-rc-logo">Kirim ulang dalam {timer}s</span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resending}
                                    className="text-rc-logo hover:opacity-80 border-b-[2px] border-rc-logo/30"
                                >
                                    {resending ? 'MENGIRIM...' : 'KIRIM ULANG'}
                                </button>
                            )}
                        </p>
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
                                <span className="flex items-center gap-3">VERIFIKASI SEKARANG <i className="fa-solid fa-check-double"></i></span>
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
