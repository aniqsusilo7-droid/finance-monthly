import React from 'react';
import { InvestmentItem } from '../types';
import CurrencyInput from './ui/CurrencyInput';
import { formatRupiah } from '../utils';
import { Plus, Trash2, TrendingUp, Target, Briefcase, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface InvestmentsProps {
  items: InvestmentItem[];
  onChange: (items: InvestmentItem[]) => void;
}

const COLORS = ['#6366F1', '#3B82F6', '#10B981', '#F97316', '#F43F5E', '#8B5CF6'];

const Investments: React.FC<InvestmentsProps> = ({ items, onChange }) => {
  const addItem = () => {
    const newItem: InvestmentItem = { id: Date.now().toString(), name: '', currentValue: 0, targetValue: 0 };
    onChange([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof InvestmentItem, val: any) => {
    const newItems = items.map(item => item.id === id ? { ...item, [field]: val } : item);
    onChange(newItems);
  };

  const deleteItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const totalPortfolio = items.reduce((acc, item) => acc + item.currentValue, 0);
  const totalTarget = items.reduce((acc, item) => acc + item.targetValue, 0);
  const progress = totalTarget > 0 ? (totalPortfolio / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="glass-panel p-6 sm:p-8 rounded-2xl relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white border border-indigo-100">
           <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-5">
              <TrendingUp size={100} className="sm:hidden text-indigo-600" />
              <TrendingUp size={140} className="hidden sm:block text-indigo-600" />
           </div>
           
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-2">
               <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                 <Briefcase size={20} />
               </div>
               <h3 className="text-slate-500 font-medium text-xs sm:text-sm uppercase tracking-wider">Total Aset</h3>
             </div>
             
             <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight mb-4 sm:mb-6">
               {formatRupiah(totalPortfolio)}
             </div>

             <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  <span>Progress Target Global</span>
                  <span className="text-indigo-600">{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 sm:h-2.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out shadow-sm" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                </div>
             </div>
           </div>
        </div>

        {/* Chart */}
        <div className="glass-panel p-4 sm:p-6 rounded-2xl flex flex-col justify-center items-center relative">
          <h3 className="absolute top-4 left-4 sm:top-6 sm:left-6 text-slate-500 font-medium text-xs sm:text-sm uppercase tracking-wider">Distribusi Aset</h3>
          <div className="w-full h-48 sm:h-64 mt-4">
            {items.length > 0 && totalPortfolio > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={items}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="currentValue"
                    stroke="none"
                  >
                    {items.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatRupiah(value)}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: '#1e293b' }}
                    itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                    labelStyle={{ color: '#64748b' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                 <PieChartIcon size={30} className="opacity-30" />
                 <span className="text-xs sm:text-sm">Belum ada data visualisasi</span>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="glass-panel rounded-2xl overflow-hidden">
         <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-base sm:text-lg text-slate-800 flex items-center gap-2">
              <Briefcase size={18} className="text-indigo-600" />
              Daftar Aset
            </h3>
            <button 
              onClick={addItem}
              className="px-3 py-2 sm:px-5 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 text-xs sm:text-sm font-medium transition-all shadow-lg shadow-indigo-200"
            >
              <Plus size={16} /> Tambah
            </button>
         </div>
         <div className="p-4 sm:p-6 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm transition-colors grid grid-cols-2 md:grid-cols-12 gap-3 sm:gap-5 items-end">
                  <div className="col-span-2 md:col-span-4">
                    <label className="text-[10px] sm:text-xs text-slate-500 uppercase font-bold mb-1.5 block">Nama Aset</label>
                    <input 
                      type="text" 
                      value={item.name} 
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:p-3 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      placeholder="Misal: Saham BBCA"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <CurrencyInput 
                      label="Saldo Saat Ini" 
                      value={item.currentValue} 
                      onChange={(v) => updateItem(item.id, 'currentValue', v)}
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <CurrencyInput 
                      label="Target Dana" 
                      value={item.targetValue} 
                      onChange={(v) => updateItem(item.id, 'targetValue', v)}
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-2 flex justify-between items-center pl-2 pt-2 sm:pt-0">
                    <div className="text-xs text-slate-500">
                       {item.targetValue > 0 && (
                         <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                           <Target size={12} className="text-indigo-500" /> 
                           <span className="font-mono font-bold text-indigo-600">{((item.currentValue / item.targetValue) * 100).toFixed(0)}%</span>
                         </span>
                       )}
                    </div>
                    <button onClick={() => deleteItem(item.id)} className="p-2 sm:p-3 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-8 sm:py-12 text-slate-400 flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-slate-50">
                  <Briefcase size={24} className="opacity-50" />
                </div>
                <p className="text-sm">Mulai tambahkan portofolio investasi Anda</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default Investments;
