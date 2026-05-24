import React, { useState } from 'react';
import MainLayout from '../components/MainLayout';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  Plus, 
  Minus,
  MessageSquare,
  LifeBuoy
} from 'lucide-react';

const FAQ = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [openIndex, setOpenIndex] = useState(0);

    const questions = [
        { q: "What is HSR-grade audio?", a: "High-Res Sound benchmarks (HSR) represent the gold standard in audio fidelity. We stream at 24-bit/192kHz to ensure every nuance of the artist's original recording is preserved in its digital form." },
        { q: "How do I request account deletion?", a: "Navigate to Settings > Danger Zone and select 'Request Account Deletion'. Your request will be transmitted to our administrators for approval to ensure data integrity and security." },
        { q: "Can I synchronize multiple playback Accounts?", a: "Yes, Pro Sound Architects and Collective plans support multi-device synchronization, allowing you to stream seamlessly across desktop terminals, mobile devices, and high-end audio receivers." },
        { q: "What are 'Rhythm Keepers'?", a: "Rhythm Keepers are our community contributors who help curate global playlists and identify emerging sound trends within the terminal ecosystem." },
        { q: "How do I update my security credentials?", a: "Security credentials can be modified in the 'Security' section of your Settings panel. We recommend rotating your keys every 90 days for optimal Account protection." }
    ];

    const filteredQs = questions.filter(item => 
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <MainLayout>
            <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-700">
                
                {/* Header */}
                <div className="text-center mb-20 py-12">
                    <h1 className="text-6xl font-black text-hdr tracking-tight uppercase leading-none mb-6">
                        Technical <br /><span className="text-vibe-primary">Inquiries</span>
                    </h1>
                    <p className="max-w-xl mx-auto text-lg text-muted font-medium leading-relaxed">
                        Explore our hyper-fidelity knowledge base and platform documentation.
                    </p>
                </div>

                {/* FAQ Search */}
                <div className="relative group max-w-2xl mx-auto mb-20">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-vibe-primary transition-all" size={24} />
                    <input 
                        type="text"
                        placeholder="Search for answers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full panel-soft border border-white/10 rounded-3xl py-6 pl-16 pr-8 text-lg text-hdr font-bold focus:ring-2 focus:ring-vibe-primary/30 transition-all placeholder:text-slate-600"
                    />
                </div>

                {/* FAQ Accodion */}
                <div className="space-y-6 mb-24">
                    {filteredQs.map((item, i) => (
                        <div key={i} className={`glass-card overflow-hidden transition-all duration-500 ${openIndex === i ? 'border-vibe-primary/30 ring-1 ring-vibe-primary/20' : 'hover:border-white/20'}`}>
                            <button 
                                onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
                                className="w-full px-10 py-8 flex items-center justify-between text-left group"
                            >
                                <span className={`text-xl font-bold uppercase tracking-tight transition-colors ${openIndex === i ? 'text-vibe-primary' : 'text-hdr group-hover:text-vibe-primary'}`}>{item.q}</span>
                                <div className={`p-2 rounded-xl transition-all ${openIndex === i ? 'bg-vibe-primary text-white rotate-180 shadow-hdr-orange' : 'bg-white/5 text-slate-500 group-hover:bg-vibe-primary/10 group-hover:text-vibe-primary'}`}>
                                    <ChevronDown size={24} />
                                </div>
                            </button>
                            <div className={`overflow-hidden transition-all duration-700 ease-in-out ${openIndex === i ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="px-10 pb-10 pt-2 text-muted text-lg leading-relaxed font-medium max-w-3xl">
                                    <div className="w-12 h-1 bg-vibe-primary/30 mb-6 rounded-full" />
                                    {item.a}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Support Block */}
                <div className="glass-card p-12 bg-vibe-primary/5 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-vibe-primary rounded-3xl flex items-center justify-center shadow-hdr-orange">
                            <LifeBuoy className="text-white" size={40} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-hdr uppercase tracking-tight mb-1">Still confused?</h3>
                            <p className="text-muted font-bold uppercase tracking-widest text-xs">Direct terminal access is available 24/7</p>
                        </div>
                    </div>
                    <a href="/contact" className="btn-hdr-orange px-10 py-5 w-full md:w-auto">
                        <MessageSquare size={20} /> Open Ticket
                    </a>
                </div>

            </div>
            <div className="h-40" />
        </MainLayout>
    );
};

export default FAQ;
