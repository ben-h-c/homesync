import { useState, useEffect, useRef } from 'react';
import usePortalStore from '../../store/portalStore';
import { Send } from 'lucide-react';

export default function PortalMessages() {
  const { data, portalFetch } = usePortalStore();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const load = () => { portalFetch('/messages').then(setMessages).catch(() => {}); };
  useEffect(() => { load(); const interval = setInterval(load, 15000); return () => clearInterval(interval); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await portalFetch('/messages', { method: 'POST', body: JSON.stringify({ message: text }) });
      setText('');
      load();
    } catch (err) { alert(err.message); }
    finally { setSending(false); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Messages</h2>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3 mb-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No messages yet. Send a message to your contractor below.</p>
          </div>
        )}
        {messages.map((m) => {
          const isClient = m.sender_type === 'client';
          return (
            <div key={m.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isClient ? 'bg-primary text-white rounded-br-md' : 'bg-gray-100 text-gray-900 rounded-bl-md'}`}>
                <p className={`text-xs mb-0.5 ${isClient ? 'text-white/70' : 'text-gray-500'}`}>{m.sender_name}</p>
                <p className="text-sm">{m.message}</p>
                <p className={`text-[10px] mt-1 ${isClient ? 'text-white/50' : 'text-gray-400'}`}>
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()} />
        <button onClick={sendMessage} disabled={sending || !text.trim()}
          className="px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
