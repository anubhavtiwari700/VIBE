import React, { useState } from 'react';
import MainLayout from '../components/MainLayout';
import { 
  Send, 
  Mail, 
  MessageSquare, 
  Phone, 
  MapPin, 
  CornerDownRight, 
  Loader2,
  CheckCircle2,
  Headphones,
  Globe
} from 'lucide-react';

const Contact = () => {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        topic: 'Complain',
        message: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        
        const subject = `VIBE TERMINAL: Signal from ${formData.name}`;
        const body = `Curator Identity: ${formData.name}\nResponse Frequency: ${formData.email}\nTopic: ${formData.topic}\n\n--- DISPATCH CONTENT ---\n\n${formData.message}`;
        
        const mailtoUrl = `mailto:anubhavtiwari9598@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        setTimeout(() => {
            window.location.href = mailtoUrl;
            setLoading(false);
            setSent(true);
        }, 1200);
    };

    return (
        <MainLayout>
            <div className="max-w-6xl mx-auto w-full animate-in fade-in duration-700">
                
                {/* Header */}
                <div className="mb-20">
                    <h1 className="text-6xl font-black text-hdr tracking-tight uppercase leading-none mb-6">
                        Open the <br /><span className="text-vibe-primary">Terminal</span>
                    </h1>
                    <p className="max-w-xl text-lg text-muted font-medium leading-relaxed">
                        Need assistance? Our support engineers and curators are available 24/7 to synchronize your experience.
                    </p>
                </div>

                <div className="grid lg:grid-cols-[1fr_400px] gap-16 items-start">
                    
                    {/* Contact Form */}
                    <div className="glass-card p-12 relative overflow-hidden backdrop-blur-3xl">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.03] rotate-12 pointer-events-none">
                            <Send size={240} />
                        </div>
                        
                        {sent ? (
                            <div className="py-12 text-center animate-in zoom-in-95 duration-500">
                                <CheckCircle2 size={80} className="text-emerald-500 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
                                <h2 className="text-3xl font-black text-hdr uppercase mb-4">Message Dispatched</h2>
                                <p className="text-muted font-medium max-w-sm mx-auto">Your signal has been received by our terminal. A curator will reach out shortly.</p>
                                <button onClick={() => setSent(false)} className="mt-8 text-vibe-primary font-bold uppercase tracking-widest text-xs hover:underline underline-offset-8">Send another signal</button>
                            </div>
                        ) : (
                            <form className="space-y-8 relative z-10" onSubmit={handleSubmit}>
                                <div className="grid sm:grid-cols-2 gap-8">
                                    <FormInput 
                                        label="Your Identity" 
                                        placeholder="Full Name" 
                                        required 
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                    <FormInput 
                                        label="Frequency (Email)" 
                                        placeholder="name@domain.com" 
                                        type="email" 
                                        required 
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
{/* Topic selection removed as requested */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Your Signal</label>
                                    <textarea 
                                        className="w-full panel-soft border border-white/5 rounded-2xl px-6 py-5 text-hdr font-medium placeholder-slate-600 focus:ring-2 focus:ring-vibe-primary/30 min-h-[160px] transition-all resize-none" 
                                        placeholder="Type your message here..."
                                        required
                                        value={formData.message}
                                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                                    />
                                </div>
                                <button className="bg-red-500 hover:bg-red-600 text-white font-bold px-10 py-5 w-full sm:w-auto shadow-lg text-lg rounded-2xl flex items-center justify-center gap-3 transition-colors">
                                    {loading ? <Loader2 className="animate-spin" size={24} /> : <><MessageSquare size={20} /> Complain</>}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Contact Sidebar Details */}
                    <div className="space-y-12">
                        {/* Information blocks removed as requested */}
                    </div>

                </div>
            </div>
            {/* Height Spacer */}
            <div className="h-24"></div>
        </MainLayout>
    );
};

const FormInput = ({ label, ...props }) => (
    <div className="space-y-3">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{label}</label>
        <input 
            className="w-full panel-soft border border-white/5 rounded-2xl px-6 py-4 text-hdr font-medium placeholder-slate-600 focus:ring-2 focus:ring-vibe-primary/30 transition-all font-bold" 
            {...props}
        />
    </div>
);

const TopicBtn = ({ label, active = false, onClick }) => (
    <button 
        type="button" 
        onClick={onClick}
        className={`px-4 py-3 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all ${active ? 'bg-vibe-primary/10 border-vibe-primary/50 text-vibe-primary' : 'bg-white/5 border-white/5 text-slate-500 hover:text-hdr hover:border-white/20'}`}
    >
        {label}
    </button>
);

const ContactBlock = ({ icon, title, lines }) => (
    <div className="group">
        <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:scale-110 group-hover:shadow-hdr-orange/10 transition-all">
                {icon}
            </div>
            <h4 className="text-sm font-black text-hdr uppercase tracking-widest">{title}</h4>
        </div>
        <div className="space-y-1.5 pl-[60px]">
            {lines.map((line, i) => (
                <div key={i} className="flex items-center gap-3 text-muted font-medium hover:text-hdr transition-colors">
                    <CornerDownRight size={12} className="text-vibe-primary/50" />
                    {line}
                </div>
            ))}
        </div>
    </div>
);

export default Contact;
