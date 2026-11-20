import React, { useEffect, useState } from 'react';
import { Send, MessageSquare, Building2, User, RefreshCw, Hash } from 'lucide-react';
import api from '../../services/api';
import { ChatMessage } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const ChatPage: React.FC = () => {
  const { hospitalFacility, user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState('general');
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    try {
      const res = await api.get('/chats', {
        params: { channel, facility: hospitalFacility },
      });
      setMessages(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [channel, hospitalFacility]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setSending(true);
    try {
      await api.post('/chats', {
        message: inputMessage.trim(),
        channel,
        recipientFacility: 'ALL',
      });
      setInputMessage('');
      fetchMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden max-w-7xl mx-auto">
      {/* Channels Sidebar */}
      <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 flex flex-col justify-between shrink-0">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
            Hospital Comms Channels
          </h2>
          <div className="space-y-1">
            {[
              { id: 'general', label: 'Inter-Hospital General' },
              { id: 'referrals', label: 'Transfer Coordination' },
              { id: 'nicu_ward', label: 'NICU Rapid Response' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setChannel(c.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition ${
                  channel === c.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-500">
          <p className="font-bold text-slate-800">Active Node</p>
          <p className="mt-0.5">{hospitalFacility} Neonatal Station</p>
        </div>
      </div>

      {/* Chat Messages Main Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-slate-900 capitalize">#{channel} Channel</span>
            <span className="text-xs text-slate-400 font-medium ml-2">
              Shared between PGI, RML, KGMU & District Command
            </span>
          </div>
          <button
            onClick={fetchMessages}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600 mr-2" />
              Loading communication feed...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
              <p>No messages in this channel yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">Start a message to communicate with peer hospitals.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderFacility?.toUpperCase() === hospitalFacility?.toUpperCase();

              return (
                <div
                  key={msg._id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-1">
                    <span className="font-bold text-slate-700">{msg.senderName}</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 font-semibold text-slate-600 border border-slate-200 text-[10px]">
                      {msg.senderFacility}
                    </span>
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div
                    className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex items-center gap-3">
          <input
            type="text"
            placeholder={`Message #${channel}...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition"
          />
          <button
            type="submit"
            disabled={sending || !inputMessage.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
