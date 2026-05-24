import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import SongCard from '../components/SongCard';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { useSidebar } from '../context/SidebarContext';
import MainLayout from '../components/MainLayout';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout, loading: authLoading } = useAuth();
  const { playTrack } = usePlayer();
  const { isVisible: sidebarVisible } = useSidebar();



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

  // Auto-load more when sentinel div is visible
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          setLoadingMore(true);
          setTimeout(() => {
            setVisibleCount(prev => prev + 20);
            setLoadingMore(false);
          }, 3000);
        }
      },
      { threshold: 1.0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [songs, visibleCount, loadingMore]);

  const filteredSongs = songs.filter((song) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      song.title?.toLowerCase().includes(query) ||
      song.artist?.toLowerCase().includes(query) ||
      song.album?.toLowerCase().includes(query)
    );
  });

    const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 17) return 'Good Afternoon';
    return 'Good Evening';
  };
  const greeting = getGreeting();

  return (
    <MainLayout>
      <div className="animate-in fade-in duration-700">
        <header className="relative h-auto min-h-[140px] sm:min-h-[180px] bg-gradient-to-br from-vibe-950 via-vibe-900 to-black overflow-hidden border border-white/5 rounded-[30px] sm:rounded-[40px] mb-8 sm:mb-12 shadow-2xl group/banner transition-all">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] pointer-events-none" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-vibe-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 animate-pulse" />

          <div className="relative md:inset-0 p-6 md:px-12 flex flex-col items-center justify-center md:items-start md:justify-start py-8 sm:py-10">
            <div className="flex-1 space-y-1 text-center md:text-left">
              <h1 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-tight">
                <span className="block opacity-90">
                  {greeting}, <span className="text-vibe-primary block md:inline">
                    {authLoading ? <Loader2 className="inline animate-spin text-vibe-primary" size={24} /> : (user?.name || user?.firstName || 'Vibe User')}
                  </span>
                </span>
              </h1>
            </div>
          </div>
        </header>
      </div>


      {/* SONGS SECTION */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-vibe-primary" size={48} strokeWidth={2.5} />
        </div>
      ) : songs.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl border border-white/5">
          <h3 className="text-2xl font-bold text-white">No songs yet</h3>
          <p className="text-slate-500 mt-2 text-sm">Ask an admin to add songs from the Admin panel.</p>
        </div>
      ) : searchQuery.trim() !== '' ? (
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-vibe-primary rounded-full shadow-xl" />
            <h3 className="text-xl font-semibold text-white tracking-tight">
              Results
              <span className="ml-3 text-xs bg-vibe-primary/15 text-vibe-primary border border-vibe-primary/20 px-3 py-1 rounded-full font-bold">
                {filteredSongs.length}
              </span>
            </h3>
          </div>
          {filteredSongs.length === 0 ? (
            <div className="py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
              <p className="text-slate-500 font-semibold">No results for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="bg-white/3 rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5">
              {filteredSongs.map((song, i) => (
                <div key={song._id || song.id || i} className="flex items-center">
                  <span className="text-slate-600 text-[10px] md:text-xs font-mono w-5 sm:w-10 text-center flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0 pl-1"><SongCard _id={song._id} id={song._id || song.id} title={song.title} artist={song.artist} album={song.album} duration={song.duration} fileUrl={song.fileUrl} coverImageUrl={song.coverImageUrl} /></div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="space-y-16">
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-vibe-primary rounded-full shadow-xl" />
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold text-white tracking-tight">Top Hits</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Most played tracks on VIBE</p>
              </div>
            </div>
            <div className="bg-white/3 rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5 shadow-2xl">
              {songs
                .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
                .slice(0, visibleCount)
                .map((song, i) => (
                  <div key={song._id || song.id || i} className="flex items-center hover:bg-white/5 transition-colors group">
                    <span className="text-slate-600 text-[10px] md:text-xs font-mono w-8 sm:w-12 text-center flex-shrink-0 group-hover:text-vibe-primary transition-colors">{i + 1}</span>
                    <div className="flex-1 min-w-0"><SongCard _id={song._id} id={song._id || song.id} title={song.title} artist={song.artist} album={song.album} duration={song.duration} fileUrl={song.fileUrl} coverImageUrl={song.coverImageUrl} /></div>
                  </div>
                ))}
            </div>

            {/* Auto-load sentinel — appears after last visible song */}
            {songs.length > visibleCount && (
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

    </MainLayout>
  );
};

export default Dashboard;
