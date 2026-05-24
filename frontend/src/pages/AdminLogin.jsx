import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  Lock, 
  Mail, 
  Loader2, 
  MoveRight,
  ChevronLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import vibeLogo from '../assets/vibe-logo.png';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Domain restriction
    if (!email.endsWith('@vibecom')) {
      setError('Access Denied: Only @vibecom Accounts authorized.');
      return;
    }

    // Password length restriction
    if (password.length !== 10) {
      setError('Security Breach: Access key must be exactly 10 characters.');
      return;
    }

    setLoading(true);
    try {
      const identity = { email, phone: '' };
      const user = await login(identity, password);
      
      if (user.role === 'admin' || user.role === 'superadmin') {
        navigate('/dashboard');
      } else {
        setError('Unauthorized: Administrative clearance required.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen app-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-vibe-primary/5 rounded-full blur-[150px] animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-lg animate-in zoom-in-95 duration-500">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-all mb-8 group bg-transparent border-none cursor-pointer"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Return to Public Portal</span>
        </button>

        <div className="glass-card p-10 md:p-14 relative overflow-hidden shadow-2xl border-red-500/10">
          {/* Top Security Line */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent"></div>

          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl overflow-hidden mb-6 shadow-2xl border border-white/5 p-1 bg-vibe-950 flex items-center justify-center">
                <img src={vibeLogo} className="w-full h-full object-cover brightness-110 contrast-110" alt="VIBE Admin" />
            </div>
            <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-1">Admin Access</h1>
            <p className="text-[10px] font-bold text-red-500/60 uppercase tracking-[0.3em]">Restricted Account</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-black uppercase tracking-wider rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 shadow-lg scale-105 transition-transform">
              <ShieldAlert size={18} className="shrink-0 animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3 group">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 group-focus-within:text-red-500 transition-colors">Admin Identifier</label>
              <div className="flex items-center gap-4 panel-soft border border-white/5 rounded-2xl px-6 py-4 bg-white/5 focus-within:border-red-500/40 transition-all">
                <div className="text-red-500">
                  <Mail size={22} />
                </div>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-hdr font-bold text-lg placeholder:opacity-30"
                  placeholder="admin@vibecom"
                  required
                />
              </div>
            </div>

            <div className="space-y-3 group">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 group-focus-within:text-red-500 transition-colors">Access Key (10 Chars)</label>
              <div className="flex items-center gap-4 panel-soft border border-white/5 rounded-2xl px-6 py-4 bg-white/5 focus-within:border-red-500/40 transition-all">
                <div className="text-red-500">
                  <Lock size={22} />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.slice(0, 10))}
                  className="w-full bg-transparent border-none outline-none text-hdr font-bold text-lg placeholder:opacity-30"
                  placeholder="••••••••••"
                  required
                  maxLength={10}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase text-sm tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 border-none cursor-pointer mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  Login <Lock size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-white/5 text-center">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">
              Unauthorized access to this Account is strictly prohibited. <br /> All activity is monitored and logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
