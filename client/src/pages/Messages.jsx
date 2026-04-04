import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchAPI } from '../api/client';
import {
  MessageSquare, Send, User, ArrowLeft, Circle, Clock,
} from 'lucide-react';

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  // Load conversations
  useEffect(() => {
    loadConversations();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Auto-select job from URL param (only on initial load)
  const initialJobRef = useRef(searchParams.get('job'));
  useEffect(() => {
    if (initialJobRef.current && conversations.length > 0) {
      const conv = conversations.find((c) => String(c.job_id) === initialJobRef.current);
      if (conv) selectConversation(conv);
      initialJobRef.current = null;
    }
  }, [conversations]);

  const loadConversations = async () => {
    try {
      const data = await fetchAPI('/jobs/conversations/list');
      setConversations(Array.isArray(data) ? data : []);
    } catch { setConversations([]); }
    finally { setLoading(false); }
  };

  const selectConversation = async (conv) => {
    setSelectedJob(conv);
    setMsgLoading(true);
    setSearchParams({ job: conv.job_id }, { replace: true });
    try {
      const data = await fetchAPI(`/jobs/${conv.job_id}/messages`);
      setMessages(Array.isArray(data) ? data : []);
      // Update unread count locally
      setConversations((prev) =>
        prev.map((c) => c.job_id === conv.job_id ? { ...c, unread_count: 0 } : c)
      );
    } catch { setMessages([]); }
    finally { setMsgLoading(false); }

    // Start polling for this conversation
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const data = await fetchAPI(`/jobs/${conv.job_id}/messages`);
        setMessages(Array.isArray(data) ? data : []);
      } catch {}
    }, 10000);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedJob || sending) return;
    setSending(true);
    try {
      await fetchAPI(`/jobs/${selectedJob.job_id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: newMessage.trim() }),
      });
      setNewMessage('');
      // Refresh messages
      const data = await fetchAPI(`/jobs/${selectedJob.job_id}/messages`);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) { alert(err.message); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="flex h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Conversation list */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col ${selectedJob ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Messages
              {totalUnread > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalUnread}
                </span>
              )}
            </h1>
          </div>

          {conversations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div>
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No conversations yet</p>
                <p className="text-gray-400 text-xs mt-1">Messages will appear when clients use their portal</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.job_id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    selectedJob?.job_id === conv.job_id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">
                          {conv.client_name || conv.client_email || 'Client'}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {formatTime(conv.last_message?.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{conv.title}</p>
                      {conv.last_message && (
                        <p className={`text-sm truncate mt-1 ${conv.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                          {conv.last_message.sender_type === 'contractor' && <span className="text-gray-400">You: </span>}
                          {conv.last_message.message}
                        </p>
                      )}
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message thread */}
        <div className={`flex-1 flex flex-col ${!selectedJob ? 'hidden md:flex' : 'flex'}`}>
          {selectedJob ? (
            <>
              {/* Thread header */}
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <button
                  onClick={() => { setSelectedJob(null); setSearchParams({}); if (pollRef.current) clearInterval(pollRef.current); }}
                  className="md:hidden p-1 hover:bg-gray-100 rounded"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-medium text-sm">{selectedJob.client_name || 'Client'}</h2>
                  <p className="text-xs text-gray-500">{selectedJob.title} &middot; {selectedJob.service_type || 'Project'}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-400 text-sm">No messages yet. Send the first one!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_type === 'contractor' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        msg.sender_type === 'contractor'
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_type === 'contractor' ? 'text-white/60' : 'text-gray-400'
                        }`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Compose */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Select a conversation</p>
                <p className="text-gray-400 text-sm mt-1">Choose from your active client conversations</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
