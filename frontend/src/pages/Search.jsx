import React, { useEffect, useState } from 'react';
import MainLayout from '../components/MainLayout';
import SongCard from '../components/SongCard';
import api from '../utils/api';
import { 
  Search as SearchIcon, 
  Mic2, 
  Library
} from 'lucide-react';

const SectionHeader = ({ icon, title }) => (
    <div className="flex items-center gap-4 mb-8">
        <div className="w-1.5 h-10 bg-vibe-primary rounded-full shadow-xl shadow-vibe-primary/20" />
        <div className="flex items-center gap-3">
            <div className="text-vibe-primary opacity-60">{icon}</div>
            <h3 className="text-lg sm:text-2xl font-black text-white italic tracking-tighter uppercase drop-shadow-sm truncate">{title}</h3>
        </div>
    </div>
);

const Search = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            if (!searchQuery.trim()) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const { data } = await api.get('/songs');
                const filtered = data.filter(s => 
                    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.artist?.toLowerCase().includes(searchQuery.toLowerCase())
                );
                setResults(filtered);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        const timeout = setTimeout(fetchResults, 800); // Increased debounce for history saving
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    return (
        <MainLayout>
            <div className="max-w-6xl mx-auto w-full animate-in fade-in duration-700">
                
                {/* Search Bar */}
                <div className="relative group mb-12">
                    <div className="flex items-center gap-3 mb-4 ml-4">
                        <SearchIcon className="text-vibe-primary flex-shrink-0" size={16} />
                        <span className="text-[9px] sm:text-xs font-black text-vibe-primary uppercase tracking-[0.2em] sm:tracking-[0.4em] truncate">Initialize Search Query</span>
                    </div>
                    <input 
                        type="text"
                        autoFocus
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl md:rounded-[28px] py-4 md:py-6 px-6 md:px-10 text-lg md:text-3xl text-hdr font-black tracking-tighter focus:ring-4 focus:ring-vibe-primary/20 transition-all placeholder:text-slate-700 shadow-2xl"
                    />
                </div>


                {searchQuery && (
                    <div className="space-y-12">
                        <SectionHeader icon={<Library size={18} />} title={`Discovery results for "${searchQuery}"`} />
                        {loading ? (
                            <div className="py-20 flex justify-center"><SearchIcon className="animate-pulse text-vibe-primary" size={48} /></div>
                        ) : results.length === 0 ? (
                            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 italic text-muted">No items found on this frequency.</div>
                        ) : (
                            <div className="glass-card overflow-hidden divide-y divide-white/5 border-white/5">
                                {results.map((song, i) => (
                                    <div key={song._id || song.id} className="flex items-center px-1 sm:px-4 md:px-10 py-3 md:py-6 hover:bg-white/5 transition-all group">
                                        <span className="text-[10px] md:text-xs font-mono text-slate-600 w-6 sm:w-8 md:w-12 text-center flex-shrink-0 group-hover:text-vibe-primary transition-colors">{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <SongCard {...song} id={song._id || song.id} compact={window.innerWidth < 640} />
                                        </div>
                                        <div className="hidden md:flex flex-col text-right">
                                            <span className="text-xs font-bold text-slate-400 capitalize flex items-center justify-end gap-2">
                                                {song.artist} <Mic2 size={12} className="text-vibe-primary/50" />
                                            </span>
                                            <span className="text-[10px] text-slate-600 uppercase tracking-widest mt-1">
                                                {song.album || 'Untagged'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
            <div className="h-40" />
        </MainLayout>
    );
};

export default Search;
