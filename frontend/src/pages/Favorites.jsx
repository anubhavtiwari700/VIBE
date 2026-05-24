import { Heart, Music2 } from 'lucide-react';
import SongCard from '../components/SongCard';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/MainLayout';

const Favorites = () => {
  const { likedSongs, user } = useAuth();

  return (
    <MainLayout>
        <header className="mb-12">
            <div className="inline-flex items-center space-x-2 bg-vibe-primary/10 px-4 py-1.5 rounded-full border border-vibe-primary/20 text-vibe-primary text-[10px] font-bold tracking-widest uppercase mb-4">Personal Collection</div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black flex items-center gap-4 sm:gap-6 tracking-tighter uppercase text-hdr">
               <Heart className="text-vibe-primary fill-vibe-primary animate-pulse w-8 h-8 sm:w-12 sm:h-12 md:w-[60px] md:h-[60px]" strokeWidth={2.5} /> Favorite Drops
            </h1>
            <p className="text-muted mt-2 text-base sm:text-lg font-medium opacity-70">Your curated selection of tracks that hit different.</p>
        </header>

        {likedSongs.length === 0 ? (
          <section className="flex-1 flex flex-col items-center justify-center space-y-8 glass-card p-20 border-dashed border-white/10 opacity-50">
            <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center">
                <Music2 size={64} className="text-slate-700" strokeWidth={1} />
            </div>
            <div className="text-center">
                <h3 className="text-3xl font-bold text-hdr mb-2">The vault is empty</h3>
                <p className="text-muted max-w-sm font-medium">Head back to the dashboard and drop some hearts on tracks you love to see them here.</p>
            </div>
          </section>
        ) : (
          <section className="animate-in fade-in duration-1000">
             <div className="flex items-center gap-4 mb-10 pl-2">
                <div className="w-1.5 h-10 bg-vibe-primary rounded-full shadow-xl" />
                <h3 className="text-xl sm:text-3xl font-bold tracking-tight text-hdr uppercase">
                  Liked Tracks <span className="text-xs sm:text-sm bg-vibe-primary/10 text-vibe-primary px-3 py-1 rounded-lg ml-2 font-bold">{likedSongs.length}</span>
                </h3>
             </div>
             <div className="bg-white/3 rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5">
               {likedSongs.map((song, i) => (
                 <div key={song._id || song.id} className="flex items-center">
                   <span className="text-slate-600 text-xs font-mono w-10 text-center flex-shrink-0">{i + 1}</span>
                   <div className="flex-1">
                     <SongCard
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

export default Favorites;
