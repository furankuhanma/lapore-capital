import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Loader2, RefreshCw } from 'lucide-react';
import { TransactionService } from '../src/lib/transactionService';

interface TransactionHistoryProps {
  userId: string;
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

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ userId, onRefresh }) => {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 text-ethblue animate-spin" />
        <p className="text-slate-500 text-sm">Loading transactions...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 opacity-60">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
          <HistoryIcon className="w-8 h-8 text-slate-700" />
        </div>
        <div className="text-center">
          <p className="text-slate-500 text-sm font-medium">No transactions yet</p>
          <p className="text-slate-600 text-xs mt-1">Your transaction history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          Transaction History
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
          const otherParty = isSent ? tx.receiver : tx.sender;
          const otherPartyName = otherParty?.full_name || 'Unknown User';
          const otherPartyUsername = otherParty?.username || '';

          return (
            <div
              key={tx.id}
              className="bg-cardbg border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all group"
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
                        {isSent ? 'Sent to' : 'Received from'} {otherPartyName}
                      </h4>
                      {otherPartyUsername && (
                        <p className="text-slate-500 text-xs mt-0.5">
                          @{otherPartyUsername}
                        </p>
                      )}
                      {tx.description && (
                        <p className="text-slate-600 text-xs mt-1 truncate">
                          {tx.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-sm ${
                        isSent ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {isSent ? '-' : '+'}₱{tx.amount.toFixed(2)}
                      </p>
                      <p className="text-slate-600 text-xs mt-0.5">
                        {formatDate(tx.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const HistoryIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    {...props} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M12 8v4l3 3" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

export default TransactionHistory;