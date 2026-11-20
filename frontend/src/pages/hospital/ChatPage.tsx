import React, { useEffect, useState } from 'react';
import { Send, MessageSquare, RefreshCw, Hash } from 'lucide-react';
import api from '../../services/api';
import { ChatMessage } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const ChatPage: React.FC = () => {
  const { hospitalFacility } = useAuth();
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
    <div className="h-[calc(100vh-140px)] w-full max-w-[1700px] mx-auto flex bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Channels Sidebar */}
      <div className="w-60 bg-slate-50/80 border-r border-slate-200 p-4 flex flex-col justify-between shrink-0">
        <div>
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
            Hospital Channels
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
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${
                  channel === c.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-500 shadow-xs">
          <p className="font-bold text-slate-800">Active Node</p>
          <p className="mt-0.5 text-blue-700 font-semibold">{hospitalFacility} Neonatal Station</p>
        </div>
      </div>

      {/* Chat Messages Main Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-slate-900 capitalize">#{channel} Channel</span>
            <span className="text-xs text-slate-400 font-normal ml-2 hidden sm:inline">
              Shared between PGI, RML, KGMU & District Command
            </span>
          </div>
          <button
            onClick={fetchMessages}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600 mr-2" />
              Loading communication feed...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">No messages in this channel yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Start a message to communicate with peer hospitals.</p>
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
                    className={`max-w-md px-4 py-2.5 rounded-xl text-xs leading-relaxed shadow-xs ${
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
        <form onSubmit={handleSend} className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-2.5">
          <input
            type="text"
            placeholder={`Message #${channel}...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={sending || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
