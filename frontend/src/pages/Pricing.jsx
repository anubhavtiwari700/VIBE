import React from 'react';
import MainLayout from '../components/MainLayout';
import { 
  Check, 
  Zap, 
  Star, 
  Shield, 
  Headphones, 
  Crown,
  Music2,
  Lock,
  Globe
} from 'lucide-react';

const Pricing = () => {
    return (
        <MainLayout>
            <div className="max-w-6xl mx-auto w-full animate-in fade-in duration-700">
                
                {/* Header */}
                <div className="text-center mb-24 py-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-vibe-primary/10 text-vibe-primary text-[10px] font-bold tracking-widest uppercase mb-6 border border-vibe-primary/20">Elevated Experience</div>
                    <h1 className="text-7xl font-black text-hdr tracking-tight uppercase leading-none mb-6">
                        Synchronize <br />Your <span className="text-vibe-primary">Rhythm.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xl text-muted font-medium leading-relaxed">
                        Select a tier to unlock hyper-fidelity audio benchmarks, exclusive curator playlists, and advanced Account control features.
                    </p>
                </div>

                {/* Plans Grid */}
                <div className="grid md:grid-cols-3 gap-8 items-center mb-24">
                    
                    {/* Basic Tier */}
                    <PlanCard 
                        title="Standard Listener" 
                        price="Free" 
                        sub="Entry-level access"
                        features={["320kbps Audio Quality", "Unlimited Standard Playlists", "Desktop Terminal Access", "Ad-supported Experience"]}
                        icon={<Headphones size={32} className="text-slate-400" />}
                    />

                    {/* Pro Tier (Featured) */}
                    <PlanCard 
                        featured 
                        title="Pro Sound Architect" 
                        price="$9.99" 
                        sub="The definitive hi-fi benchmark"
                        features={[
                            "Hi-Res Lossless Audio (24-bit)", 
                            "Offline Repository Access", 
                            "Infinite multi-device Sync", 
                            "Zero Advertisement Interference",
                            "Artist Direct Connect",
                            "Priority Feature Access"
                        ]}
                        icon={<Crown size={40} className="text-white" />}
                    />

                    {/* Team Tier */}
                    <PlanCard 
                        title="Collective Access" 
                        price="$15.99" 
                        sub="Up to 6 synced identities"
                        features={["Everything in Pro Architect", "Synchronized Group Listening", "Shared Audio Repositories", "Admin Control Hub", "Curator Support Line"]}
                        icon={<Star size={32} className="text-blue-400" />}
                    />

                </div>

                {/* Bottom Stats / Trust */}
                <div className="glass-card p-12 bg-gradient-to-r from-vibe-950 via-vibe-primary/5 to-blue-900/10 grid grid-cols-2 md:grid-cols-4 gap-12 text-center overflow-hidden relative">
                    <div className="absolute inset-0 aura-effect opacity-20 pointer-events-none" />
                    <TrustStat title="4.5M" label="Active Rhythm Accounts" />
                    <TrustStat title="99.9%" label="Sync Uptime" />
                    <TrustStat title="192kHz" label="Max Frequency Range" />
                    <TrustStat title="256-bit" label="Security Encryption" />
                </div>
            </div>
            <div className="h-40" />
        </MainLayout>
    );
};

const PlanCard = ({ featured = false, title, price, sub, features, icon }) => (
    <div className={`glass-card p-12 relative flex flex-col h-full transform transition-all duration-500 hover:scale-105 ${featured ? 'border-vibe-primary bg-vibe-primary/5 pt-16 z-10 shadow-hdr-orange/40 ring-1 ring-vibe-primary/50' : 'hover:border-white/20'}`}>
        {featured && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-vibe-primary text-white font-black text-[12px] px-8 py-3 rounded-2xl shadow-hdr-orange uppercase tracking-widest whitespace-nowrap">
                Most Optimized Account
            </div>
        )}
        
        <div className={`mb-8 p-4 rounded-3xl w-fit ${featured ? 'bg-vibe-primary shadow-hdr-orange' : 'bg-white/5 border border-white/5'}`}>
            {icon}
        </div>

        <h3 className={`text-2xl font-black uppercase tracking-tight mb-2 ${featured ? 'text-hdr' : 'text-slate-200'}`}>{title}</h3>
        <div className="flex items-baseline gap-2 mb-6">
            <span className={`text-5xl font-black tracking-tighter ${featured ? 'text-vibe-primary' : 'text-hdr'}`}>{price}</span>
            {price !== 'Free' && <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">/ Month</span>}
        </div>
        <p className="text-muted font-bold text-sm mb-10 pb-8 border-b border-white/5">{sub}</p>

        <div className="space-y-6 flex-1 mb-12">
            {features.map((f, i) => (
                <div key={i} className="flex items-start gap-4 group">
                    <div className={`p-1 rounded-full mt-1 ${featured ? 'bg-vibe-primary/20 text-vibe-primary' : 'bg-white/10 text-slate-500'}`}>
                        <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="text-[14px] font-bold text-hdr opacity-80 group-hover:opacity-100 transition-opacity leading-tight tracking-tight">{f}</span>
                </div>
            ))}
        </div>

        <button className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all active:scale-95 ${featured ? 'bg-vibe-primary text-white shadow-hdr-orange hover:shadow-hdr-orange/80' : 'bg-white/10 text-white hover:bg-white/20'}`}>
            Initialize Account
        </button>
    </div>
);

const TrustStat = ({ title, label }) => (
    <div className="relative z-10">
        <div className="text-4xl font-black text-hdr tracking-tighter mb-2">{title}</div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</div>
    </div>
);

export default Pricing;
