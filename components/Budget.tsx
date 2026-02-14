import React, { useState } from 'react';
import { BudgetData, BudgetItem, OtherBudgetItem } from '../types';
import CurrencyInput from './ui/CurrencyInput';
import { formatRupiah } from '../utils';
import { ChevronDown, ChevronUp, Plus, Trash2, AlertTriangle, CheckCircle, Info, Wallet } from 'lucide-react';

interface BudgetProps {
  income: number;
  data: BudgetData;
  onChange: (data: BudgetData) => void;
}

interface CategorySectionProps {
  title: string;
  items: BudgetItem[];
  color: string;
  onUpdateItems: (items: BudgetItem[]) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({ 
  title, 
  items, 
  color,
  onUpdateItems
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const catTotalAllocated = items.reduce((a, b) => a + b.budget, 0);
  const catTotalActual = items.reduce((a, b) => a + b.actual, 0);
  const catRemaining = catTotalAllocated - catTotalActual;
  const isCatOver = catTotalActual > catTotalAllocated;
  const unrealizedCount = items.filter(i => i.actual === 0).length;

  const addItem = () => {
    const newItem: BudgetItem = { id: Date.now().toString(), name: '', budget: 0, actual: 0 };
    onUpdateItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof BudgetItem, val: any) => {
    const newItems = items.map(item => item.id === id ? { ...item, [field]: val } : item);
    onUpdateItems(newItems);
  };

  const deleteItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    onUpdateItems(newItems);
  };

  const getIconColor = () => {
      if (color === 'blue') return 'text-blue-600 bg-blue-50';
      if (color === 'emerald') return 'text-emerald-600 bg-emerald-50';
      if (color === 'red') return 'text-red-600 bg-red-50';
      return 'text-slate-600';
  };

  return (
    <div className={`glass-panel rounded-2xl overflow-hidden mb-4 sm:mb-5 transition-all duration-300 hover:shadow-lg`}>
      <div 
        className="p-4 sm:p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 sm:gap-4">
           <div className={`p-2.5 sm:p-3 rounded-xl ${getIconColor()}`}>
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
           </div>
           <div className="flex-1 min-w-0">
             <h4 className="font-bold text-base sm:text-lg text-slate-800 tracking-tight truncate">{title}</h4>
             <div className="text-xs text-slate-500 flex flex-col sm:flex-row sm:gap-3 mt-0.5 sm:mt-1 font-medium">
               <div className="flex items-center gap-2">
                 <span>{items.length} Item</span>
                 {unrealizedCount > 0 && (
                   <span className="text-amber-500 font-medium flex items-center gap-1 bg-amber-50 px-1.5 rounded-full text-[10px] border border-amber-100">
                     <Info size={8} /> {unrealizedCount}
                   </span>
                 )}
               </div>
               <div className="hidden sm:block">
                  <span>Alloc: <span className="text-slate-700">{formatRupiah(catTotalAllocated)}</span></span>
                  <span className="mx-2">•</span>
                  <span>Act: <span className="text-slate-700">{formatRupiah(catTotalActual)}</span></span>
               </div>
             </div>
           </div>
        </div>
        <div className="text-right pl-2">
           <div className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">Sisa</div>
           <div className={`text-base sm:text-lg font-bold ${isCatOver ? 'text-rose-500' : 'text-emerald-600'}`}>
             {formatRupiah(catRemaining)}
           </div>
           {isCatOver && <span className="text-[9px] sm:text-[10px] text-rose-600 flex items-center justify-end gap-1 bg-rose-50 px-2 py-0.5 rounded mt-1 font-medium"><AlertTriangle size={8}/> Over</span>}
        </div>
      </div>

      {expanded && (
        <div className="p-3 sm:p-5 bg-slate-50 border-t border-slate-100">
           {items.map((item) => (
             <div key={item.id} className="grid grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 mb-3 items-end p-3 sm:p-4 bg-white rounded-xl border border-slate-100 shadow-sm transition-colors">
               {/* Name Input - Full width on mobile */}
               <div className="col-span-2 md:col-span-4">
                 <label className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold ml-1 mb-1 block">Item Name</label>
                 <input 
                   type="text" 
                   value={item.name} 
                   onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                   className="w-full bg-slate-50 rounded-xl p-2.5 sm:p-3 text-slate-800 text-sm border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                   placeholder="Nama pengeluaran..."
                 />
               </div>
               
               {/* Budget & Actual - Side by side on mobile */}
               <div className="col-span-1 md:col-span-3">
                 <CurrencyInput 
                   label="Anggaran" 
                   value={item.budget} 
                   onChange={(v) => updateItem(item.id, 'budget', v)}
                   className="text-sm"
                 />
               </div>
               <div className="col-span-1 md:col-span-3">
                 <CurrencyInput 
                   label="Realisasi" 
                   value={item.actual} 
                   onChange={(v) => updateItem(item.id, 'actual', v)}
                   className="text-sm"
                 />
               </div>

               {/* Delete Button */}
               <div className="col-span-2 md:col-span-2 flex justify-end pb-0 sm:pb-1.5">
                 <button onClick={() => deleteItem(item.id)} className="w-full sm:w-auto p-2 sm:p-3 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors border border-transparent hover:border-rose-100 flex items-center justify-center">
                   <Trash2 size={18} />
                   <span className="sm:hidden ml-2 text-sm font-medium">Hapus Item</span>
                 </button>
               </div>

               {/* Alert */}
               {item.budget > 0 && item.actual === 0 && (
                  <div className="col-span-2 md:col-span-12 text-xs text-amber-500 flex items-center gap-1 mt-1 sm:mt-[-8px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Belum ada realisasi
                  </div>
               )}
             </div>
           ))}
           
           <button 
             onClick={addItem}
             className={`w-full py-3 border border-dashed border-${color}-200 text-${color}-600 bg-white rounded-xl hover:bg-${color}-50 hover:border-${color}-300 flex items-center justify-center gap-2 transition-all font-medium text-sm mt-2`}
           >
             <Plus size={16} /> Tambah Item
           </button>
        </div>
      )}
    </div>
  );
};

interface OthersCategoryProps {
  allocation: number;
  items: OtherBudgetItem[];
  onUpdateAllocation: (val: number) => void;
  onUpdateItems: (items: OtherBudgetItem[]) => void;
}

const OthersCategory: React.FC<OthersCategoryProps> = ({
  allocation,
  items,
  onUpdateAllocation,
  onUpdateItems
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const catTotalActual = items.reduce((a, b) => a + b.actual, 0);
  const catRemaining = allocation - catTotalActual;
  const isCatOver = catTotalActual > allocation;
  const unrealizedCount = items.filter(i => i.actual === 0).length;

  const addItem = () => {
    const newItem: OtherBudgetItem = { id: Date.now().toString(), name: '', actual: 0 };
    onUpdateItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof OtherBudgetItem, val: any) => {
    const newItems = items.map(item => item.id === id ? { ...item, [field]: val } : item);
    onUpdateItems(newItems);
  };

  const deleteItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    onUpdateItems(newItems);
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden mb-5 transition-all duration-300 hover:shadow-lg">
      <div 
        className="p-4 sm:p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 sm:gap-4">
           <div className="p-2.5 sm:p-3 rounded-xl bg-violet-50 text-violet-600">
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
           </div>
           <div className="flex-1 min-w-0">
             <h4 className="font-bold text-base sm:text-lg text-slate-800 tracking-tight truncate">Lain-lain</h4>
             <div className="text-xs text-slate-500 flex flex-col sm:flex-row sm:gap-3 mt-0.5 sm:mt-1 font-medium">
                <div className="flex items-center gap-2">
                 <span>{items.length} Item</span>
                 {unrealizedCount > 0 && (
                   <span className="text-amber-500 font-medium flex items-center gap-1 bg-amber-50 px-1.5 rounded-full text-[10px] border border-amber-100">
                     <Info size={8} /> {unrealizedCount}
                   </span>
                 )}
               </div>
             </div>
           </div>
        </div>
        <div className="text-right pl-2">
           <div className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">Sisa</div>
           <div className={`text-base sm:text-lg font-bold ${isCatOver ? 'text-rose-500' : 'text-emerald-600'}`}>
             {formatRupiah(catRemaining)}
           </div>
           {isCatOver && <span className="text-[9px] sm:text-[10px] text-rose-600 flex items-center justify-end gap-1 bg-rose-50 px-2 py-0.5 rounded mt-1 font-medium"><AlertTriangle size={8}/> Over</span>}
        </div>
      </div>

      {expanded && (
        <div className="p-3 sm:p-5 bg-slate-50 border-t border-slate-100">
           <div className="mb-4 sm:mb-6 bg-violet-50 p-4 rounded-xl border border-violet-100">
             <CurrencyInput 
               label="Total Anggaran Lain-lain"
               value={allocation}
               onChange={onUpdateAllocation}
             />
           </div>

           {items.map((item) => (
             <div key={item.id} className="grid grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 mb-3 items-end p-3 sm:p-4 bg-white rounded-xl border border-slate-100 shadow-sm transition-colors">
               <div className="col-span-2 md:col-span-7">
                 <label className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold ml-1 mb-1 block">Item Name</label>
                 <input 
                   type="text" 
                   value={item.name} 
                   onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                   className="w-full bg-slate-50 rounded-xl p-2.5 sm:p-3 text-slate-800 text-sm border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                   placeholder="Nama pengeluaran..."
                 />
               </div>
               <div className="col-span-2 md:col-span-3">
                 <CurrencyInput 
                   label="Realisasi" 
                   value={item.actual} 
                   onChange={(v) => updateItem(item.id, 'actual', v)}
                   className="text-sm"
                 />
               </div>
               <div className="col-span-2 md:col-span-2 flex justify-end pb-0 sm:pb-1.5">
                 <button onClick={() => deleteItem(item.id)} className="w-full sm:w-auto p-2 sm:p-3 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors border border-transparent hover:border-rose-100 flex items-center justify-center">
                   <Trash2 size={18} />
                   <span className="sm:hidden ml-2 text-sm font-medium">Hapus Item</span>
                 </button>
               </div>
                {item.actual === 0 && (
                  <div className="col-span-2 md:col-span-12 text-xs text-amber-500 flex items-center gap-1 mt-1 sm:mt-[-8px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Belum ada realisasi
                  </div>
               )}
             </div>
           ))}
           
           <button 
             onClick={addItem}
             className="w-full py-3 border border-dashed border-violet-200 text-violet-600 bg-white rounded-xl hover:bg-violet-50 hover:border-violet-300 flex items-center justify-center gap-2 transition-all font-medium text-sm mt-2"
           >
             <Plus size={16} /> Tambah Item
           </button>
        </div>
      )}
    </div>
  );
};

const Budget: React.FC<BudgetProps> = ({ income, data, onChange }) => {
  const calcTotalBudget = () => {
    const needs = data.needs.items.reduce((acc, item) => acc + item.budget, 0);
    const savings = data.savings.items.reduce((acc, item) => acc + item.budget, 0);
    const debt = data.debt.items.reduce((acc, item) => acc + item.budget, 0);
    const others = data.others.allocation;
    return needs + savings + debt + others;
  };

  const calcTotalActual = () => {
    const needs = data.needs.items.reduce((acc, item) => acc + item.actual, 0);
    const savings = data.savings.items.reduce((acc, item) => acc + item.actual, 0);
    const debt = data.debt.items.reduce((acc, item) => acc + item.actual, 0);
    const others = data.others.items.reduce((acc, item) => acc + item.actual, 0);
    return needs + savings + debt + others;
  };

  const totalAllocated = calcTotalBudget();
  const totalActual = calcTotalActual();
  const balance = income - totalActual;
  
  const isOverBudget = totalAllocated > income;
  const isOverSpent = totalActual > totalAllocated;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="glass-panel p-4 sm:p-5 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
           <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet size={64} className="text-indigo-600" />
           </div>
           <p className="text-slate-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">Penghasilan (Net)</p>
           <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{formatRupiah(income)}</h3>
        </div>

        {/* Budget Card */}
        <div className="glass-panel p-4 sm:p-5 rounded-2xl relative overflow-hidden hover:-translate-y-1 transition-transform duration-300">
           <p className="text-slate-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">Total Anggaran</p>
           <h3 className={`text-xl md:text-2xl font-bold tracking-tight ${isOverBudget ? 'text-rose-500' : 'text-blue-600'}`}>
             {formatRupiah(totalAllocated)}
           </h3>
           <div className="w-full bg-slate-100 h-1.5 mt-2 sm:mt-3 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${isOverBudget ? 'bg-rose-500' : 'bg-blue-500'}`} 
                style={{ width: `${Math.min((totalAllocated / income) * 100, 100)}%` }} 
              />
           </div>
           {isOverBudget && <span className="text-[10px] text-rose-500 absolute top-4 right-4 flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-full border border-rose-100"><AlertTriangle size={10}/> Over</span>}
        </div>

        {/* Realization Card */}
        <div className="glass-panel p-4 sm:p-5 rounded-2xl relative overflow-hidden hover:-translate-y-1 transition-transform duration-300">
           <p className="text-slate-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">Total Realisasi</p>
           <h3 className={`text-xl md:text-2xl font-bold tracking-tight ${isOverSpent ? 'text-rose-500' : 'text-amber-500'}`}>
             {formatRupiah(totalActual)}
           </h3>
           <div className="w-full bg-slate-100 h-1.5 mt-2 sm:mt-3 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${isOverSpent ? 'bg-rose-500' : 'bg-amber-500'}`} 
                style={{ width: `${Math.min((totalActual / totalAllocated) * 100, 100)}%` }} 
              />
           </div>
        </div>

        {/* Balance Card */}
        <div className={`glass-panel p-4 sm:p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${balance < 0 ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}>
           <p className="text-slate-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">Sisa Saldo</p>
           <h3 className={`text-xl md:text-2xl font-bold tracking-tight ${balance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
             {formatRupiah(balance)}
           </h3>
           <div className="mt-2 sm:mt-3 flex items-center">
             {balance > 0 ? (
               <span className="text-[10px] sm:text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium"><CheckCircle size={10}/> Aman</span>
             ) : (
               <span className="text-[10px] sm:text-[11px] text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium"><AlertTriangle size={10}/> Defisit</span>
             )}
           </div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <CategorySection 
          title="Kebutuhan Pokok" 
          items={data.needs.items} 
          color="blue" 
          onUpdateItems={(items) => onChange({ ...data, needs: { items } })}
        />
        <CategorySection 
          title="Tabungan / Investasi" 
          items={data.savings.items} 
          color="emerald" 
          onUpdateItems={(items) => onChange({ ...data, savings: { items } })}
        />
        <CategorySection 
          title="Hutang / Cicilan" 
          items={data.debt.items} 
          color="red" 
          onUpdateItems={(items) => onChange({ ...data, debt: { items } })}
        />
        <OthersCategory 
          allocation={data.others.allocation} 
          items={data.others.items}
          onUpdateAllocation={(val) => onChange({ ...data, others: { ...data.others, allocation: val } })}
          onUpdateItems={(items) => onChange({ ...data, others: { ...data.others, items } })}
        />
      </div>
    </div>
  );
};

export default Budget;
