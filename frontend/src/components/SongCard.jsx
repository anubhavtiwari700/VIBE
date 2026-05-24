import React from 'react';
import { Play, Pause, Music2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, resolveUrl } from '../utils/constants';

const SongCard = (props) => {
  // Extract song data cleanly, ignoring React internal props
  const song = {
    _id: props._id,
    id: props.id,
    title: props.title,
    artist: props.artist,
    album: props.album,
    duration: props.duration,
    fileUrl: props.fileUrl,
    coverImageUrl: props.coverImageUrl,
  };

  const songId = song._id || song.id;

  const { currentTrack, isPlaying, playTrack } = usePlayer();
  const { user } = useAuth();

  const isThisPlaying =
    (currentTrack?._id || currentTrack?.id) === songId && isPlaying;

  const coverUrl = resolveUrl(song.coverImageUrl);



  const handlePlay = () => {
    playTrack(song);
  };

  const formatDuration = (dur) => {
    if (!dur) return '';
    if (typeof dur === 'number') {
      return `${Math.floor(dur / 60)}:${String(Math.floor(dur % 60)).padStart(2, '0')}`;
    }
    return dur;
  };

  return (
    <div
      onClick={handlePlay}
      className={`flex items-center gap-2 sm:gap-4 ${props.compact ? 'px-1 sm:px-2 py-1.5' : 'px-2 sm:px-4 py-2 sm:py-3'} rounded-xl cursor-pointer group transition-all duration-200 hover:bg-white/5 ${
        isThisPlaying ? 'bg-white/5' : ''
      }`}
    >
      {/* Cover thumbnail */}
      <div className={`${props.compact ? 'w-8 h-8 md:w-10 md:h-10' : 'w-11 h-11'} rounded-lg overflow-hidden bg-vibe-800 flex-shrink-0 border border-white/5 relative`}>
        {coverUrl ? (
          <img src={coverUrl} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-vibe-800 to-vibe-950">
            <Music2 size={18} className="text-vibe-primary/40" strokeWidth={1.5} />
          </div>
        )}
        {/* Play/Pause overlay */}
        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200 ${
          isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          {isThisPlaying
            ? <Pause size={14} fill="currentColor" className="text-vibe-primary" strokeWidth={0} />
            : <Play size={14} fill="currentColor" className="text-white" strokeWidth={0} />
          }
        </div>
      </div>

      {/* Song info */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold ${props.compact ? 'text-[11px] md:text-sm' : 'text-sm'} truncate leading-tight transition-colors ${
          isThisPlaying ? 'text-vibe-primary' : 'text-white'
        }`}>
          {song.title}
        </p>
        <p className={`${props.compact ? 'text-[9px] md:text-xs' : 'text-xs'} text-slate-500 truncate mt-0.5`}>{song.artist}</p>
      </div>

      {/* Equalizer when playing */}
      {isThisPlaying && (
        <div className="flex items-end gap-0.5 h-4 flex-shrink-0">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="w-1 bg-vibe-primary rounded-full animate-bounce"
              style={{ height: `${6 + i * 4}px`, animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
      )}

      {/* Duration */}
      {song.duration && (
        <span className="text-[11px] text-slate-600 flex-shrink-0 font-mono w-10 text-right hidden sm:block">
          {formatDuration(song.duration)}
        </span>
      )}
    </div>

  );
};

export default SongCard;
