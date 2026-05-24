import React, { useEffect, useState, useRef } from 'react';
import { Bell, Camera, CheckCircle, Clock, Edit3, Heart, Key, Loader2, Lock, Mail, Music, Plus, Search, ShieldCheck, Trash2, Unlock, Users, Zap, BadgeCheck, Download, X } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import MainLayout from '../components/MainLayout';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL, resolveUrl } from '../utils/constants';
import verifiedBadge from '../assets/verified.png';
import vibeLogo from '../assets/vibe-logo.png';



const UserManagement = ({ users, loading, removeUser, approveDeletion, loadUsers, currentUser, activeTab: currentTab }) => {
  const handleToggleBlock = async (id, currentStatus) => {
    if (!window.confirm(`Security Protocol: ${currentStatus ? 'Unblock' : 'Restrict'} this user?`)) return;
    try {
      await api.put(`/auth/users/block/${id}`);
      alert(`User access ${currentStatus ? 'restored' : 'restricted'}.`);
      if (loadUsers) loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed.");
    }
  };

  const handleUpdateName = async (id, currentName) => {
    const newName = window.prompt("Enter new identity label (Full Name):", currentName);
    if (!newName || newName === currentName) return;

    try {
      await api.put(`/auth/users/update/${id}`, { name: newName });
      alert("Identity label updated successfully.");
      if (loadUsers) loadUsers();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to update identity label.";
      alert(errorMsg);
    }
  };

  const handleResetPassword = async (id) => {
    const newPassword = window.prompt("Enter new security key for this account:");
    if (!newPassword) return;

    // Check if the target user is a vibecom system item
    const targetUser = users.find(u => u._id === id);
    const requiredLen = targetUser?.email.endsWith('@vibecom') ? 10 : 6;

    if (newPassword.length !== requiredLen) {
      alert(`Security key for this account must be exactly ${requiredLen} characters.`);
      return;
    }

    try {
      await api.put(`/auth/reset-password/${id}`, { newPassword });
      alert("Security key synchronized successfully.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reset security key.");
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [visibleCount, setVisibleCount] = useState(40);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  // Declare these early so the useEffect below can reference them
  const filteredUsers = users.filter(u =>
    (u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const adminUsers = filteredUsers.filter(u => u.role === 'admin' && u.email !== currentUser?.email);
  const regularUsers = filteredUsers.filter(u => u.role === 'user' || !u.role);

  useEffect(() => {
    const el = sentinelRef.current;
    // Don't observe if all users are already visible
    if (!el || visibleCount >= filteredUsers.length) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMore) {
        setLoadingMore(true);
        setTimeout(() => {
          setVisibleCount(prev => prev + 40);
          setLoadingMore(false);
        }, 800);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadingMore, visibleCount, filteredUsers.length]);

  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');


  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreatingAdmin(true);
    setAdminError('');
    setAdminSuccess('');

    const cleanEmail = adminForm.email.trim().toLowerCase();
    const isVibecom = cleanEmail.endsWith('@vibecom');
    const requiredLen = isVibecom ? 10 : 6;
    
    if (adminForm.password.length !== requiredLen) {
      setAdminError(`Access key for ${isVibecom ? 'System Admin (@vibecom)' : 'Admin account'} must be exactly ${requiredLen} characters.`);
      setCreatingAdmin(false);
      return;
    }

    try {
      await api.post('/auth/create-admin', adminForm);
      setAdminSuccess('Admin account created successfully.');
      setAdminForm({ name: '', email: '', password: '' });
      if (loadUsers) loadUsers();
    } catch (err) {
      setAdminError(err.response?.data?.message || 'Failed to create admin.');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const UserTable = ({ data, title }) => (
    <div className="mb-12 glass-card p-4 sm:p-10 border border-white/5 shadow-2xl relative">
      <div className="absolute top-0 left-4 w-12 h-1 bg-vibe-primary/40 rounded-full" />
      <h3 className="text-2xl font-black text-white mb-10 tracking-tighter flex items-center gap-3">
        {title} 
        <span className="text-[11px] bg-vibe-primary/20 text-vibe-primary border border-vibe-primary/20 px-3 py-1 rounded-lg uppercase tracking-widest font-black">
          {data.length} Users Online
        </span>
      </h3>
      {/* Desktop/Tablet Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-4">
          <thead>
            <tr className="text-muted text-[11px] font-black uppercase tracking-[0.3em] opacity-40">
              <th className="pb-4 px-6 border-b border-white/5">Metadata & ID</th>
              <th className="pb-4 px-6 border-b border-white/5">Credentials</th>
              <th className="pb-4 px-6 border-b border-white/5">Activity</th>
              <th className="pb-4 px-6 border-b border-white/5">Status & Role</th>
              <th className="pb-4 px-6 border-b border-white/5 text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="">
            {data.slice(0, title === 'admins' ? data.length : visibleCount).map(u => (
              <tr key={u._id} className={`group/row transition-colors duration-300 ${u.deletionRequested ? 'bg-red-500/5' : ''}`}>
                {/* 1. Metadata Column */}
                <td className="py-6 px-6 first:rounded-l-[24px] bg-white/[0.02] border-y border-l border-white/5 group-hover/row:border-vibe-primary/30 transition-colors duration-300">
                  <div className="flex items-center gap-5">
                    <div>
                      <div className="font-bold text-white text-base group-hover/row:text-vibe-primary transition-colors tracking-tight mb-0.5 flex items-center gap-2">
                        {u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="py-6 px-6 bg-white/[0.02] border-y border-white/5 group-hover/row:border-vibe-primary/30 transition-colors duration-300">
                  <div className="flex flex-col gap-1">
                    <div className="text-[13px] text-hdr font-bold flex items-center gap-2 tracking-tight">
                      <Mail size={14} className="text-vibe-primary" /> {u.email}
                    </div>

                  </div>
                </td>

                <td className="py-6 px-6 bg-white/[0.02] border-y border-white/5 group-hover/row:border-vibe-primary/30 transition-colors duration-300">
                  <div className="flex flex-col gap-2">
                    <span className="text-vibe-primary font-black text-[11px] flex items-center gap-1.5 uppercase tracking-widest border border-vibe-primary/20 bg-vibe-primary/5 w-fit px-3 py-1 rounded-lg">
                      <Heart size={11} fill="currentColor" strokeWidth={0} /> {u.likedSongs?.length || 0} Liked Music
                    </span>
                    {currentUser?.role === 'superadmin' && (
                      <span className="text-slate-400 font-bold text-[10px] flex items-center gap-1.5 mt-1">
                        <Clock size={11} /> Last Seen: {u.lastSeen ? new Date(u.lastSeen).toLocaleString() : 'Not Used'}
                      </span>
                    )}
                  </div>
                </td>

                <td className="py-6 px-6 bg-white/[0.02] border-y border-white/5 group-hover/row:border-vibe-primary/30 transition-colors duration-300">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-fit px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all duration-500 shadow-xl ${u.role === 'superadmin' ? 'bg-vibe-primary/10 text-vibe-primary border-vibe-primary/30' : u.role === 'admin' ? 'bg-vibe-primary/10 text-vibe-primary border-vibe-primary/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10'}`}>
                        {u.role === 'superadmin' ? 'Super Admin' : u.role === 'admin' ? 'Curator Admin' : 'User'}
                      </span>
                      {u.isVerified && (
                        <BadgeCheck size={18} className="text-[#1D9BF0] drop-shadow-[0_0_8px_rgba(29,155,240,0.3)] animate-in zoom-in duration-500" fill="currentColor" stroke="white" strokeWidth={1.5} />
                      )}
                    </div>
                    {u.deletionRequested && (
                      <div className="mt-2 flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/40 rounded-xl w-fit animate-pulse shadow-lg shadow-red-500/20">
                         <div className="w-2 h-2 rounded-full bg-red-500" />
                         <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Terminate Active</span>
                      </div>
                    )}
                  </div>
                </td>

                <td className="py-6 px-6 text-right last:rounded-r-[24px] bg-white/[0.02] border-y border-r border-white/5 group-hover/row:border-vibe-primary/30 transition-colors duration-300">
                  <div className="flex items-center justify-end gap-3">
                    {u.deletionRequested && title === 'user' && currentUser?.role === 'superadmin' && (
                      <button 
                        onClick={() => approveDeletion(u._id)} 
                        className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-[14px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-900/20 active:scale-95 transition-all"
                      >
                        Authorize Deletion
                      </button>
                    )}
                    <button 
                      onClick={() => handleToggleBlock(u._id, u.isBlocked)}
                      className={`p-3.5 rounded-2xl transition-all ${u.isBlocked ? 'bg-orange-500/20 text-orange-500 border border-orange-500/20 hover:bg-orange-500 hover:text-white' : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-vibe-primary hover:text-white'}`}
                      title={u.isBlocked ? "Unblock Account" : "Block Account"}
                    >
                      {u.isBlocked ? <Lock size={18} fill="currentColor" /> : <Unlock size={18} />}
                    </button>
                    <button 
                      onClick={() => handleUpdateName(u._id, u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim())} 
                      className="p-3.5 rounded-2xl bg-white/5 text-slate-400 border border-white/5 hover:bg-vibe-primary hover:text-white transition-all" 
                      title="Edit Identity"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button onClick={() => handleResetPassword(u._id)} className="p-3.5 rounded-2xl bg-vibe-primary/10 text-vibe-primary border border-vibe-primary/10 hover:bg-vibe-primary hover:text-white transition-all" title="Reset Key"><Key size={18} /></button>
                    <button 
                      onClick={() => removeUser(u._id)} 
                      className={`p-3.5 rounded-2xl transition-all ${currentUser?.role === 'superadmin' ? 'bg-red-500/10 text-red-500 border border-red-500/10 hover:bg-red-500 hover:text-white' : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed opacity-50'}`}
                      title={currentUser?.role === 'superadmin' ? "Terminate Account" : "Super Admin Privilege Required"}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {data.slice(0, title === 'admins' ? data.length : visibleCount).map(u => (
          <div key={u._id} className={`panel-soft p-6 border transition-all ${u.deletionRequested ? 'border-red-500/30 bg-red-500/5' : 'border-white/5'} space-y-6 rounded-[32px]`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-white text-base tracking-tight truncate mb-1">{u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()}</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-[10px] font-black tracking-widest uppercase ${u.role === 'admin' || u.role === 'superadmin' ? 'text-vibe-primary' : 'text-emerald-400'}`}>{u.role === 'superadmin' ? 'Super Admin' : u.role === 'admin' ? 'Curator Admin' : 'User'}</p>
                    {u.isVerified && <BadgeCheck size={14} className="text-[#1D9BF0]" fill="currentColor" stroke="white" strokeWidth={1} />}
                  </div>
                </div>
              </div>
              {u.deletionRequested && (
                <div className="px-3 py-1 bg-red-500 text-white text-[9px] font-black rounded-lg uppercase tracking-widest animate-pulse shadow-lg shadow-red-500/20">
                  Alert
                </div>
              )}
            </div>

            <div className="p-4 bg-white/5 rounded-2xl space-y-2 border border-white/5">
              <p className="text-[13px] text-slate-300 flex items-center gap-3 font-medium truncate"><Mail size={14} className="text-vibe-primary" /> {u.email} </p>
              {currentUser?.role === 'superadmin' && (
                <p className="text-[11px] text-slate-400 flex items-center gap-3 font-bold mt-2">
                  <Clock size={12} className="text-vibe-primary" /> Last Seen: {u.lastSeen ? new Date(u.lastSeen).toLocaleString() : 'Not Used'}
                </p>
              )}
            </div>

            {u.deletionRequested && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-1">Reason for Deletion</p>
                <p className="text-[12px] font-bold text-red-100/80 italic">"{u.deletionReason || "No justification provided"}"</p>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              {u.deletionRequested && currentUser?.role === 'superadmin' && (
                 <button
                   onClick={() => approveDeletion(u._id)}
                   className="w-full py-4 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-900/20"
                 >
                   Authorize Deletion
                 </button>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleUpdateName(u._id, u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim())}
                  className="flex-1 min-w-[100px] py-4 bg-white/5 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-white/5 active:scale-95 transition-all"
                >
                  Edit Name
                </button>
                <button
                  onClick={() => handleToggleBlock(u._id, u.isBlocked)}
                  className={`flex-1 min-w-[100px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border active:scale-95 transition-all flex items-center justify-center gap-2 ${u.isBlocked ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-white/5 text-slate-400 border-white/5'}`}
                >
                  {u.isBlocked ? <><Lock size={14} /> Unblock</> : <><Unlock size={14} /> Lock</>}
                </button>
                <button
                  onClick={() => handleResetPassword(u._id)}
                  className="flex-1 min-w-[100px] py-4 bg-vibe-primary/10 text-vibe-primary rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-vibe-primary/20 active:scale-95 transition-all"
                >
                  Key Swap
                </button>
                <button
                  onClick={() => removeUser(u._id)}
                  className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border active:scale-95 transition-all ${currentUser?.role === 'superadmin' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-white/5 text-white/20 border-white/5 opacity-50'}`}
                >
                  Terminate
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Using activeTab from props now to avoid sync issues with context

  return (
    <div className="space-y-8">
      {(currentTab === 'admins' || currentTab === 'users') && (
        <div className="relative mb-8 z-20">
          <div className="flex items-center gap-2 mb-3 ml-2">
             <Search className="text-vibe-primary" size={14} />
             <span className="text-[10px] font-black text-vibe-primary uppercase tracking-[0.3em]">Search Account</span>
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-muted/40 focus:outline-none focus:border-vibe-primary/40 focus:ring-1 focus:ring-vibe-primary/40 transition-all font-bold text-sm shadow-xl"
          />
        </div>
      )}

      {currentTab === 'admins' && currentUser?.role === 'superadmin' && (
        <form onSubmit={handleCreateAdmin} className="glass-card p-8 border-vibe-primary/20 bg-vibe-900 mb-10">
          <h3 className="text-xl font-bold text-hdr uppercase tracking-tighter flex items-center gap-3 mb-6">
            <ShieldCheck className="text-vibe-primary" size={24} />
            Initialize New Admin account
          </h3>
          {adminError && <div className="text-red-400 text-xs font-bold mb-4 bg-red-500/10 p-3 rounded-xl">{adminError}</div>}
          {adminSuccess && <div className="text-vibe-primary text-xs font-bold mb-4 bg-vibe-primary/10 p-3 rounded-xl">{adminSuccess}</div>}

          <div className="grid md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">Curator Name</label>
              <input required placeholder="Admin Name" value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} className="w-full panel-soft border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:ring-2 focus:ring-vibe-primary/40 outline-none transition-all font-bold text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">Admin Email</label>
              <input required type="email" placeholder="admin@terminal.sys" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} className="w-full panel-soft border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:ring-2 focus:ring-vibe-primary/40 outline-none transition-all font-bold text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">Security Key</label>
              <input required type="password" placeholder="••••••••" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} className="w-full panel-soft border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:ring-2 focus:ring-vibe-primary/40 outline-none transition-all font-bold text-sm" />
            </div>
            <button disabled={creatingAdmin} className="btn-hdr-orange py-3 px-6 h-[46px] w-full flex items-center justify-center text-xs uppercase tracking-widest shadow-xl">
              {creatingAdmin ? <Loader2 className="animate-spin" size={18} /> : <><Plus size={16} className="mr-2" /> Initialize</>}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-vibe-primary" size={40} /></div>
      ) : (
        <>
          {currentTab === 'admins' && currentUser?.role === 'superadmin' && (
            <UserTable data={adminUsers} title="admins" />
          )}
          {currentTab === 'users' && (
            <UserTable data={regularUsers} title="user" />
          )}
          
          {currentTab === 'users' && visibleCount < regularUsers.length && (
            <div ref={sentinelRef} className="h-6 flex items-center justify-center py-6 mt-4">
              {loadingMore && <Loader2 className="animate-spin text-vibe-primary" size={24} />}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const SongManagement = ({ 
  songs, loadingSongs, savingSong, songError, form, setForm, addSong, removeSong, 
  audioFile, setAudioFile, coverFile, setCoverFile, currentUser, loadSongs,
  duplicates, setDuplicates, loadingDuplicates, setLoadingDuplicates, 
  showDuplicateModal, setShowDuplicateModal 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(40);
  const [loadingMore, setLoadingMore] = useState(false);
  const songSentinelRef = useRef(null);
  const [uploadMode, setUploadMode] = useState('single'); // 'single' | 'batch'
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchProgress, setBatchProgress] = useState(null); // { current, total, status[] }
  const [batchDone, setBatchDone] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [skipExisting, setSkipExisting] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isResettingGraph, setIsResettingGraph] = useState(false);

  useEffect(() => {
    const el = songSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMore) {
        setLoadingMore(true);
        setTimeout(() => {
          setVisibleCount(prev => prev + 40);
          setLoadingMore(false);
        }, 1500);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadingMore, songs.length, searchTerm]);

  const parseName = (filename) => {
    const base = filename.replace(/\.[^/.]+$/, '');
    if (base.includes(' - ')) { const [a, t] = base.split(' - '); return { artist: a.trim(), title: t.trim() }; }
    if (base.includes(' -'))  { const [a, t] = base.split(' -');  return { artist: a.trim(), title: t.trim() }; }
    if (base.includes('-'))   { const [a, t] = base.split('-');   return { artist: a.trim(), title: t.trim() }; }
    return { artist: '', title: base };
  };

  // Read ID3 tags + cover art + duration for a single file
  const readFileMeta = (file) => new Promise((resolve) => {
    const { artist: fnArtist, title: fnTitle } = parseName(file.name);
    let meta = { title: fnTitle, artist: fnArtist, album: 'Single', duration: '', coverBlob: null };

    // Duration extraction with Promise
    const getDuration = () => new Promise((res) => {
      const audioEl = new Audio();
      const url = URL.createObjectURL(file);
      audioEl.src = url;
      audioEl.onloadedmetadata = () => {
        const m = Math.floor(audioEl.duration / 60);
        const s = Math.floor(audioEl.duration % 60).toString().padStart(2, '0');
        meta.duration = `${m}:${s}`;
        URL.revokeObjectURL(url);
        res();
      };
      audioEl.onerror = () => { URL.revokeObjectURL(url); res(); };
      // Safety timeout for duration
      setTimeout(() => { try { URL.revokeObjectURL(url); } catch(e){} res(); }, 4000);
    });

    // Tag & Cover extraction with Promise
    const getTags = () => new Promise((res) => {
      if (!window.jsmediatags) return res();
      
      window.jsmediatags.read(file, {
        onSuccess: (tag) => {
          const { title, artist, album, picture } = tag.tags;
          if (title)  meta.title  = title.trim();
          if (artist) meta.artist = artist.trim();
          if (album)  meta.album  = album.trim();

          if (picture) {
            try {
              const { data, format } = picture;
              const byteArray = new Uint8Array(data);
              const blob = new Blob([byteArray], { type: format });
              meta.coverBlob = new File([blob], 'cover.jpg', { type: format });
            } catch (err) {
              console.error("Cover extraction failed:", err);
            }
          }
          res();
        },
        onError: (err) => {
          console.warn("JSMediaTags skip:", file.name, err);
          res();
        }
      });
      // Safety timeout for tags
      setTimeout(() => res(), 8000);
    });

    Promise.all([getDuration(), getTags()]).then(() => resolve(meta));
  });

  const handleBatchSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setBatchDone(false);
    setBatchProgress(null);
    setIsEnriching(true);

    // 1. Initial Quick Load (Filenames)
    const preliminary = files.map((file, idx) => {
      const { artist, title } = parseName(file.name);
      return { id: idx, file, title, artist, album: 'Single', duration: '', coverBlob: null, status: 'pending' };
    });
    setBatchFiles(preliminary);

    // 2. Deep Enrichment (Meta & Covers)
    try {
      const enriched = await Promise.all(
        files.map(async (file, idx) => {
          const meta = await readFileMeta(file);
          return { id: idx, file, ...meta, status: 'pending' };
        })
      );
      setBatchFiles(enriched);
    } catch (err) {
      console.error("Batch enrichment failed:", err);
    } finally {
      setIsEnriching(false);
    }
  };

  const updateBatchItem = (id, field, value) => {
    setBatchFiles(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeBatchItem = (id) => {
    setBatchFiles(prev => prev.filter(item => item.id !== id));
  };

  const handleBatchUpload = async () => {
    if (batchFiles.length === 0) return;
    const total = batchFiles.length;
    const statusArr = batchFiles.map(() => 'pending');
    setBatchProgress({ current: 0, total, statuses: statusArr });
    setBatchDone(false);

    for (let i = 0; i < batchFiles.length; i++) {
      const item = batchFiles[i];
      try {
        const fd = new FormData();
        fd.append('title',    item.title  || item.file.name);
        fd.append('artist',   item.artist || 'Unknown');
        fd.append('album',    item.album  || 'Single');
        fd.append('duration', item.duration || '');
        fd.append('audio',    item.file);
        if (item.coverBlob) fd.append('cover', item.coverBlob);

        await api.post('/songs', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        statusArr[i] = 'success';
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed';
        if (skipExisting && (msg.includes('exists') || msg.includes('duplicate'))) {
          statusArr[i] = 'skipped';
        } else {
          statusArr[i] = msg;
        }
      }
      setBatchProgress({ current: i + 1, total, statuses: [...statusArr] });
    }
    setBatchDone(true);
    if (loadSongs) await loadSongs();
    setTimeout(() => {
      setBatchFiles([]);
      setBatchProgress(null);
      setBatchDone(false);
    }, 3000);
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAllVisible = () => {
    const visibleIds = visibleSongs.map(s => s._id || s.id);
    const allVisibleSelected = visibleIds.every(id => selectedIds.includes(id));
    if (allVisibleSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`AUTHORIZED PROTOCOL: Confirm permanent termination of ${selectedIds.length} song items?`)) return;
    const authPass = window.prompt("Terminal Wipe Security: Type 'CONFIRM' to authorize this mass deletion.");
    if (authPass !== 'CONFIRM') {
      alert("Authorization failed. Terminal Wipe aborted.");
      return;
    }
    setIsBulkDeleting(true);
    try {
      await api.delete('/songs/bulk', { data: { ids: selectedIds } });
      setSelectedIds([]);
      if (loadSongs) await loadSongs();
    } catch (err) {
      alert(err.response?.data?.message || "Bulk deletion failed.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkDownload = async () => {
    const selectedSongs = songs.filter(s => selectedIds.includes(s._id || s.id));
    for (const song of selectedSongs) {
      try {
        const url = song.fileUrl?.startsWith('/uploads') ? `${API_BASE_URL}${song.fileUrl}` : song.fileUrl;
        
        // Use fetch to get the file as a blob which bypasses browser's "play instead of download" behavior
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        // Ensure some extension is present if missing
        const filename = `${song.title} - ${song.artist}`.replace(/[/\\?%*:|"<>]/g, '');
        link.download = filename.toLowerCase().endsWith('.mp3') ? filename : `${filename}.mp3`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        window.URL.revokeObjectURL(blobUrl);
        
        // Small delay to prevent browser from blocking multiple downloads or overwhelming the network
        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        console.error(`Download failed for song ${song.title}:`, err);
      }
    }
    setSelectedIds([]);
  };

  const filteredSongs = songs.filter(s =>
    s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.album?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset visible count when search changes
  const handleSearch = (val) => { setSearchTerm(val); setVisibleCount(30); };
  const visibleSongs = filteredSongs.slice(0, visibleCount);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
      {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
        <div className="glass-card p-4 sm:p-8 space-y-6">
          {/* Mode Toggle */}
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-6 bg-vibe-primary rounded-full shadow-xl" />
            <h3 className="text-lg md:text-xl font-bold text-hdr uppercase tracking-tighter flex-1">Initialize Song Item</h3>
            <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setUploadMode('single')}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${uploadMode === 'single' ? 'bg-vibe-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >Single</button>
              <button
                onClick={() => setUploadMode('batch')}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${uploadMode === 'batch' ? 'bg-vibe-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >Batch</button>
            </div>
            {uploadMode === 'batch' && (
              <div 
                onClick={() => setSkipExisting(!skipExisting)}
                className="flex items-center gap-2 cursor-pointer group ml-auto"
              >
                <div className={`w-8 h-4 rounded-full transition-all relative ${skipExisting ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${skipExisting ? 'left-4.5' : 'left-0.5'}`} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300">Skip Existing</span>
              </div>
            )}
          </div>

          {/* ── SINGLE UPLOAD ── */}
          {uploadMode === 'single' && (
            <form onSubmit={addSong} className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">Metadata</label>
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="panel-soft border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:ring-2 focus:ring-vibe-primary/40 outline-none transition-all font-bold" />
                  <input required placeholder="Artist" value={form.artist} onChange={(e) => setForm((f) => ({ ...f, artist: e.target.value }))} className="panel-soft border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:ring-2 focus:ring-vibe-primary/40 outline-none transition-all font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">Album / Tempo</label>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Album" value={form.album} onChange={(e) => setForm((f) => ({ ...f, album: e.target.value }))} className="panel-soft border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:ring-2 focus:ring-vibe-primary/40 outline-none transition-all font-bold" />
                  <input placeholder="Duration (e.g. 3:45)" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} className="panel-soft border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:ring-2 focus:ring-vibe-primary/40 outline-none transition-all font-bold" />
                </div>
              </div>

              <div className="space-y-3 md:col-span-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">Audio Master</label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="relative group">
                    <input
                      type="file" accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setAudioFile(file);
                          const audio = new Audio();
                          audio.src = URL.createObjectURL(file);
                          audio.onloadedmetadata = () => {
                            const m = Math.floor(audio.duration / 60);
                            const s = Math.floor(audio.duration % 60).toString().padStart(2, '0');
                            setForm(f => ({ ...f, duration: `${m}:${s}` }));
                            URL.revokeObjectURL(audio.src);
                          };
                          const cleanName = file.name.replace(/\.[^/.]+$/, "");
                          if (cleanName.includes(" - ")) { const [art, tit] = cleanName.split(" - "); setForm(f => ({ ...f, artist: art.trim(), title: tit.trim() })); }
                          else if (cleanName.includes("-")) { const [art, tit] = cleanName.split("-"); setForm(f => ({ ...f, artist: art.trim(), title: tit.trim() })); }
                          else { setForm(f => ({ ...f, title: cleanName })); }
                          if (window.jsmediatags) {
                            window.jsmediatags.read(file, { onSuccess: (tag) => {
                              const { title, artist, album, picture } = tag.tags;
                              setForm(f => ({ ...f, title: title || f.title, artist: artist || f.artist, album: album || f.album }));
                              if (picture) {
                                try {
                                  const { data, format } = picture;
                                  const byteArray = new Uint8Array(data);
                                  const blob = new Blob([byteArray], { type: format });
                                  setCoverFile(new File([blob], "embedded-cover.jpg", { type: format }));
                                } catch (err) {
                                  console.error("Single cover extraction failed:", err);
                                }
                              }
                            }});
                          }
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`panel-soft border border-dashed ${audioFile ? 'border-vibe-primary bg-vibe-primary/5' : 'border-white/20'} rounded-xl px-4 py-3 text-center transition-all group-hover:border-vibe-primary/60`}>
                      <span className="text-sm font-bold text-slate-400 group-hover:text-vibe-primary">{audioFile ? `✓ ${audioFile.name}` : 'Local File Upload (+)'}</span>
                    </div>
                  </div>
                  <input placeholder="...or Global Audio Link" value={form.fileUrl} onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))} className="panel-soft border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:ring-2 focus:ring-vibe-primary/40 outline-none transition-all font-bold" />
                </div>
              </div>

              <div className="space-y-3 md:col-span-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">Visual Cover</label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="relative group">
                    <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className={`panel-soft border border-dashed ${coverFile ? 'border-vibe-primary bg-vibe-primary/5' : 'border-white/20'} rounded-xl px-4 py-3 text-center transition-all group-hover:border-vibe-primary/60`}>
                      <span className="text-sm font-bold text-slate-400 group-hover:text-vibe-primary">{coverFile ? `✓ ${coverFile.name}` : 'Local Image Upload (+)'}</span>
                    </div>
                  </div>
                  <input placeholder="...or Cover Image URL" value={form.coverImageUrl} onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))} className="panel-soft border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:ring-2 focus:ring-vibe-primary/40 outline-none transition-all font-bold" />
                </div>
              </div>

              <div className="md:col-span-2 flex justify-center pt-2">
                <button disabled={savingSong} className="btn-hdr-orange px-10 py-4 shadow-xl">
                  {savingSong ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} strokeWidth={3} />}
                  <span className="font-black text-xs">Sync To Library</span>
                </button>
              </div>
              {songError && <p className="text-red-400 text-xs font-bold md:col-span-2 animate-pulse">{songError}</p>}
            </form>
          )}

          {/* ── BATCH UPLOAD ── */}
          {uploadMode === 'batch' && (
            <div className="space-y-6">
              {/* Drop Zone */}
              <div className="relative group">
                <input
                  type="file" accept="audio/*" multiple
                  onChange={handleBatchSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`border-2 border-dashed ${isEnriching ? 'border-vibe-primary/50 bg-vibe-primary/10 animate-pulse' : 'border-vibe-primary/30 hover:border-vibe-primary/70 bg-vibe-primary/5'} rounded-2xl py-12 text-center transition-all group-hover:bg-vibe-primary/10`}>
                  <div className="text-4xl mb-3">{isEnriching ? '⚡' : '🎵'}</div>
                  <p className="text-vibe-primary font-black text-sm uppercase tracking-widest">{isEnriching ? 'Extracting Metadata...' : 'Drop Multiple Songs Here'}</p>
                  <p className="text-slate-500 text-xs mt-1">{isEnriching ? 'Decoding audio streams and extracting covers...' : 'Click to select — All audio formats supported'}</p>
                </div>
              </div>

              {/* File Cards */}
              {batchFiles.length > 0 && (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-vibe-primary uppercase tracking-widest">{batchFiles.length} Songs Queued</span>
                    {!batchProgress && <button onClick={() => setBatchFiles([])} className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-widest">Clear All</button>}
                  </div>
                  {batchFiles.map((item) => {
                    const st = batchProgress?.statuses?.[item.id];
                    return (
                      <div key={item.id} className={`panel-soft border rounded-xl p-3 flex items-center gap-3 transition-all ${st === 'success' ? 'border-emerald-500/30 bg-emerald-500/5' : st && st !== 'pending' ? 'border-red-500/30 bg-red-500/5' : 'border-white/10'}`}>
                        {/* Status indicator */}
                        <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg bg-white/5">
                          {!st || st === 'pending'
                            ? <Music size={13} className="text-vibe-primary" />
                            : st === 'success'
                            ? <CheckCircle size={13} className="text-emerald-400" />
                            : <span className="text-red-400 text-[10px]">✗</span>
                          }
                        </div>
                        <div className="flex-1 grid grid-cols-3 gap-2 min-w-0">
                          <input
                            value={item.title}
                            onChange={e => updateBatchItem(item.id, 'title', e.target.value)}
                            disabled={!!batchProgress}
                            placeholder="Title"
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-vibe-primary/50 disabled:opacity-50"
                          />
                          <input
                            value={item.artist}
                            onChange={e => updateBatchItem(item.id, 'artist', e.target.value)}
                            disabled={!!batchProgress}
                            placeholder="Artist"
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-vibe-primary/50 disabled:opacity-50"
                          />
                          <input
                            value={item.album}
                            onChange={e => updateBatchItem(item.id, 'album', e.target.value)}
                            disabled={!!batchProgress}
                            placeholder="Album"
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-vibe-primary/50 disabled:opacity-50"
                          />
                        </div>
                        {st && st !== 'pending' && st !== 'success' && (
                          <span className="text-[8px] text-red-400 font-bold max-w-[80px] truncate" title={st}>{st}</span>
                        )}
                        {!batchProgress && (
                          <button onClick={() => removeBatchItem(item.id)} className="w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-300 flex-shrink-0">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Progress Bar */}
              {batchProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-muted">
                    <span className="uppercase tracking-widest">Uploading...</span>
                    <span className="text-vibe-primary">{batchProgress.current} / {batchProgress.total}</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-vibe-primary rounded-full transition-all duration-500"
                      style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Result Summary */}
              {batchDone && batchProgress && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-emerald-400 font-black text-sm">Batch Upload Complete!</p>
                    <p className="text-slate-400 text-[11px]">
                      {batchProgress.statuses.filter(s => s === 'success').length} succeeded ·{' '}
                      {batchProgress.statuses.filter(s => s !== 'success' && s !== 'pending').length} failed
                    </p>
                  </div>
                  <button onClick={() => { setBatchFiles([]); setBatchProgress(null); setBatchDone(false); }} className="ml-auto text-[10px] text-vibe-primary font-black uppercase tracking-widest hover:underline">Reset</button>
                </div>
              )}

              {/* Upload Button */}
              {batchFiles.length > 0 && !batchDone && (
                <div className="flex justify-center">
                  <button
                    onClick={handleBatchUpload}
                    disabled={!!batchProgress || isEnriching}
                    className="flex items-center gap-3 btn-hdr-orange px-10 py-4 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {batchProgress || isEnriching ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} strokeWidth={3} />}
                    <span className="font-black text-xs">
                      {isEnriching ? 'Analyzing Files...' : batchProgress ? 'Uploading...' : `Upload ${batchFiles.length} Songs`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="glass-card p-3 sm:p-10">
        <div className="flex items-center justify-between mb-12 flex-wrap gap-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-3xl font-bold text-hdr tracking-tight uppercase">System Library</h3>
            <span className="text-sm bg-vibe-primary/10 text-vibe-primary px-4 py-1.5 rounded-xl font-bold">{filteredSongs.length} Tracks</span>
            


            {(() => {
               // Parse "3:45" or "3:45:00" duration string → seconds
               const parseDur = (d) => {
                 if (!d) return 0;
                 if (typeof d === 'number') return d;
                 const parts = String(d).split(':').map(Number);
                 if (parts.length === 3) return (parts[0]||0)*3600 + (parts[1]||0)*60 + (parts[2]||0);
                 if (parts.length === 2) return (parts[0]||0)*60 + (parts[1]||0);
                 return parseFloat(d) || 0;
               };
               // Per-song: use actual fileSize if available, else estimate @ 205kbps Avg (closer to actual VBR/HQ uploads)
               const totalBytes = songs.reduce((acc, s) => {
                 if (s.fileSize > 0) return acc + s.fileSize;
                 return acc + parseDur(s.duration) * (205 * 1000 / 8);
               }, 0);
               const trackedCount = songs.filter(s => s.fileSize > 0).length;
               const totalGB = totalBytes / (1024 ** 3);
               const totalMB = totalBytes / (1024 ** 2);
               const display = totalGB >= 1
                 ? `${totalGB.toFixed(2)} GB`
                 : totalMB >= 1
                 ? `${totalMB.toFixed(1)} MB`
                 : `${(totalBytes / 1024).toFixed(0)} KB`;
               const tooltipText = trackedCount === songs.length
                 ? `Exact size for all ${songs.length} tracks`
                 : `${trackedCount} exact · ${songs.length - trackedCount} estimated @205kbps (Mixed HQ)`;
               return (
                 <span className="text-sm bg-orange-500/10 text-orange-400 border border-orange-500/20 px-4 py-1.5 rounded-xl font-bold flex items-center gap-1.5" title={tooltipText}>
                   <span className="text-[9px] opacity-60 uppercase tracking-widest">Storage Use</span> {display}
                 </span>
               );
             })()}

            {currentUser?.role === 'superadmin' && (
              <button 
                onClick={async () => {
                  if (!window.confirm("AUTHORIZED ACTION: Reset all platform playback metrics? This will clear all data on the consumption graph.")) return;
                  setIsResettingGraph(true);
                  try {
                    await api.put('/songs/reset-graph');
                    await loadSongs(); // Refresh data to see Reset graph
                    alert('Diagnostic clusters reset. Consumption graph cleared.');
                  } catch (err) {
                    alert('System Error: Metric reset protocol failed.');
                  } finally {
                    setIsResettingGraph(false);
                  }
                }}
                disabled={isResettingGraph}
                className="text-[10px] font-black bg-white/5 text-slate-400 border border-white/10 px-4 py-2 rounded-xl hover:bg-vibe-primary hover:text-white transition-all flex items-center gap-2 uppercase tracking-widest group"
              >
                {isResettingGraph ? <Loader2 className="animate-spin" size={12} /> : <Zap size={12} className="group-hover:scale-125 transition-transform" />}
                Reset Graph
              </button>
            )}
          </div>

          <div className="relative group w-full md:w-80">
            <div className="flex items-center gap-2 mb-3 ml-2">
               <Search className="text-vibe-primary" size={14} />
               <span className="text-[10px] font-black text-vibe-primary uppercase tracking-[0.3em]">Search Library</span>
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-hdr focus:outline-none focus:ring-2 focus:ring-vibe-primary/40 font-bold tracking-tight shadow-inner hover:bg-white/10 transition-all"
            />
          </div>
        </div>

        {loadingSongs ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-vibe-primary" size={40} /></div>
        ) : filteredSongs.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-muted font-bold uppercase tracking-widest opacity-50">No matching tracks found</p>
          </div>
        ) : (
          <>
            {currentUser?.role === 'superadmin' && (
              <div className="flex items-center gap-3 mb-6 ml-2">
                <button
                  onClick={selectAllVisible}
                  className="text-[10px] font-black text-vibe-primary uppercase tracking-widest border border-vibe-primary/20 px-4 py-2 rounded-xl bg-vibe-primary/5 hover:bg-vibe-primary hover:text-white transition-all active:scale-95"
                >
                  {visibleSongs.every(s => selectedIds.includes(s._id || s.id)) ? 'Deselect All' : 'Select All Visible'}
                </button>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleSongs.map((song) => {
                const songId = song._id || song.id;
                const isSelected = selectedIds.includes(songId);
                const fullCoverUrl = song.coverImageUrl?.startsWith('/uploads') ? `${API_BASE_URL}${song.coverImageUrl}` : (song.coverImageUrl || 'https://via.placeholder.com/300');

                return (
                  <div key={songId} className={`panel-soft border ${isSelected ? 'border-vibe-primary bg-vibe-primary/5' : 'border-white/5'} rounded-2xl p-2 sm:p-4 grid ${currentUser?.role === 'superadmin' ? 'grid-cols-[30px_48px_1fr_40px]' : 'grid-cols-[48px_1fr_40px]'} items-center gap-2 sm:gap-4 group hover:border-vibe-primary/40 transition-all shadow-md overflow-hidden w-full relative`}>
                    {/* Checkbox */}
                    {currentUser?.role === 'superadmin' && (
                      <div
                        onClick={() => toggleSelection(songId)}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${isSelected ? 'bg-vibe-primary border-vibe-primary shadow-[0_0_10px_rgba(0,229,255,0.4)]' : 'bg-white/5 border-white/20 hover:border-vibe-primary/60'}`}
                      >
                        {isSelected && <CheckCircle size={12} className="text-white" />}
                      </div>
                    )}

                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-vibe-950 rounded-xl flex-shrink-0 bg-cover bg-center shadow-lg border border-white/5" style={{ backgroundImage: `url(${fullCoverUrl})` }} />
                    <div className="min-w-0 flex flex-col justify-center">
                      <p className="font-bold text-hdr text-xs sm:text-[15px] truncate tracking-tight">{song.title}</p>
                      <p className="text-[9px] sm:text-[10px] font-bold text-muted uppercase tracking-[0.2em] opacity-40 truncate">{song.artist}</p>
                    </div>
                    <button
                      onClick={() => removeSong(songId)}
                      className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95 border border-red-500/10 group-hover:bg-red-500 group-hover:text-white"
                      title="Remove Item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Floating Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom flex items-center gap-4 bg-vibe-950/90 backdrop-blur-2xl border border-vibe-primary/30 px-6 py-4 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-b-vibe-primary">
            <div className="flex items-center gap-3 pr-4 border-r border-white/10 text-white">
              <span className="text-lg font-black italic">{selectedIds.length}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Items Targeted</span>
            </div>

            <div className="flex items-center gap-3">
              {(currentUser?.role === 'superadmin' || currentUser?.email === 'user@vibecom') && (
                <button
                  onClick={handleBulkDownload}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white/5 text-white hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all active:scale-95 group"
                >
                  <Download size={14} className="group-hover:translate-y-0.5 transition-transform" /> Download
                </button>
              )}

              {currentUser?.role === 'superadmin' && (
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/10 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isBulkDeleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />} Terminal Wipe
                </button>
              )}

              <button
                onClick={() => setSelectedIds([])}
                className="p-2.5 text-slate-500 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Auto-Load Sentinel for Songs */}
        {filteredSongs.length > visibleCount && (
          <div ref={songSentinelRef} className="flex flex-col items-center gap-3 mt-8 py-6">
            {loadingMore ? (
              <>
                <Loader2 className="animate-spin text-vibe-primary" size={32} strokeWidth={2.5} />
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest animate-pulse">Loading more tracks…</p>
              </>
            ) : (
              <div className="h-6" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DuplicateModal = ({ show, onClose, duplicates, removeSong }) => {
  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-2xl animate-in fade-in duration-500" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-32px)] sm:w-[800px] max-h-[85vh] z-[120] animate-in zoom-in-95 fade-in duration-500 flex flex-col">
        <div className="bg-[#0C0C0E] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,1)] rounded-[40px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-8 border-b border-white/5 bg-gradient-to-b from-vibe-primary/10 to-transparent flex flex-col items-center text-center relative">
            <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-muted hover:text-white transition-all">
              <Plus className="rotate-45" size={24} />
            </button>
            <div className="w-16 h-16 bg-vibe-primary/20 rounded-3xl flex items-center justify-center text-vibe-primary mb-4 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
              <Trash2 size={32} />
            </div>
            <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">Deduplication Cluster</h4>
            <p className="text-[10px] font-black text-vibe-primary/60 uppercase tracking-[0.4em]">Identify & Purge Redundant Nodes</p>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            {duplicates.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center opacity-40">
                <CheckCircle size={48} className="text-vibe-primary mb-4" />
                <p className="text-xs font-black uppercase tracking-widest text-white italic">No duplicate nodes detected in local storage.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {duplicates.map((dup, i) => (
                  <div key={i} className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                      <span className="text-[10px] font-black text-vibe-primary uppercase tracking-[0.2em]">{dup.type}</span>
                      <div className="flex-1 h-[1px] bg-white/5" />
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Original */}
                      <div className="panel-soft p-4 border border-vibe-primary/20 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 px-3 py-1 bg-vibe-primary/10 text-vibe-primary text-[8px] font-black rounded-bl-xl uppercase">Keep Main</div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-vibe-900 bg-cover bg-center border border-white/5" style={{ backgroundImage: `url(${dup.original.coverImageUrl?.startsWith('/uploads') ? API_BASE_URL + dup.original.coverImageUrl : (dup.original.coverImageUrl || '')})` }} />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-white truncate">{dup.original.title}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase truncate">{dup.original.artist}</p>
                          </div>
                        </div>
                      </div>

                      {/* Duplicate */}
                      <div className="panel-soft p-4 border border-red-500/20 bg-red-500/5 rounded-3xl group/dup relative overflow-hidden">
                        <div className="absolute top-0 right-0 px-3 py-1 bg-red-500/10 text-red-500 text-[8px] font-black rounded-bl-xl uppercase">Redundant</div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-vibe-900 bg-cover bg-center border border-white/5 grayscale" style={{ backgroundImage: `url(${dup.duplicate.coverImageUrl?.startsWith('/uploads') ? API_BASE_URL + dup.duplicate.coverImageUrl : (dup.duplicate.coverImageUrl || '')})` }} />
                            <div className="min-w-0">
                              <p className="text-xs font-black text-white/60 truncate italic">{dup.duplicate.title}</p>
                              <p className="text-[9px] font-bold text-slate-700 uppercase truncate">{dup.duplicate.artist}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeSong(dup.duplicate._id)}
                            className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-900/40 active:scale-95 transition-transform"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-white/5 flex justify-center">
            <button onClick={onClose} className="px-10 py-3 bg-white/5 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10">Synchronized</button>
          </div>
        </div>
      </div>
    </>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { activeAdminTab: activeTabFromCtx, setActiveAdminTab: setActiveTab } = useSidebar();
  const { user, logout, historyTracks, updateUserProfile, loading: authLoading } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urlTab = searchParams.get('tab');
  // Use URL tab immediately to prevent black screen flash. 
  const activeTab = urlTab || 'users';

  const [visitorCount, setVisitorCount] = useState(0);

  const fetchVisitorCount = async () => {
    try {
      const { data } = await api.get('/counter/visitor');
      setVisitorCount(data?.count || 0);
    } catch (err) {
      console.error('Failed to fetch visitor count:', err);
    }
  };



  const [songs, setSongs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingSong, setSavingSong] = useState(false);
  const [songError, setSongError] = useState('');
  const [form, setForm] = useState({
    title: '',
    artist: '',
    album: '',
    duration: '',
    fileUrl: '',
    coverImageUrl: '',
  });

  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  
  const [duplicates, setDuplicates] = useState([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const [visibleActivityCount, setVisibleActivityCount] = useState(40);
  const [loadingMoreActivity, setLoadingMoreActivity] = useState(false);
  const activitySentinelRef = useRef(null);

  useEffect(() => {
    const el = activitySentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMoreActivity) {
        setLoadingMoreActivity(true);
        setTimeout(() => {
          setVisibleActivityCount(prev => prev + 40);
          setLoadingMoreActivity(false);
        }, 1500);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadingMoreActivity, activeTab, songs.length]);

  const handleProfileUpload = async (e, type) => {
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

  const handleProfileRemove = async (type) => {
    if (!window.confirm(`Clear your ${type === 'profileImg' ? 'Identity Icon' : 'Network Banner'}?`)) return;
    setUploading(true);
    const formData = new FormData();
    if (type === 'profileImg') formData.append('removeProfileImg', 'true');
    else formData.append('removeBannerImg', 'true');
    try {
      await updateUserProfile(formData);
    } catch (err) {
      console.error("Removal failed", err);
    } finally {
      setUploading(false);
    }
  };

  const convertToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    if (typeof timeStr === 'number') return timeStr;
    if (!timeStr.includes(':')) return parseInt(timeStr) || 0;
    const [mins, secs] = timeStr.split(':').map(Number);
    return (mins * 60) + (secs || 0);
  };

  const loadSongs = async () => {
    setLoadingSongs(true);
    try {
      const { data } = await api.get('/songs');
      setSongs(Array.isArray(data) ? data : []);
    } catch {
      setSongs([]);
    } finally {
      setLoadingSongs(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await api.get('/auth/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchVisitorCount();
    loadSongs();
    loadUsers();
  }, []);

  // Sync URL tab back to context for Sidebar active state highlighting
  useEffect(() => {
    if (urlTab && urlTab !== activeTabFromCtx) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const addSong = async (e) => {
    e.preventDefault();
    setSongError('');
    setSavingSong(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('artist', form.artist);
      formData.append('album', form.album);
      formData.append('duration', convertToSeconds(form.duration));

      if (audioFile) formData.append('audio', audioFile);
      else formData.append('fileUrl', form.fileUrl);

      if (coverFile) formData.append('cover', coverFile);
      else formData.append('coverImageUrl', form.coverImageUrl);

      await api.post('/songs', formData);

      setForm({ title: '', artist: '', album: '', duration: '', fileUrl: '', coverImageUrl: '' });
      setAudioFile(null);
      setCoverFile(null);
      await loadSongs();
    } catch (err) {
      setSongError(err.response?.data?.message || 'Unable to add song.');
    } finally {
      setSavingSong(false);
    }
  };

  const removeSong = async (id) => {
    if (window.confirm("Remove this song from the library?")) {
      try {
        await api.delete(`/songs/${id}`);
        setSongs((prev) => prev.filter((song) => (song._id || song.id) !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Unable to delete song.');
      }
    }
  };

  const removeUser = async (id) => {
    const targetUser = users.find(u => u._id === id);
    if (user?.role !== 'superadmin' && user?.email !== 'user@vibecom') {
      alert("Terminal Authorization Denied: Only the Super Admin can execute account termination.");
      return;
    }

    if (window.confirm(`Are you sure you want to permanently terminate this account (${targetUser?.email})?`)) {
      try {
        await api.delete(`/auth/users/${id}`);
        setUsers((prev) => prev.filter((user) => user._id !== id));
      } catch (err) {
        alert(err.response?.data?.message || "Failed to remove user");
      }
    }
  };

  const approveDeletion = async (id) => {
    if (user?.role !== 'superadmin' && user?.email !== 'user@vibecom') {
      alert("Authorization Required: Super Admin clearance needed.");
      return;
    }
    if (window.confirm("Approve account deletion? This will permanently remove the user.")) {
      try {
        await api.post(`/auth/approve-deletion/${id}`);
        setUsers((prev) => prev.filter((u) => u._id !== id));
      } catch (err) {
        alert(err.response?.data?.message || "Failed to approve deletion");
      }
    }
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 17) return 'Good Afternoon';
    return 'Good Evening';
  };
  const greeting = getGreeting();

  return (
    <MainLayout>
      <div className="duration-300">


        <div className="z-10 mt-6 sm:mt-0">
          {(['users', 'admins', 'songs', 'analytics', 'activity'].includes(activeTab)) && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-6 py-4 px-2 border-b border-white/5 pb-10 relative">
              {['users', 'admins'].includes(activeTab) && (
                <div className="flex items-center gap-4">
                  {/* Fantastic Deletion Requests Icon */}
                  <div className="relative group">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className={`p-2.5 rounded-[18px] transition-all duration-500 border ${users.filter(u => u.deletionRequested).length > 0 ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse' : 'bg-white/5 border-white/5 text-slate-500 opacity-40 hover:opacity-100 hover:text-white'}`}
                    >
                      <Bell size={18} strokeWidth={2.5} />
                      {users.filter(u => u.deletionRequested).length > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-[9px] font-black text-white shadow-lg">{users.filter(u => u.deletionRequested).length}</span>
                        </span>
                      )}
                    </button>

                    {/* Notification Dropdown Panel */}
                    {showNotifications && (
                      <>
                        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md transition-all duration-500" onClick={() => setShowNotifications(false)} />
                        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-32px)] sm:w-[500px] z-[70] animate-in zoom-in-95 fade-in duration-500">
                          <div className="bg-[#0C0C0E]/95 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,1)] backdrop-blur-3xl rounded-[40px] overflow-hidden">
                            {/* Header */}
                            <div className="p-10 border-b border-white/5 bg-gradient-to-b from-red-500/10 to-transparent flex flex-col items-center text-center relative">
                              <button 
                                onClick={() => setShowNotifications(false)} 
                                className="absolute top-6 right-6 w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-muted hover:text-white transition-all group/close"
                              >
                                <Plus className="rotate-45 group-hover:scale-110 transition-transform" size={24} />
                              </button>

                              <div className="w-16 h-16 bg-red-500/20 rounded-[22px] flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)] mb-6 animate-pulse">
                                <Trash2 size={32} />
                              </div>
                              
                              <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">Terminal Requests</h4>
                              <p className="text-[10px] font-black text-red-500/60 uppercase tracking-[0.4em]">Admin Deletion Sequences</p>
                            </div>

                            {/* Content - Removed internal scrolling as requested */}
                            <div className="p-4 sm:p-8">
                                {users.filter(u => u.deletionRequested).length === 0 ? (
                                  <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 opacity-20">
                                      <ShieldCheck size={32} />
                                    </div>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] italic">All accounts synchronized.</p>
                                  </div>
                                ) : (
                                  <div className="space-y-6">
                                      {users.filter(u => u.deletionRequested).map(reqUser => (
                                        <div key={reqUser._id} className="group/req relative bg-white/[0.03] hover:bg-white/[0.05] rounded-[32px] p-6 sm:p-8 border border-white/5 hover:border-red-500/30 transition-all duration-500 flex flex-col items-center text-center">
                                          
                                          <div className="space-y-1 mb-6 mt-4">
                                            <h5 className="text-lg font-black text-white uppercase italic tracking-tight">{reqUser.firstName ? `${reqUser.firstName} ${reqUser.lastName}` : (reqUser.name || "Unknown Identity")}</h5>
                                            <p className="text-[10px] font-bold text-muted opacity-40 uppercase tracking-widest">{reqUser.email}</p>
                                          </div>
                                          
                                          <div className="bg-red-500/5 rounded-[20px] p-5 border border-red-500/10 mb-6 w-full relative overflow-hidden group-hover/req:bg-red-500/10 transition-colors">
                                             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-red-500/20 rounded-full" />
                                             <p className="text-[8px] font-black text-red-500/60 uppercase tracking-[0.3em] mb-2">Security Justification</p>
                                             <p className="text-[12px] font-medium text-slate-300 leading-relaxed italic px-2 font-mono">
                                                "{reqUser.deletionReason || "No terminal justification provided."}"
                                             </p>
                                          </div>

                                          <button
                                            onClick={() => { approveDeletion(reqUser._id); setShowNotifications(false); }}
                                            className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(239,68,68,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group/btn"
                                          >
                                            <CheckCircle size={16} className="group-hover/btn:scale-125 transition-transform" />
                                            Authorize Revocation
                                          </button>
                                        </div>
                                      ))}
                                  </div>
                                )}
                            </div>

                            {/* Footer Security Badge */}
                            {users.filter(u => u.deletionRequested).length > 0 && (
                              <div className="p-6 bg-red-500/5 border-t border-white/5 flex items-center justify-center gap-3">
                                <div className="relative">
                                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping absolute inset-0" />
                                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 relative" />
                                </div>
                                <p className="text-[9px] font-black text-red-100 uppercase tracking-[0.15em] italic">
                                  Critical Operation: Level 7 Authorization Required
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'songs' && (
                <div className="space-y-1">
                  <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Sync Library</p>
                  <div className="flex items-center gap-3">
                    <p className="text-4xl font-black text-white italic">{songs.length}</p>
                    <div className="px-2 py-1 bg-white/5 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest">Tracks</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="z-10">
          {['users', 'admins'].includes(activeTab) && (
            <div className="flex flex-row md:flex-row gap-4 mb-6">
               <div className="glass-card bg-white/[0.02] border border-white/5 rounded-[32px] p-6 flex-1 flex flex-col justify-center shadow-xl relative overflow-hidden hover:border-vibe-primary/20 transition-all group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-vibe-primary/5 rounded-full blur-2xl -mr-12 -mt-12" />
                  <p className="text-[10px] items-center gap-2 font-black text-vibe-primary uppercase tracking-[0.3em] mb-2 opacity-50 flex overflow-hidden whitespace-nowrap"><Users size={12} /> Users</p>
                  <div className="flex items-center gap-2">
                    <span className="text-4xl font-black text-white tracking-tighter italic">{(users || []).filter(u => u.role === 'user' || !u.role).length}</span>
                    <span className="px-2 py-0.5 bg-vibe-primary/10 text-vibe-primary text-[8px] font-black rounded uppercase tracking-widest border border-vibe-primary/20">Active</span>
                  </div>
                </div>
                <div className="glass-card bg-white/[0.02] border border-white/5 rounded-[32px] p-6 flex-1 flex flex-col justify-center shadow-xl relative overflow-hidden hover:border-vibe-accent/20 transition-all group">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-vibe-accent/5 rounded-full blur-2xl -mr-12 -mt-12" />
                  <p className="text-[10px] items-center gap-2 font-black text-vibe-accent uppercase tracking-[0.3em] mb-2 opacity-50 flex overflow-hidden whitespace-nowrap"><ShieldCheck size={12} /> Admins</p>
                  <div className="flex items-center gap-2">
                    <span className="text-4xl font-black text-white tracking-tighter italic">{(users || []).filter(u => u.role === 'admin').length}</span>
                    <span className="px-2 py-0.5 bg-vibe-accent/10 text-vibe-accent text-[8px] font-black rounded uppercase tracking-widest border border-vibe-accent/20">Verified</span>
                  </div>
                </div>
            </div>
          )}

          {['users', 'admins'].includes(activeTab) ? (
            <UserManagement
              users={users}
              loading={loadingUsers}
              removeUser={removeUser}
              approveDeletion={approveDeletion}
              loadUsers={loadUsers}
              currentUser={{ ...user, role: user?.email === 'user@vibecom' ? 'superadmin' : user?.role }}
              activeTab={activeTab}
            />
          ) : (activeTab === 'analytics' || activeTab === 'analyst') ? (
            <div className="glass-card p-4 sm:p-10">
              
              {/* Hero Stats Section */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                <div className="panel-soft p-8 relative overflow-hidden group border border-vibe-primary/20">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-vibe-primary/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000" />
                  <p className="text-[10px] font-black text-vibe-primary uppercase tracking-[0.4em] mb-4">Visitor Signals</p>
                  <div className="flex items-end gap-3">
                    <h2 className="text-4xl font-black text-white tracking-tighter">{(visitorCount || 0).toLocaleString()}</h2>
                    <div className="mb-1.5 px-2 py-0.5 bg-vibe-primary/10 text-vibe-primary text-[8px] font-black rounded border border-vibe-primary/20 animate-pulse">LIVE</div>
                  </div>
                </div>

                <div className="panel-soft p-8 relative overflow-hidden group border border-vibe-accent/20">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-vibe-accent/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000" />
                  <p className="text-[10px] font-black text-vibe-accent uppercase tracking-[0.4em] mb-4">Active Admins</p>
                  <div className="flex items-end gap-3">
                    <h2 className="text-4xl font-black text-white tracking-tighter">{users.length}</h2>
                    <div className="mb-1.5 px-2 py-0.5 bg-vibe-accent/10 text-vibe-accent text-[8px] font-black rounded border border-vibe-accent/20">SYNCED</div>
                  </div>
                </div>

                <div className="panel-soft p-8 relative overflow-hidden group border border-white/10">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Media Objects</p>
                  <div className="flex items-end gap-3">
                    <h2 className="text-4xl font-black text-white tracking-tighter">{songs.length}</h2>
                    <div className="mb-1.5 px-2 py-0.5 bg-white/10 text-slate-400 text-[8px] font-black rounded border border-white/20">CLOUDINARY</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-10 pl-2">
                <div className="w-1.5 h-10 bg-vibe-primary rounded-full shadow-xl" />
                <div>
                  <h3 className="text-3xl font-bold tracking-tight text-hdr uppercase flex items-center gap-4">
                    Global Consumption Metrics
                  </h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mt-2 italic">Real-time synchronization depth and playback volume across cluster items.</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-[1fr_350px] gap-10">
                {/* Visual Data Layer */}
                <div className="bg-vibe-950/40 rounded-[32px] border border-white/5 p-5 sm:p-10 relative overflow-hidden group/graph">
                  {/* Dynamic Coordinate Grid */}
                  <div className="absolute inset-0 grid grid-cols-8 pointer-events-none opacity-[0.03]">
                    {[...Array(8)].map((_, i) => <div key={i} className="border-r border-vibe-primary" />)}
                  </div>

                          {songs.length === 0 ? (
                      <div className="py-20 text-center opacity-40 uppercase font-black tracking-widest text-xs italic">Awaiting synchronization data...</div>
                    ) : (
                      (() => {
                        const sortedSongs = [...songs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 10);
                        const maxPlays = songs.reduce((max, s) => Math.max(max, s.playCount || 0), 1);
                        return sortedSongs.map((song, i) => {
                          const percentage = ((song.playCount || 0) / maxPlays) * 100;
                          return (
                            <div key={song._id || song.id || i} className="group/bar relative">
                              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-3 px-1 gap-2">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="text-[9px] sm:text-[10px] font-black text-vibe-primary bg-vibe-primary/10 w-6 h-6 rounded flex-shrink-0 flex items-center justify-center italic">#{i + 1}</div>
                                  <p className="text-[10px] sm:text-[11px] font-black text-white uppercase italic tracking-widest truncate max-w-full">{song.title}</p>
                                </div>
                                <p className="text-[8px] sm:text-[9px] font-black text-muted uppercase tracking-widest whitespace-nowrap"><span className="text-vibe-primary">{song.playCount || 0}</span> Global Syncs</p>
                              </div>
                              <div className="h-4 sm:h-5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px] sm:p-[3px]">
                                <div
                                  className="h-full bg-gradient-to-r from-vibe-primary via-vibe-accent to-vibe-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(0,229,255,0.4)] group-hover/graph:opacity-80"
                                  style={{ width: `${Math.max(percentage, 3)}%` }}
                                />
                              </div>
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>

                {/* Metric Accumulators */}
                <div className="space-y-6">
                  <div className="glass-card p-6 sm:p-10 border-vibe-primary/20 bg-vibe-primary/5 hover:bg-vibe-primary/10 transition-colors group/stat">
                    <p className="text-[10px] font-black text-vibe-primary uppercase tracking-[0.3em] mb-4">Total Playback Cluster</p>
                    <h4 className="text-6xl font-black text-white italic drop-shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                      {(songs || []).reduce((acc, curr) => acc + (curr?.playCount || 0), 0)}
                    </h4>
                    <div className="mt-4 w-12 h-[1px] bg-vibe-primary group-hover:w-full transition-all duration-700 opacity-40" />
                  </div>

                  <div className="glass-card p-6 sm:p-10 border-white/10 bg-white/5 hover:border-vibe-accent/20 transition-all">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Prime Track</p>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-vibe-accent/20 flex items-center justify-center text-vibe-accent">
                        <Music size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-black text-white uppercase italic truncate">
                          {[...songs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0))[0]?.title || 'Standby'}
                        </p>
                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-40">Leaderboard Active</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-vibe-accent/10 border border-vibe-accent/20 rounded-[32px] relative overflow-hidden">
                    <Zap size={48} className="absolute -right-4 -bottom-4 text-vibe-accent/10 -rotate-12" />
                    <p className="text-[10px] font-black text-vibe-accent uppercase tracking-widest relative z-10">Sync Efficiency</p>
                    <p className="text-white text-lg font-bold mt-2 relative z-10 italic">99.8% Core Uptime</p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'recents' ? (
            <div className="glass-card p-4 sm:p-10 animate-in fade-in slide-in-from-bottom duration-700">
              <div className="flex items-center gap-4 mb-10 pl-2">
                <div className="w-1.5 h-10 bg-vibe-primary rounded-full shadow-xl" />
                <h3 className="text-3xl font-bold tracking-tight text-hdr uppercase">
                  Global Sync History <span className="text-sm bg-vibe-primary/10 text-vibe-primary px-3 py-1 rounded-lg ml-2 font-bold">
                    {loadingSongs ? <Loader2 className="animate-spin inline-block ml-2" size={14} /> : songs.length}
                  </span>
                </h3>
              </div>

              <div className="bg-white/3 rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5">
                {[...songs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((song, i) => (
                  <div key={song._id || i} className="panel-soft border border-white/10 p-4 sm:p-6 flex items-center justify-between group hover:border-vibe-primary/40 transition-all shadow-lg hover:bg-white/5">
                    <div className="flex gap-4 sm:gap-6 items-center overflow-hidden">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-vibe-900 rounded-xl flex-shrink-0 bg-cover bg-center shadow-lg border border-white/5" style={{ backgroundImage: `url(${song.coverImageUrl?.startsWith('/uploads') ? API_BASE_URL + song.coverImageUrl : (song.coverImageUrl || 'https://via.placeholder.com/300')})` }} />
                      <div className="overflow-hidden">
                        <p className="font-bold text-hdr text-base sm:text-lg truncate tracking-tight uppercase italic">{song.title}</p>
                        <p className="text-[9px] sm:text-[10px] font-black text-vibe-primary/60 uppercase tracking-widest mt-1 truncate">
                          Synced by: <span className="text-white italic">{song.createdBy?.name || 'VIBE Core'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="text-[10px] font-black text-muted uppercase tracking-widest opacity-80 flex items-center gap-2">
                        <Clock size={12} className="text-vibe-primary" /> {new Date(song.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                        {new Date(song.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'activity' ? (
            <div className="glass-card p-4 sm:p-10">
              {/* Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-8 bg-vibe-primary rounded-full shadow-xl" />
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tighter">Admin Activity Log</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Kaun sa song — kaun se admin ne add kiya</p>
                </div>
                <div className="ml-auto flex items-center gap-3">

                  <span className="text-xs bg-vibe-primary/10 text-vibe-primary border border-vibe-primary/20 px-3 py-1.5 rounded-xl font-bold">{songs.length} Total Songs</span>
                </div>
              </div>

              {loadingSongs ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-vibe-primary" size={40} /></div>
              ) : (
                <div className="space-y-3">
                  {[...songs]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, visibleActivityCount)
                    .map((song, i) => {
                      const coverUrl = song.coverImageUrl?.startsWith('/uploads')
                        ? `${API_BASE_URL}${song.coverImageUrl}`
                        : (song.coverImageUrl || null);
                      const addedBy = song.createdBy?.name || 'VIBE Core';
                      const addedAt = new Date(song.createdAt);
                      const dateStr = addedAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                      const timeStr = addedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div key={song._id || i} className="flex items-center gap-3 sm:gap-5 panel-soft border border-white/5 rounded-2xl p-3 sm:p-4 hover:border-vibe-primary/30 transition-all group">
                          {/* Serial */}
                          <span className="text-[10px] text-slate-600 font-mono w-6 text-center flex-shrink-0">{i + 1}</span>

                          {/* Cover */}
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex-shrink-0 bg-vibe-900 bg-cover bg-center border border-white/5 shadow"
                            style={{ backgroundImage: coverUrl ? `url(${coverUrl})` : 'none' }}>
                            {!coverUrl && <div className="w-full h-full flex items-center justify-center rounded-xl"><Music size={14} className="text-vibe-primary/40" /></div>}
                          </div>

                          {/* Song info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-[13px] sm:text-sm truncate">{song.title}</p>
                            <p className="text-[10px] text-slate-500 truncate">{song.artist}</p>
                          </div>

                          {/* Admin badge */}
                          <div className="flex-shrink-0 flex flex-col items-end gap-1">
                            <span className="text-[10px] font-black text-vibe-primary bg-vibe-primary/10 border border-vibe-primary/20 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                              {addedBy}
                            </span>
                            <span className="text-[9px] text-slate-600 font-mono">{timeStr} · {dateStr}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Auto-Load Sentinel for Activity */}
              {songs.length > visibleActivityCount && (
                 <div ref={activitySentinelRef} className="flex flex-col items-center gap-3 mt-8 py-6">
                   {loadingMoreActivity ? (
                     <>
                       <Loader2 className="animate-spin text-vibe-primary" size={32} strokeWidth={2.5} />
                       <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest animate-pulse">Loading more activity logs…</p>
                     </>
                   ) : (
                     <div className="h-6" />
                   )}
                 </div>
              )}
            </div>
          ) : (
            <SongManagement
              songs={songs}
              loadingSongs={loadingSongs}
              savingSong={savingSong}
              songError={songError}
              form={form}
              setForm={setForm}
              addSong={addSong}
              removeSong={removeSong}
              audioFile={audioFile}
              setAudioFile={setAudioFile}
              coverFile={coverFile}
              setCoverFile={setCoverFile}
              currentUser={{ ...user, role: user?.email === 'user@vibecom' ? 'superadmin' : user?.role }}
              loadSongs={loadSongs}
              duplicates={duplicates}
              setDuplicates={setDuplicates}
              loadingDuplicates={loadingDuplicates}
              setLoadingDuplicates={setLoadingDuplicates}
              showDuplicateModal={showDuplicateModal}
              setShowDuplicateModal={setShowDuplicateModal}
            />
          )}

        </div>

        <DuplicateModal 
          show={showDuplicateModal} 
          onClose={() => setShowDuplicateModal(false)} 
          duplicates={duplicates} 
          removeSong={async (id) => {
             await removeSong(id);
             setDuplicates(prev => prev.filter(d => d.duplicate._id !== id));
          }}
        />
      </div>
      <div className="h-24"></div>
    </MainLayout>
  );
};

export default AdminDashboard;
