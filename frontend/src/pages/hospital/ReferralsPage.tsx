import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowRightLeft,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Inbox,
  SendHorizontal,
  Clock,
  User,
  Building2,
  MessageSquare,
} from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Referral, ChatMessage } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { TestBalanceButton } from '../../components/common/TestBalanceButton';
import clsx from 'clsx';

export const ReferralsPage: React.FC = () => {
  const { hospitalFacility, user } = useAuth();

  // Referrals state
  const [activeTab, setActiveTab] = useState<'incoming' | 'sent'>('incoming');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Fetch referrals based on active tab
  const fetchReferrals = async () => {
    setReferralsLoading(true);
    try {
      const res = await api.get('/referrals', {
        params: { type: activeTab },
      });
      setReferrals(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setReferralsLoading(false);
    }
  };

  // Fetch chat messages
  const fetchMessages = async () => {
    try {
      const res = await api.get('/chats', {
        params: { facility: hospitalFacility, channel: 'general' },
      });
      setMessages(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [activeTab, hospitalFacility]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 6000);
    return () => clearInterval(interval);
  }, [hospitalFacility]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Accept Referral
  const handleAccept = async (id: string) => {
    setActionInProgress(id);
    try {
      await api.patch(`/referrals/${id}/accept`);
      await fetchReferrals();
    } catch (err) {
      console.error('Failed to accept referral:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Reject Referral
  const handleReject = async (id: string) => {
    const reason = window.prompt('Please enter clinical reason for referral rejection / redirection:');
    if (!reason) return;
    setActionInProgress(id);
    try {
      await api.patch(`/referrals/${id}/reject`, { rejectionReason: reason });
      await fetchReferrals();
    } catch (err) {
      console.error('Failed to reject referral:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Send Chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setSending(true);
    try {
      await api.post('/chats', {
        message: inputMessage.trim(),
        channel: 'general',
        recipientFacility: 'ALL',
      });
      setInputMessage('');
      await fetchMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header: ONLY Heading on left, Percentage Ring on right */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">EHR & Referrals</h1>
        <TestBalanceButton />
      </div>

      {/* Main Split Layout: 50% Referrals Table, 50% One Hospital Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Referral Table (50% Width) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col min-h-[580px]">
          {/* Tabs Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold border border-slate-200">
              <button
                onClick={() => setActiveTab('incoming')}
                className={clsx(
                  'px-3.5 py-1.5 rounded-lg transition inline-flex items-center gap-1.5',
                  activeTab === 'incoming'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Incoming Referrals</span>
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={clsx(
                  'px-3.5 py-1.5 rounded-lg transition inline-flex items-center gap-1.5',
                  activeTab === 'sent'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <SendHorizontal className="w-3.5 h-3.5" />
                <span>Sent Referrals</span>
              </button>
            </div>

            <span className="text-[11px] font-semibold text-slate-500">
              {referrals.length} {activeTab === 'incoming' ? 'Incoming' : 'Sent'}
            </span>
          </div>

          {/* Referrals List Table */}
          <div className="flex-1 overflow-x-auto">
            {referralsLoading ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs font-semibold">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                Loading referrals from MongoDB...
              </div>
            ) : referrals.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  No {activeTab === 'incoming' ? 'incoming' : 'sent'} referrals found
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {activeTab === 'incoming'
                    ? `No other facilities have referred patients to ${hospitalFacility} currently.`
                    : `${hospitalFacility} has not sent external patient referrals.`}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">INFANT / ID</th>
                    <th className="py-3 px-4">{activeTab === 'incoming' ? 'ORIGIN' : 'DESTINATION'}</th>
                    <th className="py-3 px-4">URGENCY</th>
                    <th className="py-3 px-4">BILIRUBIN</th>
                    <th className="py-3 px-4">STATUS</th>
                    {activeTab === 'incoming' && <th className="py-3 px-4 text-right">ACTION</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {referrals.map((ref) => {
                    const isPending = ref.status === 'pending' || ref.status === 'sent';
                    const targetId = ref.referralId || ref._id;

                    return (
                      <tr key={ref._id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{ref.babyName}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{ref.babyUhid}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-[11px]">
                          {activeTab === 'incoming'
                            ? ref.referringCentreName
                            : ref.receivingHospitalName || 'Tertiary Care'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={clsx(
                              'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                              ref.urgency === 'emergency'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : ref.urgency === 'urgent'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            )}
                          >
                            {ref.urgency || 'ROUTINE'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-slate-900 text-xs">
                            {ref.latestBilirubinValue}
                          </span>{' '}
                          <span className="text-[10px] text-slate-500">{ref.latestBilirubinUnit || 'mg/dL'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              ref.status === 'accepted'
                                ? 'reviewed'
                                : ref.status === 'rejected'
                                ? 'critical'
                                : 'pending'
                            }
                            size="sm"
                          >
                            {ref.status?.toUpperCase() || 'PENDING'}
                          </Badge>
                        </td>
                        {activeTab === 'incoming' && (
                          <td className="py-3 px-4 text-right">
                            {isPending ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => handleAccept(targetId)}
                                  disabled={actionInProgress === targetId}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition disabled:opacity-50"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleReject(targetId)}
                                  disabled={actionInProgress === targetId}
                                  className="px-2 py-1 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-lg text-[11px] font-semibold transition disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Completed</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: One Unified Hospital Chat (50% Width) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[580px]">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Hospital Communications</h3>
                <p className="text-[10px] text-slate-500">
                  Inter-facility messaging channel for {hospitalFacility}
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafbfd]">
            {chatLoading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <p className="text-xs font-semibold text-slate-600">No messages in this channel yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Send updates on infant transfers, bed availability, or triage questions.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn =
                  msg.senderFacility?.toUpperCase() === hospitalFacility?.toUpperCase() ||
                  msg.senderId === user?.id;

                return (
                  <div
                    key={msg._id}
                    className={clsx('flex flex-col max-w-[85%]', isOwn ? 'ml-auto items-end' : 'mr-auto items-start')}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-bold text-slate-600">
                        {isOwn ? 'You' : msg.senderName || msg.senderFacility}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={clsx(
                        'px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs',
                        isOwn
                          ? 'bg-blue-600 text-white rounded-tr-xs'
                          : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs'
                      )}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
            <input
              type="text"
              placeholder={`Message other hospitals as ${hospitalFacility}...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={sending}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={sending || !inputMessage.trim()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
