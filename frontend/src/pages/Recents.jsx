import { Clock, Music2, Trash2 } from 'lucide-react';
import SongCard from '../components/SongCard';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/MainLayout';

const Recents = () => {
  const { historyTracks, clearHistory, user } = useAuth();

  return (
    <MainLayout>
        <header className="mb-8 md:mb-12 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center space-x-2 bg-vibe-primary/10 px-3 py-1 rounded-full border border-vibe-primary/20 text-vibe-primary text-[9px] md:text-[10px] font-bold tracking-widest uppercase mb-3">Listening History</div>
              <h1 className="text-4xl md:text-6xl font-black flex items-center gap-4 md:gap-6 tracking-tighter uppercase text-hdr">
                 <Clock className="text-vibe-primary" size={40} md:size={60} strokeWidth={2.5} /> Recents
              </h1>
              <p className="text-muted mt-2 text-sm md:text-lg font-medium opacity-70">A chronological record of tracks you've engaged with.</p>
            </div>
            
            {(historyTracks?.length || 0) > 0 && (
              <button 
                onClick={async () => {
                  if(window.confirm('Clear all listening history?')) {
                    await clearHistory();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all font-bold uppercase tracking-widest text-[9px] md:text-xs"
              >
                <Trash2 size={14} /> Clear
              </button>
            )}
        </header>

        {!historyTracks || historyTracks.length === 0 ? (
          <section className="flex-1 flex flex-col items-center justify-center space-y-6 md:space-y-8 glass-card p-10 md:p-20 border-dashed border-white/10 opacity-50">
            <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-white/5 flex items-center justify-center">
                <Music2 size={32} md:size={64} className="text-slate-700" strokeWidth={1} />
            </div>
            <div className="text-center">
                <h3 className="text-xl md:text-3xl font-bold text-hdr mb-2">No history logged</h3>
                <p className="text-xs md:text-base text-muted max-w-sm font-medium">Head back to the dashboard and start playing some tracks to fill this list.</p>
            </div>
          </section>
        ) : (
          <section className="animate-in fade-in duration-1000">
             <div className="flex items-center gap-3 mb-8 pl-1">
                <div className="w-1 h-6 md:w-1.5 md:h-10 bg-vibe-primary rounded-full shadow-xl" />
                <h3 className="text-xl md:text-3xl font-bold tracking-tight text-hdr uppercase">
                   Recent Plays <span className="text-xs bg-vibe-primary/10 text-vibe-primary px-2 py-0.5 rounded-lg ml-2 font-black tracking-tight">{historyTracks.length}</span>
                </h3>
             </div>
             <div className="bg-white/[0.03] rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5">
               {historyTracks.map((song, i) => (
                 <div key={`${song._id || song.id}-${i}`} className="flex items-center hover:bg-white/[0.02] transition-colors">
                   <span className="text-slate-700 text-[10px] md:text-xs font-mono w-6 md:w-10 text-center flex-shrink-0 opacity-40">{i + 1}</span>
                   <div className="flex-1 min-w-0 overflow-hidden">
                     <SongCard
                       compact
                       _id={song._id}
                       id={song._id || song.id}
                       title={song.title}
                       artist={song.artist}
                       album={song.album}
                       duration={song.duration}
                       fileUrl={song.fileUrl}
                       coverImageUrl={song.coverImageUrl}
                     />
                   </div>
                 </div>
               ))}
             </div>
          </section>
        )}

        <div className="h-40" />
    </MainLayout>
  );
};

export default Recents;
