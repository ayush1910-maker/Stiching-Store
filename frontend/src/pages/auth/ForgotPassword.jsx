import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, KeyRound, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// 3-step flow: send OTP → verify OTP → reset password
export default function ForgotPassword() {
    const navigate = useNavigate();
    const { forgotPassword, verifyOtp, resetPassword } = useAuth();
    const [step, setStep] = useState(1); // 1 | 2 | 3 | 4 (success)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPw, setShowPw] = useState(false);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await forgotPassword(email);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await verifyOtp(email, otp);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await resetPassword(email, otp, newPassword);
            setStep(4);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const stepTitles = ['', 'Forgot Password', 'Enter OTP', 'New Password', 'Done!'];
    const stepDesc = ['', 'We\'ll send a 6-digit code to your email.', `Code sent to ${email}`, 'Choose a strong new password.', 'Your password has been reset.'];

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                {/* Back button */}
                <Link to="/login" className="flex items-center gap-1 text-sm text-muted-foreground font-medium mb-6">
                    <ArrowLeft size={16} /> Back to Login
                </Link>

                <div className="bg-card border border-border rounded-3xl p-6 shadow-xl">
                    {/* Step Indicator */}
                    {step < 4 && (
                        <div className="flex gap-1.5 mb-6">
                            {[1, 2, 3].map((s) => (
                                <div
                                    key={s}
                                    className={`h-1.5 rounded-full flex-1 transition-all ${s <= step ? 'bg-primary' : 'bg-muted'}`}
                                />
                            ))}
                        </div>
                    )}

                    <h2 className="text-2xl font-bold font-serif mb-1">{stepTitles[step]}</h2>
                    <p className="text-sm text-muted-foreground mb-6">{stepDesc[step]}</p>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium rounded-xl px-4 py-3 mb-4"
                        >
                            {error}
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.form key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSendOtp} className="flex flex-col gap-4">
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="email"
                                        placeholder="Your email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-3.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                                <button type="submit" disabled={loading} className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-primary/20">
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <>Send OTP <ArrowRight size={16} /></>}
                                </button>
                            </motion.form>
                        )}

                        {step === 2 && (
                            <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                                <div className="relative">
                                    <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="6-digit OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        required
                                        maxLength={6}
                                        className="w-full pl-10 pr-4 py-3.5 bg-muted/50 border border-border rounded-xl text-sm tracking-widest font-bold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                                <button type="submit" disabled={loading || otp.length < 6} className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-primary/20">
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <>Verify OTP <ArrowRight size={16} /></>}
                                </button>
                                <button type="button" onClick={() => { setError(''); setStep(1); }} className="text-xs text-center text-muted-foreground underline">
                                    Resend OTP
                                </button>
                            </motion.form>
                        )}

                        {step === 3 && (
                            <motion.form key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleReset} className="flex flex-col gap-4">
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        placeholder="New password (min 6 chars)"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full pl-10 pr-11 py-3.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <button type="submit" disabled={loading} className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-primary/20">
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <>Reset Password <ArrowRight size={16} /></>}
                                </button>
                            </motion.form>
                        )}

                        {step === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center gap-4">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                                    <CheckCircle size={40} className="text-primary" />
                                </div>
                                <p className="text-sm text-muted-foreground">You can now sign in with your new password.</p>
                                <button onClick={() => navigate('/login', { replace: true })} className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl">
                                    Go to Login
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
