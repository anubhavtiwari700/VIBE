import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { API_BASE_URL, API_URL, resolveUrl } from '../utils/constants';

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [songs, setSongs] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isAutoplay, setIsAutoplay] = useState(true);

  const audio = useRef(new Audio());

  // Fetch songs list for skip next/prev
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await fetch(`${API_URL}/songs`);
        const data = await res.json();
        setSongs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch songs for player:', err);
      }
    };
    fetchSongs();
  }, []);

  const togglePlay = useCallback(() => {
    if (!audio.current.src && songs.length > 0) {
      playTrack(songs[0]);
      return;
    }
    const el = audio.current;
    // Use el.paused instead of the isPlaying state to avoid stale-closure bugs
    if (!el.paused) {
      el.pause();
    } else {
      el.play().catch(err => console.warn('Play failed:', err.message));
    }
  }, [songs]);

  const playTrack = useCallback((track) => {
    if (!track) return;

    const sameTrack =
      currentTrack &&
      (currentTrack._id || currentTrack.id) === (track._id || track.id);

    if (sameTrack) {
      togglePlay();
    } else {
      setProgress(0);
      setDuration(0);
      setCurrentTrack(track);
    }
  }, [currentTrack, togglePlay]);

  const skipNext = useCallback(() => {
    if (songs.length === 0) return;
    if (!currentTrack) {
      playTrack(songs[0]);
      return;
    }
    const idx = songs.findIndex(s => (s._id || s.id) === (currentTrack._id || currentTrack.id));
    const nextIdx = (idx + 1) % songs.length;
    playTrack(songs[nextIdx]);
  }, [songs, currentTrack, playTrack]);

  const skipPrev = useCallback(() => {
    if (songs.length === 0) return;
    if (!currentTrack) {
      playTrack(songs[0]);
      return;
    }
    const idx = songs.findIndex(s => (s._id || s.id) === (currentTrack._id || currentTrack.id));
    const prevIdx = (idx - 1 + songs.length) % songs.length;
    playTrack(songs[prevIdx]);
  }, [songs, currentTrack, playTrack]);

  // Audio event listeners
  useEffect(() => {
    const el = audio.current;

    const onTimeUpdate = () => setProgress(el.currentTime);
    const onLoadedMeta = () => setDuration(el.duration);
    const onEnded = () => {
      if (isAutoplay) {
        skipNext();
      } else {
        setIsPlaying(false);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoadedMeta);
    el.addEventListener('ended', onEnded);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);

    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoadedMeta);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, [isAutoplay, skipNext]);

  // Volume sync
  useEffect(() => {
    audio.current.volume = volume;
  }, [volume]);

  // Load and play when currentTrack changes
  useEffect(() => {
    if (!currentTrack) {
        document.title = "vibe's";
        return;
    }

    // Update Document Title as fallback
    document.title = `${currentTrack.title} - ${currentTrack.artist}`;

    // ─── Media Session API ───
    if ('mediaSession' in navigator) {
        const cover = resolveUrl(currentTrack.coverImageUrl);
        
        navigator.mediaSession.metadata = new window.MediaMetadata({
            title: currentTrack.title,
            artist: currentTrack.artist,
            album: currentTrack.album || 'VIBE',
            artwork: [
                { src: cover || '/vibe-logo.png', sizes: '96x96',   type: 'image/png' },
                { src: cover || '/vibe-logo.png', sizes: '128x128', type: 'image/png' },
                { src: cover || '/vibe-logo.png', sizes: '192x192', type: 'image/png' },
                { src: cover || '/vibe-logo.png', sizes: '256x256', type: 'image/png' },
                { src: cover || '/vibe-logo.png', sizes: '384x384', type: 'image/png' },
                { src: cover || '/vibe-logo.png', sizes: '512x512', type: 'image/png' },
            ]
        });

        const handlers = {
            play: () => audio.current.play(),
            pause: () => audio.current.pause(),
            previoustrack: () => skipPrev(),
            nexttrack: () => skipNext(),
            seekto: (details) => { if (details.seekTime !== undefined) seek(details.seekTime); }
        };

        Object.entries(handlers).forEach(([action, handler]) => {
            try { navigator.mediaSession.setActionHandler(action, handler); } catch (e) {}
        });
    }

    const el = audio.current;
    const baseUrl = API_BASE_URL;
    const rawUrl = currentTrack.fileUrl || '';
    const fullUrl = rawUrl.startsWith('/uploads') ? `${baseUrl}${rawUrl}` : rawUrl;

    if (!fullUrl) return;

    if (el.src !== fullUrl) {
      el.pause();
      el.src = fullUrl;
      el.load();
    }

    el.play()
      .then(() => {
        setIsPlaying(true);
        // Sync to history
        import('../utils/api').then(({ default: api }) => {
           api.post(`/auth/history/${currentTrack._id || currentTrack.id}`)
              .catch(e => console.warn('History synchronization failed:', e));
        });
      })
      .catch(err => console.warn('Autoplay blocked or error:', err.message));
  }, [currentTrack, skipNext, skipPrev]);

  // Sync playback state
  useEffect(() => {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // Sync position
  useEffect(() => {
    if ('mediaSession' in navigator && duration > 0 && !isNaN(progress)) {
        try {
            navigator.mediaSession.setPositionState({
                duration: duration,
                playbackRate: 1,
                position: Math.min(progress, duration)
            });
        } catch (e) {}
    }
  }, [duration, progress]);

  const seek = (time) => {
    if (isNaN(time)) return;
    audio.current.currentTime = time;
    setProgress(time);
  };

  const stop = () => {
    audio.current.pause();
    audio.current.src = '';
    setCurrentTrack(null);
    setIsPlaying(false);
    setProgress(0);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Spacebar to play/pause (ignore if in input/textarea)
      if (e.code === 'Space' && 
          e.target.tagName !== 'INPUT' && 
          e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack, songs, isPlaying, progress, duration, volume, isAutoplay,
        setVolume, setIsAutoplay, playTrack, togglePlay, seek, skipNext, skipPrev, stop
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
