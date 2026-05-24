import React, { useState, useEffect } from 'react';
import {
    Home,
    Heart,
    Settings,
    LogOut,
    Music,
    Search,
    Compass,
    User,
    Mail,
    ShieldCheck,
    Clock,
    Plus,
    Sun,
    Moon,
    Menu,
    X,
    Disc
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { useTheme } from '../context/ThemeContext';
import vibeLogo from '../assets/vibe-logo.png';
import { API_BASE_URL, resolveUrl } from '../utils/constants';

const Sidebar = () => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const getGreeting = () => {
        const hours = new Date().getHours();
        if (hours < 12) return 'Good Morning';
        if (hours < 17) return 'Good Afternoon';
        return 'Good Evening';
    };
    const greeting = getGreeting();

    const [time, setTime] = useState(new Date());
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => {
            clearInterval(timer);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    let allItems = [];

    if (user?.role === 'superadmin' || user?.email === 'user@vibecom') {
        allItems = [
            { path: '/dashboard', label: 'Home', icon: <Home size={18} /> },
            { path: '/discover', label: 'Discover', icon: <Compass size={18} /> },
            { path: '/favorites', label: 'Favorites', icon: <Heart size={18} /> },
            { path: '/admin?tab=admins', label: 'Admins', icon: <ShieldCheck size={18} /> },
            { path: '/admin?tab=users', label: 'Users', icon: <User size={18} /> },
            { path: '/admin?tab=songs', label: 'Songs', icon: <Disc size={18} /> },
            { path: '/admin?tab=activity', label: 'Activity', icon: <Clock size={18} /> },
            { path: '/admin?tab=analytics', label: 'Analytics', icon: <Compass size={18} /> },
        ];
    } else if (user?.role === 'admin') {
        allItems = [
            { path: '/dashboard', label: 'Home', icon: <Home size={18} /> },
            { path: '/discover', label: 'Discover', icon: <Compass size={18} /> },
            { path: '/favorites', label: 'Favorites', icon: <Heart size={18} /> },
            { path: '/admin?tab=users', label: 'Users', icon: <User size={18} /> },
            { path: '/admin?tab=songs', label: 'Songs', icon: <Music size={18} /> },
            { path: '/admin?tab=analytics', label: 'Analytics', icon: <Compass size={18} /> },
        ];
    } else {
        allItems = [
            { path: '/dashboard', label: 'Home', icon: <Home size={18} /> },
            { path: '/discover', label: 'Discover', icon: <Compass size={18} /> },
            { path: '/profile', label: 'Profile', icon: <User size={18} /> },
            { path: '/recents', label: 'Recents', icon: <Clock size={18} /> },
            { path: '/favorites', label: 'Favorites', icon: <Heart size={18} /> },
            { path: '/contact', label: 'Support', icon: <Mail size={18} /> },
        ];
    }

    const isActive = (path) => {
        if (path.includes('?')) return location.pathname + location.search === path;
        return location.pathname === path;
    };

    return (
        <>
        <header 
            className="w-full glass-card border-x-0 border-t-0 rounded-none border-b border-white/5 px-3 md:px-4 xl:px-8 flex items-center justify-between z-[60] backdrop-blur-3xl flex-shrink-0"
            style={{ 
                paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 8px))',
                paddingBottom: '8px'
            }}
        >
            <div className="flex items-center gap-3 lg:gap-4 xl:gap-8 flex-1 min-w-0">
                <button 
                    className="lg:hidden flex-shrink-0 p-2 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors shadow-sm"
                    onClick={() => setIsMobileMenuOpen(true)}
                >
                    <Menu size={20} />
                </button>
                {/* Premium VIBE Logo Icon */}
                <div 
                    className="hidden sm:flex items-center gap-4 cursor-pointer group relative flex-shrink-0" 
                    onClick={() => navigate(user?.role === 'superadmin' || user?.role === 'admin' ? '/admin' : '/dashboard')}
                >
                    <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] group-active:scale-95">
                        <img 
                            src={vibeLogo} 
                            alt="VIBE Logo" 
                            className="w-full h-full object-contain p-0.5 transition-all"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-vibe-primary/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {(user?.role === 'superadmin' || user?.role === 'admin') && (
                         <div className="hidden lg:flex flex-col items-start -space-y-1 ml-1">
                             <span className="text-sm font-black text-white whitespace-nowrap uppercase tracking-wider italic drop-shadow-md">
                                 {user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                             </span>
                         </div>
                    )}
                </div>

                <nav className="hidden lg:flex items-center gap-1 overflow-x-auto scrollbar-hide py-2 flex-1 min-w-0">
                    {allItems.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => navigate(item.path)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-semibold text-xs border whitespace-nowrap ${isActive(item.path) ? 'bg-vibe-primary/10 text-vibe-primary border-vibe-primary/40 shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'}`}
                        >
                            {item.icon ? item.icon : <img src={vibeLogo} className="w-4 h-4 object-contain" alt="VIBE" />}
                            <span>{item.label}</span>
                        </button>
                    ))}
                    {deferredPrompt && (
                        <button
                            onClick={handleInstallClick}
                            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-black text-xs border whitespace-nowrap bg-gradient-to-r from-vibe-primary to-vibe-accent text-white border-transparent shadow-[0_0_20px_rgba(139,92,246,0.4)] animate-pulse"
                        >
                            <Plus size={14} strokeWidth={3} />
                            <span>Install App</span>
                        </button>
                    )}
                </nav>
                <button onClick={() => navigate('/search')} className="flex p-2 md:p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-sm ml-2" title="Search">
                    <Search size={18} />
                </button>
            </div>

            <div className="flex items-center gap-2 xl:gap-4 flex-shrink-0 ml-4">
                {/* High-End Pulsing System Clock */}
                <div className="hidden sm:flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-5 py-2.5 shadow-xl backdrop-blur-md border-b-vibe-primary/20 hover:bg-white/10 transition-all cursor-default group/clock">
                    <div className="w-2.5 h-2.5 rounded-full bg-vibe-primary animate-pulse-dot shadow-[0_0_12px_rgba(6,182,212,0.7)]" />
                    <span className="text-sm font-medium text-white tabular-nums flex items-center gap-2 whitespace-nowrap tracking-wide drop-shadow-sm">
                        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>

                <button onClick={() => navigate('/settings')} className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-sm hidden sm:block" title="Settings">
                    <Settings size={18} />
                </button>

                {/* Top Panel Greeting - Always show on Mobile per user request */}
                <div className="flex items-center gap-2 mr-1 md:mr-2">
                </div>

                <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white/5 rounded-[20px] border border-white/5 shadow-inner flex-shrink-0 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => navigate('/profile')}>
                    <div className="block">
                        <p className="text-[10px] md:text-[11px] font-black text-white tracking-widest leading-tight uppercase italic whitespace-nowrap max-w-[80px] md:max-w-none truncate">{user?.name || user?.firstName || 'User'}</p>
                    </div>
                </div>
                <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-sm" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                <button 
                    onClick={async () => { if (window.confirm('Terminate Session?')) { await logout(); navigate('/'); } }}
                    className="flex items-center justify-center p-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    title="Log Out"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>

        {/* Mobile Left Sidebar Overlay */}
        {isMobileMenuOpen && (
            <div className="fixed inset-0 z-[100] lg:hidden">
                <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                    onClick={() => setIsMobileMenuOpen(false)}
                />
                <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-vibe-900/95 border-r border-white/10 shadow-2xl flex flex-col pt-6 pb-20 px-4 animate-in slide-in-from-left duration-300">
                    <div className="flex justify-between items-center mb-8 pl-2">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                                <img src={vibeLogo} alt="VIBE Logo" className="w-full h-full object-contain p-0.5" />
                            </div>
                            <span className="text-xl font-black text-white italic tracking-widest drop-shadow-md">VIBE</span>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-2 overflow-y-auto flex-1">
                        {deferredPrompt && (
                           <button
                             onClick={() => { handleInstallClick(); setIsMobileMenuOpen(false); }}
                             className="flex items-center gap-4 px-4 py-4 rounded-xl mb-4 bg-gradient-to-r from-vibe-primary to-vibe-accent text-white font-black text-sm shadow-lg animate-pulse"
                           >
                             <Plus size={20} strokeWidth={3} />
                             <span>INSTALL VIBE APP</span>
                           </button>
                        )}
                        {allItems.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => { setIsMobileMenuOpen(false); navigate(item.path); }}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 font-semibold text-sm ${isActive(item.path) ? 'bg-vibe-primary/10 text-vibe-primary shadow-[0_0_15px_rgba(139,92,246,0.1)] border border-vibe-primary/20' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        ))}

                        <div className="h-[1px] bg-white/10 my-4" />


                        <button 
                            onClick={() => { setIsMobileMenuOpen(false); navigate('/settings'); }} 
                            className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all font-semibold text-sm"
                        >
                            <Settings size={18} />
                            <span>Settings</span>
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default Sidebar;
