
import React, { useState } from 'react';
import { BudgetData, BudgetItem } from '../types';
import CurrencyInput from './ui/CurrencyInput';
import DeleteModal from './ui/DeleteModal';
import { formatRupiah } from '../utils';
import { ChevronDown, ChevronUp, Plus, Trash2, FolderPlus, X, Check, AlertTriangle, Pencil } from 'lucide-react';

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
  onRenameCategory: (newName: string) => void;
  defaultExpanded?: boolean;
  canDelete?: boolean;
  canRename?: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({ 
  title, 
  items, 
  colorHex,
  onUpdateItems,
  onRequestDeleteCategory,
  onRequestDeleteItem,
  onRenameCategory,
  defaultExpanded = false,
  canDelete = true,
  canRename = true
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const catTotalAllocated = items?.reduce((a, b) => a + (b.budget || 0), 0) || 0;
  const catTotalActual = items?.reduce((a, b) => a + (b.actual || 0), 0) || 0;
  const isCatOver = catTotalActual > catTotalAllocated;
  
  const filledCount = items?.filter(item => (item.actual || 0) > 0).length || 0;
  const totalCount = items?.length || 0;
  const isIncomplete = items?.some(item => (item.budget || 0) > 0 && (item.actual || 0) === 0);

  const handleRename = () => {
    if (tempTitle.trim() && tempTitle !== title) {
      onRenameCategory(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
    setIsEditingTitle(false);
  };

  return (
    <div 
      className={`glass-panel rounded-[2rem] overflow-hidden mb-6 transition-all duration-500 ${isCatOver ? 'ring-2 ring-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.2)]' : 'hover:shadow-2xl hover:border-white/20'}`}
      style={{ borderLeft: `6px solid ${colorHex}` }}
    >
      <div className="flex items-stretch border-b border-white/5">
        <div 
          className="flex-1 p-5 sm:p-6 flex items-center gap-4 sm:gap-5 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => !isEditingTitle && setExpanded(!expanded)}
        >
          <div className="p-3 rounded-2xl bg-slate-900 shadow-inner shrink-0" style={{ color: colorHex }}>
            {expanded ? <ChevronUp size={20} className="sm:w-6 sm:h-6" /> : <ChevronDown size={20} className="sm:w-6 sm:h-6" />}
          </div>
          <div className="flex-1 min-w-0">
             <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1 border border-indigo-500/50" onClick={e => e.stopPropagation()}>
                    <input 
                      value={tempTitle} 
                      onChange={e => setTempTitle(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleRename()}
                      autoFocus
                      className="bg-transparent border-none outline-none text-white font-black text-sm sm:text-lg uppercase px-2 w-40 sm:w-64" 
                    />
                    <button onClick={handleRename} className="p-1 bg-indigo-600 rounded text-white"><Check size={14}/></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/title">
                    <h4 className="font-black text-sm sm:text-lg text-white uppercase tracking-tighter truncate">{title}</h4>
                    {canRename && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
                        className="p-1.5 text-slate-500 hover:text-indigo-400 opacity-0 group-hover/title:opacity-100 transition-opacity"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                   <span className="text-[9px] sm:text-[10px] font-black text-slate-400 bg-slate-900 px-2 sm:px-3 py-1 rounded-full border border-slate-700 whitespace-nowrap">{filledCount}/{totalCount} TERISI</span>
                   {isIncomplete && (
                     <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full border border-amber-400/20 animate-pulse whitespace-nowrap">
                        <AlertTriangle size={10} /> BELUM LENGKAP
                     </span>
                   )}
                </div>
             </div>
             <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span className="flex items-center gap-1.5">BUDGET: <span className="text-white">{formatRupiah(catTotalAllocated)}</span></span>
                <span className="flex items-center gap-1.5">AKTUAL: <span className={isCatOver ? 'text-rose-400' : 'text-emerald-400'}>{formatRupiah(catTotalActual)}</span></span>
             </div>
          </div>
        </div>

        {canDelete && (
          <div className="flex items-center px-3 sm:px-4 bg-slate-950/20 border-l border-white/5">
            <button 
              type="button" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRequestDeleteCategory();
              }}
              className="p-3 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
            >
              <Trash2 size={20} />
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="p-4 sm:p-8 bg-slate-950/40 space-y-4 animate-fadeIn">
           {(items || []).map((item) => (
             <div key={item.id} className="grid grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 p-4 bg-slate-900/60 rounded-2xl border border-white/5 items-end">
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
                    className="p-3 text-slate-600 hover:text-rose-500"
                 >
                   <Trash2 size={20} />
                 </button>
               </div>
             </div>
           ))}
           <button 
             type="button" 
             onClick={() => onUpdateItems([...(items || []), {id: Date.now().toString(), name: '', budget: 0, actual: 0}])} 
             className="w-full py-4 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-all"
           >
             <Plus size={16} /> TAMBAH ITEM
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
    <div className="space-y-6 sm:space-y-8 pb-20 animate-fadeIn">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <div className="glass-panel p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-l-4 sm:border-l-8 border-indigo-600 shadow-xl">
          <p className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1">Net Income</p>
          <h3 className="text-sm sm:text-2xl font-black text-white tracking-tight">{formatRupiah(income)}</h3>
        </div>
        <div className="glass-panel p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-l-4 sm:border-l-8 border-blue-500 shadow-xl">
          <p className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1">Anggaran</p>
          <h3 className="text-sm sm:text-2xl font-black text-white tracking-tight">{formatRupiah(totalAlloc)}</h3>
        </div>
        <div className="glass-panel p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-l-4 sm:border-l-8 border-amber-500 shadow-xl">
          <p className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1">Realisasi</p>
          <h3 className="text-sm sm:text-2xl font-black text-amber-500 tracking-tight">{formatRupiah(totalAct)}</h3>
        </div>
        <div className={`glass-panel p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-l-4 sm:border-l-8 shadow-xl ${income-totalAct < 0 ? 'border-rose-600' : 'border-emerald-600'}`}>
          <p className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1">Sisa</p>
          <h3 className={`text-sm sm:text-2xl font-black tracking-tight ${income-totalAct < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{formatRupiah(income-totalAct)}</h3>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-b border-white/5 pb-6">
         <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <div className="w-2 h-6 sm:h-8 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div> 
            ALOKASI ANGGARAN
         </h2>
         {!isAdding ? (
           <button onClick={() => setIsAdding(true)} className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-indigo-600 text-white rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black flex items-center justify-center gap-3 uppercase tracking-widest transition-all hover:bg-indigo-700 shadow-lg">
             <FolderPlus size={16} /> TAMBAH KATEGORI
           </button>
         ) : (
           <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-700 w-full sm:w-auto">
             <input autoFocus value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==='Enter' && (()=>{if(newName.trim()){onChange({...data, custom: [...(data.custom||[]), {id: Date.now().toString(), name: newName.trim(), items: []}]}); setNewName(''); setIsAdding(false);}})()} placeholder="Nama Kategori..." className="bg-transparent border-none outline-none text-white font-black text-sm uppercase px-2 w-40 sm:w-64" />
             <button onClick={()=>{if(newName.trim()){onChange({...data, custom: [...(data.custom||[]), {id: Date.now().toString(), name: newName.trim(), items: []}]}); setNewName(''); setIsAdding(false);}}} className="p-2 bg-indigo-600 text-white rounded-lg"><Check size={18}/></button>
             <button onClick={()=>setIsAdding(false)} className="p-2 bg-slate-800 text-slate-400 rounded-lg"><X size={18}/></button>
           </div>
         )}
      </div>

      <div className="space-y-4">
        {data.needs && <CategorySection title="Kebutuhan Pokok" items={data.needs.items} colorHex={CATEGORY_COLORS.needs} onRenameCategory={() => {}} onRequestDeleteCategory={() => setDeleteTarget({ type: 'category', id: 'needs', name: 'Kebutuhan Pokok', categoryKey: 'needs' })} onRequestDeleteItem={(id, name) => setDeleteTarget({ type: 'item', id, name, categoryKey: 'needs' })} onUpdateItems={i => onChange({ ...data, needs: { items: i } })} canDelete={false} canRename={false} />}
        
        {data.savings && <CategorySection title="Tabungan & Investasi" items={data.savings.items} colorHex={CATEGORY_COLORS.savings} onRenameCategory={() => {}} onRequestDeleteCategory={() => setDeleteTarget({ type: 'category', id: 'savings', name: 'Tabungan & Investasi', categoryKey: 'savings' })} onRequestDeleteItem={(id, name) => setDeleteTarget({ type: 'item', id, name, categoryKey: 'savings' })} onUpdateItems={i => onChange({ ...data, savings: { items: i } })} canDelete={false} canRename={false} />}
        
        {data.debt && <CategorySection title="Hutang & Cicilan" items={data.debt.items} colorHex={CATEGORY_COLORS.debt} onRenameCategory={() => {}} onRequestDeleteCategory={() => setDeleteTarget({ type: 'category', id: 'debt', name: 'Hutang & Cicilan', categoryKey: 'debt' })} onRequestDeleteItem={(id, name) => setDeleteTarget({ type: 'item', id, name, categoryKey: 'debt' })} onUpdateItems={i => onChange({ ...data, debt: { items: i } })} canDelete={false} canRename={false} />}
        
        {(data.custom||[]).map((cat, idx) => (
          <CategorySection key={cat.id} title={cat.name} items={cat.items} colorHex={CATEGORY_COLORS.extra[idx % CATEGORY_COLORS.extra.length]} onRenameCategory={(newTitle) => onChange({...data, custom: data.custom!.map(c => c.id === cat.id ? {...c, name: newTitle} : c)})} onRequestDeleteCategory={() => setDeleteTarget({ type: 'category', id: cat.id, name: cat.name, categoryKey: 'custom' })} onRequestDeleteItem={(id, name) => setDeleteTarget({ type: 'item', id, name, categoryKey: cat.id })} onUpdateItems={i => onChange({ ...data, custom: data.custom!.map(c => c.id === cat.id ? { ...c, items: i } : c) })} />
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
        <div className="flex-1 p-5 sm:p-6 flex items-center gap-4 sm:gap-5 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setExpanded(!expanded)}>
           <div className="p-3 rounded-2xl bg-slate-900 text-[#8B5CF6] shrink-0">
             {expanded ? <ChevronUp size={20} className="sm:w-6 sm:h-6" /> : <ChevronDown size={20} className="sm:w-6 sm:h-6" />}
           </div>
           <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h4 className="font-black text-sm sm:text-lg text-white uppercase tracking-tighter">Lain-lain / Hiburan</h4>
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-400 bg-slate-900 px-2 sm:px-3 py-1 rounded-full border border-slate-700">{itemsWithActual}/{totalItems} TERISI</span>
                </div>
                <div className="flex gap-4 mt-1 text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  <span>LIMIT: <span className="text-indigo-400">{formatRupiah(data.allocation)}</span></span>
                  <span>TERPAKAI: <span className="text-violet-400">{formatRupiah(totalAct)}</span></span>
                </div>
           </div>
        </div>
        <div className="flex items-center px-3 sm:px-4 bg-slate-950/20 border-l border-white/5">
          <button type="button" onClick={onRequestDelete} className="p-3 text-slate-600 hover:text-rose-500"><Trash2 size={20} /></button>
        </div>
      </div>
      {expanded && (
        <div className="p-4 sm:p-8 bg-slate-950/40 space-y-6 animate-fadeIn">
           <CurrencyInput label="Limit Anggaran Hiburan" value={data.allocation} onChange={v=>onUpdate({...data, allocation: v})} />
           <div className="space-y-4 pt-4 border-t border-white/5">
             {(data.items || []).map((item:any) => (
               <div key={item.id} className="grid grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 p-4 bg-slate-900/60 rounded-2xl border border-white/5 items-end">
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
           <button type="button" onClick={()=>onUpdate({...data, items: [...(data.items || []), {id: Date.now().toString(), name: '', actual: 0}]})} className="w-full py-4 border-2 border-dashed border-violet-900/40 text-violet-400 bg-violet-900/5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-violet-900/10 transition-all">
             <Plus size={16} /> TAMBAH PENGELUARAN
           </button>
        </div>
      )}
    </div>
  );
};

export default Budget;
