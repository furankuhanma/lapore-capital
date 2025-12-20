
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { UserSession, Profile, Transaction } from '../types';
import { Html5Qrcode } from 'html5-qrcode';
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
  Loader2,
  RefreshCw,
  Clock,
  ExternalLink,
  QrCode,
  X,
  CheckCircle2,
  Camera,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';

interface DashboardProps {
  session: UserSession;
}

/**
 * QR Scanner Component
 * Handles camera initialization, scanning, and cleanup.
 */
const QrScanner: React.FC<{ onScan: (decodedText: string) => void; onClose: () => void }> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const qrRegionId = "qr-reader";
    
    // Initialize Scanner
    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(qrRegionId);
        scannerRef.current = html5QrCode;

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        await html5QrCode.start(
          { facingMode: "environment" }, 
          config, 
          (decodedText) => {
            onScan(decodedText);
          },
          () => {
            // Silence verbose debug errors
          }
        );
        setIsInitializing(false);
      } catch (err: any) {
        console.error("Camera Error:", err);
        if (err.name === 'NotAllowedError') {
          setError("Permission denied. Please allow camera access in your browser settings.");
        } else if (err.name === 'NotFoundError') {
          setError("No camera found on this device.");
        } else {
          setError("Could not access camera. Ensure no other app is using it.");
        }
        setIsInitializing(false);
      }
    };

    startScanner();

    // Cleanup on unmount
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-square bg-black rounded-3xl overflow-hidden border border-white/10 shadow-inner">
        <div id="qr-reader" className="w-full h-full"></div>
        
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 gap-3">
            <Loader2 className="w-8 h-8 text-ethblue animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Booting Optics...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 p-8 text-center gap-4">
            <div className="p-4 bg-red-500/10 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-xs font-bold text-slate-300 leading-relaxed">{error}</p>
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors"
            >
              Back to Terminal
            </button>
          </div>
        )}
      </div>
      <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">Position QR code within frame</p>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ session: initialSession }) => {
  const [profile, setProfile] = useState<Profile | null>(initialSession.profile || null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Modals state
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Transfer Form state
  const [transferAmount, setTransferAmount] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  // Fetch latest profile data
  const fetchProfile = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', initialSession.id)
        .single();

      if (error) throw error;
      if (data) setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [initialSession.id]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`sender_id.eq.${initialSession.id},receiver_id.eq.${initialSession.id}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (data) setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  }, [initialSession.id]);

  useEffect(() => {
    fetchProfile();
    fetchTransactions();

    // Subscribe to profile changes
    const profileSub = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${initialSession.id}` }, (payload) => {
        setProfile(payload.new as Profile);
      })
      .subscribe();

    // Subscribe to transactions
    const transSub = supabase
      .channel('public:transactions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileSub);
      supabase.removeChannel(transSub);
    };
  }, [fetchProfile, fetchTransactions, initialSession.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

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
    if (isNaN(amount) || amount <= 0) {
      setTransferError("Please enter a valid amount.");
      return;
    }
    if (amount > profile.balance) {
      setTransferError("Insufficient balance in your vault.");
      return;
    }
    if (!receiverId || receiverId.trim().length < 5) {
      setTransferError("Please enter a valid receiver ID.");
      return;
    }
    if (receiverId === profile.id) {
      setTransferError("Cannot send funds to yourself.");
      return;
    }

    setTransferLoading(true);
    setTransferError(null);

    try {
      // 1. Verify receiver exists
      const { data: receiverProfile, error: receiverError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', receiverId)
        .single();

      if (receiverError || !receiverProfile) {
        throw new Error("Receiver vault not found.");
      }

      // 2. Perform transaction (Sequential update in UI, ideally a RPC in Prod)
      // Deduct from sender
      const { error: deductError } = await supabase
        .from('profiles')
        .update({ balance: profile.balance - amount })
        .eq('id', profile.id);

      if (deductError) throw deductError;

      // Add to receiver
      const { data: currentReceiver, error: fetchError } = await supabase
         .from('profiles')
         .select('balance')
         .eq('id', receiverId)
         .single();
      
      if (fetchError) throw fetchError;

      const { error: creditError } = await supabase
        .from('profiles')
        .update({ balance: (currentReceiver?.balance || 0) + amount })
        .eq('id', receiverId);

      if (creditError) throw creditError;

      // Log transaction
      const { error: logError } = await supabase
        .from('transactions')
        .insert([{
          sender_id: profile.id,
          receiver_id: receiverId,
          amount: amount,
          currency: 'PHP',
          type: 'send',
          description: `Transfer to ${receiverProfile.full_name}`
        }]);

      if (logError) throw logError;

      // Success
      setShowSendModal(false);
      setShowSuccess(true);
      setTransferAmount('');
      setReceiverId('');
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (err: any) {
      setTransferError(err.message || "Failed to process transaction.");
    } finally {
      setTransferLoading(false);
    }
  };

  /**
   * Called when a QR code is successfully decoded
   */
  const handleQrScan = (decodedId: string) => {
    setReceiverId(decodedId);
    setIsScanning(false);
    // Simple validation feedback
    if (decodedId.length > 10) {
      setTransferError(null);
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-darkbg flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-ethblue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darkbg flex flex-col font-sans text-slate-200 selection:bg-ethblue/30 selection:text-white relative">
      
      {/* Transaction Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-darkbg/90 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="text-center space-y-6 animate-in zoom-in duration-500">
            <div className="relative inline-block">
               <div className="absolute inset-0 bg-ethblue blur-3xl opacity-20 animate-pulse"></div>
               <CheckCircle2 className="w-24 h-24 text-ethblue relative z-10" />
            </div>
            <div className="space-y-2">
               <h2 className="text-3xl font-black text-white tracking-tighter">TRANSFER SECURED</h2>
               <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Lapore-Capital Intelligence</p>
            </div>
            <div className="pt-4">
               <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Confirmed</span>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-cardbg sm:rounded-[2.5rem] rounded-t-[2.5rem] p-8 border-t sm:border border-white/10 space-y-8 animate-in slide-in-from-bottom-10 duration-500">
            <header className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white tracking-tighter uppercase">Receive Funds</h3>
              <button onClick={() => setShowReceiveModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </header>
            
            <div className="flex flex-col items-center space-y-6">
               <div className="p-6 bg-white rounded-3xl shadow-2xl shadow-ethblue/20">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${profile?.id}`} 
                    alt="Wallet QR" 
                    className="w-48 h-48"
                  />
               </div>
               <div className="text-center space-y-1">
                 <p className="text-slate-400 text-sm font-bold tracking-tight">Your Vault ID</p>
                 <code className="text-[10px] bg-black/40 px-3 py-1.5 rounded-lg text-ethblue font-mono break-all">{profile?.id}</code>
               </div>
               <button 
                onClick={handleCopyId}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all text-xs font-black uppercase tracking-widest"
               >
                 {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                 {copied ? "ID Copied" : "Copy Vault ID"}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-cardbg sm:rounded-[2.5rem] rounded-t-[2.5rem] p-8 border-t sm:border border-white/10 space-y-6 animate-in slide-in-from-bottom-10 duration-500 overflow-y-auto max-h-[90vh]">
            <header className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-xl font-black text-white tracking-tighter uppercase">
                  {isScanning ? "Scanning Node" : "Initiate Transfer"}
                </h3>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Protocol 12.0a</span>
              </div>
              <button 
                onClick={() => {
                  setShowSendModal(false);
                  setIsScanning(false);
                }} 
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </header>

            {isScanning ? (
              <QrScanner onScan={handleQrScan} onClose={() => setIsScanning(false)} />
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Receiver Vault ID</label>
                    <button 
                      onClick={() => setIsScanning(true)}
                      className="flex items-center gap-1.5 text-ethblue hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest"
                    >
                      <Camera className="w-3 h-3" />
                      Scan QR
                    </button>
                  </div>
                  <div className="relative group">
                    <ArrowUp className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-ethblue transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Paste 36-digit vault ID"
                      value={receiverId}
                      onChange={(e) => setReceiverId(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 text-white rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:ring-2 focus:ring-ethblue/30 transition-all font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Amount (PHP)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-600">₱</span>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 text-white rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-ethblue/30 transition-all font-black text-lg"
                    />
                  </div>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest ml-1">
                    Available: ₱{profile?.balance.toLocaleString()}
                  </p>
                </div>

                {transferError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-2xl flex items-center gap-3 animate-in fade-in duration-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{transferError}</span>
                  </div>
                )}

                <button 
                  onClick={executeTransfer}
                  disabled={transferLoading}
                  className="w-full bg-ethblue hover:bg-ethblue-hover text-white font-black py-4 px-6 rounded-2xl transition-all shadow-xl shadow-ethblue/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                >
                  {transferLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "AUTHENTICATE TRANSFER"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Navigation Header */}
      <header className="flex items-center justify-between px-6 py-5 sticky top-0 z-50 bg-darkbg/90 backdrop-blur-2xl border-b border-white/[0.03]">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'U')}&background=3C3CFF&color=fff&rounded=true&bold=true`} 
              alt="Avatar" 
              className="w-11 h-11 rounded-full border-2 border-white/10 group-hover:border-ethblue/50 transition-all shadow-lg"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-darkbg rounded-full"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold text-white tracking-tighter">Vault One</span>
            <div className="flex items-center gap-1.5">
               <span className="text-[9px] text-slate-500 uppercase font-black tracking-[0.1em]">
                {profile?.username ? `@${profile.username}` : 'Operator'}
              </span>
              <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
              <span className="text-[9px] text-ethblue font-black uppercase tracking-[0.1em]">Mainnet</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => fetchProfile(true)}
            className={`p-2.5 rounded-2xl hover:bg-white/5 transition-all active:scale-90 ${refreshing ? 'animate-spin text-ethblue' : 'text-slate-400'}`}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button className="relative p-2.5 rounded-2xl hover:bg-white/5 transition-all text-slate-400 active:scale-90">
            <Bell className="w-5 h-5" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-ethblue rounded-full ring-2 ring-darkbg shadow-[0_0_8px_rgba(60,60,255,0.6)]"></span>
          </button>
        </div>
      </header>

      {/* Main Core Container */}
      <main className="flex-1 max-w-xl mx-auto w-full px-6 py-10 space-y-12">
        
        {/* Prime Balance Display */}
        <section className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.15em]">Live Portfolio Valuation</p>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-6xl sm:text-7xl font-black text-white tracking-tighter drop-shadow-2xl tabular-nums">
              ₱{(profile?.balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </h1>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/10">
              <span className="text-xs font-black text-emerald-500 tracking-tight">+0.00%</span>
              <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Global 24h</span>
            </div>
          </div>
        </section>

        {/* Tactical Actions Grid */}
        <section className="grid grid-cols-4 gap-2 sm:gap-4 px-2">
          <ActionTile icon={<Plus />} label="Buy" color="bg-white/10" />
          <ActionTile icon={<Minus />} label="Sell" color="bg-white/10" />
          <ActionTile icon={<ArrowUp />} label="Send" color="bg-ethblue" onClick={() => setShowSendModal(true)} />
          <ActionTile icon={<ArrowDown />} label="Receive" color="bg-ethblue" onClick={() => setShowReceiveModal(true)} />
        </section>

        {/* Portfolio Assets Overview */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-black text-white tracking-tighter uppercase">Portfolio Assets</h3>
            <button className="text-[10px] font-black text-ethblue uppercase tracking-[0.2em] hover:text-white transition-all bg-ethblue/10 px-3 py-1.5 rounded-lg border border-ethblue/20">Manage</button>
          </div>

          <div className="space-y-3">
             <div className="bg-cardbg border border-white/[0.03] p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-5 group transition-all hover:border-ethblue/30 hover:shadow-2xl hover:shadow-ethblue/5">
              <div className="w-20 h-20 rounded-[2rem] bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-ethblue/10 transition-all rotate-3 group-hover:rotate-0 shadow-inner">
                <Wallet className="w-10 h-10 text-slate-600 group-hover:text-ethblue transition-all" />
              </div>
              <div className="space-y-1">
                <p className="text-white font-extrabold text-lg tracking-tight">Vault Empty</p>
                <p className="text-slate-500 text-xs font-medium max-w-[200px] leading-relaxed">Deposit capital to begin your wealth generation cycle.</p>
              </div>
              <button 
                onClick={() => setShowReceiveModal(true)}
                className="bg-ethblue text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-3 rounded-2xl transition-all shadow-xl shadow-ethblue/20 hover:scale-105 active:scale-95"
              >
                Fund Vault
              </button>
            </div>
          </div>
        </section>

        {/* Ledger Intelligence / History */}
        <section className="space-y-6 pt-4 pb-28">
           <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em]">Recent Ledger Activity</h3>
              <button onClick={fetchTransactions} className="p-1 hover:text-ethblue transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
           </div>
           
           <div className="space-y-3">
             {transactions.length === 0 ? (
                <div className="bg-secondary/30 rounded-3xl p-6 border border-white/[0.02]">
                  <div className="flex flex-col items-center justify-center py-6 gap-3 opacity-30 grayscale">
                    <Clock className="w-8 h-8 text-slate-500" />
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-center">No transactions detected...</p>
                  </div>
                </div>
             ) : (
               transactions.map((tx) => (
                 <TransactionItem 
                    key={tx.id} 
                    tx={tx} 
                    currentUserId={initialSession.id} 
                  />
               ))
             )}
           </div>
        </section>
      </main>

      {/* Futuristic Bottom Dock Navigation */}
      <nav className="fixed bottom-6 inset-x-6 h-20 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] flex items-center justify-around px-4 z-50 lg:hidden shadow-2xl shadow-black/50">
        <DockTab icon={<Wallet />} label="Vault" active />
        <DockTab icon={<LayoutGrid />} label="Nodes" />
        <DockTab icon={<Repeat />} label="Atomic" />
        <DockTab icon={<Zap />} label="Ops" />
        <DockTab icon={<Settings />} label="Keys" onClick={() => {}} />
      </nav>

      {/* Desktop Persistent Logout */}
      <button 
        onClick={handleLogout}
        className="hidden lg:flex fixed bottom-10 right-10 items-center gap-3 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-8 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all group z-50 shadow-2xl active:scale-95"
      >
        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Terminate Sync</span>
      </button>
    </div>
  );
};

const TransactionItem: React.FC<{ tx: Transaction, currentUserId: string }> = ({ tx, currentUserId }) => {
  const isSender = tx.sender_id === currentUserId;
  const date = new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-center justify-between p-5 bg-cardbg/40 border border-white/[0.03] rounded-3xl group hover:border-white/10 transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isSender ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
           {isSender ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
        </div>
        <div className="space-y-0.5">
           <p className="text-xs font-black text-white uppercase tracking-tight">{isSender ? "Sent Funds" : "Received Funds"}</p>
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{date}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-black tracking-tighter ${isSender ? 'text-slate-300' : 'text-emerald-500'}`}>
          {isSender ? "-" : "+"} ₱{tx.amount.toLocaleString()}
        </p>
        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Confirmed</p>
      </div>
    </div>
  );
};

const ActionTile: React.FC<{ icon: React.ReactNode, label: string, color: string, onClick?: () => void }> = ({ icon, label, color, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-3 group py-2">
    <div className={`w-16 h-16 ${color} rounded-[1.75rem] flex items-center justify-center text-white shadow-xl transition-all group-hover:scale-110 group-hover:-translate-y-1 group-active:scale-95 border border-white/5`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-7 h-7' }) : icon}
    </div>
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">{label}</span>
  </button>
);

const DockTab: React.FC<{ icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 transition-all group relative ${active ? 'text-ethblue' : 'text-slate-600 hover:text-slate-400'}`}
  >
    <div className={`p-2 rounded-2xl transition-all ${active ? 'bg-ethblue/10' : 'group-hover:bg-white/5'}`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' }) : icon}
    </div>
    <span className={`text-[8px] font-black uppercase tracking-tighter transition-all ${active ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'}`}>{label}</span>
    {active && <div className="absolute -bottom-2 w-1 h-1 bg-ethblue rounded-full shadow-[0_0_10px_rgba(60,60,255,1)]"></div>}
  </button>
);

export default Dashboard;
