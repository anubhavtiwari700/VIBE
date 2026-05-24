import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { usePlayer } from './PlayerContext';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likedSongs, setLikedSongs] = useState([]);
  const [historyTracks, setHistoryTracks] = useState([]);
  const { stop } = usePlayer();

  const fetchLikedSongs = async () => {
    try {
      const { data } = await api.get('/auth/liked');
      setLikedSongs(data);
    } catch {
      setLikedSongs([]);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/auth/history');
      setHistoryTracks(data);
    } catch {
      setHistoryTracks([]);
    }
  };

  useEffect(() => {
    let retryCount = 0;
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/profile');
        setUser(data);
        // Sync token if backend returns a fresh one
        if (data.token) localStorage.setItem('token', data.token);
        
        await Promise.all([fetchLikedSongs(), fetchHistory()]);
        setLoading(false);
      } catch (err) {
        console.error("Session verification failed:", err);
        // Only remove token if it was an auth error (401/403)
        if (err.response?.status === 401 || err.response?.status === 403) {
          setUser(null);
          localStorage.removeItem('token');
          setLoading(false);
        } else {
          // If it's a network error or 5xx, retry to handle cold starts
          if (retryCount < 6) {
            retryCount++;
            console.log(`VIBE System: Core might be waking up. Retrying in 5s... (Attempt ${retryCount}/6)`);
            setTimeout(fetchProfile, 5000);
          } else {
            setUser(null);
            setLoading(false);
          }
        }
      }
    };
    fetchProfile();
  }, []);

  const login = async (identity, password) => {
    const { data } = await api.post('/auth/login', { ...identity, password });
    setUser(data);
    localStorage.setItem('token', data.token);
    fetchLikedSongs();
    fetchHistory();
    return data;
  };

  const register = async (email, phone, password) => {
    const { data } = await api.post('/auth/register', { email, phone, password });
    return data;
  };

  const verifyOTP = async (email, phone, otp) => {
    const { data } = await api.post('/auth/verify-otp', { email, phone, otp });
    return data;
  };

  const forgotPassword = async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  };

  const resetPasswordOTP = async (email, otp, newPassword) => {
    const { data } = await api.post('/auth/reset-password-otp', { email, otp, newPassword });
    return data;
  };

  const completeProfile = async (email, phone, firstName, middleName, lastName) => {
    const { data } = await api.post('/auth/complete-profile', { 
      email, 
      phone, 
      firstName, 
      middleName, 
      lastName 
    });
    setUser(data);
    localStorage.setItem('token', data.token);
    fetchLikedSongs();
    fetchHistory();
    return data;
  };

  const toggleLike = async (songId) => {
    // 1. Optimistic Update
    const isLiked = likedSongs.some(s => (s._id || s.id || s).toString() === songId.toString());
    const previousLikes = [...likedSongs];

    if (isLiked) {
      setLikedSongs(prev => prev.filter(s => (s._id || s.id || s).toString() !== songId.toString()));
    } else {
      // Find the song in history or somewhere if possible, or just add ID (basic fallback)
      setLikedSongs(prev => [...prev, { _id: songId, id: songId }]);
    }

    try {
      await api.post(`/auth/liked/${songId}`);
      // Re-fetch in background to sync full song data if needed, but UI is already updated
      fetchLikedSongs(); 
    } catch (err) {
      console.error("Failed to toggle like:", err);
      // 2. Revert on failure
      setLikedSongs(previousLikes);
    }
  };

  const clearHistory = async () => {
    try {
      await api.delete('/auth/history');
      setHistoryTracks([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Always clear local state even if API is unreachable.
    }
    stop();
    setUser(null);
    setLikedSongs([]);
    setHistoryTracks([]);
    localStorage.removeItem('token');
    localStorage.setItem('justLoggedOut', 'true');
  };

  const updateUserProfile = async (formData) => {
    const { data } = await api.put('/auth/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setUser(data);
    return data;
  };

  useEffect(() => {
    const handleLogoutShortcut = (e) => {
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        logout();
      }
    };
    window.addEventListener('keydown', handleLogoutShortcut);
    return () => window.removeEventListener('keydown', handleLogoutShortcut);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, likedSongs, historyTracks, fetchHistory, clearHistory, login, register, verifyOTP, completeProfile, logout, toggleLike, updateUserProfile, forgotPassword, resetPasswordOTP, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
