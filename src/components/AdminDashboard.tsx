import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  Filter,
  LogOut,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  MessageCircle,
  Ghost,
  Heart,
  Trash2,
  RefreshCw,
  Eye,
  X
} from 'lucide-react';
import type { VisitorRecord } from '../../server/adminService.ts';

interface AdminDashboardProps {
  token: string;
  adminUsername: string;
  onLogout: () => void;
  onBackToWebsite: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  adminUsername,
  onLogout,
  onBackToWebsite
}) => {
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'declined' | 'in_progress'>('all');
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchVisitors = async () => {
    if (!token) {
      onLogout();
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/visitors', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-store, no-cache'
        }
      });

      if (res.status === 401) {
        // Token expired or invalid -> force logout and wipe memory
        onLogout();
        return;
      }

      const data = await res.json();
      if (res.ok && data.visitors) {
        setVisitors(data.visitors);
      } else {
        setError(data.error || 'Failed to fetch visitors.');
      }
    } catch (err: any) {
      setError('Network failure while fetching visitor data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [token]);

  const handleDeleteVisitor = async (visitorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this visitor record?')) return;

    setDeletingId(visitorId);
    try {
      const res = await fetch(`/api/admin/visitors/${visitorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setVisitors(prev => prev.filter(v => v.visitorId !== visitorId));
        if (selectedVisitor?.visitorId === visitorId) {
          setSelectedVisitor(null);
        }
      }
    } catch {
      alert('Failed to delete visitor record.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredVisitors = visitors.filter(v => {
    const matchesSearch = v.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.snapchatId && v.snapchatId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.personalMessage && v.personalMessage.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || v.completionStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string, finalAnswer?: 'YES' | 'NO' | null) => {
    if (finalAnswer === 'YES' || status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>YES Proposal ❤️</span>
        </span>
      );
    }
    if (finalAnswer === 'NO' || status === 'declined') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">
          <XCircle className="w-3 h-3 text-rose-400" />
          <span>NO Response</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
        <Clock className="w-3 h-3 text-amber-400" />
        <span>In Progress</span>
      </span>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Top Bar with Navigation and Logout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-rose-500/20 mb-8">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05, x: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBackToWebsite}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-rose-200 text-xs border border-rose-500/30 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Wapas jao (Back)</span>
          </motion.button>

          <div>
            <h1 className="text-xl md:text-2xl font-serif-display font-bold text-rose-100 flex items-center gap-2">
              <Users className="w-6 h-6 text-rose-400" />
              <span>Visitor Responses Dashboard</span>
            </h1>
            <p className="text-xs text-rose-200/60">
              Logged in as <span className="text-rose-300 font-semibold">{adminUsername}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchVisitors}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-rose-200 text-xs border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-200 text-xs border border-red-500/40 flex items-center gap-1.5 font-medium shadow-md transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </motion.button>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-black/40 border border-rose-500/20">
          <p className="text-xs text-rose-300/60 font-medium">Total Sessions</p>
          <p className="text-2xl font-bold text-rose-100 mt-1">{visitors.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/20">
          <p className="text-xs text-emerald-300/60 font-medium">YES Answers ❤️</p>
          <p className="text-2xl font-bold text-emerald-300 mt-1">
            {visitors.filter(v => v.finalAnswer === 'YES').length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-black/40 border border-rose-500/20">
          <p className="text-xs text-rose-300/60 font-medium">NO Answers</p>
          <p className="text-2xl font-bold text-rose-300 mt-1">
            {visitors.filter(v => v.finalAnswer === 'NO').length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-black/40 border border-amber-500/20">
          <p className="text-xs text-amber-300/60 font-medium">In Progress</p>
          <p className="text-2xl font-bold text-amber-300 mt-1">
            {visitors.filter(v => !v.finalAnswer).length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by visitor name, Snapchat ID, or message..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-rose-500/20 text-rose-100 text-xs placeholder-rose-300/30 focus:outline-none focus:border-rose-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-rose-400/60" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2.5 rounded-xl bg-black/40 border border-rose-500/20 text-rose-100 text-xs focus:outline-none focus:border-rose-400 cursor-pointer"
          >
            <option value="all" className="bg-[#190712]">All Statuses</option>
            <option value="completed" className="bg-[#190712]">Completed (YES)</option>
            <option value="declined" className="bg-[#190712]">Declined (NO)</option>
            <option value="in_progress" className="bg-[#190712]">In Progress</option>
          </select>
        </div>
      </div>

      {/* Visitors List / Cards */}
      {loading ? (
        <div className="py-20 text-center text-rose-300/60 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-7 h-7 animate-spin text-rose-400" />
          <p className="text-sm">Loading visitor responses from database...</p>
        </div>
      ) : filteredVisitors.length === 0 ? (
        <div className="py-16 text-center bg-black/20 border border-rose-500/20 rounded-2xl p-8">
          <Users className="w-10 h-10 text-rose-400/40 mx-auto mb-3" />
          <p className="text-base text-rose-200 font-medium">No visitor records found</p>
          <p className="text-xs text-rose-300/50 mt-1">
            {searchQuery ? 'Try adjusting your search query or filter.' : 'When visitors experience the site, their answers will appear here in real time.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVisitors.map(visitor => (
            <motion.div
              key={visitor.visitorId}
              whileHover={{ scale: 1.01 }}
              onClick={() => setSelectedVisitor(visitor)}
              className="p-5 rounded-2xl bg-gradient-to-b from-[#210918] to-[#14040e] border border-rose-500/30 shadow-lg cursor-pointer hover:border-rose-400/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-rose-100 flex items-center gap-2">
                      <span>{visitor.visitorName}</span>
                      <Heart className="w-4 h-4 text-rose-400 fill-rose-500" />
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-rose-300/60 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(visitor.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(visitor.completionStatus, visitor.finalAnswer)}
                  </div>
                </div>

                {/* Quick preview snippets */}
                <div className="space-y-2 text-xs text-rose-200/80 mb-4 bg-black/30 p-3 rounded-xl border border-white/5">
                  {visitor.snapchatAnswer && (
                    <div className="flex items-center gap-1.5">
                      <Ghost className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">
                        <strong className="text-rose-300">Snapchat:</strong> {visitor.snapchatAnswer}
                        {visitor.snapchatId ? ` (ID: ${visitor.snapchatId})` : ''}
                      </span>
                    </div>
                  )}

                  {visitor.memoryAnswer && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">
                        <strong className="text-rose-300">Memory:</strong> {visitor.memoryAnswer}
                      </span>
                    </div>
                  )}

                  {visitor.personalMessage && (
                    <div className="flex items-start gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-pink-400 shrink-0 mt-0.5" />
                      <p className="line-clamp-2 text-rose-100/90 italic">
                        "{visitor.personalMessage}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-rose-500/20 text-xs">
                <span className="text-rose-400 font-medium inline-flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </span>

                <button
                  onClick={e => handleDeleteVisitor(visitor.visitorId, e)}
                  disabled={deletingId === visitor.visitorId}
                  className="p-1.5 rounded-lg text-rose-400/60 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                  title="Delete record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Visitor Detail Modal */}
      <AnimatePresence>
        {selectedVisitor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedVisitor(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="relative max-w-xl w-full bg-gradient-to-b from-[#250d1b] to-[#12030b] border border-rose-500/40 rounded-2xl p-6 md:p-8 shadow-2xl my-8 text-left"
            >
              <button
                onClick={() => setSelectedVisitor(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-rose-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold font-serif-display text-rose-100">
                    {selectedVisitor.visitorName}
                  </h2>
                  <Heart className="w-5 h-5 text-rose-400 fill-rose-500" />
                </div>
                <p className="text-xs text-rose-300/60">
                  Session ID: <code className="text-rose-200">{selectedVisitor.visitorId}</code>
                </p>
                <div className="mt-2">
                  {getStatusBadge(selectedVisitor.completionStatus, selectedVisitor.finalAnswer)}
                </div>
              </div>

              <div className="space-y-4 text-xs md:text-sm text-rose-100 max-h-[60vh] overflow-y-auto pr-2">
                {/* 1. Name */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-rose-500/20">
                  <span className="text-rose-400 text-xs block mb-1 font-semibold">1. Visitor Name (Scene 1)</span>
                  <p className="text-sm font-medium">{selectedVisitor.visitorName}</p>
                </div>

                {/* 2. Snapchat Question */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-rose-500/20">
                  <span className="text-rose-400 text-xs block mb-1 font-semibold">2. Snapchat Question (Scene 4)</span>
                  <p className="text-sm font-medium">{selectedVisitor.snapchatAnswer || 'Not answered yet'}</p>
                  {selectedVisitor.snapchatId && (
                    <p className="mt-1.5 text-xs text-amber-300 font-mono">
                      Snapchat ID: {selectedVisitor.snapchatId}
                    </p>
                  )}
                </div>

                {/* 3. Memory Question */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-rose-500/20">
                  <span className="text-rose-400 text-xs block mb-1 font-semibold">3. Memory Question (Scene 6)</span>
                  <p className="text-sm font-medium">{selectedVisitor.memoryAnswer || 'Not answered yet'}</p>
                  {selectedVisitor.memoryFollowUp && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <span className="text-rose-300/70 text-xs block mb-0.5">Follow-up Response:</span>
                      <p className="text-sm italic font-romantic text-rose-200 text-lg">"{selectedVisitor.memoryFollowUp}"</p>
                    </div>
                  )}
                </div>

                {/* 4. Personal Message */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-rose-500/20">
                  <span className="text-rose-400 text-xs block mb-1 font-semibold">4. Personal Message (Scene 7)</span>
                  <p className="text-sm italic font-romantic text-rose-200 text-xl leading-relaxed whitespace-pre-wrap">
                    {selectedVisitor.personalMessage ? `"${selectedVisitor.personalMessage}"` : 'No message submitted'}
                  </p>
                </div>

                {/* 5. Final Proposal Answer */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-rose-500/20">
                  <span className="text-rose-400 text-xs block mb-1 font-semibold">5. Final Proposal Answer (Scene 8)</span>
                  <p className="text-base font-bold">
                    {selectedVisitor.finalAnswer ? (
                      <span className={selectedVisitor.finalAnswer === 'YES' ? 'text-emerald-400' : 'text-rose-400'}>
                        {selectedVisitor.finalAnswer} {selectedVisitor.finalAnswer === 'YES' ? '❤️' : ''}
                      </span>
                    ) : (
                      <span className="text-amber-400">Not reached yet</span>
                    )}
                  </p>
                </div>

                {/* Timestamp info */}
                <div className="text-[11px] text-rose-300/40 pt-2">
                  <p>First Created: {new Date(selectedVisitor.createdAt).toLocaleString()}</p>
                  <p>Last Updated: {new Date(selectedVisitor.updatedAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-rose-500/20 flex justify-end">
                <button
                  onClick={() => setSelectedVisitor(null)}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-rose-100 text-xs font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
