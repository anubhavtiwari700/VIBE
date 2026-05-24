import React, { useEffect, useState, useRef } from 'react';
import MainLayout from '../components/MainLayout';
import SongCard from '../components/SongCard';
import api from '../utils/api';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Play, 
  ChevronRight, 
  Loader2, 
  Mic2,
  Heart
} from 'lucide-react';

import { API_BASE_URL } from '../utils/constants';

const Discover = () => {
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(40);
    const [loadingMore, setLoadingMore] = useState(false);
    const sentinelRef = useRef(null);

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

    const allSongs = [...songs].reverse(); // Show latest first if the API returns chronological order (assuming latest at end)
    // Or just songs if API already sorts by date. Let's assume we want to show all as new releases.

    // Auto-load more when sentinel div is visible
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadingMore) {
                    setLoadingMore(true);
                    setTimeout(() => {
                        setVisibleCount(prev => prev + 40);
                        setLoadingMore(false);
                    }, 2000);
                }
            },
            { threshold: 1.0 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [songs, visibleCount, loadingMore]);

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-700">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-vibe-primary/10 border border-vibe-primary/20 text-vibe-primary text-[10px] font-bold uppercase tracking-widest mb-4">Frequency Scan</div>
                        <h1 className="text-4xl md:text-6xl font-black text-hdr tracking-tighter uppercase leading-none mb-3">New Song <br /><span className="text-vibe-primary">Release</span></h1>
                        <p className="text-muted font-medium max-w-sm hidden md:block">Latest synchronized frequencies from the collective.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-40 flex justify-center"><Loader2 size={100} className="animate-spin text-vibe-primary/50" strokeWidth={0.5} /></div>
                ) : (
                    <div className="space-y-24">
                        
                        {/* All Songs as New Releases */}
                        <section>
                            <SectionHeader 
                                icon={<Sparkles size={18} className="text-vibe-primary" />} 
                                title="New Release Song" 
                                subtitle="Latest synchronized frequencies" 
                            />
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                                {allSongs.slice(0, visibleCount).map(song => (
                                    <TrackPoster key={song._id || song.id} song={song} />
                                ))}
                            </div>
                            
                            {/* Auto-load sentinel — appears after last visible song */}
                            {allSongs.length > visibleCount && (
                              <div ref={sentinelRef} className="mt-8 flex flex-col items-center gap-3 py-6">
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
                        </section>

                    </div>
                )}
            </div>
            <div className="h-40" />
        </MainLayout>
    );
};

const SectionHeader = ({ icon, title, subtitle }) => (
    <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl group-hover:scale-110 transition-all shadow-lg">
                {icon}
            </div>
            <div>
                <h3 className="text-2xl font-black text-hdr uppercase tracking-tighter leading-none mb-1.5">{title}</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{subtitle}</p>
            </div>
        </div>
        <button className="flex items-center gap-2 text-vibe-primary font-bold uppercase tracking-widest text-[10px] hover:underline underline-offset-8 transition-all">
            Explore All <ChevronRight size={14} />
        </button>
    </div>
);

const TrackPoster = ({ song }) => {
    const { playTrack } = usePlayer();
    const { likedSongs, toggleLike, user } = useAuth();
    const songId = song._id || song.id;
    const isLiked = likedSongs.some(s => (s._id || s.id || s)?.toString() === songId?.toString());

    const handleLike = async (e) => {
        e.stopPropagation();
        if (!user) return;
        await toggleLike(songId);
    };

    const fullCoverUrl = song.coverImageUrl?.startsWith('/uploads') ? `${API_BASE_URL}${song.coverImageUrl}` : (song.coverImageUrl || 'https://via.placeholder.com/600');
    return (
        <div className="glass-card p-6 group cursor-pointer border-white/5 hover:border-vibe-primary/30 relative" onClick={() => playTrack(song)}>
            <div className="aspect-[4/5] bg-vibe-950 rounded-2xl mb-6 overflow-hidden relative shadow-2xl">
                <img src={fullCoverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Play Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-500">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-vibe-primary text-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform">
                        <Play fill="currentColor" size={20} md:size={24} />
                    </div>
                </div>
            </div>
            <h4 className="text-sm md:text-xl font-black text-hdr truncate tracking-tight mb-1 uppercase group-hover:text-vibe-primary transition-colors">{song.title}</h4>
            <p className="text-[9px] md:text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-1 md:gap-2">
                <Mic2 size={10} md:size={12} className="text-vibe-primary/40" /> {song.artist}
            </p>
        </div>
    );
};

const TrendingStrip = ({ index, song }) => {
    const { playTrack } = usePlayer();
    const fullCoverUrl = song.coverImageUrl?.startsWith('/uploads') ? `${API_BASE_URL}${song.coverImageUrl}` : (song.coverImageUrl || 'https://via.placeholder.com/100');
    return (
        <div className="flex items-center gap-6 p-4 rounded-3xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5" onClick={() => playTrack(song)}>
            <div className="text-xs font-black text-slate-700 w-6 text-center group-hover:text-vibe-primary transition-colors italic">#{index}</div>
            <div className="w-14 h-14 bg-vibe-900 rounded-xl overflow-hidden border border-white/5 shadow-lg group-hover:scale-110 transition-transform duration-500">
                <img src={fullCoverUrl} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 overflow-hidden">
                <h4 className="font-bold text-hdr text-sm truncate uppercase tracking-tight">{song.title}</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate mt-0.5">{song.artist}</p>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-vibe-primary/50 uppercase tracking-widest hidden sm:block">Streaming High</span>
                <button className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-500 hover:text-vibe-primary group-hover:border-vibe-primary/30 transition-all active:scale-95">
                    <Play fill="currentColor" size={14} className="group-hover:text-vibe-primary" />
                </button>
            </div>
        </div>
    );
};

const MiniPoster = ({ song }) => {
    const { playTrack } = usePlayer();
    const fullCoverUrl = song.coverImageUrl?.startsWith('/uploads') ? `${API_BASE_URL}${song.coverImageUrl}` : (song.coverImageUrl || 'https://via.placeholder.com/300');
    return (
        <div className="group cursor-pointer" onClick={() => playTrack(song)}>
            <div className="aspect-[4/5] bg-vibe-950 rounded-2xl mb-4 overflow-hidden relative shadow-lg group-hover:scale-105 group-hover:shadow-xl/10 transition-all duration-500">
                <img src={fullCoverUrl} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-vibe-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h5 className="text-[11px] font-black text-hdr truncate uppercase tracking-tight group-hover:text-vibe-primary duration-300">{song.title}</h5>
        </div>
    );
};

export default Discover;
