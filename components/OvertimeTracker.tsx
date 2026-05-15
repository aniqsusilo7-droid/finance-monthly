import React from 'react';
import { OvertimeEntry, UserProfile } from '../types';
import { calculateEqvHours } from '../utils';
import { 
  Plus, Trash2, Calendar, Clock, Info, UserCircle, 
  ArrowRight, User, Hash, Briefcase, Users, LayoutGrid, 
  ChevronRight, CalendarDays, History
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
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
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

  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Profile & Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-panel p-6 rounded-[2rem] border border-white/10 shadow-xl relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/5 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <UserCircle className="text-indigo-400" size={20} />
              </div>
              <div>
                <h3 className="text-white font-black text-xs uppercase tracking-widest">User Profile</h3>
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-tight">Identity & Department Details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-500 pl-1 tracking-widest">Full Name</label>
                  <div className="relative group">
                    <User size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                      type="text" 
                      value={profile.name} 
                      onChange={(e) => handleProfileChange('name', e.target.value.toUpperCase())}
                      className="w-full bg-slate-950/40 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-[11px] text-white font-black uppercase outline-none focus:border-indigo-500 transition-all shadow-inner"
                      placeholder="NAME"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-500 pl-1 tracking-widest">Employee ID (NIK)</label>
                  <div className="relative group">
                    <Hash size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                      type="text" 
                      value={profile.nik} 
                      onChange={(e) => handleProfileChange('nik', e.target.value)}
                      className="w-full bg-slate-950/40 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-[11px] text-white font-black outline-none focus:border-indigo-500 transition-all shadow-inner"
                      placeholder="NIK"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-500 pl-1 tracking-widest">Department</label>
                  <div className="relative group">
                    <Briefcase size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                      type="text" 
                      value={profile.dept} 
                      onChange={(e) => handleProfileChange('dept', e.target.value.toUpperCase())}
                      className="w-full bg-slate-950/40 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-[11px] text-white font-black uppercase outline-none focus:border-indigo-500 transition-all shadow-inner"
                      placeholder="DEPT"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-500 pl-1 tracking-widest">Work Group</label>
                  <div className="relative group">
                    <Users size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                      type="text" 
                      value={profile.group} 
                      onChange={(e) => handleProfileChange('group', e.target.value.toUpperCase())}
                      className="w-full bg-slate-950/40 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-[11px] text-white font-black uppercase outline-none focus:border-indigo-500 transition-all shadow-inner"
                      placeholder="GROUP"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-[2rem] border border-indigo-500/20 bg-indigo-500/5 shadow-xl flex flex-col justify-center items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock size={80} className="text-indigo-400" />
          </div>
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2 relative z-10">Total Equivalent Hours</span>
          <div className="text-5xl sm:text-6xl font-black text-white tracking-tighter mb-2 relative z-10">
            {totalEqv.toFixed(2)}
          </div>
          <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 relative z-10">
            <History size={10} className="text-indigo-400" />
            <span className="text-[9px] text-indigo-300 font-black uppercase tracking-widest">Actual: {totalActual.toFixed(1)} Hrs</span>
          </div>
        </motion.div>
      </div>

      {/* Entries List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
            <h4 className="font-black text-xs sm:text-sm text-white uppercase tracking-widest">Overtime Log</h4>
          </div>
          <button 
            onClick={addEntry} 
            className="group flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" /> 
            Add Record
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {entries.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel py-16 rounded-[2rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 text-slate-700">
                  <LayoutGrid size={32} />
                </div>
                <p className="text-slate-600 uppercase font-black text-[10px] tracking-widest px-6">
                  Belum ada catatan lembur bulan ini
                </p>
                <button onClick={addEntry} className="mt-4 text-indigo-400 text-[9px] font-black uppercase underline underline-offset-4 hover:text-indigo-300">
                  Tambah Catatan Pertama
                </button>
              </motion.div>
            ) : (
              sortedEntries.map((entry, index) => {
                const eqv = calculateEqvHours(entry.actualHours, entry.type);
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-panel p-4 sm:p-5 rounded-3xl border border-white/5 shadow-xl hover:border-indigo-500/30 transition-all relative group"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                      {/* Date & Type Col */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:w-40 shrink-0">
                        <div className="flex-1 sm:w-full space-y-1.5">
                          <label className="hidden sm:block text-[8px] font-black uppercase text-slate-500 pl-1 tracking-widest">Date</label>
                          <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-xl px-2.5 py-2">
                            <Calendar size={12} className="text-indigo-500" />
                            <input 
                              type="date" 
                              value={entry.date} 
                              onChange={(e) => updateEntry(entry.id, 'date', e.target.value)}
                              className="bg-transparent text-[11px] text-white outline-none font-black uppercase w-full cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="flex-1 sm:w-full">
                          <select 
                            value={entry.type} 
                            onChange={(e) => updateEntry(entry.id, 'type', e.target.value)}
                            className={`w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-[9px] font-black uppercase outline-none focus:border-indigo-500 transition-all cursor-pointer ${entry.type === 'holiday' ? 'text-rose-500' : 'text-indigo-400'}`}
                          >
                            <option value="normal">NORMAL DAY</option>
                            <option value="holiday">HOLIDAY</option>
                          </select>
                        </div>
                      </div>

                      {/* Time Range Col */}
                      <div className="flex flex-col gap-1.5 sm:w-44 shrink-0">
                        <label className="hidden sm:block text-[8px] font-black uppercase text-slate-500 pl-1 tracking-widest">Period</label>
                        <div className="flex items-center justify-between gap-2 bg-slate-950/60 border border-slate-800 rounded-xl p-2 px-3">
                          <div className="flex flex-col items-center">
                             <input 
                                type="time" 
                                value={entry.startTime} 
                                onChange={(e) => updateEntry(entry.id, 'startTime', e.target.value)}
                                className="bg-transparent text-[11px] text-white outline-none font-black cursor-pointer"
                             />
                             <span className="text-[7px] text-slate-600 font-black uppercase">START</span>
                          </div>
                          <ArrowRight size={14} className="text-slate-700" />
                          <div className="flex flex-col items-center">
                             <input 
                                type="time" 
                                value={entry.endTime} 
                                onChange={(e) => updateEntry(entry.id, 'endTime', e.target.value)}
                                className="bg-transparent text-[11px] text-white outline-none font-black cursor-pointer"
                             />
                             <span className="text-[7px] text-slate-600 font-black uppercase">END</span>
                          </div>
                        </div>
                      </div>

                      {/* Purpose Col */}
                      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                        <label className="hidden sm:block text-[8px] font-black uppercase text-slate-500 pl-1 tracking-widest">Purpose / Description</label>
                        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 px-4 h-full flex items-center">
                          <input 
                            type="text"
                            value={entry.purpose} 
                            onChange={(e) => updateEntry(entry.id, 'purpose', e.target.value)}
                            placeholder="Deskripsi pekerjaan..."
                            className="w-full bg-transparent text-[11px] text-white font-bold outline-none placeholder-slate-700"
                          />
                        </div>
                      </div>

                      {/* Hours Summary Col */}
                      <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-3 sm:w-28 border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-4">
                        <div className="flex flex-col items-center">
                          <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] sm:mb-1">Actual</span>
                          <div className="text-sm font-black text-slate-300 slashed-zero">
                            {entry.actualHours.toFixed(1)}
                            <span className="text-[8px] ml-0.5 opacity-50">h</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] sm:mb-1">Eqv</span>
                          <div className={`text-base font-black slashed-zero leading-none ${eqv > 0 ? (entry.type === 'holiday' ? 'text-rose-500' : 'text-emerald-500') : 'text-slate-700'}`}>
                            {eqv.toFixed(2)}
                          </div>
                        </div>
                        
                        {/* Delete Button Mobile */}
                        <button 
                          onClick={() => removeEntry(entry.id)} 
                          className="sm:hidden p-2 text-rose-500/70 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Delete Button Desktop */}
                      <button 
                        onClick={() => removeEntry(entry.id)} 
                        className="hidden sm:flex items-center justify-center p-2 text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
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
