
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserSession, Profile } from '../types';
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
  RefreshCw
} from 'lucide-react';

interface DashboardProps {
  session: UserSession;
}

const Dashboard: React.FC<DashboardProps> = ({ session: initialSession }) => {
  const [profile, setProfile] = useState<Profile | null>(initialSession.profile || null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch latest profile data from Supabase
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

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-darkbg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-ethblue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darkbg flex flex-col font-sans text-slate-200">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-4 sticky top-0 z-30 bg-darkbg/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <img 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'U')}&background=3C3CFF&color=fff&rounded=true`} 
            alt="Avatar" 
            className="w-10 h-10 rounded-full border border-white/10"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight">Wallet 1</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
              {profile?.username ? `@${profile.username}` : 'Main Account'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={() => fetchProfile(true)}
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

      {/* Main Container - Mobile Centered */}
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-8 space-y-12">
        
        {/* Balance Section */}
        <section className="text-center space-y-3">
          <p className="text-slate-500 text-sm font-medium tracking-wide">Portfolio Balance</p>
          <div className="space-y-1">
            <h1 className="text-6xl font-black text-white tracking-tighter">
              ₱{(profile?.balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-ethblue/10 rounded-full border border-ethblue/20">
              <span className="text-xs font-bold text-ethblue">+0.00%</span>
            </div>
          </div>
        </section>

        {/* Action Buttons Grid */}
        <section className="grid grid-cols-4 gap-4">
          <ActionButton icon={<Plus />} label="Buy" />
          <ActionButton icon={<Minus />} label="Sell" />
          <ActionButton icon={<ArrowUp />} label="Send" />
          <ActionButton icon={<ArrowDown />} label="Deposit" />
        </section>

        {/* Portfolio / History Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white tracking-tight">Portfolio</h3>
            <button className="text-xs font-bold text-ethblue uppercase tracking-widest hover:text-white transition-colors">Manage</button>
          </div>

          <div className="space-y-4">
            {/* Empty State placeholder */}
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
          </div>
        </section>

        {/* Prepared History Section (Static for now) */}
        <section className="space-y-4 pt-4 pb-20">
           <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Transaction History</h3>
           <div className="flex flex-col items-center justify-center py-10 opacity-40">
              <HistoryPlaceholder className="w-12 h-12 text-slate-700" />
              <p className="text-slate-600 text-xs mt-2 italic">Ledger synchronization active...</p>
           </div>
        </section>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 h-20 bg-darkbg/90 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-4 z-40 lg:hidden">
        <NavTab icon={<Wallet />} label="Wallet" active />
        <NavTab icon={<LayoutGrid />} label="Assets" />
        <NavTab icon={<Repeat />} label="Swap" />
        <NavTab icon={<Zap />} label="Activity" />
        <NavTab icon={<Settings />} label="Settings" onClick={() => {}} />
      </nav>

      {/* Logout Floating Button (Desktop) */}
      <button 
        onClick={handleLogout}
        className="hidden lg:flex fixed bottom-8 right-8 items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-6 py-3 rounded-2xl font-bold transition-all group z-50 shadow-2xl"
      >
        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Terminate</span>
      </button>
    </div>
  );
};

const ActionButton: React.FC<{ icon: React.ReactNode, label: string }> = ({ icon, label }) => (
  <button className="flex flex-col items-center gap-2 group">
    <div className="w-14 h-14 bg-ethblue rounded-full flex items-center justify-center text-white shadow-xl shadow-ethblue/20 group-hover:scale-110 group-active:scale-95 transition-all">
      {/* Fix: Use React.isValidElement and cast ReactElement with expected props to avoid TypeScript overload errors */}
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' }) : icon}
    </div>
    <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors tracking-wide">{label}</span>
  </button>
);

const NavTab: React.FC<{ icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-ethblue' : 'text-slate-600 hover:text-slate-400'}`}
  >
    {/* Fix: Use React.isValidElement and cast ReactElement with expected props to avoid TypeScript overload errors */}
    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' }) : icon}
    <span className={`text-[10px] font-bold uppercase tracking-tighter ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
    {active && <div className="w-1 h-1 bg-ethblue rounded-full mt-0.5 shadow-[0_0_8px_rgba(60,60,255,0.8)]"></div>}
  </button>
);

const HistoryPlaceholder = (props: React.SVGProps<SVGSVGElement>) => (
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

export default Dashboard;
