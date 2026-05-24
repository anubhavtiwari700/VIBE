import React, { useState } from 'react';
import MainLayout from '../components/MainLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  User, 
  Lock, 
  Trash2, 
  Shield, 
  Save, 
  Loader2,
  AlertTriangle,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import vibeLogo from '../assets/vibe-logo.png';

const Settings = () => {
    const { user, logout, login, updateUserProfile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activePart, setActivePart] = useState('account-profile'); // account-profile, update-password, login-activity, account-deletion

    /* Profile Edit State */
    const [name, setName] = useState(user?.name || '');

    React.useEffect(() => {
        if (user?.name) setName(user.name);
    }, [user?.name]);

    /* Password Update State */
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

    /* Account Deletion Request State */
    const [deletionStep, setDeletionStep] = useState(user?.deletionRequested ? 'PENDING' : 'IDLE'); // IDLE, WARN, FORM, SUCCESS, PENDING, CANCEL_CONFIRM
    const [deletionReason, setDeletionReason] = useState('');
    const [confirmForm, setConfirmForm] = useState({ email: '', password: '' });

    const handleCancelDeletion = async () => {
        setLoading(true);
        try {
            await api.post('/auth/cancel-deletion');
            setDeletionStep('IDLE');
            setSuccess('Termination request aborted. Profile synchronization restored.');
        } catch (err) {
            setError('Failed to cancel request');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            await updateUserProfile(formData);
            setSuccess('Identity synchronization successful. User name updated.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    }

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (passwords.new !== passwords.confirm) {
            return setError('Passwords do not match');
        }

        // Limit for vivecom accounts is 10, others 6 as per request
        const isVibecom = user?.email.endsWith('@vibecom');
        const requiredLen = isVibecom ? 10 : 6;
        
        if (passwords.new.length !== requiredLen) {
            return setError(`${isVibecom ? 'System Account' : 'User'} security keys must be exactly ${requiredLen} characters.`);
        }

        setLoading(true);
        try {
            const newPass = passwords.new;
            const userEmail = user.email;

            await api.put('/auth/password', { 
                currentPassword: passwords.current, 
                newPassword: newPass 
            });
            
            setSuccess('Password updated. Re-synchronizing session...');
            setPasswords({ current: '', new: '', confirm: '' });

            // Automatically cycle the session
            await logout();
            await login({ email: userEmail, phone: '' }, newPass);
            
            setSuccess('Synchronized successfully with new credentials.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletionRequest = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/request-deletion', { 
                email: confirmForm.email,
                password: confirmForm.password,
                reason: deletionReason || 'No reason provided'
            });
            setDeletionStep('SUCCESS');
            setSuccess('Request confirmed. Terminating session and logging out...');
            
            // Automatic logout after 2.5 seconds
            setTimeout(() => {
                logout();
                navigate('/');
            }, 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failure');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout hideSidebar>
            <div className="max-w-4xl mx-auto w-full animate-in fade-in duration-700">
                
                {/* Header with Music Logo */}
                <div className="mb-10 md:mb-14 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/5 pb-6 md:pb-8 gap-6">
                    <div className="flex items-start md:items-center gap-4 md:gap-6 flex-col md:flex-row w-full md:w-auto">
                        <div className="flex items-center gap-4">
                            {/* Logo */}
                            <div 
                                className="relative w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 bg-vibe-950 shadow-xl cursor-pointer hover:scale-110 transition-all active:scale-95 group"
                                onClick={() => navigate('/dashboard')}
                            >
                                <img src={vibeLogo} className="w-full h-full object-cover brightness-110 contrast-110 group-hover:brightness-125 transition-all" alt="VIBE" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none mt-6">
                                    <svg width="34" height="14" viewBox="0 0 34 14" fill="none" className="text-vibe-primary">
                                        <path 
                                            d="M1 7h4l2-4 2 8 2-4h2l2-6 2 12 2-6h2l2-4 2 8 2-4h4" 
                                            stroke="currentColor" 
                                            strokeWidth="1.5" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                            className="animate-[music-pulse_2s_linear_infinite]"
                                        />
                                    </svg>
                                </div>
                            </div>
                            {/* Title */}
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter italic">
                                    vibe's Settings
                                </h1>
                                <p className="text-muted mt-1 font-bold uppercase tracking-widest text-[9px] md:text-[10px] opacity-40">Configure your account and security settings.</p>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-2.5 rounded-xl border border-white/10 text-muted font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 hover:text-white transition-all shadow-xl whitespace-nowrap"
                    >
                        Return Home
                    </button>
                </div>

                {error && <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl font-semibold animate-in slide-in-from-top-2">{error}</div>}
                {success && <div className="p-4 mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm rounded-xl font-semibold animate-in slide-in-from-top-2">{success}</div>}

                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] lg:grid-cols-[300px_1fr] gap-6 md:gap-10">
                    
                    {/* Navigation Rail */}
                    <div className="space-y-2 md:sticky md:top-24">
                        <SettingNavItem 
                            icon={<User size={18} />} 
                            label="Account Profile" 
                            onClick={() => setActivePart('account-profile')} 
                            active={activePart === 'account-profile'} 
                        />
                        <SettingNavItem 
                            icon={<Lock size={18} />} 
                            label="Update Password" 
                            onClick={() => setActivePart('update-password')} 
                            active={activePart === 'update-password'} 
                        />
                        <SettingNavItem 
                            icon={<Shield size={18} />} 
                            label="Where You Logged In" 
                            onClick={() => setActivePart('login-activity')} 
                            active={activePart === 'login-activity'} 
                        />
                        {user?.role !== 'superadmin' && (
                            <div className="pt-4 mt-4 border-t border-white/5">
                                <SettingNavItem 
                                    icon={<Trash2 size={18} />} 
                                    label="Delete Account" 
                                    className={activePart === 'account-deletion' ? 'text-red-500 bg-red-500/10' : 'text-red-500/60 hover:text-red-500 hover:bg-red-500/5'}
                                    onClick={() => setActivePart('account-deletion')} 
                                    active={activePart === 'account-deletion'} 
                                />
                            </div>
                        )}
                    </div>

                    {/* Main Content Area */}
                    <div className="space-y-12 min-h-[500px]">
                        
                        {/* Profile Section */}
                        {activePart === 'account-profile' && (
                        <section className="glass-card p-8 animate-in slide-in-from-right-4 duration-500">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <User className="text-slate-400" size={20} />
                                Account Profile
                            </h2>
                            <form className="space-y-6" onSubmit={handleProfileUpdate}>
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2 group">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 px-1 group-focus-within:text-vibe-primary transition-colors">Your Name</label>
                                        <input 
                                            type="text" 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full panel-soft border border-white/5 rounded-xl px-5 py-3 text-hdr font-bold bg-white/5 focus:border-vibe-primary/50 transition-all outline-none"
                                            placeholder="Update your display name"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 px-1">Email Address</label>
                                        <div className="panel-soft px-5 py-3 rounded-xl text-hdr font-medium bg-white/5 opacity-60 cursor-not-allowed">{user?.email}</div>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <button 
                                        type="submit"
                                        className="btn-hdr-orange px-8 py-3 w-full sm:w-auto"
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save Settings</>}
                                    </button>
                                </div>
                            </form>
                        </section>
                        )}

                        {/* Security Segment */}
                        {activePart === 'update-password' && (
                        <section className="glass-card p-8 animate-in slide-in-from-right-4 duration-500">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Lock className="text-slate-400" size={20} />
                                Update Password
                            </h2>
                            <form className="space-y-6" onSubmit={handlePasswordUpdate}>
                                <div className="space-y-4">
                                    <PasswordField 
                                        label="Current Password" 
                                        value={passwords.current} 
                                        onChange={(v) => setPasswords({...passwords, current: v})}
                                        show={showPass.current}
                                        onToggle={() => setShowPass({...showPass, current: !showPass.current})}
                                    />
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <PasswordField 
                                            label="New Password" 
                                            value={passwords.new} 
                                            onChange={(v) => setPasswords({...passwords, new: v})}
                                            show={showPass.new}
                                            onToggle={() => setShowPass({...showPass, new: !showPass.new})}
                                        />
                                        <PasswordField 
                                            label="Confirm New Password" 
                                            value={passwords.confirm} 
                                            onChange={(v) => setPasswords({...passwords, confirm: v})}
                                            show={showPass.confirm}
                                            onToggle={() => setShowPass({...showPass, confirm: !showPass.confirm})}
                                        />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <button 
                                        className="btn-hdr-orange px-8 py-3 w-full sm:w-auto"
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Update Password</>}
                                    </button>
                                </div>
                            </form>
                        </section>
                        )}

                        {/* Session Metadata */}
                        {activePart === 'login-activity' && (
                        <section className="glass-card p-6 md:p-8 animate-in slide-in-from-right-4 duration-500">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-vibe-primary">
                                <Shield className="text-vibe-primary" size={20} />
                                Where You Logged In
                            </h2>
                            <div className="p-4 md:p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-vibe-primary/10 border border-vibe-primary/20 flex items-center justify-center text-vibe-primary flex-shrink-0">
                                        <Shield size={20} md:size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Connected Device</p>
                                        <p className="font-bold text-hdr text-sm md:text-base">
                                            {(() => {
                                                const ua = navigator.userAgent;
                                                if (ua.includes("Windows")) return "Windows PC";
                                                if (ua.includes("Macintosh")) return "MacBook";
                                                if (ua.includes("iPhone")) return "iPhone";
                                                if (ua.includes("Android")) return "Android Account";
                                                if (ua.includes("iPad")) return "iPad";
                                                return "Active Account";
                                            })()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit ml-auto sm:ml-0">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Primary Sync Active</span>
                                </div>
                            </div>
                        </section>
                        )}

                        {/* Account Termination Wizard */}
                        {user?.role !== 'superadmin' && activePart === 'account-deletion' && (
                        <section className="glass-card p-8 border-red-500/10 bg-red-500/5 animate-in slide-in-from-right-4 duration-500">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-500">
                                <AlertTriangle size={20} />
                                Account Deletion Request
                            </h2>
                            
                            {/* Logic Rail */}
                            {deletionStep === 'IDLE' && (
                                <div className="space-y-4">
                                    <button 
                                        onClick={() => setDeletionStep('WARN')}
                                        className="w-full p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black uppercase text-[10px] tracking-widest border border-red-500/20 transition-all active:scale-[0.98]"
                                    >
                                        Delete Account Request
                                    </button>
                                </div>
                            )}

                            {deletionStep === 'WARN' && (
                                <div className="space-y-6 animate-in zoom-in-95">
                                    <div className="space-y-4">
                                        <p className="text-sm font-bold text-red-500 leading-relaxed">
                                            Are you sure you want to delete your account? This action cannot be undone.
                                        </p>
                                        <p className="text-sm font-bold text-slate-300 leading-relaxed">
                                            Before proceeding, please let us know why you want to delete your account.
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-white/10">
                                        <h3 className="text-lg font-black text-hdr mb-4">Account Deletion Request Form</h3>
                                        <p className="text-sm text-slate-400 mb-6">Please fill in the required details to proceed:</p>
                                        <form onSubmit={handleDeletionRequest} className="space-y-4">
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <label className="text-sm font-bold text-slate-300 px-1">Email Address</label>
                                                    <input required type="email" value={confirmForm.email} onChange={(e) => setConfirmForm({...confirmForm, email: e.target.value})} className="w-full panel-soft border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-500/20 outline-none" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-bold text-slate-300 px-1">Password</label>
                                                    <input required type="password" value={confirmForm.password} onChange={(e) => setConfirmForm({...confirmForm, password: e.target.value})} className="w-full panel-soft border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-500/20 outline-none" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-bold text-slate-300 px-1">Reason for Deletion (required)</label>
                                                    <textarea required rows="3" value={deletionReason} onChange={(e) => setDeletionReason(e.target.value)} className="w-full panel-soft border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-500/20 outline-none resize-none" />
                                                </div>
                                            </div>
                                            <div className="flex gap-4 pt-4">
                                                <button type="submit" disabled={loading} className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg flex items-center justify-center min-w-[160px]">
                                                    {loading ? <Loader2 className="animate-spin" size={18} /> : "Submit Request"}
                                                </button>
                                                <button type="button" onClick={() => setDeletionStep('IDLE')} className="px-6 py-3 rounded-xl bg-white/5 text-slate-400 font-bold hover:bg-white/10 transition-all">
                                                    Go Back
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {deletionStep === 'SUCCESS' && (
                                <div className="space-y-6 text-center py-4 animate-in slide-in-from-top-4">
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                                        <Shield className="text-emerald-500" size={32} />
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-black text-white">Request Submitted</h3>
                                        <p className="text-sm font-bold text-slate-300 px-4">Your account deletion request has been successfully submitted.</p>
                                        <p className="text-sm font-bold text-slate-300 px-4">Our team is currently reviewing your request. This process may take some time.</p>
                                    </div>
                                    <button onClick={() => setDeletionStep('PENDING')} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-hdr font-bold transition-all hover:bg-white/10">Continue</button>
                                </div>
                            )}

                            {deletionStep === 'PENDING' && (
                                <div className="space-y-6 animate-in fade-in">
                                    <div className="flex flex-col items-center gap-4 text-center pb-4">
                                        <Loader2 className="animate-spin text-vibe-primary" size={32} />
                                        <div className="space-y-4">
                                            <h3 className="text-2xl font-black text-hdr">Request in Progress</h3>
                                            <p className="text-sm font-bold text-slate-300">Your account deletion request is currently under process.</p>
                                            <p className="text-sm font-bold text-slate-300">If you wish to cancel your request, you can do so below.</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setDeletionStep('CANCEL_CONFIRM')}
                                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-hdr font-bold transition-all"
                                    >
                                        Cancel Request
                                    </button>
                                </div>
                            )}

                            {deletionStep === 'CANCEL_CONFIRM' && (
                                <div className="space-y-6 animate-in zoom-in-95">
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-black text-white">Cancel Deletion Request</h3>
                                        <p className="text-sm font-bold text-slate-300">
                                            Are you sure you want to cancel your account deletion request?
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={handleCancelDeletion}
                                            disabled={loading}
                                            className="px-6 py-3 rounded-xl bg-vibe-primary text-white font-bold shadow-xl flex-1 flex justify-center items-center"
                                        >
                                            {loading ? <Loader2 className="animate-spin m-auto" size={18} /> : "Yes, Cancel Request"}
                                        </button>
                                        <button onClick={() => setDeletionStep('PENDING')} className="px-6 py-3 rounded-xl bg-white/5 text-slate-300 font-bold hover:bg-white/10 flex-1">
                                            No, Go Back
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>
                        )}

                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

const SettingNavItem = ({ icon, label, active = false, className = "", onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-medium ${active ? 'bg-vibe-primary/10 text-vibe-primary' : 'hover:bg-white/5 text-slate-400 hover:text-hdr'} ${className}`}
    >
        <div className="flex items-center gap-3">
            {icon}
            <span className="text-sm">{label}</span>
        </div>
        <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${active ? 'opacity-100' : ''}`} />
    </button>
);

const PasswordField = ({ label, value, onChange, show, onToggle }) => (
    <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 px-1">{label}</label>
        <div className="relative">
            <input 
                type={show ? 'text' : 'password'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full panel-soft border-0 rounded-xl px-5 py-4 text-hdr font-medium placeholder-slate-600 focus:ring-2 focus:ring-vibe-primary/20 transition-all pr-12"
                placeholder="••••••••"
                required
            />
            <button 
                type="button"
                onClick={onToggle}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-hdr transition-colors"
            >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    </div>
);

export default Settings;
