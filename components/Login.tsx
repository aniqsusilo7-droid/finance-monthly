import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, RefreshCw, ArrowLeft, KeyRound, Loader2 } from 'lucide-react';

interface LoginProps {
  onAuthenticated: () => void;
}

const Login: React.FC<LoginProps> = ({ onAuthenticated }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getLocalUsers = () => {
    const users = localStorage.getItem('app_local_users');
    return users ? JSON.parse(users) : {};
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    setTimeout(() => {
      try {
        const users = getLocalUsers();

        if (isForgot) {
          if (!users[username]) throw new Error('Username tidak ditemukan');
          if (password !== confirmPassword) throw new Error('Konfirmasi password tidak cocok');
          users[username] = password;
          localStorage.setItem('app_local_users', JSON.stringify(users));
          setSuccess('Password diperbarui!');
          setIsForgot(false);
        } 
        else if (isSignUp) {
          if (users[username]) throw new Error('Username sudah terdaftar');
          if (password !== confirmPassword) throw new Error('Password tidak cocok');
          users[username] = password;
          localStorage.setItem('app_local_users', JSON.stringify(users));
          setSuccess('Akun berhasil dibuat!');
          setIsSignUp(false);
        } 
        else {
          if (!users[username] || users[username] !== password) {
            throw new Error('Username atau Password salah');
          }
          localStorage.setItem('is_authenticated', 'true');
          onAuthenticated();
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f172a] selection:bg-indigo-500/30">
      <div className="max-w-md w-full animate-fadeIn">
        <div className="glass-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden text-white">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 text-center mb-6 sm:mb-8">
            <div className="inline-flex p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-indigo-600 shadow-xl mb-4 sm:mb-6 shadow-indigo-900/40">
              <ShieldCheck className="text-white w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            {/* Judul diselaraskan dengan Dashboard sesuai instruksi */}
            <div className="space-y-1">
              <h1 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                ANIQ SUSILO - FINANCE MONTHLY
              </h1>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {isForgot ? 'Reset Akses' : isSignUp ? 'Daftar Akun' : 'Masuk Dashboard'}
              </p>
            </div>
          </div>

          <form onSubmit={handleAction} className="space-y-4 sm:space-y-5 relative z-10">
            {error && <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-500 text-[10px] font-black uppercase text-center">{error}</div>}
            {success && <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-emerald-500 text-[10px] font-black uppercase text-center">{success}</div>}

            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-black uppercase text-slate-500 pl-1 tracking-widest">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400" />
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl sm:rounded-2xl py-3 sm:py-3.5 pl-11 pr-4 text-white font-bold text-sm focus:outline-none focus:border-indigo-500 transition-all" 
                  placeholder="Username" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-black uppercase text-slate-500 pl-1 tracking-widest">{isForgot ? 'Password Baru' : 'Password'}</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl sm:rounded-2xl py-3 sm:py-3.5 pl-11 pr-12 text-white font-bold text-sm focus:outline-none focus:border-indigo-500 transition-all" 
                  placeholder="••••••••" 
                  required 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {(isSignUp || isForgot) && (
              <div className="space-y-1.5 animate-fadeIn text-left">
                <label className="text-[9px] font-black uppercase text-slate-500 pl-1 tracking-widest">Konfirmasi Password</label>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl sm:rounded-2xl py-3 sm:py-3.5 pl-11 pr-4 text-white font-bold text-sm focus:outline-none focus:border-indigo-500 transition-all" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-3.5 sm:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl sm:rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {isForgot ? 'Update Password' : isSignUp ? 'Daftar Akun' : 'Masuk Dashboard'}
            </button>

            <div className="pt-4 flex flex-col gap-3">
              {!isSignUp && !isForgot && (
                <button type="button" onClick={() => { setIsForgot(true); setError(''); setSuccess(''); }} className="text-[9px] font-black uppercase text-indigo-400 tracking-widest flex items-center justify-center gap-2 hover:text-indigo-300 transition-colors">
                  <RefreshCw size={12} /> Lupa Password?
                </button>
              )}
              {(isSignUp || isForgot) && (
                <button type="button" onClick={() => { setIsSignUp(false); setIsForgot(false); setError(''); setSuccess(''); }} className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center justify-center gap-2 hover:text-white transition-colors">
                  <ArrowLeft size={12} /> Kembali ke Login
                </button>
              )}
              {!isSignUp && !isForgot && (
                <div className="text-center">
                  <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Belum punya akun? </span>
                  <button type="button" onClick={() => { setIsSignUp(true); setError(''); setSuccess(''); }} className="text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-300">Buat Akun</button>
                </div>
              )}
            </div>
          </form>
        </div>
        <p className="mt-6 text-center text-[8px] font-black text-slate-600 uppercase tracking-[0.4em]">Local Secure Storage</p>
      </div>
    </div>
  );
};

export default Login;