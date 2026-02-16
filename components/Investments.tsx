import React, { useState } from 'react';
import { InvestmentItem } from '../types';
import CurrencyInput from './ui/CurrencyInput';
import DeleteModal from './ui/DeleteModal';
import { formatRupiah } from '../utils';
import { Plus, Trash2, TrendingUp, Target, Briefcase, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface InvestmentsProps {
  items: InvestmentItem[];
  onChange: (items: InvestmentItem[]) => void;
}

const COLORS = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6'];

const Investments: React.FC<InvestmentsProps> = ({ items, onChange }) => {
  const [deleteTarget, setDeleteTarget] = useState<InvestmentItem | null>(null);

  const addItem = () => {
    const newItem: InvestmentItem = { id: Date.now().toString() + Math.random().toString(36).substr(2, 5), name: '', currentValue: 0, targetValue: 0 };
    onChange([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof InvestmentItem, val: any) => {
    const newItems = items.map(item => item.id === id ? { ...item, [field]: val } : item);
    onChange(newItems);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    onChange(items.filter(item => item.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const totalPortfolio = items.reduce((acc, item) => acc + (item.currentValue || 0), 0);
  const totalTarget = items.reduce((acc, item) => acc + (item.targetValue || 0), 0);
  const progress = totalTarget > 0 ? (totalPortfolio / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="glass-panel p-6 sm:p-8 rounded-[2rem] relative overflow-hidden border border-indigo-900/30">
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <TrendingUp size={140} className="text-indigo-400" />
           </div>
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-2">
               <Briefcase size={20} className="text-indigo-400" />
               <h3 className="text-slate-400 font-black text-xs uppercase tracking-wider">Total Nilai Aset</h3>
             </div>
             <div className="text-3xl sm:text-4xl font-black text-white mb-6 tracking-tight">{formatRupiah(totalPortfolio)}</div>
             <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-2">
                  <span>Target Progress</span>
                  <span className="text-indigo-400">{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-blue-500 h-full transition-all duration-1000 shadow-lg" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                </div>
             </div>
           </div>
        </div>

        <div className="glass-panel p-6 rounded-[2rem] flex flex-col items-center justify-center min-h-[300px] border border-slate-800">
          <h3 className="w-full text-left text-slate-400 font-black text-xs uppercase tracking-wider mb-4 pl-2">Alokasi Aset</h3>
          {items.length > 0 && totalPortfolio > 0 ? (
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={items.filter(i => (i.currentValue || 0) > 0)} 
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80} 
                    dataKey="currentValue" stroke="#0f172a" strokeWidth={2} labelLine={false} 
                    // All white label (Name + Persen)
                    label={(props: any) => (
                      <text x={props.x} y={props.y} fill="#FFFFFF" textAnchor={props.textAnchor} dominantBaseline={props.dominantBaseline} fontSize={10} fontWeight="bold">
                        {`${props.name} ${(props.percent * 100).toFixed(0)}%`}
                      </text>
                    )}
                  >
                    {items.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v:any)=>formatRupiah(v)} contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 gap-3 opacity-30 py-10">
              <PieChartIcon size={48} />
              <span className="font-black uppercase text-xs tracking-widest">Belum ada data</span>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-[2rem] overflow-hidden border border-slate-800 shadow-xl">
         <div className="p-4 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
            <h3 className="font-black text-base sm:text-lg text-white uppercase tracking-tight flex items-center gap-2">
               <div className="w-1.5 h-5 bg-indigo-500 rounded-full"></div> DAFTAR ASET & INVESTASI
            </h3>
            <button type="button" onClick={addItem} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg">
              <Plus size={16} /> TAMBAH ASET
            </button>
         </div>
         <div className="p-4 sm:p-6 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-700/50 grid grid-cols-2 md:grid-cols-12 gap-4 items-end transition-colors hover:border-slate-600 group/asset">
                  <div className="col-span-2 md:col-span-4">
                    <label className="text-[10px] text-slate-500 uppercase font-black mb-1.5 block">Nama Aset</label>
                    <input type="text" value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm font-black outline-none focus:border-indigo-500" placeholder="Saham / Emas / Dll" />
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <CurrencyInput label="Nilai Saldo" value={item.currentValue} onChange={(v) => updateItem(item.id, 'currentValue', v)} />
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <CurrencyInput label="Target Nilai" value={item.targetValue} onChange={(v) => updateItem(item.id, 'targetValue', v)} />
                  </div>
                  <div className="col-span-2 md:col-span-2 flex justify-between items-center pt-2">
                    <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 font-mono font-black text-indigo-400 text-xs">
                      {item.targetValue > 0 ? ((item.currentValue/item.targetValue)*100).toFixed(0) : 0}%
                    </div>
                    <button type="button" onClick={() => setDeleteTarget(item)} className="p-3 text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 rounded-xl transition-all">
                      <Trash2 size={22} />
                    </button>
                  </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-10 opacity-30 flex flex-col items-center gap-3">
                <Briefcase size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest">Belum ada aset</p>
              </div>
            )}
         </div>
      </div>

      <DeleteModal isOpen={!!deleteTarget} title="Hapus Aset" itemName={deleteTarget?.name || ""} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    </div>
  );
};

export default Investments;