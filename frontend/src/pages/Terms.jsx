import React from 'react';
import MainLayout from '../components/MainLayout';
import { 
  Terminal, 
  ShieldCheck, 
  AlertTriangle, 
  Scale, 
  Cpu, 
  Zap,
  Lock,
  Globe
} from 'lucide-react';

const Terms = () => {
    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto w-full animate-in fade-in duration-700">
                
                {/* Header */}
                <div className="mb-20 text-center py-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-bold tracking-widest uppercase mb-6 border border-rose-500/20">Operational Service Level Agreement</div>
                    <h1 className="text-6xl font-black text-hdr tracking-tight uppercase leading-none mb-6">
                        Terms of <br /><span className="text-vibe-primary">Terminal</span>
                    </h1>
                    <p className="max-w-xl mx-auto text-lg text-muted font-medium leading-relaxed">
                        Governance of Account access, rhythmic distribution, and platform synchronization.
                    </p>
                </div>

                {/* Content Sections */}
                <div className="space-y-16 mb-24">
                    
                    <TermsSection 
                        icon={<Terminal className="text-vibe-primary" size={24} />} 
                        title="1. License for Synchronization" 
                        text="You are granted a non-exclusive license to synchronize our rhythmic frequencies for personal, non-commercial use on up to 10 Accounts simultaneously."
                    />

                    <TermsSection 
                        icon={<Cpu className="text-blue-400" size={24} />} 
                        title="2. Prohibited Terminal Actions" 
                        text="Reverse-engineering the audio codecs, unauthorized frequency scraping, or attempt to bypass Account security protocols will result in permanent identity expiration."
                    />

                    <TermsSection 
                        icon={<Scale className="text-purple-400" size={24} />} 
                        title="3. Distribution Protocols" 
                        text="All rhythmic content is the intellectual property of the sound architects. Redistribution of these frequencies as unauthorized Accounts is strictly prohibited."
                    />

                    <TermsSection 
                        icon={<ShieldCheck className="text-emerald-500" size={24} />} 
                        title="4. Sync Liability" 
                        text="We ensure 99.9% sync uptime but are not responsible for rhythmic disruptions caused by your local hardware failures or ISP frequency interference."
                    />

                </div>

                {/* Warning / Disclaimer */}
                <div className="glass-card p-10 bg-rose-500/5 flex items-center justify-between gap-10">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-900/30 shrink-0">
                            <AlertTriangle className="text-white" size={32} />
                        </div>
                        <p className="text-muted font-bold uppercase tracking-widest text-[10px] leading-relaxed">
                            Failure to comply with these terms will result in immediate termination of all rhythmic Accounts and security key expiration without notice.
                        </p>
                    </div>
                    <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest whitespace-nowrap underline underline-offset-8">Execute Agreement</div>
                </div>

            </div>
            <div className="h-40" />
        </MainLayout>
    );
};

const TermsSection = ({ icon, title, text }) => (
    <div className="group">
        <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl group-hover:scale-110 transition-all shadow-lg group-hover:shadow-hdr-orange/10">
                {icon}
            </div>
            <h3 className="text-2xl font-black text-hdr uppercase tracking-tight">{title}</h3>
        </div>
        <p className="text-muted leading-relaxed font-bold text-lg opacity-80 group-hover:opacity-100 transition-opacity pl-[60px]">
            {text}
        </p>
    </div>
);

export default Terms;
