import React from 'react';
import MainLayout from '../components/MainLayout';
import { 
  ShieldCheck, 
  Eye, 
  Scan, 
  Fingerprint, 
  Database,
  Lock,
  Globe
} from 'lucide-react';

const Privacy = () => {
    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto w-full animate-in fade-in duration-700">
                
                {/* Header */}
                <div className="mb-20 text-center py-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold tracking-widest uppercase mb-6 border border-blue-500/20">Frequency Transparency Protocol</div>
                    <h1 className="text-6xl font-black text-hdr tracking-tight uppercase leading-none mb-6">
                        Privacy <br /><span className="text-vibe-primary">Architecture</span>
                    </h1>
                    <p className="max-w-xl mx-auto text-lg text-muted font-medium leading-relaxed">
                        How we process your rhythmic data, encrypted Accounts, and platform interactions.
                    </p>
                </div>

                {/* Content Sections */}
                <div className="space-y-16 mb-24">
                    
                    <PolicySection 
                        icon={<Database className="text-vibe-primary" size={24} />} 
                        title="1. Data Ingestion" 
                        text="We collect metadata regarding your listening behaviors to optimize frequency delivery. This includes track interactions, Account connections, and duration of synchronized sessions."
                    />

                    <PolicySection 
                        icon={<ShieldCheck className="text-blue-400" size={24} />} 
                        title="2. Encryption Standards" 
                        text="All rhythmic signals are encrypted using 256-bit AES protocols during transmission. Your security keys are stored in high-security hardware modules and are never accessible to platform administrators."
                    />

                    <PolicySection 
                        icon={<Eye className="text-purple-400" size={24} />} 
                        title="3. Third-party Sync" 
                        text="We do not synchronize your identity Accounts with external market aggregators. Your data remains within the private rhythmic collective."
                    />

                    <PolicySection 
                        icon={<Scan className="text-emerald-500" size={24} />} 
                        title="4. Biometric Sovereignty" 
                        text="If enabled, biometric data for Account access is stored locally on your hardware terminal and is never transmitted to our global servers."
                    />

                </div>

                {/* Contact Footer */}
                <div className="glass-card p-10 bg-vibe-primary/5 text-center">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Questions regarding the architecture?</p>
                    <a href="/contact" className="text-vibe-primary font-black uppercase text-xs hover:underline underline-offset-8">Open a Transparency Ticket</a>
                </div>

            </div>
            <div className="h-40" />
        </MainLayout>
    );
};

const PolicySection = ({ icon, title, text }) => (
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

export default Privacy;
