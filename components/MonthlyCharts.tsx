import React from 'react';
import { BudgetData } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { formatRupiah } from '../utils';
import { AlertTriangle } from 'lucide-react';

interface MonthlyChartsProps {
  budgetData: BudgetData;
  income: number;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  'Pokok': '#6366F1',     // Indigo
  'Tabungan': '#10B981',  // Emerald
  'Cicilan': '#F43F5E',   // Rose
  'Lainnya': '#8B5CF6',   // Violet
};

const EXTRA_COLORS = [
  '#F59E0B', '#06B6D4', '#EC4899', '#14B8A6', '#F97316'
];

const MonthlyCharts: React.FC<MonthlyChartsProps> = ({ budgetData, income }) => {
  const categories: { name: string, Anggaran: number, Aktual: number, isOver: boolean, color: string }[] = [];

  const addCategory = (name: string, budget: number, actual: number, defaultColor: string) => {
    if (budget > 0 || actual > 0) {
      categories.push({
        name,
        Anggaran: budget,
        Aktual: actual,
        isOver: actual > budget,
        color: defaultColor
      });
    }
  };

  addCategory('Pokok', budgetData.needs?.items?.reduce((a, b) => a + (b.budget || 0), 0) || 0, budgetData.needs?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0, CATEGORY_COLORS['Pokok']);
  addCategory('Tabungan', budgetData.savings?.items?.reduce((a, b) => a + (b.budget || 0), 0) || 0, budgetData.savings?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0, CATEGORY_COLORS['Tabungan']);
  addCategory('Cicilan', budgetData.debt?.items?.reduce((a, b) => a + (b.budget || 0), 0) || 0, budgetData.debt?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0, CATEGORY_COLORS['Cicilan']);

  budgetData.custom?.forEach((cat, idx) => {
    addCategory(cat.name || 'Custom', cat.items?.reduce((a, b) => a + (b.budget || 0), 0) || 0, cat.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0, EXTRA_COLORS[idx % EXTRA_COLORS.length]);
  });

  addCategory('Lainnya', budgetData.others?.allocation || 0, budgetData.others?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0, CATEGORY_COLORS['Lainnya']);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const budgetVal = payload.find((p: any) => p.name === 'Rencana')?.value || 0;
      const actualVal = payload.find((p: any) => p.name === 'Aktual')?.value || 0;
      const isOver = actualVal > budgetVal && budgetVal > 0;

      return (
        <div className="bg-slate-900 border-2 border-slate-700 p-4 rounded-2xl shadow-2xl backdrop-blur-xl min-w-[200px]">
          <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
            <p className="font-black text-white text-xs uppercase tracking-widest">{label}</p>
            {isOver && <AlertTriangle size={14} className="text-rose-500 animate-pulse" />}
          </div>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-slate-400 text-[10px] font-black uppercase">{entry.name}</span>
                </div>
                <span className={`font-mono text-xs font-black ${entry.name === 'Aktual' && isOver ? 'text-rose-400' : 'text-white'}`}>
                  {formatRupiah(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const yAxisFormatter = (val: number) => {
    if (val === 0) return 'Rp 0';
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}jt`;
    return `Rp ${(val / 1000).toFixed(0)}rb`;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* 3D Bar Chart - Optimized for Mobile */}
      <div className="glass-panel p-4 sm:p-8 rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">Budget Performance</h3>
           </div>
           <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-xl border border-slate-800 self-start sm:self-auto">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-amber-400"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase">Rencana</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-emerald-500"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase text-emerald-400">Aktual</span>
              </div>
           </div>
        </div>
        
        <div className="h-[300px] sm:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categories} margin={{ top: 10, right: 5, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="planGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FDE047" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#EAB308" stopOpacity={1}/>
                </linearGradient>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A7F3D0" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#10B981" stopOpacity={1}/>
                </linearGradient>
                <linearGradient id="overGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FDA4AF" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#F43F5E" stopOpacity={1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
              <XAxis 
                dataKey="name" 
                stroke="#FFFFFF" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false} 
                tick={{fontWeight: 900, fill: '#FFFFFF'}} 
                interval={0}
                // Labels Straight
                angle={0}
                textAnchor="middle"
                height={40}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={8} 
                width={70} 
                tickFormatter={yAxisFormatter} 
                tickLine={false} 
                axisLine={false} 
                tick={{fontWeight: 900, fill: '#94a3b8'}}
              />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
              <Bar 
                name="Rencana" 
                dataKey="Anggaran" 
                fill="url(#planGrad)" 
                radius={[6, 6, 2, 2]} 
                maxBarSize={25}
              />
              <Bar 
                name="Aktual" 
                dataKey="Aktual" 
                radius={[6, 6, 2, 2]} 
                maxBarSize={25}
              >
                {categories.map((entry, index) => (
                  <Cell 
                    key={`bar-cell-${index}`} 
                    fill={entry.isOver ? 'url(#overGrad)' : 'url(#actualGrad)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie: Allocation - Labels White */}
        <div className="glass-panel p-6 rounded-[2rem] border border-white/10 overflow-hidden">
           <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Rencana Alokasi</h3>
           <div className="h-[280px] sm:h-[320px]">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={categories.filter(c => c.Anggaran > 0)} 
                    cx="50%" cy="50%" innerRadius={60} outerRadius={85} 
                    dataKey="Anggaran" stroke="#0f172a" strokeWidth={4} paddingAngle={5}
                    // All white label (Name + %)
                    label={(props: any) => (
                      <text x={props.x} y={props.y} fill="#FFFFFF" textAnchor={props.textAnchor} dominantBaseline={props.dominantBaseline} fontSize={9} fontWeight="bold">
                        {`${props.name} ${(props.percent * 100).toFixed(0)}%`}
                      </text>
                    )}
                  >
                    {categories.filter(c => c.Anggaran > 0).map((entry, index) => <Cell key={`p-all-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Pie: Actuals - Labels White */}
        <div className="glass-panel p-6 rounded-[2rem] border border-white/10 overflow-hidden">
           <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Realisasi Pengeluaran</h3>
           <div className="h-[280px] sm:h-[320px]">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={categories.filter(c => c.Aktual > 0)} 
                    cx="50%" cy="50%" innerRadius={60} outerRadius={85} 
                    dataKey="Aktual" stroke="#0f172a" strokeWidth={4} paddingAngle={5}
                    // All white label (Name + %)
                    label={(props: any) => (
                      <text x={props.x} y={props.y} fill="#FFFFFF" textAnchor={props.textAnchor} dominantBaseline={props.dominantBaseline} fontSize={9} fontWeight="bold">
                        {`${props.name} ${(props.percent * 100).toFixed(0)}%`}
                      </text>
                    )}
                  >
                    {categories.filter(c => c.Aktual > 0).map((entry, index) => <Cell key={`p-act-${index}`} fill={entry.isOver ? '#F43F5E' : entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyCharts;