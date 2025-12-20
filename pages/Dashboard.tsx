import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  LogOut, Wallet, ArrowUp, ArrowDown, Plus, Minus, Bell, Settings,
  Repeat, Zap, LayoutGrid, Loader2, RefreshCw, Clock, X,
  CheckCircle2, Camera, Copy, Check, AlertCircle
} from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  username: string;
  balance: number;
  created_at: string;
}

interface Transaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  currency: string;
  type: 'send' | 'receive';
  description: string | null;
  created_at: string;
}

interface UserSession {
  id: string;
  email: string | undefined;
  profile?: Profile;
}

interface DashboardProps {
  session: UserSession;
}

const QrScanner: React.FC<{ onScan: (decodedText: string) => void; onClose: () => void }> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    const qrRegionId = "qr-reader";
    
    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(qrRegionId);
        scannerRef.current = html5QrCode;
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        await html5QrCode.start(
          { facingMode: "environment" }, 
          config, 
          (decodedText) => {
            if (!hasScannedRef.current) {
              hasScannedRef.current = true;
              onScan(decodedText);
            }
          },
          () => {}
        );
        setIsInitializing(false);
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          setError("Permission denied. Please allow camera access.");
        } else if (err.name === 'NotFoundError') {
          setError("No camera found on this device.");
        } else {
          setError("Could not access camera.");
        }
        setIsInitializing(false);
      }
    };

    startScanner();
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-square bg-black rounded-3xl overflow-hidden border border-white/10">
        <div id="qr-reader" className="w-full h-full"></div>
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 gap-3">
            <Loader2 className="w-8 h-8 text-ethblue animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Booting...</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 p-8 text-center gap-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-xs font-bold text-slate-300">{error}</p>
            <button onClick={onClose} className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white hover:bg-white/10">
              Close
            </button>
          </div>
        )}
      </div>
      <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">Position QR within frame</p>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ session: initialSession }) => {
  const [profile, setProfile] = useState<Profile | null>(initialSession.profile || null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', initialSession.id).single();
      if (error) throw error;
      if (data) setProfile(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [initialSession.id]);

  const fetchTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('transactions').select('*')
        .or(`sender_id.eq.${initialSession.id},receiver_id.eq.${initialSession.id}`)
        .order('created_at', { ascending: false }).limit(10);
      if (error) throw error;
      if (data) setTransactions(data);
    } catch (err) {
      console.error('Error:', err);
    }
  }, [initialSession.id]);

  useEffect(() => {
    fetchProfile();
    fetchTransactions();
    const profileSub = supabase.channel('public:profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${initialSession.id}` }, 
        (payload) => setProfile(payload.new as Profile))
      .subscribe();
    const transSub = supabase.channel('public:transactions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, fetchTransactions)
      .subscribe();
    return () => {
      supabase.removeChannel(profileSub);
      supabase.removeChannel(transSub);
    };
  }, [fetchProfile, fetchTransactions, initialSession.id]);

  const handleLogout = async () => await supabase.auth.signOut();
  const handleCopyId = () => {
    if (profile?.id) {
      navigator.clipboard.writeText(profile.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const executeTransfer = async () => {
    if (!profile) return;
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) return setTransferError("Invalid amount.");
    if (amount > profile.balance) return setTransferError("Insufficient balance.");
    if (!receiverId || receiverId.length < 5) return setTransferError("Invalid receiver ID.");
    if (receiverId === profile.id) return setTransferError("Cannot send to yourself.");

    setTransferLoading(true);
    setTransferError(null);
    try {
      const { data: receiverProfile, error: receiverError } = await supabase.from('profiles')
        .select('id, full_name').eq('id', receiverId).single();
      if (receiverError || !receiverProfile) throw new Error("Receiver not found.");

      await supabase.from('profiles').update({ balance: profile.balance - amount }).eq('id', profile.id);
      const { data: currentReceiver } = await supabase.from('profiles').select('balance').eq('id', receiverId).single();
      await supabase.from('profiles').update({ balance: (currentReceiver?.balance || 0) + amount }).eq('id', receiverId);
      await supabase.from('transactions').insert([{
        sender_id: profile.id, receiver_id: receiverId, amount, currency: 'PHP', type: 'send',
        description: `Transfer to ${receiverProfile.full_name}`
      }]);

      setShowSendModal(false);
      setShowSuccess(true);
      setTransferAmount('');
      setReceiverId('');
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setTransferError(err.message || "Transfer failed.");
    } finally {
      setTransferLoading(false);
    }
  };

  const handleQrScan = (decodedId: string) => {
    setReceiverId(decodedId);
    setIsScanning(false);
    if (decodedId.length > 10) setTransferError(null);
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-darkbg flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-ethblue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darkbg flex flex-col font-sans text-slate-200 relative">
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-darkbg/90 backdrop-blur-xl">
          <div className="text-center space-y-6">
            <CheckCircle2 className="w-24 h-24 text-ethblue mx-auto" />
            <h2 className="text-3xl font-black text-white">TRANSFER SECURED</h2>
            <p className="text-slate-500 font-bold uppercase text-xs">Lapore-Capital</p>
          </div>
        </div>
      )}

      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-cardbg rounded-[2.5rem] p-8 border border-white/10 space-y-8">
            <header className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white uppercase">Receive Funds</h3>
              <button onClick={() => setShowReceiveModal(false)} className="p-2 hover:bg-white/5 rounded-full">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </header>
            <div className="flex flex-col items-center space-y-6">
              <div className="p-6 bg-white rounded-3xl shadow-2xl">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${profile?.id}`} alt="QR" className="w-48 h-48" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-slate-400 text-sm font-bold">Your Vault ID</p>
                <code className="text-[10px] bg-black/40 px-3 py-1.5 rounded-lg text-ethblue font-mono block break-all">{profile?.id}</code>
              </div>
              <button onClick={handleCopyId} className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-xs font-black uppercase">
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy ID"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-cardbg rounded-[2.5rem] p-8 border border-white/10 space-y-6 max-h-[90vh] overflow-y-auto">
            <header className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white uppercase">{isScanning ? "Scanning" : "Send Funds"}</h3>
              <button onClick={() => { setShowSendModal(false); setIsScanning(false); }} className="p-2 hover:bg-white/5 rounded-full">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </header>
            {isScanning ? (
              <QrScanner onScan={handleQrScan} onClose={() => setIsScanning(false)} />
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Receiver ID</label>
                    <button onClick={() => setIsScanning(true)} className="flex items-center gap-1.5 text-ethblue text-[9px] font-black uppercase">
                      <Camera className="w-3 h-3" />Scan QR
                    </button>
                  </div>
                  <input type="text" placeholder="Paste vault ID" value={receiverId} onChange={(e) => setReceiverId(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 text-white rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-ethblue/30 font-mono text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Amount (PHP)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-600">₱</span>
                    <input type="number" placeholder="0.00" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 text-white rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-ethblue/30 font-black text-lg" />
                  </div>
                  <p className="text-[10px] text-slate-600 font-bold uppercase ml-1">Available: ₱{profile?.balance.toLocaleString()}</p>
                </div>
                {transferError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-2xl flex items-center gap-3">
                    <AlertCircle className="w-4 h-4" /><span>{transferError}</span>
                  </div>
                )}
                <button onClick={executeTransfer} disabled={transferLoading}
                  className="w-full bg-ethblue hover:bg-ethblue-hover text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
                  {transferLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "SEND TRANSFER"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <header className="flex items-center justify-between px-6 py-5 sticky top-0 z-50 bg-darkbg/90 backdrop-blur-2xl border-b border-white/[0.03]">
        <div className="flex items-center gap-3">
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'U')}&background=3C3CFF&color=fff&rounded=true&bold=true`} 
            alt="Avatar" className="w-11 h-11 rounded-full border-2 border-white/10" />
          <div>
            <span className="text-sm font-extrabold text-white block">Vault One</span>
            <span className="text-[9px] text-slate-500 uppercase font-black">{profile?.username ? `@${profile.username}` : 'Operator'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => fetchProfile(true)} className={`p-2.5 rounded-2xl hover:bg-white/5 ${refreshing ? 'animate-spin text-ethblue' : 'text-slate-400'}`}>
            <RefreshCw className="w-5 h-5" />
          </button>
          <button className="relative p-2.5 rounded-2xl hover:bg-white/5 text-slate-400">
            <Bell className="w-5 h-5" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-ethblue rounded-full"></span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-6 py-10 space-y-12">
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <p className="text-slate-500 text-[10px] font-black uppercase">Live Portfolio</p>
          </div>
          <h1 className="text-6xl sm:text-7xl font-black text-white tracking-tighter tabular-nums">
            ₱{(profile?.balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </h1>
        </section>

        <section className="grid grid-cols-4 gap-2 sm:gap-4 px-2">
          <ActionTile icon={<Plus />} label="Buy" color="bg-white/10" />
          <ActionTile icon={<Minus />} label="Sell" color="bg-white/10" />
          <ActionTile icon={<ArrowUp />} label="Send" color="bg-ethblue" onClick={() => setShowSendModal(true)} />
          <ActionTile icon={<ArrowDown />} label="Receive" color="bg-ethblue" onClick={() => setShowReceiveModal(true)} />
        </section>

        <section className="space-y-6">
          <h3 className="text-lg font-black text-white uppercase">Assets</h3>
          <div className="bg-cardbg border border-white/[0.03] p-10 rounded-[2.5rem] flex flex-col items-center text-center space-y-5">
            <Wallet className="w-10 h-10 text-slate-600" />
            <div>
              <p className="text-white font-extrabold text-lg">Vault Empty</p>
              <p className="text-slate-500 text-xs">Deposit to begin</p>
            </div>
            <button onClick={() => setShowReceiveModal(true)} className="bg-ethblue text-white text-[10px] font-black uppercase px-8 py-3 rounded-2xl shadow-xl">
              Fund Vault
            </button>
          </div>
        </section>

        <section className="space-y-6 pb-28">
          <h3 className="text-[10px] font-black text-slate-600 uppercase">Recent Activity</h3>
          {transactions.length === 0 ? (
            <div className="bg-secondary/30 rounded-3xl p-6 border border-white/[0.02]">
              <div className="flex flex-col items-center py-6 gap-3 opacity-30">
                <Clock className="w-8 h-8 text-slate-500" />
                <p className="text-[10px] text-slate-500 font-black uppercase">No transactions</p>
              </div>
            </div>
          ) : (
            transactions.map((tx) => <TransactionItem key={tx.id} tx={tx} currentUserId={initialSession.id} />)
          )}
        </section>
      </main>

      <nav className="fixed bottom-6 inset-x-6 h-20 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] flex items-center justify-around px-4 z-50 lg:hidden">
        <DockTab icon={<Wallet />} label="Vault" active />
        <DockTab icon={<LayoutGrid />} label="Nodes" />
        <DockTab icon={<Repeat />} label="Atomic" />
        <DockTab icon={<Zap />} label="Ops" />
        <DockTab icon={<Settings />} label="Keys" />
      </nav>

      <button onClick={handleLogout}
        className="hidden lg:flex fixed bottom-10 right-10 items-center gap-3 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-8 py-4 rounded-[1.5rem] font-black uppercase text-[10px]">
        <LogOut className="w-4 h-4" />Logout
      </button>
    </div>
  );
};

const TransactionItem: React.FC<{ tx: Transaction, currentUserId: string }> = ({ tx, currentUserId }) => {
  const isSender = tx.sender_id === currentUserId;
  const date = new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return (
    <div className="flex items-center justify-between p-5 bg-cardbg/40 border border-white/[0.03] rounded-3xl">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isSender ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
          {isSender ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
        </div>
        <div>
          <p className="text-xs font-black text-white uppercase">{isSender ? "Sent" : "Received"}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase">{date}</p>
        </div>
      </div>
      <p className={`text-sm font-black ${isSender ? 'text-slate-300' : 'text-emerald-500'}`}>
        {isSender ? "-" : "+"} ₱{tx.amount.toLocaleString()}
      </p>
    </div>
  );
};

const ActionTile: React.FC<{ icon: React.ReactNode, label: string, color: string, onClick?: () => void }> = ({ icon, label, color, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-3 group py-2">
    <div className={`w-16 h-16 ${color} rounded-[1.75rem] flex items-center justify-center text-white shadow-xl transition-all group-hover:scale-110 border border-white/5`}>
      {React.cloneElement(icon as React.ReactElement, { className: 'w-7 h-7' })}
    </div>
    <span className="text-[10px] font-black text-slate-500 uppercase group-hover:text-white">{label}</span>
  </button>
);

const DockTab: React.FC<{ icon: React.ReactNode, label: string, active?: boolean }> = ({ icon, label, active }) => (
  <button className={`flex flex-col items-center gap-1.5 ${active ? 'text-ethblue' : 'text-slate-600'}`}>
    <div className={`p-2 rounded-2xl ${active ? 'bg-ethblue/10' : ''}`}>
      {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
    </div>
    <span className="text-[8px] font-black uppercase">{label}</span>
  </button>
);

export default Dashboard;