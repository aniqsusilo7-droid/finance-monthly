import React from 'react';
import { OvertimeEntry, UserProfile } from '../types';
import { calculateEqvHours } from '../utils';
import { Plus, Trash2, Calendar, Clock, Info, UserCircle, ArrowRight, User, Hash, Briefcase, Users } from 'lucide-react';

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
    
    // Jika lewat tengah malam (misal 22:00 ke 02:00)
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
    onChange([...entries, newEntry]);
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

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Header Info - Editable */}
      <div className="glass-panel p-6 rounded-[2rem] border border-white/10 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Clock size={120} className="text-indigo-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {/* Personal Info Inputs */}
             <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                   <UserCircle className="text-indigo-400" size={16} />
                   <h3 className="text-white font-black text-[10px] uppercase tracking-widest">Personal Info</h3>
                </div>
                <div className="space-y-2">
                   <div className="relative group">
                      <User size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                      <input 
                         type="text" 
                         value={profile.name} 
                         onChange={(e) => handleProfileChange('name', e.target.value.toUpperCase())}
                         className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2 pl-8 pr-3 text-[10px] text-white font-black uppercase outline-none focus:border-indigo-500 transition-all"
                         placeholder="NAME"
                      />
                   </div>
                   <div className="relative group">
                      <Hash size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                      <input 
                         type="text" 
                         value={profile.nik} 
                         onChange={(e) => handleProfileChange('nik', e.target.value)}
                         className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2 pl-8 pr-3 text-[10px] text-white font-black outline-none focus:border-indigo-500 transition-all"
                         placeholder="NIK"
                      />
                   </div>
                </div>
             </div>

             {/* Department Info Inputs */}
             <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                   <Info className="text-indigo-400" size={16} />
                   <h3 className="text-white font-black text-[10px] uppercase tracking-widest">Dept Info</h3>
                </div>
                <div className="space-y-2">
                   <div className="relative group">
                      <Briefcase size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                      <input 
                         type="text" 
                         value={profile.dept} 
                         onChange={(e) => handleProfileChange('dept', e.target.value.toUpperCase())}
                         className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2 pl-8 pr-3 text-[10px] text-white font-black uppercase outline-none focus:border-indigo-500 transition-all"
                         placeholder="DEPT"
                      />
                   </div>
                   <div className="relative group">
                      <Users size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                      <input 
                         type="text" 
                         value={profile.group} 
                         onChange={(e) => handleProfileChange('group', e.target.value.toUpperCase())}
                         className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2 pl-8 pr-3 text-[10px] text-white font-black uppercase outline-none focus:border-indigo-500 transition-all"
                         placeholder="GROUP"
                      />
                   </div>
                </div>
             </div>
          </div>
          
          <div className="flex flex-col justify-center items-end bg-indigo-900/10 p-5 rounded-2xl border border-indigo-500/20">
             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1 text-right">Total Equivalent Hours</span>
             <div className="text-4xl sm:text-5xl font-black text-white tracking-tighter text-right">
                {totalEqv.toFixed(2)}
             </div>
             <span className="text-[9px] text-slate-500 font-bold uppercase mt-2 text-right">Actual Total: {totalActual.toFixed(1)} Hours</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
         <div className="p-5 sm:p-6 border-b border-white/5 bg-slate-800/30 flex justify-between items-center">
            <h4 className="font-black text-xs sm:text-sm text-white uppercase tracking-widest flex items-center gap-3">
               <div className="w-1.5 h-5 bg-indigo-600 rounded-full"></div>
               Overtime Sheet Form
            </h4>
            <button onClick={addEntry} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
               <Plus size={14} /> Add Row
            </button>
         </div>

         <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left min-w-[1000px]">
               <thead className="bg-slate-900/80 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                     <th className="px-6 py-5">Date / Type</th>
                     <th className="px-6 py-5">Time Actual (From - To)</th>
                     <th className="px-6 py-5">Purpose</th>
                     <th className="px-6 py-5 text-center">Hrs</th>
                     <th className="px-6 py-5 text-center">Eqv</th>
                     <th className="px-6 py-5 text-center">Del</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-600 uppercase font-black text-[10px] tracking-widest opacity-30">
                         No overtime records for this month
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => {
                      const eqv = calculateEqvHours(entry.actualHours, entry.type);
                      return (
                        <tr key={entry.id} className="hover:bg-white/5 transition-colors group">
                           <td className="px-6 py-4 min-w-[180px]">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 shadow-inner">
                                   <Calendar size={12} className="text-slate-500" />
                                   <input 
                                      type="date" 
                                      value={entry.date} 
                                      onChange={(e) => updateEntry(entry.id, 'date', e.target.value)}
                                      className="bg-transparent text-[11px] text-white outline-none font-black uppercase w-full"
                                   />
                                </div>
                                <select 
                                   value={entry.type} 
                                   onChange={(e) => updateEntry(entry.id, 'type', e.target.value)}
                                   className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] font-black uppercase outline-none focus:border-indigo-500 shadow-inner ${entry.type === 'holiday' ? 'text-rose-400' : 'text-indigo-400'}`}
                                >
                                   <option value="normal">Normal Day</option>
                                   <option value="holiday">Holiday</option>
                                </select>
                              </div>
                           </td>
                           <td className="px-6 py-4 min-w-[200px]">
                              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2.5 shadow-inner">
                                 <input 
                                    type="time" 
                                    value={entry.startTime} 
                                    onChange={(e) => updateEntry(entry.id, 'startTime', e.target.value)}
                                    className="bg-transparent text-sm text-white outline-none font-mono font-black"
                                 />
                                 <ArrowRight size={14} className="text-slate-600" />
                                 <input 
                                    type="time" 
                                    value={entry.endTime} 
                                    onChange={(e) => updateEntry(entry.id, 'endTime', e.target.value)}
                                    className="bg-transparent text-sm text-white outline-none font-mono font-black"
                                 />
                              </div>
                           </td>
                           <td className="px-6 py-4 min-w-[350px]">
                              <input 
                                 type="text"
                                 value={entry.purpose} 
                                 onChange={(e) => updateEntry(entry.id, 'purpose', e.target.value)}
                                 placeholder="Enter purpose..."
                                 className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-bold outline-none focus:border-indigo-500 placeholder-slate-600 transition-all shadow-inner"
                              />
                           </td>
                           <td className="px-6 py-4 text-center w-24">
                              <div className="text-sm font-mono font-black text-slate-300">
                                 {entry.actualHours.toFixed(1)}
                              </div>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <div className={`text-sm font-mono font-black ${eqv > 0 ? (entry.type === 'holiday' ? 'text-rose-500' : 'text-emerald-500') : 'text-slate-700'}`}>
                                 {eqv.toFixed(2)}
                              </div>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <button onClick={() => removeEntry(entry.id)} className="p-3 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all shadow-sm">
                                 <Trash2 size={18} />
                              </button>
                           </td>
                        </tr>
                      );
                    })
                  )}
               </tbody>
            </table>
         </div>
         
         {/* Table Footer */}
         <div className="bg-slate-900/50 px-6 py-5 flex justify-between items-center border-t border-white/5">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic opacity-50">
               *Auto-calculation enabled for Time Actual
            </span>
            <div className="flex gap-10 text-right">
               <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Eqv Hours</p>
                  <p className="text-2xl font-black text-indigo-400 tracking-tighter">{totalEqv.toFixed(2)}</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default OvertimeTracker;