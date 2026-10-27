import React from 'react';
import { OvertimeEntry, UserProfile } from '../types';
import { calculateEqvHours, formatDateToLocalISO } from '../utils';
import { 
  Plus, Trash2, Calendar, Clock, Info, UserCircle, 
  ArrowRight, User, Hash, Briefcase, Users, LayoutGrid, 
  ChevronRight, CalendarDays, History, Sparkles, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OvertimeTrackerProps {
  entries: OvertimeEntry[];
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
  onChange: (entries: OvertimeEntry[]) => void;
}

const OvertimeTracker: React.FC<OvertimeTrackerProps> = ({ entries, profile, onProfileChange, onChange }) => {
  const calculateDuration = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    
    let diffInMinutes = (eH * 60 + eM) - (sH * 60 + sM);
    
    if (diffInMinutes < 0) {
      diffInMinutes += 24 * 60;
    }
    
    return diffInMinutes / 60;
  };

  const addEntry = () => {
    const newEntry: OvertimeEntry = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
      date: formatDateToLocalISO(new Date()),
      type: 'normal',
      startTime: '17:00',
      endTime: '18:00',
      actualHours: 1,
      purpose: ''
    };
    onChange([newEntry, ...entries]);
  };

  const updateEntry = (id: string, field: keyof OvertimeEntry, value: any) => {
    onChange(entries.map(e => {
      if (e.id === id) {
        const updated = { ...e, [field]: value };
        if (field === 'startTime' || field === 'endTime') {
          updated.actualHours = calculateDuration(updated.startTime, updated.endTime);
        }
        return updated;
      }
      return e;
    }));
  };

  const removeEntry = (id: string) => {
    onChange(entries.filter(e => e.id !== id));
  };

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    onProfileChange({ ...profile, [field]: value });
  };

  const totalActual = entries.reduce((acc, curr) => acc + curr.actualHours, 0);
  const totalEqv = entries.reduce((acc, curr) => acc + calculateEqvHours(curr.actualHours, curr.type), 0);
  const holidayEntriesCount = entries.filter(e => e.type === 'holiday').length;
  const normalEntriesCount = entries.filter(e => e.type === 'normal').length;

  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* Profile & KPI Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden"
        >
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-md border border-white/10 text-white">
                  <UserCircle size={22} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">Profil Karyawan</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Informasi Ketenagakerjaan & Divisi</p>
                </div>
              </div>
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                <Sparkles size={12} />
                <span>Terverifikasi</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 pl-1 tracking-wider">Nama Lengkap</label>
                <div className="relative group">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input 
                    type="text" 
                    value={profile.name} 
                    onChange={(e) => handleProfileChange('name', e.target.value.toUpperCase())}
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl py-3 pl-10 pr-4 text-xs font-black uppercase text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition-all shadow-inner"
                    placeholder="NAMA LENGKAP"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 pl-1 tracking-wider">Nomor Induk Karyawan (NIK)</label>
                <div className="relative group">
                  <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input 
                    type="text" 
                    value={profile.nik} 
                    onChange={(e) => handleProfileChange('nik', e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl py-3 pl-10 pr-4 text-xs font-black text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition-all shadow-inner"
                    placeholder="NIK"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 pl-1 tracking-wider">Departemen / Divisi</label>
                <div className="relative group">
                  <Briefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input 
                    type="text" 
                    value={profile.dept} 
                    onChange={(e) => handleProfileChange('dept', e.target.value.toUpperCase())}
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl py-3 pl-10 pr-4 text-xs font-black uppercase text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition-all shadow-inner"
                    placeholder="DEPT"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 pl-1 tracking-wider">Group Kerja / Shift</label>
                <div className="relative group">
                  <Users size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input 
                    type="text" 
                    value={profile.group} 
                    onChange={(e) => handleProfileChange('group', e.target.value.toUpperCase())}
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl py-3 pl-10 pr-4 text-xs font-black uppercase text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition-all shadow-inner"
                    placeholder="GROUP / REGU"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Equivalent Hours KPI Widget */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 sm:p-8 rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 via-slate-900/80 to-slate-950/90 shadow-xl flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Clock size={120} className="text-indigo-400" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Total Jam Ekuivalen</span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[9px] font-black uppercase">
                {entries.length} Sesi
              </span>
            </div>
            <div className="text-5xl sm:text-6xl font-black text-white tracking-tight my-3 font-mono">
              {totalEqv.toFixed(2)}
              <span className="text-xl sm:text-2xl font-bold text-indigo-400 ml-1 font-sans">Jam</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Jam lembur yang telah dikalikan faktor pengali resmi Depnaker.</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-white/10 relative z-10 mt-4">
            <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-700/50 text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Jam Aktual</span>
              <span className="text-sm font-black text-white font-mono">{totalActual.toFixed(1)}h</span>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-700/50 text-center">
              <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider block">Hari Libur</span>
              <span className="text-sm font-black text-rose-300 font-mono">{holidayEntriesCount}x</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Entries List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
            <div>
              <h4 className="font-black text-sm sm:text-base text-[var(--text-primary)] uppercase tracking-tight">Daftar Rekap Lembur</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Log Riwayat Jam Kerja Ekstra</p>
            </div>
          </div>
          <button 
            onClick={addEntry} 
            className="group flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 active:scale-95 border border-indigo-400/30"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" /> 
            <span>Tambah Data</span>
          </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {entries.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel py-16 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-6"
              >
                <div className="w-16 h-16 bg-slate-900/80 rounded-2xl flex items-center justify-center mb-4 text-slate-600 border border-slate-800">
                  <LayoutGrid size={32} />
                </div>
                <h5 className="text-white font-bold text-sm mb-1">Belum Ada Catatan Lembur</h5>
                <p className="text-slate-400 font-medium text-xs max-w-sm mb-4">
                  Klik tombol tambah untuk mencatat jam lembur reguler atau hari libur pada bulan ini.
                </p>
                <button 
                  onClick={addEntry} 
                  className="px-4 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all"
                >
                  Tambah Catatan Sekarang
                </button>
              </motion.div>
            ) : (
              sortedEntries.map((entry, index) => {
                const eqv = calculateEqvHours(entry.actualHours, entry.type);
                const isHoliday = entry.type === 'holiday';
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="glass-panel p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/10 shadow-lg hover:border-indigo-500/40 transition-all relative group"
                  >
                    <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
                      
                      {/* Date & Type Selection */}
                      <div className="flex items-center gap-2.5 sm:w-72 shrink-0">
                        <div className="flex-1 space-y-1">
                          <label className="text-[9px] font-bold uppercase text-slate-400 pl-1 tracking-wider">Tanggal</label>
                          <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-700/70 rounded-xl px-3 py-2">
                            <Calendar size={13} className="text-indigo-400 shrink-0" />
                            <input 
                              type="date" 
                              value={entry.date} 
                              onChange={(e) => updateEntry(entry.id, 'date', e.target.value)}
                              className="bg-transparent text-xs text-white outline-none font-black uppercase w-full cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="w-32 space-y-1">
                          <label className="text-[9px] font-bold uppercase text-slate-400 pl-1 tracking-wider">Tipe Hari</label>
                          <select 
                            value={entry.type} 
                            onChange={(e) => updateEntry(entry.id, 'type', e.target.value)}
                            className={`w-full bg-slate-900/70 border border-slate-700/70 rounded-xl px-2.5 py-2 text-[10px] font-black uppercase outline-none focus:border-indigo-500 transition-all cursor-pointer ${isHoliday ? 'text-rose-400 border-rose-500/40 bg-rose-950/20' : 'text-indigo-400'}`}
                          >
                            <option value="normal">Reguler</option>
                            <option value="holiday">Libur (x2)</option>
                          </select>
                        </div>
                      </div>

                      {/* Time Range */}
                      <div className="space-y-1 sm:w-48 shrink-0">
                        <label className="text-[9px] font-bold uppercase text-slate-400 pl-1 tracking-wider">Rentang Waktu</label>
                        <div className="flex items-center justify-between gap-1.5 bg-slate-900/70 border border-slate-700/70 rounded-xl p-1.5 px-3">
                          <input 
                            type="time" 
                            value={entry.startTime} 
                            onChange={(e) => updateEntry(entry.id, 'startTime', e.target.value)}
                            className="bg-transparent text-xs text-white outline-none font-bold cursor-pointer text-center"
                          />
                          <ArrowRight size={13} className="text-slate-500" />
                          <input 
                            type="time" 
                            value={entry.endTime} 
                            onChange={(e) => updateEntry(entry.id, 'endTime', e.target.value)}
                            className="bg-transparent text-xs text-white outline-none font-bold cursor-pointer text-center"
                          />
                        </div>
                      </div>

                      {/* Purpose */}
                      <div className="flex-1 space-y-1 min-w-0">
                        <label className="text-[9px] font-bold uppercase text-slate-400 pl-1 tracking-wider">Uraian Pekerjaan</label>
                        <div className="bg-slate-900/70 border border-slate-700/70 rounded-xl px-3.5 py-2 flex items-center">
                          <input 
                            type="text"
                            value={entry.purpose} 
                            onChange={(e) => updateEntry(entry.id, 'purpose', e.target.value)}
                            placeholder="Tulis tujuan lembur..."
                            className="w-full bg-transparent text-xs text-white font-medium outline-none placeholder-slate-600"
                          />
                        </div>
                      </div>

                      {/* Hours Summary & Actions */}
                      <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 border-white/10 pt-3 lg:pt-0 lg:pl-2 shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Aktual</span>
                            <span className="text-xs font-black text-slate-300 font-mono">{entry.actualHours.toFixed(1)}h</span>
                          </div>
                          <div className="text-right bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block">Eqv</span>
                            <span className={`text-sm font-black font-mono leading-none ${isHoliday ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {eqv.toFixed(2)}h
                            </span>
                          </div>
                        </div>

                        <button 
                          onClick={() => removeEntry(entry.id)} 
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-xl transition-all active:scale-95"
                          title="Hapus baris lembur"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OvertimeTracker;
