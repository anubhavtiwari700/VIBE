import React, { useState } from 'react';
import MainLayout from '../components/MainLayout';
import { ShieldCheck, User, Laptop, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Security = () => {
    const { user } = useAuth();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleDeletionRequest = async () => {
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            await api.post('/auth/request-deletion');
            setSuccess('Deletion request sent to admin for approval.');
            setConfirmDelete(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request deletion');
        } finally {
            setLoading(false);
        }
    };

    // Very basic browser detection
    const getDeviceName = () => {
        const ua = navigator.userAgent;
        if (ua.includes("Windows")) return "Windows Desktop";
        if (ua.includes("Mac")) return "MacBook / iMac";
        if (ua.includes("Linux")) return "Linux Device";
        if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS Device";
        if (ua.includes("Android")) return "Android Device";
        return "Unknown Device";
    };

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto w-full animate-in fade-in duration-700">
                
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3 mb-2">
                        <ShieldCheck className="text-vibe-primary" size={32} />
                        Security & Access
                    </h1>
                    <p className="text-slate-400 font-medium">Manage your active sessions and account status.</p>
                </div>

                {error && <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl font-semibold animate-in slide-in-from-top-2">{error}</div>}
                {success && <div className="p-4 mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm rounded-xl font-semibold animate-in slide-in-from-top-2">{success}</div>}

                <div className="space-y-8">
                    {/* Active Session Info */}
                    <section className="glass-card p-8 bg-vibe-900 border border-white/5">
                        <h2 className="text-xl font-bold mb-6 text-white border-b border-white/10 pb-4">Current Session</h2>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/5 rounded-xl text-slate-400"><User size={24} /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Authenticated As</p>
                                    <p className="font-medium text-white text-lg">{user?.name || "Unknown User"}</p>
                                    <p className="text-slate-400 text-sm">{user?.email}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/5 rounded-xl text-slate-400"><Laptop size={24} /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Active Device</p>
                                    <p className="font-medium text-white text-lg">{getDeviceName()}</p>
                                    <p className="text-emerald-500 text-sm font-bold flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> App Connected
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Danger Zone Section moved from Settings */}
                    {user?.role !== 'admin' && (
                    <section className="glass-card border-red-500/20 p-8 overflow-hidden relative bg-vibe-900">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                            <Trash2 size={180} />
                        </div>
                        <h2 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-2 border-b border-red-500/10 pb-4">
                            <AlertTriangle size={24} />
                            Danger Zone
                        </h2>
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-lg">
                            Submitting a deletion request will notify our administrators. Upon approval, all your profile data, playlists, and favorites will be permanently erased. This action cannot be undone.
                        </p>

                        {!confirmDelete ? (
                            <button 
                                onClick={() => setConfirmDelete(true)}
                                className="flex items-center gap-2 px-6 py-3 border border-red-500/30 text-red-500 rounded-xl hover:bg-red-500/10 transition-all font-bold text-sm"
                            >
                                Request Account Deletion
                            </button>
                        ) : (
                            <div className="space-y-4 animate-in zoom-in-95 duration-200">
                                <p className="text-red-400 font-bold text-sm">Are you absolutely sure?</p>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={handleDeletionRequest}
                                        className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold text-sm shadow-lg shadow-red-900/20"
                                        disabled={loading}
                                    >
                                        {loading ? 'Processing...' : 'Confirm Request'}
                                    </button>
                                    <button 
                                        onClick={() => setConfirmDelete(false)}
                                        className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-all font-bold text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                    )}
                </div>
                
                <div className="h-20" />
            </div>
        </MainLayout>
    );
};

export default Security;
