import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, Mic2, X,
  Shuffle, Repeat, Heart, ListMusic, ChevronDown, Download
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { resolveUrl } from '../utils/constants';


/* ─── Song transition hook ─── */
const useTrackTransition = (currentTrack) => {
  const [displayTrack, setDisplayTrack] = useState(currentTrack);
  const [transClass,   setTransClass]   = useState('');
  const prevIdRef = useRef(null);
  const dirRef    = useRef('next');

  useEffect(() => {
    const newId = currentTrack?._id || currentTrack?.id;
    if (newId && newId !== prevIdRef.current) {
      setTransClass(dirRef.current === 'next' ? 'tr-out-left' : 'tr-out-right');
      const t = setTimeout(() => {
        setDisplayTrack(currentTrack);
        setTransClass(dirRef.current === 'next' ? 'tr-in-right' : 'tr-in-left');
        prevIdRef.current = newId;
        setTimeout(() => setTransClass(''), 380);
      }, 200);
      return () => clearTimeout(t);
    }
    if (!prevIdRef.current && currentTrack) {
      setDisplayTrack(currentTrack);
      prevIdRef.current = newId;
    }
  }, [currentTrack]);

  return { displayTrack, transClass, dirRef };
};

/* ─── Draggable progress bar ─── */
const DragSeekBar = ({ progress, duration, seek, mini = false }) => {
  const barRef      = useRef(null);
  const dragging    = useRef(false);
  const [localPct, setLocalPct]   = useState(null); // null = use real progress

  const pct = localPct !== null ? localPct : (duration ? (progress / duration) * 100 : 0);

  const getPct = (clientX) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
  };

  const commit = (p) => {
    dragging.current = false;
    setLocalPct(null);
    seek((p / 100) * duration);
  };

  /* ── Pointer events (works for both mouse & touch) ── */
  const onPointerDown = (e) => {
    e.preventDefault();
    dragging.current = true;
    barRef.current?.setPointerCapture(e.pointerId);
    setLocalPct(getPct(e.clientX));
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    setLocalPct(getPct(e.clientX));
  };
  const onPointerUp = (e) => {
    if (!dragging.current) return;
    commit(getPct(e.clientX));
  };

  if (mini) {
    return (
      <div
        ref={barRef}
        className="absolute top-0 left-0 right-0 h-[3px] bg-white/10 cursor-pointer touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div
          className="h-full bg-purple-500 transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  }

  return (
    <div className="mb-4 px-1">
      <div
        ref={barRef}
        className="relative h-5 flex items-center cursor-pointer touch-none group"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* track */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 bg-white/15 rounded-full">
          {/* fill */}
          <div
            className="h-full bg-white group-hover:bg-purple-400 rounded-full transition-colors"
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* thumb */}
        <div
          className="absolute w-4 h-4 bg-white rounded-full shadow-lg transition-transform group-hover:scale-110 -translate-x-1/2"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[11px] text-white/38 font-mono select-none">
        <span>{fmt(progress)}</span>
        <span>-{fmt((duration || 0) - (progress || 0))}</span>
      </div>
    </div>
  );
};

const fmt = (t) => {
  if (!t || isNaN(t)) return '0:00';
  return `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
};

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
const MusicPlayer = () => {
  const [expanded,   setExpanded]   = useState(false);

  /* drag-to-dismiss state */
  const [dragY,      setDragY]      = useState(0);
  const dragStart    = useRef(null);
  const isDraggingFull = useRef(false);

  const { likedSongs, toggleLike } = useAuth();
  const { isVisible: sidebarVisible } = useSidebar();
  const {
    currentTrack, isPlaying, progress, duration, volume, isAutoplay,
    setVolume, togglePlay, seek, skipNext, skipPrev, setIsAutoplay
  } = usePlayer();

  const { displayTrack, transClass, dirRef } = useTrackTransition(currentTrack);

  // Set volume to max on first load
  useEffect(() => { setVolume(1); }, []);

  useEffect(() => {
    if (currentTrack) setExpanded(true);
  }, [currentTrack?._id ?? currentTrack?.id]);

  /* ─── Back button handling ─── */
  useEffect(() => {
    const handlePopState = (e) => {
      if (expanded) {
        setExpanded(false);
      }
    };

    if (expanded) {
      window.history.pushState({ playerExpanded: true }, '');
    }

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [expanded]);

  const handleMinimize = () => {
    if (window.history.state?.playerExpanded) {
      window.history.back();
    }
    setExpanded(false);
  };

  if (!currentTrack) return null;

  const track    = displayTrack || currentTrack;
  const trackId  = track?._id || track?.id || '';
  const isLiked  = likedSongs.some(s => (s._id || s.id || s).toString() === trackId.toString());
  const coverUrl = resolveUrl(track?.coverImageUrl);

  const handleToggleLike = async (e) => {
    e.stopPropagation();
    if (!trackId) return;
    await toggleLike(trackId);
  };

  const handleNext = () => { dirRef.current = 'next'; skipNext(); };
  const handlePrev = () => { dirRef.current = 'prev'; skipPrev(); };

  /* ── Drag-to-dismiss (full-screen → swipe down) ── */
  const onFullPointerDown = (e) => {
    // only start drag on the handle area (top 64px)
    if (e.target.closest('button') || e.target.closest('[data-no-drag]')) return;
    dragStart.current = e.clientY;
    isDraggingFull.current = true;
  };
  const onFullPointerMove = (e) => {
    if (!isDraggingFull.current) return;
    const dy = Math.max(0, e.clientY - dragStart.current);
    setDragY(dy);
  };
  const onFullPointerUp = () => {
    if (!isDraggingFull.current) return;
    isDraggingFull.current = false;
    if (dragY > 120) handleMinimize();
    setDragY(0);
  };

  const fullStyle = {
    transform: expanded
      ? `translateY(${dragY}px)`
      : 'translateY(100%)',
    opacity: expanded ? Math.max(0.3, 1 - dragY / 400) : 0,
    transition: dragY > 0 ? 'none' : 'transform 0.48s cubic-bezier(.32,1,.4,1), opacity 0.4s ease',
    background: 'linear-gradient(180deg, #050209 0%, #0d001a 45%, #050209 100%)',
  };

  return (
    <>
      <style>{`
        @keyframes trInR   { from{opacity:0;transform:translateX(55px)} to{opacity:1;transform:translateX(0)} }
        @keyframes trInL   { from{opacity:0;transform:translateX(-55px)} to{opacity:1;transform:translateX(0)} }
        @keyframes trOutL  { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(-55px)} }
        @keyframes trOutR  { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(55px)} }
        @keyframes slowZoom { from{transform:scale(1.4) rotate(0deg)} to{transform:scale(1.6) rotate(3deg)} }
        .tr-in-right  { animation:trInR  0.32s cubic-bezier(.4,0,.2,1) both }
        .tr-in-left   { animation:trInL  0.32s cubic-bezier(.4,0,.2,1) both }
        .tr-out-left  { animation:trOutL 0.18s cubic-bezier(.4,0,.2,1) both }
        .tr-out-right { animation:trOutR 0.18s cubic-bezier(.4,0,.2,1) both }
        .animate-slow-zoom { animation: slowZoom 20s linear infinite alternate; }
        .animate-pulse-slow { animation: pulse 8s ease-in-out infinite; }
        .mini-safe    { padding-bottom: max(8px, env(safe-area-inset-bottom, 0px)); }
      `}</style>

      {/* ════════════ FULL-SCREEN NOW PLAYING ════════════ */}
      <div
        className="fixed inset-0 z-[150] flex flex-col pointer-events-auto"
        style={{ ...fullStyle, pointerEvents: expanded ? 'auto' : 'none' }}
        onPointerDown={onFullPointerDown}
        onPointerMove={onFullPointerMove}
        onPointerUp={onFullPointerUp}
        onPointerLeave={onFullPointerUp}
      >
        {/* Full-screen immersive dynamic background */}
        {coverUrl && (
          <div className={`absolute inset-0 overflow-hidden ${transClass}`}>
            <div
              className={`absolute inset-0 opacity-50 scale-150 animate-slow-zoom`}
              style={{
                backgroundImage: `url(${coverUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(100px) saturate(3) brightness(0.6)',
              }}
            />
            <div
              className={`absolute inset-0 opacity-30 mix-blend-color-dodge animate-pulse-slow`}
              style={{
                backgroundImage: `url(${coverUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(40px) saturate(2)',
                transform: 'rotate(15deg) scale(1.2)',
              }}
            />
            {/* Ambient vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/95" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
          </div>
        )}
        <div className="absolute inset-0 backdrop-blur-[2px]" />

        <div
          className="relative z-10 flex flex-col h-full w-full px-5 sm:px-8 pb-6 select-none"
          style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 18px)' }}
        >
          {/* ── TOP: Minimize button (absolute top-left) ── */}
          <button
            data-no-drag="true"
            onClick={handleMinimize}
            className="absolute top-4 left-4 sm:top-5 sm:left-5 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:scale-110 active:scale-95"
            title="Minimize"
            style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <ChevronDown size={22} strokeWidth={2.5} />
          </button>

          {/* ── Drag pill (centered) ── */}
          <div className="flex justify-center mb-2">
            <div className="w-10 h-1 rounded-full bg-white/30 cursor-grab active:cursor-grabbing" />
          </div>

          {/* ── Now Playing label (centered, no right button) ── */}
          <div className="flex items-center justify-center mb-3">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-white/45 uppercase">Now Playing</p>
          </div>

          {/* ── Album Art ── */}
          <div className="flex-1 flex items-center justify-center py-2 overflow-hidden">
            <div
              className={`relative rounded-2xl overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.85)] w-full ${transClass} ${
                isPlaying ? 'scale-100' : 'scale-95 opacity-80'
              } transition-transform duration-300`}
              style={{ maxWidth: 'min(100%, 340px)', aspectRatio: '1 / 1', margin: '0 auto' }}
            >
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={track?.title}
                  className="w-full h-full object-cover"
                  key={trackId}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
                  <ListMusic size={64} className="text-white/30" />
                </div>
              )}
              {isPlaying && (
                <div className="absolute inset-0 rounded-2xl border-2 border-purple-400/30 animate-pulse pointer-events-none" />
              )}
            </div>
          </div>

          {/* ── Track info + Download + Like ── */}
          <div className={`flex items-center justify-between mt-4 mb-3 ${transClass}`} key={trackId + '-info'}>
            <div className="flex-1 min-w-0 pr-3">
              <h2 className="text-xl sm:text-2xl font-bold text-white truncate leading-tight">{track?.title}</h2>
              <p className="text-sm sm:text-base text-white/50 truncate mt-0.5 font-medium">{track?.artist}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0" data-no-drag="true">
              {/* Download */}
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const { resolveUrl: ru } = await import('../utils/constants');
                    const fileUrl = resolveUrl(track?.fileUrl);
                    const res = await fetch(fileUrl);
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${track?.title || 'track'} - ${track?.artist || 'VIBE'}.mp3`;
                    document.body.appendChild(a);
                    a.click();
                    a.parentNode.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  } catch (err) {
                    window.open(resolveUrl(track?.fileUrl), '_blank');
                  }
                }}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95"
                title="Download"
              >
                <Download size={19} strokeWidth={2} />
              </button>
              {/* Like */}
              <button
                onClick={handleToggleLike}
                className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                  isLiked ? 'text-pink-500 bg-pink-500/15' : 'text-white/35 hover:text-white/70 bg-white/10'
                }`}
              >
                <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* ── Draggable progress bar ── */}
          <div data-no-drag="true">
            <DragSeekBar progress={progress} duration={duration} seek={seek} />
          </div>

          {/* ── Controls ── */}
          <div className="flex items-center justify-between mb-5" data-no-drag="true">
            <button className="p-2 text-white/35 hover:text-white transition-colors hover:scale-110 active:scale-90">
              <Shuffle size={20} strokeWidth={2} />
            </button>
            <button onClick={handlePrev} className="p-2 text-white/75 hover:text-white transition-colors hover:scale-110 active:scale-90">
              <SkipBack size={28} fill="currentColor" strokeWidth={0} />
            </button>
            <button
              onClick={togglePlay}
              className="w-16 h-16 flex items-center justify-center bg-white text-black rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-transform"
            >
              {isPlaying
                ? <Pause size={26} fill="currentColor" strokeWidth={0} />
                : <Play  size={26} fill="currentColor" strokeWidth={0} className="ml-1" />
              }
            </button>
            <button onClick={handleNext} className="p-2 text-white/75 hover:text-white transition-colors hover:scale-110 active:scale-90">
              <SkipForward size={28} fill="currentColor" strokeWidth={0} />
            </button>
            <button
              onClick={() => setIsAutoplay(!isAutoplay)}
              className={`p-2 transition-all duration-300 hover:scale-110 active:scale-90 ${
                isAutoplay ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]' : 'text-white/25 hover:text-white/55'
              }`}
            >
              <Repeat size={20} strokeWidth={isAutoplay ? 3 : 2} />
            </button>
          </div>

        </div>
      </div>

      {/* ════════════ MINI PLAYER — centered floating pill ════════════ */}
      {/* ════════════ MINI PLAYER — centered floating pill ════════════ */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[100] flex justify-center pointer-events-none transition-all duration-500 px-4 ${
          expanded ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
      >
        {/* The floating pill card */}
        <div
          className="pointer-events-auto cursor-pointer flex items-center gap-3 rounded-2xl px-4 py-2.5 active:scale-95 transition-all duration-300 hover:scale-[1.02] relative overflow-hidden w-full"
          style={{
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)',
            maxWidth: '860px',
          }}
          onClick={() => setExpanded(true)}
        >
          {/* ── Blurred album art background (same as full-screen) ── */}
          {coverUrl && (
            <div
              className="absolute inset-0 z-0"
              style={{
                backgroundImage: `url(${coverUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(18px) saturate(2.8) brightness(0.45)',
                transform: 'scale(1.4)',
              }}
            />
          )}
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 z-[1] bg-black/35" />

          {/* Album art — no ring */}
          <div className="relative flex-shrink-0 z-[2]">
            <div className="w-[46px] h-[46px] rounded-xl overflow-hidden shadow-lg flex-shrink-0">
              {coverUrl
                ? <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-purple-800 to-pink-900" />
              }
            </div>
            {/* Playing indicator dot */}
            {isPlaying && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white rounded-full border-2 border-black/30 animate-pulse" />
            )}
          </div>

          {/* Title + artist */}
          <div className="flex-1 min-w-0 leading-none relative z-[2]">
            <p className="font-semibold text-[12px] text-white truncate drop-shadow">{track?.title}</p>
            <p className="text-[10px] text-white/55 truncate mt-1">{track?.artist}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default MusicPlayer;
