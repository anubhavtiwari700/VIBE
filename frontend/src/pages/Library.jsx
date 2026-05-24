import React, { useEffect, useState } from 'react';
import MainLayout from '../components/MainLayout';
import api from '../utils/api';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { 
  Play, 
  Heart, 
  Clock, 
  Search, 
  Loader2, 
  Music2,
  Mic2,
  Disc,
  Library as LibraryIcon
} from 'lucide-react';

import { API_BASE_URL } from '../utils/constants';

const Library = () => {
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { playTrack, currentTrack, isPlaying } = usePlayer();
    const { likedSongs, toggleLike, user } = useAuth();

    useEffect(() => {
        const fetchSongs = async () => {
            try {
                const { data } = await api.get('/songs');
                setSongs(Array.isArray(data) ? data : []);
            } catch {
                setSongs([]);
            } finally {
                setLoading(false);
            }
        };
        fetchSongs();
    }, []);

    const filteredSongs = songs.filter(song => 
        song.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        song.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.album?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <MainLayout>
            <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-1000">
                
                {/* Header Profile Section - The "Vibe" Look */}
                <header className="flex flex-col md:flex-row items-center md:items-end gap-10 mb-16 px-4">
                    <div className="w-64 h-64 bg-gradient-to-br from-vibe-primary/20 to-vibe-accent/20 rounded-[40px] flex items-center justify-center shadow-2xl shadow-vibe-primary/10 border border-white/5 relative group shrink-0 overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center bg-vibe-950/40 backdrop-blur-sm group-hover:scale-110 transition-transform duration-1000">
                             <LibraryIcon size={120} className="text-vibe-primary/20" />
                        </div>
                        <Music2 size={80} className="text-vibe-primary drop-shadow-[0_0_20px_rgba(250,204,21,0.5)] group-hover:scale-110 transition-transform duration-700 relative z-10" />
                    </div>
                    
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-vibe-primary/10 border border-vibe-primary/20 text-vibe-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                            Global Collective Terminal
                        </div>
                        <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-hdr uppercase italic leading-[0.8] mb-4">
                            All <br /><span className="text-vibe-primary">Music</span>
                        </h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-muted uppercase tracking-widest mt-6">
                            <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5"><Disc size={14} className="text-vibe-primary" /> {songs.length} Items</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-vibe-primary/40" />
                            <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5"><Clock size={14} className="text-vibe-primary" /> Global Protocol Active</span>
                        </div>
                    </div>
                </header>

                {/* Actions & Search Strip */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 px-4 sticky top-0 bg-vibe-bg/80 backdrop-blur-xl z-30 py-6 border-b border-white/5">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => filteredSongs.length > 0 && playTrack(filteredSongs[0])}
                            className="w-16 h-16 bg-vibe-primary text-black rounded-full flex items-center justify-center shadow-xl hover:shadow-vibe-primary/40 hover:scale-110 active:scale-95 transition-all group"
                        >
                            <Play fill="currentColor" size={28} className="translate-x-0.5" />
                        </button>
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group">
                            <Heart size={24} className="text-vibe-muted group-hover:text-vibe-primary group-hover:scale-110 transition-all" />
                        </div>
                    </div>

                    <div className="relative group w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-hover:text-vibe-primary transition-colors" size={18} strokeWidth={3} />
                        <input 
                            type="text" 
                            placeholder="Search synchronized tracks..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full panel-soft border border-white/10 rounded-[22px] py-4 pl-12 pr-6 text-sm text-hdr focus:outline-none focus:ring-2 focus:ring-vibe-primary/40 font-bold tracking-tight transition-all placeholder:text-slate-600" 
                        />
                    </div>
                </div>

                {/* The Vibe Table View */}
                <div className="px-2 overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-1">
                        <thead>
                            <tr className="text-muted text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                                <th className="pb-4 px-6 w-16 text-center">#</th>
                                <th className="pb-4 px-2">Identification</th>
                                <th className="pb-4 px-4 hidden md:table-cell">Album Hub</th>
                                <th className="pb-4 px-4 text-right"><Clock size={14} className="ml-auto" /></th>
                                <th className="pb-4 px-4 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="space-y-1">
                            {loading ? (
                                <tr><td colSpan="5" className="py-20 text-center"><Loader2 size={40} className="animate-spin text-vibe-primary/50 mx-auto" /></td></tr>
                            ) : filteredSongs.length === 0 ? (
                                <tr><td colSpan="5" className="py-32 text-center text-muted font-bold uppercase tracking-widest opacity-30">No matching audio tracks detected</td></tr>
                            ) : filteredSongs.map((song, index) => {
                                const songId = song._id || song.id;
                                const isActive = currentTrack?._id === songId || currentTrack?.id === songId;
                                const isLiked = likedSongs.some(s => (s._id || s.id || s)?.toString() === songId?.toString());
                                const fullCoverUrl = song.coverImageUrl?.startsWith('/uploads') ? `${API_BASE_URL}${song.coverImageUrl}` : (song.coverImageUrl || 'https://via.placeholder.com/300');

                                return (
                                    <tr 
                                        key={songId} 
                                        className={`group hover:bg-white/5 transition-all duration-300 cursor-pointer ${isActive ? 'bg-vibe-primary/10' : ''}`}
                                        onClick={() => playTrack(song)}
                                    >
                                        <td className="py-4 px-6 first:rounded-l-2xl text-center">
                                            {isActive && isPlaying ? (
                                                <div className="flex gap-[2px] items-end h-3 w-4 mx-auto">
                                                    <div className="w-[1.5px] bg-vibe-primary animate-[music-bar_0.8s_ease-in-out_infinite] h-full" />
                                                    <div className="w-[1.5px] bg-vibe-primary animate-[music-bar_1.2s_ease-in-out_infinite] h-[60%]" />
                                                    <div className="w-[1.5px] bg-vibe-primary animate-[music-bar_1s_ease-in-out_infinite] h-[80%]" />
                                                </div>
                                            ) : (
                                                <span className="text-[11px] font-mono font-black text-slate-700 group-hover:text-vibe-primary transition-colors italic">{index + 1}</span>
                                            )}
                                        </td>
                                        <td className="py-2 px-2">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-vibe-900 flex-shrink-0 shadow-lg border border-white/5 scale-90 group-hover:scale-100 transition-all duration-500">
                                                    <img src={fullCoverUrl} className="w-full h-full object-cover" alt={song.title} />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <div className={`text-[15px] font-black truncate tracking-tighter leading-none group-hover:text-vibe-primary transition-colors ${isActive ? 'text-vibe-primary' : 'text-hdr'}`}>
                                                        {song.title}
                                                    </div>
                                                    <div className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mt-1.5 group-hover:text-vibe-accent transition-colors truncate flex items-center gap-1.5 opacity-60 group-hover:opacity-100">
                                                        <Mic2 size={10} className="text-vibe-primary/60" /> {song.artist}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 hidden md:table-cell">
                                            <div className="flex items-center gap-2 group-hover:text-white transition-colors truncate">
                                                <span className="text-[11px] font-black italic text-muted uppercase tracking-widest">{song.album || "Single"}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="text-xs font-mono font-black text-slate-500 group-hover:text-white transition-colors">{formatDuration(song.duration)}</span>
                                        </td>
                                        <td className="py-4 px-4 last:rounded-r-2xl text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); toggleLike(songId); }}
                                                    className={`p-2 rounded-lg transition-all ${isLiked ? 'text-vibe-primary scale-125' : 'text-slate-700 hover:text-white opacity-0 group-hover:opacity-100'}`}
                                                >
                                                    <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="h-40" />
            </div>
        </MainLayout>
    );
};

export default Library;
