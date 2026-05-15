import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, Wallet, RefreshCw, ArrowLeft, KeyRound, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
    }, 1200);
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1
      }
    },
    exit: { opacity: 0, scale: 1.05, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#020617] selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md w-full relative z-10"
      >
        <div className="glass-panel p-8 sm:p-12 rounded-[2.5rem] border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] backdrop-blur-3xl relative overflow-hidden text-white">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={isSignUp ? 'signup' : isForgot ? 'forgot' : 'login'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center"
            >
              <motion.div variants={itemVariants} className="flex items-center gap-4 mb-8">
                <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3.5 rounded-2xl shadow-xl shadow-indigo-900/40 relative">
                  <Wallet className="text-white w-8 h-8" />
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="text-yellow-400 w-4 h-4" />
                  </motion.div>
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">MY FINANCE</h1>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mt-1">Smarter Tracking</p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="w-full mb-8 text-center">
                <h2 className="text-lg font-black text-white uppercase tracking-widest mb-1">
                  {isForgot ? 'Pemulihan Akses' : isSignUp ? 'Bergabung Sekarang' : 'Selamat Datang'}
                </h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60">
                  {isForgot ? 'Reset kata sandi aman Anda' : isSignUp ? 'Kelola keuangan dengan cerdas' : 'Masuk ke ruang finansial Anda'}
                </p>
              </motion.div>

              <form onSubmit={handleAction} className="w-full space-y-5">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl text-rose-500 text-[10px] font-black uppercase text-center"
                  >
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl text-emerald-500 text-[10px] font-black uppercase text-center"
                  >
                    {success}
                  </motion.div>
                )}

                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 pl-1 tracking-widest">Identitas</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                      type="text" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      className="w-full bg-slate-950/40 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white font-bold text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700" 
                      placeholder="Username" 
                      required 
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 pl-1 tracking-widest">
                    {isForgot ? 'Kata Sandi Baru' : 'Kata Sandi'}
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="w-full bg-slate-950/40 border border-slate-800 rounded-2xl py-4 pl-12 pr-12 text-white font-bold text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700" 
                      placeholder="••••••••" 
                      required 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </motion.div>

                {(isSignUp || isForgot) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-[10px] font-black uppercase text-slate-500 pl-1 tracking-widest">Konfirmasi Sandi</label>
                    <div className="relative group">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        className="w-full bg-slate-950/40 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white font-bold text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700" 
                        placeholder="••••••••" 
                        required 
                      />
                    </div>
                  </motion.div>
                )}

                <motion.button 
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all shadow-xl shadow-indigo-900/30 flex items-center justify-center gap-3 disabled:opacity-50 overflow-hidden relative group"
                >
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]"></div>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span className="relative z-10">
                    {isForgot ? 'Perbarui Sandi' : isSignUp ? 'Daftar Sekarang' : 'Masuk Dashboard'}
                  </span>
                </motion.button>

                <motion.div variants={itemVariants} className="pt-4 flex flex-col gap-4">
                  {!isSignUp && !isForgot && (
                    <button type="button" onClick={() => { setIsForgot(true); setError(''); setSuccess(''); }} className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center justify-center gap-2 hover:text-indigo-300 transition-colors">
                      <RefreshCw size={12} /> Lupa Akses?
                    </button>
                  )}
                  {(isSignUp || isForgot) && (
                    <button type="button" onClick={() => { setIsSignUp(false); setIsForgot(false); setError(''); setSuccess(''); }} className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center justify-center gap-2 hover:text-white transition-colors">
                      <ArrowLeft size={12} /> Kembali Login
                    </button>
                  )}
                  {!isSignUp && !isForgot && (
                    <div className="text-center pt-2 border-t border-white/5">
                      <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Baru di sini? </span>
                      <button type="button" onClick={() => { setIsSignUp(true); setError(''); setSuccess(''); }} className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors">Buat Akun Free</button>
                    </div>
                  )}
                </motion.div>
              </form>
            </motion.div>
          </AnimatePresence>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 flex flex-col items-center gap-2"
        >
          <div className="flex items-center gap-2 text-slate-600">
            <ShieldCheck size={12} />
            <span className="text-[8px] font-black uppercase tracking-[0.5em]">Secure Storage Active</span>
          </div>
          <p className="text-[8px] font-black text-slate-800 uppercase tracking-[0.2em]">Designed for Aniq Susilo Finance</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
