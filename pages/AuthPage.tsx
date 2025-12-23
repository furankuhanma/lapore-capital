
import React, { useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { AuthMode } from '../src/context/types';
import { Lock, Mail, User, ShieldCheck, ChevronRight, Loader2, Cpu } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                full_name: fullName,
                username: username,
                created_at: new Date().toISOString(),
              },
            ]);

          if (profileError) throw profileError;
          setSuccess('Account created! Please confirm your email.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-darkbg font-sans selection:bg-ethblue/30">
      {/* Visual Side Panel (Desktop Only) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 relative overflow-hidden items-center justify-center p-12 bg-black border-r border-white/5">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 -left-1/4 w-[100%] h-[100%] bg-ethblue/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 -right-1/4 w-[80%] h-[80%] bg-ethblue/5 blur-[100px] rounded-full"></div>
          <div className="absolute inset-0 bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:32px_32px] opacity-20"></div>
        </div>
        
        <div className="relative z-10 text-center max-w-xl">
          <h1 className="text-6xl font-bold tracking-tight text-white mb-6">
            Lapore Finance<span className="text-ethblue"></span>
          </h1>
          <p className="text-slate-400 text-xl font-light leading-relaxed">
            The next generation of capital management. Secure, decentralized, and intelligent.
          </p>
        </div>
      </div>

      {/* Auth Form Container */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-24 relative overflow-hidden">
        {/* Mobile Background Glows */}
        <div className="md:hidden absolute -top-24 -right-24 w-64 h-64 bg-ethblue/10 blur-3xl rounded-full"></div>
        <div className="md:hidden absolute -bottom-24 -left-24 w-64 h-64 bg-ethblue/10 blur-3xl rounded-full"></div>

        <div className="w-full max-w-sm space-y-10 relative z-10">
          <div className="text-center md:text-left space-y-2">
            <div className="md:hidden inline-block mb-4">
               <h1 className="text-3xl font-bold text-white tracking-tighter">Lapore Finance<span className="text-ethblue"></span></h1>
            </div>
            <h2 className="text-4xl font-bold text-white tracking-tight">
              {mode === 'login' ? 'Sign In' : ''}
            </h2>
            <p className="text-slate-500 font-medium">
              {mode === 'login' 
                ? 'Welcome back to your private portfolio.' 
                : 'Experience the future of asset growth.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {mode === 'register' && (
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-ethblue transition-colors" />
                    <input 
                      required
                      type="text" 
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-ethblue/40 focus:border-ethblue/50 transition-all placeholder:text-slate-700"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Username</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-ethblue transition-colors" />
                    <input 
                      required
                      type="text" 
                      placeholder="janedoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-ethblue/40 focus:border-ethblue/50 transition-all placeholder:text-slate-700"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-ethblue transition-colors" />
                <input 
                  required
                  type="email" 
                  placeholder="name@ethereum.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-ethblue/40 focus:border-ethblue/50 transition-all placeholder:text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-ethblue transition-colors" />
                <input 
                  required
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-ethblue/40 focus:border-ethblue/50 transition-all placeholder:text-slate-700"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-2xl flex items-start gap-2 animate-in slide-in-from-top-2 duration-300">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-ethblue/10 border border-ethblue/20 text-ethblue text-sm rounded-2xl flex items-start gap-2 animate-in slide-in-from-top-2 duration-300">
                <span className="mt-0.5">✅</span>
                <span>{success}</span>
              </div>
            )}

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-ethblue hover:bg-ethblue-hover text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-xl shadow-ethblue/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:scale-[0.98] active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="tracking-wide uppercase text-sm">
                    {mode === 'login' ? 'Login' : 'Get Started'}
                  </span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <button 
              onClick={toggleMode}
              className="text-slate-500 hover:text-white transition-colors text-sm font-semibold tracking-wide uppercase"
            >
              {mode === 'login' ? (
                <span>No account? <span className="text-ethblue ml-1 underline decoration-ethblue/30 underline-offset-4">Sign up</span></span>
              ) : (
                <span>Member? <span className="text-ethblue ml-1 underline decoration-ethblue/30 underline-offset-4">Log in</span></span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
