import React, { useState } from 'react';
import { Lock, Mail, Send, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';

const BlockedScreen = ({ user, logout }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    try {
      // Re-using support endpoint or similar for complaints
      await api.post('/counter/visitor', { 
        type: 'complaint',
        user: user.email,
        message: message 
      });
      setSent(true);
    } catch (err) {
      console.error("Failed to send complaint", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-red-950 via-orange-900 to-red-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card p-10 border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-in fade-in zoom-in duration-500 text-center">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/30 animate-pulse">
          <Lock className="text-red-500" size={40} />
        </div>
        
        <h1 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase italic">
          Access Terminated
        </h1>
        
        <p className="text-orange-200/80 font-bold text-sm mb-8 leading-relaxed">
          Your Account has been restricted for violating core protocols. Access is blocked. Try again after 24 hours.
        </p>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Submit an appeal or complaint..."
                className="w-full h-32 panel-soft bg-black/40 border border-red-500/20 rounded-2xl p-4 text-white text-sm focus:border-red-500/50 transition-all outline-none resize-none"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-red-900/40 flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={18} /> Submit Appeal</>}
            </button>
          </form>
        ) : (
          <div className="py-8 animate-in fade-in slide-in-from-bottom-4">
            <CheckCircle2 className="text-emerald-500 mx-auto mb-4" size={48} />
            <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs">Complaint Logged Successfully</p>
          </div>
        )}

        <button
          onClick={logout}
          className="mt-8 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-[0.3em] transition-colors"
        >
          Terminate Connection (Logout)
        </button>
      </div>
    </div>
  );
};

export default BlockedScreen;
