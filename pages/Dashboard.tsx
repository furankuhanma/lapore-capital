import React, { useState, useEffect } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/context/lib/supabase';
import { Profile } from '../src/context/types';
import {Send, QrCode, DollarSign, TrendingDown, Banknote, BanknoteArrowDown, BanknoteArrowUpIcon, RotateCcw, Clock, Layers} from 'lucide-react';
import { 
  LogOut, 
  Wallet, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Minus, 
  Bell,
  Settings,
  Repeat,
  Zap,
  LayoutGrid,
  RefreshCw
} from 'lucide-react';
import SendFundsModal from './SendFundsModal';
import QRScannerModal from './QRScannerModal';
import ReceiveFundsModal from './RecieveFundsModal';
import TransactionHistory from './TransactionHistory';

const Dashboard: React.FC = () => {
  const { profile: authProfile, signOut, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(authProfile);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  
  // Animation state for balance changes
  const [balanceChanged, setBalanceChanged] = useState(false);
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);

  // Sync with auth context profile
  useEffect(() => {
    if (authProfile) {
      // Check if balance changed for animation
      if (profile && authProfile.balance !== profile.balance) {
        setPreviousBalance(profile.balance);
        setBalanceChanged(true);
        setTimeout(() => setBalanceChanged(false), 2000);
      }
      setProfile(authProfile);
    }
  }, [authProfile]);

  // Real-time subscription for balance updates
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          console.log('Profile updated:', payload);
          const newData = payload.new as Profile;
          
          // Trigger balance animation
          if (newData.balance !== profile.balance) {
            setPreviousBalance(profile.balance);
            setBalanceChanged(true);
            setTimeout(() => setBalanceChanged(false), 2000);
          }
          
          setProfile(newData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const handleSendSuccess = () => {
    handleRefresh();
  };

  const handleQRScanSuccess = (userId: string, username?: string) => {
    setQrScannerOpen(false);
    setSendModalOpen(true);
  };

  if (!profile) {
    return null; // This shouldn't happen due to ProtectedRoute, but adding for safety
  }

  const balanceIncrease = previousBalance !== null 
    ? profile.balance > previousBalance 
    : false;

  return (
    <div className="min-h-screen bg-darkbg flex flex-col font-sans text-slate-200">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-4 sticky top-0 z-30 bg-darkbg/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <img 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'U')}&background=3C3CFF&color=fff&rounded=true`} 
            alt="Avatar" 
            className="w-10 h-10 rounded-full border border-white/10"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight">Wallet 1</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
              {profile.username ? `@${profile.username}` : 'Main Account'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className={`p-2 rounded-full hover:bg-white/5 transition-colors ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-5 h-5 text-slate-400" />
          </button>
          <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
            <Bell className="w-5 h-5 text-slate-400" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-ethblue rounded-full ring-2 ring-darkbg"></span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-8 space-y-12">
        
        {/* Balance Section */}
        <section className="text-center space-y-3">
          <p className="text-slate-500 text-sm font-medium tracking-wide">Portfolio Balance</p>
          <div className="space-y-1">
            <h1 className={`text-6xl font-black text-white tracking-tighter transition-all duration-500 ${
              balanceChanged ? (balanceIncrease ? 'animate-balance-increase' : 'animate-balance-decrease') : ''
            }`}>
              ₱{(profile.balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </h1>
            {balanceChanged && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border animate-in fade-in zoom-in-95 ${
                balanceIncrease 
                  ? 'bg-green-500/10 border-green-500/20' 
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                <span className={`text-xs font-bold ${
                  balanceIncrease ? 'text-green-400' : 'text-red-400'
                }`}>
                  {balanceIncrease ? '+' : '-'}₱{Math.abs(profile.balance - (previousBalance || 0)).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Action Buttons Grid */}
        <section className="grid grid-cols-4 gap-4">
          <ActionButton 
            icon={<Send />} 
            label="Send" 
            onClick={() => setSendModalOpen(true)}
          />
          <ActionButton 
            icon={<QrCode />} 
            label="Receive" 
            onClick={() => setReceiveModalOpen(true)}
          />
          <ActionButton icon={<DollarSign />} label="Buy" onClick={() => {}} />
          <ActionButton icon={<BanknoteArrowDown />} label="Sell" onClick={() => {}} />
        </section>

        {/* Portfolio Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white tracking-tight">Portfolio</h3>
            <button className="text-xs font-bold text-ethblue uppercase tracking-widest hover:text-white transition-colors">Manage</button>
          </div>

          <div className="bg-cardbg border border-white/5 p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 group transition-all hover:border-ethblue/30">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-ethblue/10 transition-colors">
              <Wallet className="w-8 h-8 text-slate-600 group-hover:text-ethblue transition-colors" />
            </div>
            <div>
              <p className="text-white font-bold">No assets yet</p>
              <p className="text-slate-500 text-xs mt-1">Start building your portfolio by depositing capital.</p>
            </div>
            <button className="bg-ethblue/20 hover:bg-ethblue/30 text-ethblue text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full transition-all">
              Get Started
            </button>
          </div>
        </section>

        {/* Transaction History */}
        <section className="space-y-4 pt-4 pb-20">
          <TransactionHistory 
            userId={profile.id} 
            onRefresh={handleRefresh}
          />
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 h-20 bg-darkbg/90 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-4 z-40 lg:hidden">
        <NavTab icon={<Wallet />} label="Wallet" active />
        <NavTab icon={<Layers />} label="Assets" />
        <NavTab icon={<Repeat />} label="Swap" />
        <NavTab icon={<Clock />} label="Activity" />
        <NavTab icon={<Settings />} label="Settings" />
      </nav>

      {/* Logout Button (Desktop) */}
      <button 
        onClick={signOut}
        className="hidden lg:flex fixed bottom-8 right-8 items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-6 py-3 rounded-2xl font-bold transition-all group z-50 shadow-2xl"
      >
        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Terminate</span>
      </button>

      {/* Modals */}
      <SendFundsModal
        isOpen={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        currentUser={profile}
        onSuccess={handleSendSuccess}
        onOpenQRScanner={() => {
          setSendModalOpen(false);
          setQrScannerOpen(true);
        }}
      />

      <ReceiveFundsModal
        isOpen={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        currentUser={profile}
      />

      <QRScannerModal
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onScanSuccess={handleQRScanSuccess}
      />

      <style>{`
        @keyframes balance-increase {
          0% { transform: scale(1); color: rgb(255, 255, 255); }
          50% { transform: scale(1.05); color: rgb(74, 222, 128); }
          100% { transform: scale(1); color: rgb(255, 255, 255); }
        }
        
        @keyframes balance-decrease {
          0% { transform: scale(1); color: rgb(255, 255, 255); }
          50% { transform: scale(0.95); color: rgb(248, 113, 113); }
          100% { transform: scale(1); color: rgb(255, 255, 255); }
        }
        
        .animate-balance-increase {
          animation: balance-increase 0.6s ease-out;
        }
        
        .animate-balance-decrease {
          animation: balance-decrease 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

const ActionButton: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-2 group">
    <div className="w-14 h-14 bg-ethblue rounded-full flex items-center justify-center text-white shadow-xl shadow-ethblue/20 group-hover:scale-110 group-active:scale-95 transition-all">
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' }) : icon}
    </div>
    <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors tracking-wide">{label}</span>
  </button>
);

const NavTab: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
}> = ({ icon, label, active }) => (
  <button className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-ethblue' : 'text-slate-600 hover:text-slate-400'}`}>
    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' }) : icon}
    <span className={`text-[10px] font-bold uppercase tracking-tighter ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
    {active && <div className="w-1 h-1 bg-ethblue rounded-full mt-0.5 shadow-[0_0_8px_rgba(60,60,255,0.8)]"></div>}
  </button>
);

export default Dashboard;