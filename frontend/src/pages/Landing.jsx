import React, { useState, useEffect } from 'react';
import {
  MoveRight,
  Loader2,
  Eye,
  EyeOff,
  Zap,
  ShieldCheck,
  Users,
  Target,
  Sun,
  Moon,
  Headphones,
  Mail,
  X,
  MessageSquare,
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import vibeLogo from '../assets/vibe-logo.png';

const Landing = () => {
  const [isLoginState, setIsLoginState] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '+91 ', password: '', firstName: '', middleName: '', lastName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showSupport, setShowSupport] = useState(false);
  const [supportForm, setSupportForm] = useState({ name: '', email: '', message: '' });
  const [supportLoading, setSupportLoading] = useState(false);
  const [visitorCount, setVisitorCount] = useState(0);
  const [regStep, setRegStep] = useState(1); // 1: Info, 2: OTP, 3: Names
  const [identityType] = useState('email'); // Hardcoded to email, phone removed
  
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [forgotData, setForgotData] = useState({ email: '', otp: '', newPassword: '' });
  const [successMsg, setSuccessMsg] = useState('');

  const { login, register, verifyOTP, completeProfile, forgotPassword, resetPasswordOTP, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const justLoggedOut = localStorage.getItem('justLoggedOut');
    if (justLoggedOut) {
      setFormData({ name: '', email: '', phone: '+91 ', password: '' });
      localStorage.removeItem('justLoggedOut');
    }

    // Fetch visitor count and handle initial state
    let isMounted = true;
    const initPage = async () => {
      try {
        // Increment visitor count if not visited this session
        if (!sessionStorage.getItem('vibe_v1')) {
          await api.post('/counter/visitor');
          sessionStorage.setItem('vibe_v1', 'true');
        }
        
        const { data } = await api.get('/counter/visitor');
        if (isMounted && data && data.count) {
          setVisitorCount(data.count);
        }
      } catch (err) {
        console.warn('VIBE System: Counter synchronization failed. Retrying in background...');
      }
    };

    initPage();
    return () => { isMounted = false; };
  }, []);

  // Restore automatic navigation to dashboard if user is already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Force password truncation if it exceeds role-based limit
  useEffect(() => {
    if (formData.email.includes('vibecom')) {
      const limit = 10;
      if (formData.password.length > limit) {
        setFormData(prev => ({ ...prev, password: prev.password.slice(0, limit) }));
      }
    }
  }, [formData.email]);

  const handleAuth = async (e) => {
    if (e) e.preventDefault();
    setError('');
    
    // RED WARNING: Restricted Area for @vibecom
    if (formData.email.toLowerCase().endsWith('@vibecom') || formData.email.toLowerCase() === 'admin@terminal.sys') {
      setError('⚠️ RESTRICTED AREA: admin Accounts detected. Use the dedicated Admin Portal for clearance.');
      return;
    }

    if (!formData.email.toLowerCase().endsWith('@gmail.com')) {
      setError('Only @gmail.com accounts are permitted in the user section.');
      return;
    }

    setLoading(true);

    try {
      if (isLoginState) {
        // LOGIN FLOW
        const identity = {
          email: formData.email,
          phone: ''
        };
        const responseUser = await login(identity, formData.password);
        navigate('/dashboard');
      } else {
        // REGISTRATION FLOW (3 STEPS)
        if (regStep === 1) {
          // Step 1: Submit Identity & Password
          const emailInput = formData.email;
          const phoneInput = '';
          
          await register(emailInput, phoneInput, formData.password);
          setVerificationEmail(emailInput);
          setRegStep(2); // Move to OTP step
          setError('');
        } 
        else if (regStep === 2) {
          // Step 2: Verify OTP
          await verifyOTP(verificationEmail, '', otp);
          setRegStep(3); // Move to Profile setup
          setError('');
        }
        else if (regStep === 3) {
          // Step 2 (was 3): Complete Profile
          const emailInput = formData.email;
          const phoneInput = '';
          
          const responseUser = await completeProfile(
            emailInput, 
            phoneInput, 
            formData.firstName, 
            formData.middleName, 
            formData.lastName
          );
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Auth Error Details:', err);
      let msg = err.response?.data?.message;

      if (!msg) {
        if (err.message === 'Network Error') {
          msg = `Server Connectivity Error. Please verify the backend service is operational. (Connecting to: ${api.defaults.baseURL})`;
        } else if (err.code === 'ECONNABORTED') {
          msg = 'Server request timed out. Please try again in 30 seconds.';
        } else {
          msg = 'Critical system error. Please check your network connection.';
        }
      }
      
      if (msg.includes('Account not verified')) {
        setError('Verification pending. We have moved you to the sign-up flow to complete your profile.');
        setIsLoginState(false);
        setRegStep(1);
      } else if (msg.includes('User already exists')) {
        try {
          // Attempt automatic login if account exists
          const identity = { email: formData.email, phone: '' };
          const responseUser = await login(identity, formData.password);
          navigate('/dashboard');
        } catch (loginErr) {
          setError('User already exists with this email. Please log in with the correct password.');
        }
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (forgotStep === 1) {
        if (!forgotData.email.endsWith('@gmail.com')) {
           setError('Please provide a valid @gmail.com address.');
           setLoading(false);
           return;
        }
        await forgotPassword(forgotData.email);
        setForgotStep(2);
        setSuccessMsg('Reset code dispatched to your email.');
      } else {
        if (forgotData.otp.length !== 6) {
          setError('Code must be exactly 6 digits.');
          setLoading(false);
          return;
        }
        if (forgotData.newPassword.length < 6) {
          setError('New security key must be at least 6 characters.');
          setLoading(false);
          return;
        }
        await resetPasswordOTP(forgotData.email, forgotData.otp, forgotData.newPassword);
        setSuccessMsg('Security key updated! You can now log in.');
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotStep(1);
          setForgotData({ email: '', otp: '', newPassword: '' });
          setSuccessMsg('');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification system failure.');
    } finally {
      setLoading(false);
    }
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    setSupportLoading(true);
    const subject = `VIBE SUPPORT: ${supportForm.name}`;
    const body = `Name: ${supportForm.name}\nEmail: ${supportForm.email}\n\nMessage:\n${supportForm.message}`;
    const mailtoUrl = `mailto:anubhavtiwari9598@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    setTimeout(() => {
      window.location.href = mailtoUrl;
      setSupportLoading(false);
      setShowSupport(false);
      setSupportForm({ name: '', email: '', message: '' });
    }, 1000);
  };

  const { theme, toggleTheme } = useTheme();

  // If auth is loading with a token, OR the user is already authenticated (waiting for redirect)
  // This prevents the login UI from blinking for a split second before navigation!
  if ((authLoading && localStorage.getItem('token')) || user) {
    return (
      <div className="min-h-screen bg-[#05000a] text-white flex flex-col items-center justify-center relative overflow-hidden loader-container selection:bg-vibe-primary/30">
        <style>{`
          @keyframes ripple {
            0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
            100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
          }
          @keyframes float-3d {
            0%, 100% { transform: translateY(0px) rotateX(15deg) rotateY(-10deg); }
            50% { transform: translateY(-20px) rotateX(-5deg) rotateY(10deg); }
          }
          @keyframes spin-vinyl {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes equalize {
            0%, 100% { height: 12px; }
            50% { height: 45px; }
          }
          .loader-container {
            perspective: 1200px;
          }
          .loader-3d {
            transform-style: preserve-3d;
            animation: float-3d 8s ease-in-out infinite;
          }
          .sound-wave {
            position: absolute;
            top: 50%;
            left: 50%;
            border-radius: 50%;
            border: 2px solid rgba(139, 92, 246, 0.5);
            box-shadow: 0 0 30px rgba(139, 92, 246, 0.2) inset;
            animation: ripple 3s linear infinite;
            pointer-events: none;
          }
          .bar-eq {
            width: 6px;
            background: linear-gradient(180deg, #ec4899, #8b5cf6, #3b82f6);
            border-radius: 10px;
            animation: equalize 1s infinite ease-in-out;
            box-shadow: 0 0 12px rgba(139, 92, 246, 0.5);
          }
          .vinyl-grooves {
            background: repeating-radial-gradient(
              #111 0%, 
              #111 5%, 
              #1a1a1a 6%, 
              #111 7%
            );
          }
        `}</style>
        
        {/* Deep Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-vibe-primary/20 rounded-full blur-[200px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[120px] mix-blend-screen" />
        
        <div className="relative z-10 flex flex-col items-center gap-20 loader-3d mt-10">
          
          {/* 3D Vinyl Record Player Effect */}
          <div className="relative flex items-center justify-center w-56 h-56 md:w-64 md:h-64">
            {/* Pulsing Sound Waves */}
            <div className="sound-wave w-full h-full" style={{ animationDelay: '0s' }} />
            <div className="sound-wave w-full h-full" style={{ animationDelay: '1s' }} />
            <div className="sound-wave w-full h-full" style={{ animationDelay: '2s' }} />
            
            {/* The Record / Attractive Logo */}
            <div className="relative w-[85%] h-[85%] rounded-full border-[8px] border-black shadow-[0_0_80px_rgba(139,92,246,0.5),inset_0_0_20px_rgba(255,255,255,0.1)] animate-[spin-vinyl_4s_linear_infinite] overflow-hidden vinyl-grooves flex items-center justify-center">
              {/* Shine reflection on vinyl */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent w-full h-full rotate-45 pointer-events-none mix-blend-overlay" />
              
              {/* Inner Label / Highlighted Logo */}
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-[3px] border-[#222] shadow-[inset_0_0_15px_rgba(0,0,0,0.8)] bg-black flex items-center justify-center relative">
                <img src={vibeLogo} alt="VIBE" className="w-[140%] h-[140%] object-cover contrast-125 brightness-110 drop-shadow-2xl" />
                {/* Center hole */}
                <div className="absolute w-3 h-3 bg-black rounded-full border border-white/20 shadow-inner" />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-8">
            {/* 3D Audio Equalizer */}
            <div className="flex items-center justify-center gap-2.5 h-12">
              <div className="bar-eq" style={{ animationDelay: '0.0s' }} />
              <div className="bar-eq" style={{ animationDelay: '0.3s' }} />
              <div className="bar-eq" style={{ animationDelay: '0.6s' }} />
              <div className="bar-eq" style={{ animationDelay: '0.9s' }} />
              <div className="bar-eq" style={{ animationDelay: '0.4s', width: '8px', boxShadow: '0 0 20px rgba(236,72,153,0.8)' }} />
              <div className="bar-eq" style={{ animationDelay: '0.7s' }} />
              <div className="bar-eq" style={{ animationDelay: '0.1s' }} />
              <div className="bar-eq" style={{ animationDelay: '0.5s' }} />
              <div className="bar-eq" style={{ animationDelay: '0.8s' }} />
            </div>
            
            {/* Loading Text */}
            <div className="flex flex-col items-center gap-3">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-[0.5em] text-transparent bg-clip-text bg-gradient-to-r from-vibe-primary via-fuchsia-400 to-vibe-primary animate-pulse drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                Loading
              </h2>
              <p className="text-[10px] font-bold text-white/40 tracking-[0.4em] uppercase">Syncing to Vibe Network</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-bg app-text relative overflow-x-hidden selection:bg-vibe-primary/30 scroll-smooth">

      {/* Navigation Header */}
      <header className="fixed top-0 inset-x-0 z-[100] px-4 py-3 md:px-8 md:py-5 flex items-center justify-between bg-vibe-950/80 backdrop-blur-xl border-b border-white/5 shadow-xl">
        <div>
          <img src={vibeLogo} alt="VIBE" className="h-8 md:h-10 brightness-110" />
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {/* Visitor Counter Pill */}
          <div className="flex items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-2.5 rounded-full border border-vibe-primary/30 bg-vibe-primary/5 text-vibe-primary shadow-xl backdrop-blur-md">
            <Users size={14} className="md:w-4 md:h-4" />
            <div className="flex flex-col leading-none">
              <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest opacity-60">Visitors</span>
              <span className="text-xs md:text-sm font-black text-white">{visitorCount.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={() => setShowSupport(true)}
            className="flex items-center gap-2 px-3 md:px-6 py-2 md:py-2.5 rounded-full border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-xl font-bold text-[10px] md:text-sm bg-vibe-950/20 backdrop-blur-md active:scale-95 group"
          >
            <Mail size={16} />
            <span className="hidden xs:inline">Support</span>
          </button>

          <button
            onClick={() => navigate('/admin/login')}
            className="p-2 md:p-2.5 rounded-full border border-white/10 hover:border-vibe-primary/50 text-slate-400 hover:text-vibe-primary transition-all shadow-xl bg-vibe-950/20 backdrop-blur-md active:scale-95"
          >
            <ShieldCheck size={18} />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 md:p-2.5 rounded-full border border-white/10 text-slate-400 hover:text-vibe-primary transition-all shadow-xl bg-vibe-950/20 backdrop-blur-md active:scale-95"
          >
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      {/* Background Aura Elements (Live Wallpaper Effect) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-vibe-primary/5 rounded-full blur-[200px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[800px] h-[800px] bg-vibe-primary/5 rounded-full blur-[200px] animate-blob animation-delay-2000" />
        <div className="absolute top-[30%] right-[10%] w-[500px] h-[500px] bg-vibe-accent/5 rounded-full blur-[180px] animate-blob animation-delay-4000" />
      </div>

      {/* Main Hero & Auth Section */}
      <div className="flex items-center justify-center p-4 md:p-6 pt-32 md:pt-36 pb-16 min-h-screen">
        <div className="w-full max-w-[1240px] transition-all duration-700 ease-in-out grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center z-10">

          {/* Left Side: Auth Card (Now on Left) */}
          <div className="w-full glass-card p-6 md:p-14 lg:p-16 relative overflow-hidden transition-all duration-700 ease-out shadow-2xl animate-in slide-in-from-left order-2 lg:order-1 flex flex-col justify-center">
            {/* Top Decorative Line */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-vibe-primary/60 to-transparent"></div>

            <div className="flex gap-2 mb-8 md:mb-10 items-center">
              <button 
                disabled={regStep > 1}
                onClick={() => { setIsLoginState(false); setShowForgotPassword(false); setError(''); setSuccessMsg(''); }} 
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none ${!isLoginState && !showForgotPassword ? 'bg-vibe-primary text-white shadow-xl shadow-vibe-primary/30' : 'bg-white/5 text-slate-600 hover:bg-white/10 hover:text-slate-400'}`}
              >
                Sign Up
              </button>
              <button 
                onClick={() => { setIsLoginState(true); setShowForgotPassword(false); setError(''); setSuccessMsg(''); }} 
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none ${isLoginState && !showForgotPassword ? 'bg-vibe-primary text-white shadow-xl shadow-vibe-primary/30' : 'bg-white/5 text-slate-600 hover:bg-white/10 hover:text-slate-400'}`}
              >
                Log In
              </button>
            </div>

            <div className="flex items-center justify-between mb-8 md:mb-10 w-full text-left">
              <div className="flex flex-col items-start">
                <h2 className="text-[2.25rem] md:text-3xl font-black text-white tracking-tighter uppercase leading-none italic">
                  {isLoginState ? 'Welcome Back' : (
                    regStep === 1 ? 'Join VIBE' : 
                    regStep === 2 ? 'Verify Access' : 'Personalize'
                  )}
                </h2>
                <div className="w-12 h-1 bg-vibe-primary mt-3 rounded-full" />
              </div>
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl overflow-hidden border border-white/10 shadow-2xl group transition-all duration-500 hover:scale-110 active:scale-95 flex-shrink-0">
                <img src={vibeLogo} className="w-full h-full object-cover brightness-110 contrast-110" alt="VIBE Logo" />
              </div>
            </div>


            {error && (
              <div className="p-4 mb-8 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl font-bold animate-in slide-in-from-top-2 shadow-xl flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="shrink-0" size={16} /> 
                  <span className="flex-1">{error}</span>
                </div>
                {error.includes('User already exists') && (
                  <button 
                    type="button" 
                    onClick={() => { 
                      setShowForgotPassword(true); 
                      setForgotStep(1); 
                      setForgotData({ ...forgotData, email: formData.email }); 
                      setError(''); 
                    }}
                    className="ml-7 text-[9px] uppercase tracking-[0.2em] text-vibe-primary hover:text-white transition-all underline underline-offset-4 w-fit cursor-pointer bg-transparent border-none font-black"
                  >
                    Reset Security Key Now
                  </button>
                )}
              </div>
            )}

            {successMsg && <div className="p-4 mb-8 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-xl font-bold animate-in slide-in-from-top-2 shadow-lg flex items-center gap-3">
              <Zap className="shrink-0" size={16} /> {successMsg}
            </div>}

            {showForgotPassword ? (
               <form className="space-y-6" onSubmit={handleForgotPassword}>
                  <div className="flex items-center gap-2 mb-6 cursor-pointer text-slate-500 hover:text-white transition-all group w-fit" onClick={() => { setShowForgotPassword(false); setError(''); setSuccessMsg(''); }}>
                     <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Return to Login</span>
                  </div>
                  
                  {forgotStep === 1 ? (
                    <div className="space-y-5 animate-in slide-in-from-right duration-500">
                      <div className="space-y-2 group">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">Forgot Security Key?</label>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4 px-1 opacity-60">Enter your email to receive a reset code.</p>
                        <input
                          type="email"
                          value={forgotData.email}
                          onChange={(e) => setForgotData({ ...forgotData, email: e.target.value })}
                          className="w-full panel-soft border border-white/5 rounded-2xl px-6 py-5 text-hdr font-bold text-lg bg-white/5 outline-none focus:border-vibe-primary transition-all group-hover:border-white/10"
                          placeholder="example@gmail.com"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5 animate-in slide-in-from-right duration-500">
                       <div className="space-y-4">
                         <div className="space-y-2 group text-center">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">Reset Code</label>
                            <input
                              type="text"
                              maxLength={6}
                              value={forgotData.otp}
                              onChange={(e) => setForgotData({...forgotData, otp: e.target.value})}
                              className="w-full panel-soft border border-white/5 rounded-2xl px-6 py-4 text-hdr font-bold text-2xl bg-white/5 outline-none focus:border-vibe-primary transition-all text-center tracking-[0.5em]"
                              placeholder="••••••"
                              required
                            />
                         </div>
                         <div className="space-y-2 group">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">New Security Key</label>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={forgotData.newPassword}
                                onChange={(e) => setForgotData({...forgotData, newPassword: e.target.value})}
                                className="w-full panel-soft border border-white/5 rounded-2xl px-6 py-5 text-hdr font-bold text-lg bg-white/5 outline-none focus:border-vibe-primary transition-all pr-14"
                                placeholder="Min 6 characters"
                                required
                              />
                              <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-vibe-primary transition-colors cursor-pointer bg-transparent border-none"
                              >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                         </div>
                       </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-hdr-orange font-black py-5 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all mt-6 shadow-xl active:scale-[0.98] border-none cursor-pointer"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : (
                      <>
                        <span>{forgotStep === 1 ? 'Send Code' : 'Update Key'}</span>
                        <MoveRight size={22} />
                      </>
                    )}
                  </button>
               </form>
            ) : (
            <form className="space-y-6" onSubmit={handleAuth}>



              {isLoginState ? (
                <div className="space-y-5 animate-in slide-in-from-right duration-500">
                  <div className="space-y-2 group">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full panel-soft border border-white/5 rounded-2xl px-6 py-5 text-hdr font-bold text-lg bg-white/5 outline-none focus:border-vibe-primary transition-all group-hover:border-white/10"
                      placeholder="example@gmail.com"
                      required
                    />
                  </div>
                  <div className="space-y-2 group">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Password</label>
                      <button 
                        type="button" 
                        onClick={() => { setShowForgotPassword(true); setForgotStep(1); setError(''); setSuccessMsg(''); }} 
                        className="text-[10px] font-black text-vibe-primary uppercase tracking-widest hover:text-white transition-all bg-transparent border-none cursor-pointer underline underline-offset-4 decoration-vibe-primary/30"
                      >
                        Forgot Key?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => {
                          const limit = formData.email.includes('vibecom') ? 10 : 100;
                          const val = e.target.value.slice(0, limit);
                          setFormData({ ...formData, password: val });
                        }}
                        maxLength={formData.email.includes('vibecom') ? 10 : 100}
                        className="w-full panel-soft border border-white/5 rounded-2xl px-6 py-5 text-hdr font-bold text-lg bg-white/5 outline-none focus:border-vibe-primary transition-all group-hover:border-white/10 pr-14"
                        placeholder="••••••••"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-vibe-primary transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : regStep === 1 ? (
                <div className="space-y-5 animate-in slide-in-from-right duration-500">
                  <div className="space-y-2 group">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                      {identityType === 'email' ? 'Email Address' : 'Phone Number'}
                    </label>
                    <input
                      type={identityType === 'email' ? 'email' : 'text'}
                      value={identityType === 'email' ? formData.email : formData.phone}
                      onChange={(e) => setFormData({ ...formData, [identityType]: e.target.value })}
                      className="w-full panel-soft border border-white/5 rounded-2xl px-6 py-5 text-hdr font-bold text-lg bg-white/5 outline-none focus:border-vibe-primary transition-all group-hover:border-white/10"
                      placeholder={identityType === 'email' ? 'example@gmail.com' : '+91 0000000000'}
                      required
                    />
                  </div>
                  <div className="space-y-2 group">
                    <div className="flex items-center px-1">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Password</label>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => {
                          const limit = formData.email.includes('vibecom') ? 10 : 100;
                          const val = e.target.value.slice(0, limit);
                          setFormData({ ...formData, password: val });
                        }}
                        maxLength={formData.email.includes('vibecom') ? 10 : 100}
                        className="w-full panel-soft border border-white/5 rounded-2xl px-6 py-5 text-hdr font-bold text-lg bg-white/5 outline-none focus:border-vibe-primary transition-all group-hover:border-white/10 pr-14"
                        placeholder="••••••••"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-vibe-primary transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
               ) : regStep === 2 ? (
                <div className="space-y-5 animate-in slide-in-from-right duration-500">
                  <div className="space-y-2 group text-center">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1 mb-4">Verification Code</label>
                    <div className="relative max-w-xs mx-auto">
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                        className="w-full panel-soft border border-white/5 rounded-2xl px-4 py-5 text-hdr font-black text-3xl bg-white/5 outline-none focus:border-vibe-primary transition-all text-center tracking-[0.5em]"
                        placeholder="••••••"
                        maxLength={6}
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-4 leading-relaxed">
                      A code has been dispatched to <br />
                      <span className="text-vibe-primary text-xs lowercase">{verificationEmail}</span>
                    </p>
                  </div>
                </div>
               ) : regStep === 3 ? (
                <div className="space-y-5 animate-in slide-in-from-right duration-500">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2 group">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName || ''}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full panel-soft border border-white/5 rounded-2xl px-6 py-5 text-hdr font-bold text-lg bg-white/5 outline-none focus:border-vibe-primary transition-all group-hover:border-white/10"
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className="space-y-2 group">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName || ''}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full panel-soft border border-white/5 rounded-2xl px-6 py-5 text-hdr font-bold text-lg bg-white/5 outline-none focus:border-vibe-primary transition-all group-hover:border-white/10"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>
                </div>
               ) : null}

              {(regStep === 1 || regStep === 2) && (
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full ${isLoginState ? 'btn-hdr-orange shadow-xl' : 'bg-white text-black hover:bg-slate-200'} font-black py-5 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all mt-6 disabled:opacity-50 text-lg active:scale-[0.98] border-none cursor-pointer`}
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : (
                    <>
                      <span>{isLoginState ? 'Log In' : regStep === 2 ? 'Verify Code' : 'Next Step'}</span>
                      <MoveRight size={22} />
                    </>
                  )}
                </button>
              )}



              {(!isLoginState && regStep === 3) && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-hdr-orange font-black py-5 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all mt-6 shadow-xl active:scale-[0.98] border-none cursor-pointer uppercase italic tracking-tighter"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : (
                    <>
                      <span>Complete Setup</span>
                      <MoveRight size={22} />
                    </>
                  )}
                </button>
              )}

            </form>
            )}

            {/* Removed redundant toggle */}
          </div>

          {/* Right Side: Brand & Value Prop in a Box */}
          <div className="w-full glass-card p-6 md:p-14 lg:p-16 relative overflow-hidden transition-all duration-700 ease-out shadow-2xl animate-in slide-in-from-right order-1 lg:order-2 flex flex-col justify-center">
            {/* Subtle glow effect for the text box */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-vibe-primary/10 blur-3xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-vibe-accent/10 blur-2xl -ml-10 -mb-10"></div>

            <div className="space-y-4 md:space-y-6 relative z-10 lg:text-left text-center">
              <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-vibe-primary/10 border border-vibe-primary/30 text-vibe-primary text-[10px] md:text-xs font-semibold mx-auto lg:mx-0 shadow-sm backdrop-blur-md">
                <Zap size={14} fill="currentColor" className="drop-shadow-md" /> A beautiful music experience
              </div>
              <h1 className="text-4xl xs:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-hdr leading-[1.1] md:leading-none drop-shadow-sm uppercase">
                Listen to <br className="hidden xs:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-vibe-primary to-vibe-accent italic drop-shadow-[0_0_20px_rgba(139,92,246,0.2)]">Music.</span> <br />
                <span className="opacity-90 block mt-1 md:mt-2">Feel the vibe.</span>
              </h1>
              <div className="w-12 md:w-16 h-1 bg-vibe-primary/40 rounded-full mx-auto lg:mx-0 mt-4 md:mt-6 mb-2"></div>
              <p className="text-muted text-base md:text-lg font-medium max-w-sm mx-auto lg:mx-0 leading-relaxed mt-2 md:mt-4">
                Stream your favorite songs, create your profile, and connect with sound.
              </p>
            </div>
          </div>

        </div>
      </div>
      {/* Integrated About Section Content */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-24 space-y-16 md:space-y-32 relative z-10">

        {/* Manifesto Section */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-vibe-primary/10 border border-vibe-primary/20 text-vibe-primary text-xs font-semibold mb-6 md:mb-8">
            Our Story
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-hdr tracking-tight mb-6 md:mb-10">
            Music for <br /><span className="text-vibe-primary">Everyone.</span>
          </h2>
          <p className="max-w-2xl mx-auto text-base md:text-xl text-muted font-medium leading-relaxed border-t border-white/5 pt-6 md:pt-8">
            We simply love good music and want to listen to it as easily as possible. Our platform is built to make finding and enjoying songs simple and fun.
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-8">
          <ValueCard
            icon={<Target className="text-vibe-primary" size={32} />}
            title="Easy Access"
            desc="Making great music available to all, without hassle or endless menus."
          />
          <ValueCard
            icon={<Zap className="text-vibe-primary" size={32} />}
            title="High Quality"
            desc="Enjoy crisp audio without interruptions. Every note, beautifully played."
          />
          <ValueCard
            icon={<Users className="text-vibe-accent" size={32} />}
            title="Together"
            desc="Share your favorites and discover what others are enjoying."
          />
        </div>

        {/* Team / Architecture Section */}
        <div className="glass-card p-12 lg:p-20 overflow-hidden bg-vibe-950/40 border-white/5">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 text-vibe-primary text-xs font-semibold mb-8 border border-white/10">How it works</div>
              <h3 className="text-4xl font-bold text-hdr tracking-tight mb-10 leading-tight">Built for <br />Music Lovers</h3>
              <p className="text-muted text-lg leading-relaxed font-medium mb-10 opacity-80">
                We believe music is for everyone. Our platform is continuously improved to ensure your listening experience is smooth and enjoyable. Just click play and relax.
              </p>
              <div className="flex items-center gap-8 border-t border-white/5 pt-10">
                <div>
                  <div className="text-3xl font-bold text-hdr">Crisp</div>
                  <div className="text-xs font-semibold text-slate-500 mt-2">Sound Quality</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-hdr">Fast</div>
                  <div className="text-xs font-semibold text-slate-500 mt-2">Loading Times</div>
                </div>
              </div>
            </div>
            <div className="relative group grayscale hover:grayscale-0 transition-all duration-700 cursor-none">
              <div className="absolute inset-0 bg-vibe-primary/10 rounded-3xl -rotate-2 group-hover:rotate-0 transition-transform" />
              <div className="h-[500px] bg-vibe-900 rounded-3xl relative z-10 border border-white/10 overflow-hidden shadow-3xl">
                <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover opacity-60" alt="Team Visual" />
                <div className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <h4 className="text-2xl font-semibold text-white tracking-tight">Music connects us all.</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Engagement */}
        <div className="text-center py-24">
          <div className="flex flex-col items-center gap-6 group/footer cursor-default mb-12">
             {/* VIBE Logo - unchanged */}
             <div className="w-28 h-28 rounded-full border-4 border-vibe-primary/20 bg-vibe-primary/5 overflow-hidden shadow-[0_0_60px_rgba(139,92,246,0.3)] group-hover/footer:scale-110 transition-all duration-700 group-hover/footer:border-vibe-primary relative group">
                <img
                  src={vibeLogo}
                  className="w-full h-full object-cover brightness-110 animate-spin-slow group-hover/footer:scale-110 transition-all"
                  alt="VIBE Logo"
                />
             </div>
             <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-[0.5em] text-vibe-primary opacity-50 group-hover/footer:opacity-100 transition-opacity">Architected &amp; Developed by</p>
                <div className="flex flex-col items-center justify-center gap-2">
                  <p className="text-3xl md:text-4xl font-black tracking-tight uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-white via-vibe-primary to-vibe-primary group-hover/footer:from-vibe-primary group-hover/footer:to-white transition-all duration-700">Anubhav Tiwari</p>
                  <p className="text-xl md:text-2xl font-black tracking-widest uppercase italic text-vibe-primary/60 group-hover/footer:text-white transition-all duration-700">&amp; Aman Chaudhary</p>
                </div>
             </div>
             {/* Team Banner Card — hardcoded, non-editable */}
             <div className="mt-6 w-full max-w-3xl rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(139,92,246,0.4)] border border-vibe-primary/30 hover:scale-[1.02] transition-all duration-700 relative"
               style={{ background: 'linear-gradient(135deg, #1a0533 0%, #2d0a6b 40%, #4c1d95 70%, #6d28d9 100%)' }}>
               {/* Stars/particles overlay */}
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(167,139,250,0.3),transparent_60%),radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.2),transparent_50%)] pointer-events-none" />
               {/* Glowing orbs */}
               <div className="absolute top-4 right-16 w-2 h-2 rounded-full bg-white/80 shadow-[0_0_8px_4px_rgba(255,255,255,0.4)]" />
               <div className="absolute top-12 right-32 w-1 h-1 rounded-full bg-purple-300/90" />
               <div className="absolute bottom-8 right-24 w-1.5 h-1.5 rounded-full bg-white/60 shadow-[0_0_6px_3px_rgba(255,255,255,0.3)]" />
               <div className="absolute top-1/2 right-8 w-1 h-1 rounded-full bg-pink-300/80" />

               <div className="relative z-10 flex flex-col sm:flex-row items-center gap-0">
                 {/* Photo on left */}
                 <div className="w-full sm:w-[45%] p-6">
                   <div className="rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
                     <img
                       src="/team-photo.jpg"
                       className="w-full h-full object-cover"
                       alt="Anubhav Tiwari & Aman Chaudhary"
                       draggable="false"
                       onContextMenu={e => e.preventDefault()}
                     />
                   </div>
                 </div>
                 {/* Text on right */}
                 <div className="w-full sm:w-[55%] p-6 sm:p-8 text-left">
                   <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3">Developed by<br />Creative Students</h3>
                   <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 border border-white/20 mb-4">
                     <span className="text-xs font-bold text-white/90 tracking-wide">Innovative Solutions by Future Developers</span>
                   </div>
                   <p className="text-xs sm:text-sm text-white/60 leading-relaxed">Empowering young minds to create cutting-edge tech solutions. Experience the innovation and dedication of tomorrow's developers.</p>
                 </div>
               </div>
             </div>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-8 italic">Come enjoy the music.</p>
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-vibe-primary/40 to-transparent"></div>
        </div>
      </div>

      {/* Support Modal Overlay */}
      {showSupport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowSupport(false)} />
          
          <div className="w-full max-w-2xl glass-card p-10 lg:p-14 relative overflow-hidden transition-all duration-500 shadow-2xl animate-in zoom-in-95 border border-white/10">
            <button 
              onClick={() => setShowSupport(false)}
              className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-xl border-none cursor-pointer"
            >
              <X size={20} />
            </button>

            <form className="space-y-8 relative z-10" onSubmit={handleSupportSubmit}>
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Your Identity</label>
                  <input 
                    required 
                    placeholder="Full Name" 
                    value={supportForm.name}
                    onChange={(e) => setSupportForm({...supportForm, name: e.target.value})}
                    className="w-full panel-soft border border-white/5 rounded-2xl px-6 py-4 text-hdr font-bold placeholder-slate-600 focus:ring-2 focus:ring-red-500/30 transition-all outline-none" 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Frequency (Email)</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="name@domain.com" 
                    value={supportForm.email}
                    onChange={(e) => setSupportForm({...supportForm, email: e.target.value})}
                    className="w-full panel-soft border border-white/5 rounded-2xl px-6 py-4 text-hdr font-bold placeholder-slate-600 focus:ring-2 focus:ring-red-500/30 transition-all outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Your Signal</label>
                <textarea 
                  required
                  placeholder="Type your message here..."
                  value={supportForm.message}
                  onChange={(e) => setSupportForm({...supportForm, message: e.target.value})}
                  className="w-full panel-soft border border-white/5 rounded-2xl px-6 py-5 text-hdr font-bold placeholder-slate-600 focus:ring-2 focus:ring-red-500/30 min-h-[160px] transition-all resize-none outline-none" 
                />
              </div>

              <button className="bg-[#ff4b5c] hover:bg-[#ff354a] text-white font-black px-10 py-5 w-full sm:w-auto shadow-2xl text-lg rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 border-none cursor-pointer uppercase tracking-wider">
                {supportLoading ? <Loader2 className="animate-spin" size={24} /> : <><MessageSquare size={20} /> Complain</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ValueCard = ({ icon, title, desc }) => (
  <div className="glass-card p-6 md:p-12 hover:border-vibe-primary/50 transition-all group relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-vibe-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-vibe-primary/10 transition-colors"></div>
    <div className="mb-6 md:mb-10 p-4 md:p-5 bg-white/5 rounded-[2rem] w-fit group-hover:scale-110 group-hover:shadow-[0_0_50px_rgba(255,107,0,0.1)] transition-all border border-white/5 text-vibe-primary">
      {icon}
    </div>
    <h3 className="text-lg md:text-xl font-semibold text-hdr mb-3 md:mb-4 tracking-tight">{title}</h3>
    <p className="text-muted text-sm md:text-base leading-relaxed font-normal opacity-90">{desc}</p>
  </div>
);

export default Landing;
