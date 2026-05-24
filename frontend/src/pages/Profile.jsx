import React from 'react';
import MainLayout from '../components/MainLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Loader2 } from 'lucide-react';
import { 
  Mail, 
  Calendar, 
  Heart, 
  Music, 
  Clock, 
  Award,
  Camera,
  Trash2
} from 'lucide-react';

import { useState, useRef } from 'react';
import { API_BASE_URL, resolveUrl } from '../utils/constants';

const Profile = () => {
    const { user, likedSongs, updateUserProfile, loading } = useAuth();
    
    if (loading) {
        return (
            <MainLayout>
                <div className="h-[70vh] w-full flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-vibe-primary" size={40} />
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">Synchronizing Terminal...</p>
                </div>
            </MainLayout>
        );
    }
    const [uploading, setUploading] = useState(false);
    const profileInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    const handleUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append(type, file);
        try {
            await updateUserProfile(formData);
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = async (type) => {
        if (!window.confirm(`Clear your ${type === 'profileImg' ? 'Identity Icon' : 'Network Banner'}?`)) return;
        
        setUploading(true);
        const formData = new FormData();
        if (type === 'profileImg') {
            formData.append('removeProfileImg', 'true');
        } else {
            formData.append('removeBannerImg', 'true');
        }
        
        try {
            await updateUserProfile(formData);
        } catch (err) {
            console.error("Removal failed", err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <MainLayout>
            <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-700">
                
                {/* Profile Header */}
                <div className="relative mb-12 group/header">
                    {/* Cover Image */}
                    <div 
                        className="h-56 w-full rounded-3xl bg-vibe-950 border border-white/5 overflow-hidden relative shadow-2xl"
                    >
                        {user?.bannerImg ? (
                            <img src={resolveUrl(user.bannerImg)} className="w-full h-full object-cover" alt="Banner" />
                        ) : (
                            <div className="absolute inset-0 bg-[#0F0F10] shadow-[inset_0_-80px_100px_rgba(255,42,95,0.03)] border-b border-vibe-primary/5">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/header:opacity-100 transition-opacity" />
                        <div className="absolute bottom-6 right-6 opacity-0 group-hover/header:opacity-100 transition-all transform translate-y-2 group-hover/header:translate-y-0">
                            <input 
                                type="file" 
                                hidden 
                                ref={bannerInputRef} 
                                onChange={(e) => handleUpload(e, 'bannerImg')} 
                                accept="image/*"
                            />
                            <button 
                                onClick={() => bannerInputRef.current?.click()}
                                disabled={uploading}
                                className="p-4 bg-white/10 hover:bg-vibe-primary backdrop-blur-md rounded-2xl text-white transition-all border border-white/10 shadow-xl active:scale-95"
                                title="Change Network Banner"
                            >
                                {uploading ? <Loader2 size={24} className="animate-spin text-white" /> : <Camera size={24} />}
                            </button>
                            {user?.bannerImg && (
                                <button 
                                    onClick={() => handleRemove('bannerImg')}
                                    disabled={uploading}
                                    className="p-4 bg-red-500/10 hover:bg-red-500 backdrop-blur-md rounded-2xl text-white transition-all border border-white/10 shadow-lg active:scale-95 ml-3"
                                    title="Remove Banner"
                                >
                                    <Trash2 size={24} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Left Mid-Side Avatar */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-10 flex items-center gap-6">
                        <div className="w-32 h-32 rounded-[32px] bg-vibe-950 border-4 border-vibe-primary/30 p-1.5 shadow-xl/20 relative group/avatar overflow-hidden">
                            <div className="w-full h-full rounded-[24px] bg-vibe-900 border border-white/5 flex items-center justify-center text-white/10 text-4xl font-semibold overflow-hidden shadow-inner relative">
                                {user?.profileImg ? (
                                    <img src={resolveUrl(user.profileImg)} className="w-full h-full object-cover" alt="Profile" />
                                ) : null}
                            </div>
                            <div 
                                onClick={() => profileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/60 rounded-[32px] opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm"
                            >
                                <input 
                                    type="file" 
                                    hidden 
                                    ref={profileInputRef} 
                                    onChange={(e) => handleUpload(e, 'profileImg')} 
                                    accept="image/*"
                                />
                                {uploading ? <Loader2 className="animate-spin text-vibe-primary" size={28} /> : <Camera size={28} className="text-white mb-2" />}
                                <span className="text-xs font-semibold text-white">Update ID</span>
                                {user?.profileImg && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleRemove('profileImg'); }}
                                        className="mt-4 p-2 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-all"
                                        title="Remove Photo"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="drop-shadow-2xl">
                            <h1 className="text-3xl font-semibold text-white leading-none mb-2 drop-shadow-md">
                                {user?.firstName} {user?.middleName ? `${user.middleName} ` : ''}{user?.lastName}
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-[1fr_350px] gap-8 mt-16">
                    
                    {/* Left Column: Details & Stats */}
                    <div className="space-y-8">
                        
                        {/* Information Grid */}
                        <div className="glass-card p-8 grid sm:grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                                    <Mail size={12} /> Email Address
                                </label>
                                <p className="text-hdr font-bold text-lg">{user?.email}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                                    <Calendar size={12} /> Member Since
                                </label>
                                <p className="text-hdr font-bold text-lg">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                                    <Award size={12} /> Role Assignment
                                </label>
                                <p className="text-hdr font-bold text-lg uppercase tracking-widest text-vibe-primary">{user?.role}</p>
                            </div>
                        </div>

                        {/* Recent Activity / Bio Placeholder */}
                        <div className="glass-card p-8">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                                <Music className="text-vibe-primary" size={24} />
                                Musical Identity
                            </h3>
                            <div className="space-y-6">
                                <p className="text-muted leading-relaxed font-medium text-sm">
                                    You've been exploring the rhythm with us! Your profile showcases your unique taste and interactions within the platform. Keep streaming to unlock more achievements.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <Badge icon={<Award size={14} />} label="Early Adopter" />
                                    <Badge icon={<Clock size={14} />} label="Hifi Streamer" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Mini Stats */}
                    {user?.role !== 'admin' && user?.role !== 'superadmin' && (
                        <div className="space-y-6">
                            <div className="glass-card p-6 bg-vibe-primary/5 border-vibe-primary/10">
                                <h4 className="text-sm font-semibold text-vibe-primary mb-6 underline underline-offset-8">Engagement Metrics</h4>
                                <div className="space-y-6">
                                    <StatItem icon={<Heart fill="currentColor" size={18} className="text-vibe-accent" strokeWidth={0} />} label="Songs Liked" value={likedSongs?.length || 0} />
                                    <StatItem icon={<Music size={18} className="text-vibe-primary" />} label="Playlists Created" value="0" />
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
            {/* Height Spacer */}
            <div className="h-24"></div>
        </MainLayout>
    );
};

const Badge = ({ icon, label }) => (
    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full flex items-center gap-2 text-xs font-semibold text-hdr hover:border-vibe-primary/40 transition-all cursor-default">
        {icon}
        {label}
    </div>
);

const StatItem = ({ icon, label, value }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                {icon}
            </div>
            <span className="text-sm font-bold text-slate-400">{label}</span>
        </div>
        <span className="text-lg font-black text-hdr tracking-tighter">{value}</span>
    </div>
);

export default Profile;
