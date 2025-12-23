import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Loader2, RefreshCw, X, User, Calendar, Hash } from 'lucide-react';
import { TransactionService } from '../lib/transactionService';
import { Profile } from '../../src/context/types';

interface ActivityTabProps {
  userId: string;
  currentUser: Profile;
  onRefresh?: () => void;
}

interface TransactionItem {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  currency: string;
  type: 'send' | 'receive';
  timestamp: string;
  description?: string;
  sender?: { full_name: string; username: string };
  receiver?: { full_name: string; username: string };
}

const ActivityTab: React.FC<ActivityTabProps> = ({ userId, currentUser, onRefresh }) => {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  const fetchTransactions = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await TransactionService.getTransactionHistory(userId);
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchTransactions(true);
    if (onRefresh) onRefresh();
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatFullDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 text-ethblue animate-spin" />
        <p className="text-slate-500 text-sm">Loading activity...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 opacity-60">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
          <ArrowUpRight className="w-8 h-8 text-slate-700" />
        </div>
        <div className="text-center">
          <p className="text-slate-500 text-sm font-medium">No transactions yet</p>
          <p className="text-slate-600 text-xs mt-1">Your transaction history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          Recent Activity
        </h3>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`p-2 rounded-full hover:bg-white/5 transition-colors ${refreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {transactions.map((tx) => {
          const isSent = tx.type === 'send';
          const displayAmount = isSent ? -tx.amount : tx.amount;

          return (
            <button
              key={tx.id}
              onClick={() => setSelectedTransaction(tx)}
              className="w-full bg-cardbg border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isSent 
                    ? 'bg-red-500/10 group-hover:bg-red-500/20' 
                    : 'bg-green-500/10 group-hover:bg-green-500/20'
                } transition-colors`}>
                  {isSent ? (
                    <ArrowUpRight className="w-6 h-6 text-red-400" />
                  ) : (
                    <ArrowDownLeft className="w-6 h-6 text-green-400" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-white font-bold text-sm truncate">
                        {isSent ? 'Sent' : 'Received'}
                      </h4>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {formatDate(tx.timestamp)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-sm ${
                        isSent ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {displayAmount > 0 ? '+' : ''}₱{Math.abs(displayAmount).toFixed(2)}
                      </p>
                      <p className="text-slate-600 text-xs mt-0.5">
                        Tap for details
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-cardbg border border-white/10 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white">Transaction Details</h2>
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Amount Badge */}
              <div className="text-center space-y-2">
                <div className={`inline-flex w-20 h-20 rounded-full items-center justify-center ${
                  selectedTransaction.type === 'send' 
                    ? 'bg-red-500/10' 
                    : 'bg-green-500/10'
                }`}>
                  {selectedTransaction.type === 'send' ? (
                    <ArrowUpRight className="w-10 h-10 text-red-400" />
                  ) : (
                    <ArrowDownLeft className="w-10 h-10 text-green-400" />
                  )}
                </div>
                <h3 className={`text-4xl font-black ${
                  selectedTransaction.type === 'send' ? 'text-red-400' : 'text-green-400'
                }`}>
                  {selectedTransaction.type === 'send' ? '-' : '+'}₱{selectedTransaction.amount.toFixed(2)}
                </h3>
                <p className="text-slate-500 text-sm">
                  {selectedTransaction.type === 'send' ? 'Sent' : 'Received'}
                </p>
              </div>

              {/* Transaction Info */}
              <div className="space-y-4">
                {/* Sender */}
                <div className="bg-darkbg border border-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      From
                    </span>
                  </div>
                  <p className="text-white font-bold">
                    {selectedTransaction.sender?.full_name || 'Unknown'}
                  </p>
                  {selectedTransaction.sender?.username && (
                    <p className="text-slate-400 text-sm">
                      @{selectedTransaction.sender.username}
                    </p>
                  )}
                </div>

                {/* Receiver */}
                <div className="bg-darkbg border border-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      To
                    </span>
                  </div>
                  <p className="text-white font-bold">
                    {selectedTransaction.receiver?.full_name || 'Unknown'}
                  </p>
                  {selectedTransaction.receiver?.username && (
                    <p className="text-slate-400 text-sm">
                      @{selectedTransaction.receiver.username}
                    </p>
                  )}
                </div>

                {/* Description */}
                {selectedTransaction.description && (
                  <div className="bg-darkbg border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Hash className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Note
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm">
                      {selectedTransaction.description}
                    </p>
                  </div>
                )}

                {/* Date */}
                <div className="bg-darkbg border border-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Date & Time
                    </span>
                  </div>
                  <p className="text-white text-sm">
                    {formatFullDate(selectedTransaction.timestamp)}
                  </p>
                </div>

                {/* Transaction ID */}
                <div className="bg-darkbg border border-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Hash className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Transaction ID
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs font-mono break-all">
                    {selectedTransaction.id}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedTransaction(null)}
                className="w-full bg-ethblue hover:bg-ethblue/90 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityTab;