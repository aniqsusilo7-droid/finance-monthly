import React, { useState } from 'react';
import { BudgetData, BudgetItem } from '../types';
import CurrencyInput from './ui/CurrencyInput';
import DeleteModal from './ui/DeleteModal';
import { formatRupiah } from '../utils';
import { ChevronDown, ChevronUp, Plus, Trash2, FolderPlus, X, Check, AlertTriangle } from 'lucide-react';

interface BudgetProps {
  income: number;
  data: BudgetData;
  onChange: (data: BudgetData) => void;
}

interface CategorySectionProps {
  title: string;
  items: BudgetItem[];
  colorHex: string;
  onUpdateItems: (items: BudgetItem[]) => void;
  onRequestDeleteCategory: () => void;
  onRequestDeleteItem: (id: string, name: string) => void;
  defaultExpanded?: boolean;
  canDelete?: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({ 
  title, 
  items, 
  colorHex,
  onUpdateItems,
  onRequestDeleteCategory,
  onRequestDeleteItem,
  defaultExpanded = false,
  canDelete = true
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const catTotalAllocated = items?.reduce((a, b) => a + (b.budget || 0), 0) || 0;
  const catTotalActual = items?.reduce((a, b) => a + (b.actual || 0), 0) || 0;
  const catRemaining = catTotalAllocated - catTotalActual;
  const isCatOver = catTotalActual > catTotalAllocated;
  
  // Count items with actual entries
  const filledCount = items?.filter(item => (item.actual || 0) > 0).length || 0;
  const totalCount = items?.length || 0;
  
  // Check if any item has a budget but 0 actual (Incomplete)
  const isIncomplete = items?.some(item => (item.budget || 0) > 0 && (item.actual || 0) === 0);

  return (
    <div 
      className={`glass-panel rounded-[2rem] overflow-hidden mb-6 transition-all duration-500 ${isCatOver ? 'ring-2 ring-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.2)]' : 'hover:shadow-2xl hover:border-white/20'}`}
      style={{ borderLeft: `6px solid ${colorHex}` }}
    >
      <div className="flex items-stretch border-b border-white/5">
        <div 
          className="flex-1 p-5 sm:p-6 flex items-center gap-5 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="p-3 rounded-2xl bg-slate-900 shadow-inner shrink-0" style={{ color: colorHex }}>
            {expanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>
          <div className="flex-1 min-w-0">
             <div className="flex flex-wrap items-center gap-3">
                <h4 className="font-black text-base sm:text-lg text-white uppercase tracking-tighter truncate">{title}</h4>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">{filledCount}/{totalCount} TERISI</span>
                   {isIncomplete && (
                     <span className="flex items-center gap-1.5 text-[9px] font-black text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 animate-pulse">
                        <AlertTriangle size={10} /> BELUM LENGKAP
                     </span>
                   )}
                </div>
             </div>
             <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span className="flex items-center gap-1.5">PLAN: <span className="text-white">{formatRupiah(catTotalAllocated)}</span></span>
                <span className="flex items-center gap-1.5">AKTUAL: <span className={isCatOver ? 'text-rose-400' : 'text-emerald-400'}>{formatRupiah(catTotalActual)}</span></span>
                <span className="flex items-center gap-1.5">SISA: <span className="text-indigo-400">{formatRupiah(catRemaining)}</span></span>
             </div>
          </div>
        </div>

        {canDelete && (
          <div className="flex items-center px-4 bg-slate-950/20 border-l border-white/5">
            <button 
              type="button" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRequestDeleteCategory();
              }}
              className="p-3.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all group"
            >
              <Trash2 size={22} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="p-5 sm:p-8 bg-slate-950/40 space-y-4 animate-fadeIn">
           {(items || []).map((item) => (
             <div key={item.id} className="grid grid-cols-2 md:grid-cols-12 gap-4 p-4 bg-slate-900/60 rounded-2xl border border-white/5 items-end hover:border-white/10 transition-all">
               <div className="col-span-2 md:col-span-5">
                 <label className="text-[9px] uppercase font-black text-slate-500 block mb-2 tracking-widest">Detail Item</label>
                 <input type="text" value={item.name} onChange={(e) => onUpdateItems(items.map(i => i.id === item.id ? {...i, name: e.target.value} : i))} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white font-black outline-none focus:border-indigo-500 shadow-inner" placeholder="Nama item..." />
               </div>
               <div className="col-span-1 md:col-span-3">
                 <CurrencyInput label="Budget" value={item.budget} onChange={(v) => onUpdateItems(items.map(i => i.id === item.id ? {...i, budget: v} : i))} />
               </div>
               <div className="col-span-1 md:col-span-3">
                 <CurrencyInput label="Realisasi" value={item.actual} onChange={(v) => onUpdateItems(items.map(i => i.id === item.id ? {...i, actual: v} : i))} />
               </div>
               <div className="col-span-2 md:col-span-1 flex justify-end">
                 <button 
                    type="button" 
                    onClick={() => onRequestDeleteItem(item.id, item.name)} 
                    className="p-3 text-slate-600 hover:text-rose-500 transition-all"
                 >
                   <Trash2 size={20} />
                 </button>
               </div>
             </div>
           ))}
           <button 
             type="button" 
             onClick={() => onUpdateItems([...(items || []), {id: Date.now().toString(), name: '', budget: 0, actual: 0}])} 
             className="w-full py-4 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.3em] text-slate-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
           >
             <Plus size={18} /> TAMBAH ITEM
           </button>
        </div>
      )}
    </div>
  );
};

const Budget: React.FC<BudgetProps> = ({ income, data, onChange }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const CATEGORY_COLORS = {
    needs: '#6366F1',
    savings: '#10B981',
    debt: '#F43F5E',
    others: '#8B5CF6',
    extra: ['#F59E0B', '#06B6D4', '#EC4899', '#14B8A6', '#F97316']
  };

  const totalAlloc = (data.needs?.items?.reduce((a,b)=>a+(b.budget||0),0)||0) + 
                     (data.savings?.items?.reduce((a,b)=>a+(b.budget||0),0)||0) + 
                     (data.debt?.items?.reduce((a,b)=>a+(b.budget||0),0)||0) + 
                     (data.others?.allocation||0) + 
                     (data.custom?.reduce((a,c)=>a+c.items.reduce((ia,ii)=>ia+(ii.budget||0),0),0)||0);

  const totalAct = (data.needs?.items?.reduce((a,b)=>a+(b.actual||0),0)||0) + 
                    (data.savings?.items?.reduce((a,b)=>a+(b.actual||0),0)||0) + 
                    (data.debt?.items?.reduce((a,b)=>a+(b.actual||0),0)||0) + 
                    (data.others?.items?.reduce((a,b)=>a+(b.actual||0),0)||0) + 
                    (data.custom?.reduce((a,c)=>a+c.items.reduce((ia,ii)=>ia+(ii.actual||0),0),0)||0);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'category') {
      const { categoryKey, id } = deleteTarget;
      if (categoryKey === 'custom') {
        onChange({ ...data, custom: (data.custom || []).filter(c => c.id !== id) });
      } else {
        const newData = { ...data };
        delete (newData as any)[categoryKey];
        onChange(newData);
      }
    } else {
      const { categoryKey, id } = deleteTarget;
      if (['needs', 'savings', 'debt'].includes(categoryKey)) {
        const cat = (data as any)[categoryKey];
        onChange({ ...data, [categoryKey]: { ...cat, items: cat.items.filter((i:any) => i.id !== id) } });
      } else if (categoryKey === 'others-items') {
        onChange({ ...data, others: { ...data.others!, items: data.others!.items.filter(i => i.id !== id) } });
      } else {
        const updatedCustom = (data.custom || []).map(cat => cat.id === categoryKey ? { ...cat, items: cat.items.filter(i => i.id !== id) } : cat);
        onChange({ ...data, custom: updatedCustom });
      }
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-8 pb-20 animate-fadeIn">
      {/* Header Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass-panel p-6 rounded-[2rem] border-l-8 border-indigo-600 shadow-xl">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Net Income</p>
          <h3 className="text-2xl font-black text-white tracking-tight">{formatRupiah(income)}</h3>
        </div>
        <div className="glass-panel p-6 rounded-[2rem] border-l-8 border-blue-500 shadow-xl">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Anggaran</p>
          <h3 className="text-2xl font-black text-white tracking-tight">{formatRupiah(totalAlloc)}</h3>
        </div>
        <div className="glass-panel p-6 rounded-[2rem] border-l-8 border-amber-500 shadow-xl">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Realisasi</p>
          <h3 className="text-2xl font-black text-amber-500 tracking-tight">{formatRupiah(totalAct)}</h3>
        </div>
        <div className={`glass-panel p-6 rounded-[2rem] border-l-8 shadow-xl ${income-totalAct < 0 ? 'border-rose-600' : 'border-emerald-600'}`}>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Sisa Dana</p>
          <h3 className={`text-2xl font-black tracking-tight ${income-totalAct < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{formatRupiah(income-totalAct)}</h3>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-6 border-b border-white/5 pb-8">
         <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
            <div className="w-2.5 h-8 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div> 
            ALOKASI ANGGARAN
         </h2>
         {!isAdding ? (
           <button onClick={() => setIsAdding(true)} className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-3 uppercase tracking-[0.3em] transition-all hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow-2xl">
             <FolderPlus size={18} /> TAMBAH KATEGORI
           </button>
         ) : (
           <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-2xl border border-slate-700 w-full sm:w-auto">
             <input autoFocus value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==='Enter' && (()=>{if(newName.trim()){onChange({...data, custom: [...(data.custom||[]), {id: Date.now().toString(), name: newName.trim(), items: []}]}); setNewName(''); setIsAdding(false);}})()} placeholder="Nama Kategori..." className="bg-transparent px-4 py-2 text-sm text-white font-black outline-none w-full sm:w-64" />
             <button onClick={()=>{if(newName.trim()){onChange({...data, custom: [...(data.custom||[]), {id: Date.now().toString(), name: newName.trim(), items: []}]}); setNewName(''); setIsAdding(false);}}} className="p-3 bg-indigo-600 text-white rounded-xl"><Check size={20}/></button>
             <button onClick={()=>setIsAdding(false)} className="p-3 bg-slate-800 text-slate-400 rounded-xl"><X size={20}/></button>
           </div>
         )}
      </div>

      <div className="space-y-2">
        {data.needs && <CategorySection title="Kebutuhan Pokok" items={data.needs.items} colorHex={CATEGORY_COLORS.needs} onRequestDeleteCategory={() => setDeleteTarget({ type: 'category', id: 'needs', name: 'Kebutuhan Pokok', categoryKey: 'needs' })} onRequestDeleteItem={(id, name) => setDeleteTarget({ type: 'item', id, name, categoryKey: 'needs' })} onUpdateItems={i => onChange({ ...data, needs: { items: i } })} />}
        
        {data.savings && <CategorySection title="Tabungan & Investasi" items={data.savings.items} colorHex={CATEGORY_COLORS.savings} onRequestDeleteCategory={() => setDeleteTarget({ type: 'category', id: 'savings', name: 'Tabungan & Investasi', categoryKey: 'savings' })} onRequestDeleteItem={(id, name) => setDeleteTarget({ type: 'item', id, name, categoryKey: 'savings' })} onUpdateItems={i => onChange({ ...data, savings: { items: i } })} />}
        
        {data.debt && <CategorySection title="Hutang & Cicilan" items={data.debt.items} colorHex={CATEGORY_COLORS.debt} onRequestDeleteCategory={() => setDeleteTarget({ type: 'category', id: 'debt', name: 'Hutang & Cicilan', categoryKey: 'debt' })} onRequestDeleteItem={(id, name) => setDeleteTarget({ type: 'item', id, name, categoryKey: 'debt' })} onUpdateItems={i => onChange({ ...data, debt: { items: i } })} />}
        
        {(data.custom||[]).map((cat, idx) => (
          <CategorySection key={cat.id} title={cat.name} items={cat.items} colorHex={CATEGORY_COLORS.extra[idx % CATEGORY_COLORS.extra.length]} onRequestDeleteCategory={() => setDeleteTarget({ type: 'category', id: cat.id, name: cat.name, categoryKey: 'custom' })} onRequestDeleteItem={(id, name) => setDeleteTarget({ type: 'item', id, name, categoryKey: cat.id })} onUpdateItems={i => onChange({ ...data, custom: data.custom!.map(c => c.id === cat.id ? { ...c, items: i } : c) })} />
        ))}

        {data.others && <OthersSection data={data.others} onUpdate={o=>onChange({...data, others: o})} onRequestDelete={()=>setDeleteTarget({ type: 'category', id: 'others', name: 'Lain-lain', categoryKey: 'others' })} onRequestDeleteItem={(id, name) => setDeleteTarget({ type: 'item', id, name, categoryKey: 'others-items' })} />}
      </div>

      <DeleteModal isOpen={!!deleteTarget} title={deleteTarget?.type === 'category' ? 'Hapus Kategori' : 'Hapus Item'} itemName={deleteTarget?.name || ''} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    </div>
  );
};

const OthersSection: React.FC<{data: any, onUpdate: (d: any)=>void, onRequestDelete: ()=>void, onRequestDeleteItem: (id: string, name: string) => void}> = ({data, onUpdate, onRequestDelete, onRequestDeleteItem}) => {
  const [expanded, setExpanded] = useState(false);
  const totalAct = data.items?.reduce((a:any, b:any)=>a+(b.actual||0), 0) || 0;
  const itemsWithActual = data.items?.filter((item:any) => (item.actual || 0) > 0).length || 0;
  const totalItems = data.items?.length || 0;

  return (
    <div className="glass-panel rounded-[2rem] overflow-hidden mb-6 transition-all hover:shadow-2xl" style={{ borderLeft: '6px solid #8B5CF6' }}>
      <div className="flex items-stretch border-b border-white/5">
        <div className="flex-1 p-6 flex items-center gap-5 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setExpanded(!expanded)}>
           <div className="p-3 rounded-2xl bg-slate-900 text-[#8B5CF6] shrink-0">
             {expanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
           </div>
           <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h4 className="font-black text-lg text-white uppercase tracking-tighter">Lain-lain / Hiburan</h4>
                  <span className="text-[10px] font-black text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">{itemsWithActual}/{totalItems} TERISI</span>
                </div>
                <div className="flex gap-4 mt-1 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  <span>LIMIT: <span className="text-indigo-400">{formatRupiah(data.allocation)}</span></span>
                  <span>TERPAKAI: <span className="text-violet-400">{formatRupiah(totalAct)}</span></span>
                </div>
           </div>
        </div>
        <div className="flex items-center px-4 bg-slate-950/20 border-l border-white/5">
          <button type="button" onClick={onRequestDelete} className="p-3.5 text-slate-600 hover:text-rose-500"><Trash2 size={22} /></button>
        </div>
      </div>
      {expanded && (
        <div className="p-8 bg-slate-950/40 space-y-6 animate-fadeIn">
           <CurrencyInput label="Limit Anggaran Hiburan" value={data.allocation} onChange={v=>onUpdate({...data, allocation: v})} />
           <div className="space-y-4 pt-4 border-t border-white/5">
             {(data.items || []).map((item:any) => (
               <div key={item.id} className="grid grid-cols-2 md:grid-cols-12 gap-4 p-4 bg-slate-900/60 rounded-2xl border border-white/5 items-end">
                 <div className="col-span-2 md:col-span-7">
                   <label className="text-[9px] uppercase font-black text-slate-500 block mb-2 tracking-widest">Keterangan</label>
                   <input value={item.name} onChange={e=>onUpdate({...data, items: data.items.map((i:any)=>i.id===item.id?{...i, name: e.target.value}:i)})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white font-black outline-none focus:border-indigo-500 shadow-inner" placeholder="Misal: Bioskop..." />
                 </div>
                 <div className="col-span-1 md:col-span-4">
                   <CurrencyInput label="Nominal" value={item.actual} onChange={v=>onUpdate({...data, items: data.items.map((i:any)=>i.id===item.id?{...i, actual: v}:i)})} />
                 </div>
                 <div className="col-span-1 md:col-span-1 flex justify-end">
                   <button type="button" onClick={()=>onRequestDeleteItem(item.id, item.name)} className="p-3 text-slate-600 hover:text-rose-500"><Trash2 size={20} /></button>
                 </div>
               </div>
             ))}
           </div>
           <button type="button" onClick={()=>onUpdate({...data, items: [...(data.items || []), {id: Date.now().toString(), name: '', actual: 0}]})} className="w-full py-4 border-2 border-dashed border-violet-900/40 text-violet-400 bg-violet-900/5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-violet-900/10 transition-all">
             <Plus size={18} /> TAMBAH PENGELUARAN
           </button>
        </div>
      )}
    </div>
  );
};

export default Budget;