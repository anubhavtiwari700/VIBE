import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Favorites from './pages/Favorites';
import Recents from './pages/Recents';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
import Library from './pages/Library';
import Search from './pages/Search';
import Discover from './pages/Discover';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Security from './pages/Security';

import MusicPlayer from './components/MusicPlayer';
import BlockedScreen from './components/BlockedScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { ThemeProvider } from './context/ThemeContext';
import { SidebarProvider } from './context/SidebarContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="h-screen w-screen bg-vibe-950 flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-vibe-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!user) return <Navigate to="/" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="h-screen w-screen bg-vibe-950 flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-vibe-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) return <Navigate to="/dashboard" />;
  return children;
}

function AppContent() {
  const { user, logout } = useAuth();

  // Register Service Worker for PWA install prompt
  /* 
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('SW registration failed:', err));
    }
  }, []);
  */

  if (user?.isBlocked) {
    return <BlockedScreen user={user} logout={logout} />;
  }

  return (
    <div className="min-h-screen app-bg flex flex-col relative">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/recents" element={<ProtectedRoute><Recents /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
        <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />

        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        {/* Semi-Public / Information Pages */}
        <Route path="/contact" element={<Contact />} />
        <Route path="/search" element={<Search />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <MusicPlayer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <PlayerProvider>
          <AuthProvider>
            <SidebarProvider>
              <AppContent />
            </SidebarProvider>
          </AuthProvider>
        </PlayerProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
