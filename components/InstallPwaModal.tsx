import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Share2, PlusSquare, Check, X, 
  Sparkles, ExternalLink, ArrowRight, ShieldCheck, 
  Download, Laptop, Layers, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
}

export const usePwaInstall = () => {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canPrompt, setCanPrompt] = useState(false);

  useEffect(() => {
    // Check if running in standalone (installed) mode
    const checkStandalone = () => {
      const isWindowStandalone = (window.navigator as any).standalone === true;
      const isMediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
      return isWindowStandalone || isMediaStandalone;
    };

    setIsStandalone(checkStandalone());

    // Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.maxTouchPoints > 1 && /macintosh/.test(userAgent));
    setIsIOS(isIosDevice);

    // Check if Safari
    const isSafariBrowser = /safari/.test(userAgent) && !/chrome|crios|fxios|edgios/.test(userAgent);
    setIsSafari(isSafariBrowser);

    // Listen for beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setCanPrompt(false);
        setDeferredPrompt(null);
      }
    }
  };

  return {
    isStandalone,
    isIOS,
    isSafari,
    canPrompt,
    deferredPrompt,
    triggerInstall
  };
};

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt
}) => {
  const { isIOS, isSafari, triggerInstall } = usePwaInstall();
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>(isIOS ? 'ios' : 'android');

  useEffect(() => {
    if (isIOS) {
      setActiveTab('ios');
    }
  }, [isIOS]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md"
        style={{
          paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 0.75rem), 1rem)',
          paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 0.75rem), 1rem)',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 0.75rem)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 0.75rem)'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="glass-panel w-full max-w-lg rounded-[2.2rem] border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 p-2.5 shrink-0 border border-white/20">
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/5501/5501360.png" 
                  alt="App Icon" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                    Pasang Aplikasi
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                    PWA Ready
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400">
                  Finance Tracker di Layar Utama HP
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 transition-all border border-slate-700/60"
            >
              <X size={18} />
            </button>
          </div>

          {/* Platform Tab Switcher */}
          <div className="px-5 sm:px-6 pt-4">
            <div className="flex items-center p-1 bg-slate-900/90 rounded-2xl border border-slate-700/80">
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'ios'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone size={14} />
                <span>iPhone / iPad (iOS)</span>
              </button>
              <button
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'android'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Download size={14} />
                <span>Android / Desktop</span>
              </button>
            </div>
          </div>

          {/* Modal Content Scrollable Area */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {activeTab === 'ios' ? (
              <div className="space-y-4">
                <div className="bg-indigo-950/40 p-4 rounded-2xl border border-indigo-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-black uppercase tracking-wider">
                    <Sparkles size={15} />
                    <span>Langkah Mudah Pasang di iPhone:</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                    iOS Apple menggunakan fitur resmi <strong className="text-white">"Add to Home Screen"</strong> pada browser Safari untuk memasang aplikasi langsung ke layar iPhone Anda.
                  </p>
                </div>

                {/* Step-by-Step iOS Guide */}
                <div className="space-y-3">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-white/5">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                        <Compass size={13} className="text-indigo-400" /> Buka di Browser Safari
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                        Pastikan Anda membuka tautan aplikasi ini langsung di browser bawaan <strong className="text-slate-200">Safari</strong> iPhone (bukan in-app browser Instagram / WhatsApp).
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-white/5">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                        <Share2 size={13} className="text-indigo-400" /> Ketuk Tombol Share (Bagikan)
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                        Ketuk ikon <strong className="text-white">Kotak Panah ke Atas (Share)</strong> yang terletak di bilah menu bawah browser Safari Anda.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-white/5">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                        <PlusSquare size={13} className="text-indigo-400" /> Pilih "Tambah ke Layar Utama"
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                        Gulir menu ke bawah lalu pilih menu <strong className="text-white">"Tambah ke Layar Utama" (Add to Home Screen)</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-white/5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      4
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                        <Check size={13} className="text-emerald-400" /> Ketuk "Tambah" (Add)
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                        Ketuk tombol <strong className="text-emerald-300">"Tambah" (Add)</strong> di pojok kanan atas. Ikon aplikasi <strong className="text-white">Finance Tracker</strong> akan langsung muncul di Homescreen iPhone Anda!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Benefits Pill */}
                <div className="p-3 bg-slate-900/40 rounded-2xl border border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-400" /> Layar Penuh (Fullscreen)
                  </span>
                  <span>•</span>
                  <span>Cepat & Ringan</span>
                  <span>•</span>
                  <span>Data Cloud Realtime</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-indigo-950/40 p-4 rounded-2xl border border-indigo-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-black uppercase tracking-wider">
                    <Download size={15} />
                    <span>Instalasi 1-Klik di Android & Chrome:</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                    Aplikasi ini mendukung Progressive Web App (PWA) standar yang dapat langsung dipasang ke perangkat Android atau komputer Anda.
                  </p>
                </div>

                {deferredPrompt ? (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-xs font-bold text-slate-300">
                      Perangkat Anda siap memasang aplikasi ini sekarang:
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        triggerInstall();
                        onClose();
                      }}
                      className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 text-white font-black text-xs uppercase tracking-wider hover:opacity-90 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <Download size={16} /> Pasang Aplikasi Sekarang
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-white/5">
                      <div className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-white uppercase tracking-tight">
                          Buka Menu Browser (Titik Tiga)
                        </h4>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Di browser Chrome / Edge, ketuk ikon titik tiga <strong className="text-white">(⋮)</strong> di sudut kanan atas.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-white/5">
                      <div className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-white uppercase tracking-tight">
                          Pilih "Install App" / "Tambahkan ke Layar Utama"
                        </h4>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Pilih menu <strong className="text-white">"Install app"</strong> atau <strong className="text-white">"Tambahkan ke Layar Utama"</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-900/60 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Check size={15} /> Mengerti, Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
