
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserSession } from '../types';
import { 
  LogOut, 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  History, 
  User as UserIcon,
  Bell,
  Search,
  Menu,
  X,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

interface DashboardProps {
  session: UserSession;
}

const Dashboard: React.FC<DashboardProps> = ({ session }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-darkbg flex flex-col lg:flex-row text-slate-200 font-sans">
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-ethblue rounded-lg flex items-center justify-center shadow-lg shadow-ethblue/20">
            <TrendingUp className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tighter text-white">Lapore.</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation (Desktop) / Fullscreen Overlay (Mobile) */}
      <aside className={`
        fixed inset-0 z-40 lg:relative lg:z-0 lg:flex lg:translate-x-0
        transition-transform duration-300 ease-in-out transform
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        w-full lg:w-72 border-r border-white/5 bg-black lg:bg-transparent flex flex-col p-8 space-y-10
      `}>
        <div className="hidden lg:flex items-center gap-3">
          <div className="w-10 h-10 bg-ethblue rounded-xl flex items-center justify-center shadow-xl shadow-ethblue/20">
            <TrendingUp className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-2xl text-white tracking-tighter">Lapore.</span>
        </div>

        <nav className="flex-1 space-y-2">
          <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">Core Portal</p>
          <NavItem icon={<LayoutDashboard />} label="Dashboard" active />
          <NavItem icon={<Wallet />} label="Portfolio" />
          <NavItem icon={<History />} label="Ledger" />
          <NavItem icon={<UserIcon />} label="Security" />
        </nav>

        <div className="pt-6 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-slate-500 hover:text-red-500 transition-all p-4 rounded-2xl hover:bg-red-500/5 w-full group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold uppercase text-xs tracking-widest">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-20 border-b border-white/5 items-center justify-between px-10 bg-black/20 backdrop-blur-md sticky top-0 z-30">
          <div className="relative w-full max-w-sm group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-ethblue transition-colors" />
            <input 
              type="text" 
              placeholder="Query assets..." 
              className="bg-white/5 border border-white/5 text-slate-200 text-sm rounded-full py-2.5 pl-12 pr-6 w-full focus:outline-none focus:ring-2 focus:ring-ethblue/20 focus:border-ethblue/30 transition-all"
            />
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Encrypted Connection</span>
            </div>
            
            <button className="relative text-slate-400 hover:text-ethblue transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-ethblue rounded-full ring-4 ring-darkbg"></span>
            </button>
            
            <div className="h-8 w-px bg-white/5 mx-2"></div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-white tracking-tight">{session.profile?.full_name || 'User'}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">@{session.profile?.username || 'member'}</p>
              </div>
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(session.profile?.full_name || 'U')}&background=3C3CFF&color=fff&rounded=true`} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full border border-white/10 p-0.5"
              />
            </div>
          </div>
        </header>

        {/* Dynamic Dashboard Page Content */}
        <div className="p-6 md:p-10 lg:p-12 space-y-10">
          <section className="space-y-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-4xl font-black text-white tracking-tighter">Terminal Dashboard</h1>
                <p className="text-slate-500 font-medium">Global capital distribution and real-time yield analysis.</p>
              </div>
              <button className="bg-ethblue hover:bg-ethblue-hover text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-2xl shadow-ethblue/40 flex items-center gap-2 group text-sm active:scale-95">
                <span>Deploy Capital</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </section>

          {/* Core Metrics Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Aggregate Value" value="$124,082.44" delta="+8.21%" />
            <StatCard label="Yield Optimization" value="12.4% APY" delta="+1.2%" />
            <StatCard label="Secured Assets" value="$88,200.00" delta="+0.4%" />
            <StatCard label="Network Load" value="Optimal" status="good" />
          </section>

          {/* Analytics & Activity */}
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-8 min-h-[400px] flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-ethblue/5 blur-[100px] rounded-full group-hover:bg-ethblue/10 transition-colors"></div>
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-ethblue" />
                  Performance Projection
                </h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-slate-400">1W</span>
                  <span className="px-3 py-1 bg-ethblue/20 border border-ethblue/20 rounded-lg text-[10px] font-bold text-ethblue">1M</span>
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-slate-400">1Y</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                <div className="w-full h-32 flex items-end gap-1 mb-8 opacity-20">
                  {Array.from({length: 40}).map((_, i) => (
                    <div key={i} className="flex-1 bg-ethblue rounded-t-sm" style={{height: `${Math.random() * 100}%`}}></div>
                  ))}
                </div>
                <p className="text-slate-400 font-medium text-lg">Analysis Engine Initialization...</p>
                <p className="text-slate-600 text-sm mt-2 text-center max-w-xs">Integrating your database feeds for hyper-accurate forecasting.</p>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col">
               <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                   <History className="w-5 h-5 text-ethblue" />
                   Recent Activity
                 </h3>
                 <button className="text-[10px] font-bold text-ethblue uppercase tracking-widest hover:text-white transition-colors">View All</button>
               </div>
               <div className="flex-1 space-y-6">
                 <ActivityItem label="Deposit Initiated" time="2h ago" amount="+$1,200.00" type="positive" />
                 <ActivityItem label="System Rebalance" time="5h ago" amount="-- $0.00" type="neutral" />
                 <ActivityItem label="Yield Harvested" time="1d ago" amount="+$42.12" type="positive" />
                 <div className="pt-4 flex flex-col items-center justify-center text-center">
                   <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                     <History className="w-6 h-6 text-slate-700" />
                   </div>
                   <p className="text-slate-600 text-xs font-medium italic">End of recent synchronization</p>
                 </div>
               </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active?: boolean }> = ({ icon, label, active }) => (
  <button className={`
    flex items-center gap-4 w-full p-4 rounded-2xl transition-all group
    ${active 
      ? 'bg-ethblue text-white shadow-xl shadow-ethblue/25' 
      : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}
  `}>
    {React.cloneElement(icon as React.ReactElement, { className: `w-5 h-5 ${active ? 'text-white' : 'text-slate-600 group-hover:text-ethblue'} transition-colors` })}
    <span className="font-bold text-sm tracking-tight">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>}
  </button>
);

const StatCard: React.FC<{ label: string, value: string, delta?: string, status?: 'good' | 'bad' }> = ({ label, value, delta, status }) => (
  <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl hover:border-ethblue/30 transition-all hover:bg-white/[0.04] group">
    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3 group-hover:text-slate-400 transition-colors">{label}</p>
    <div className="flex items-end justify-between">
      <h3 className="text-2xl font-black text-white tracking-tighter">{value}</h3>
      {delta && (
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${delta.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
          {delta}
        </span>
      )}
      {status === 'good' && (
        <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
      )}
    </div>
  </div>
);

const ActivityItem: React.FC<{ label: string, time: string, amount: string, type: 'positive' | 'neutral' | 'negative' }> = ({ label, time, amount, type }) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-4">
      <div className={`w-2 h-2 rounded-full ${type === 'positive' ? 'bg-emerald-500' : type === 'negative' ? 'bg-red-500' : 'bg-slate-600'}`}></div>
      <div>
        <p className="text-sm font-bold text-white group-hover:text-ethblue transition-colors tracking-tight">{label}</p>
        <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">{time}</p>
      </div>
    </div>
    <span className={`text-xs font-black tracking-tight ${type === 'positive' ? 'text-emerald-500' : 'text-slate-400'}`}>
      {amount}
    </span>
  </div>
);

export default Dashboard;
