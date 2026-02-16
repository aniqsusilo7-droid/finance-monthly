
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

const chunkArray = (arr: any[], size: number) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

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

  const categoryChunks = chunkArray(categories, 4);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const budgetVal = payload.find((p: any) => p.name === 'Rencana' || p.name === 'Anggaran')?.value || 0;
      const actualVal = payload.find((p: any) => p.name === 'Aktual')?.value || 0;
      const isOver = actualVal > budgetVal && budgetVal > 0;

      return (
        <div className="bg-slate-900 border-2 border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-xl min-w-[160px]">
          <p className="font-black text-white text-[10px] uppercase mb-2 border-b border-slate-800 pb-1">{label || payload[0]?.name}</p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-slate-400 text-[9px] font-black uppercase">{entry.name}</span>
                </div>
                <span className={`font-mono text-[9px] font-black ${entry.name === 'Aktual' && isOver ? 'text-rose-400' : 'text-white'}`}>
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

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central" 
        fontSize={10} 
        fontWeight="900"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const yAxisFormatter = (val: number) => {
    if (val === 0) return 'Rp 0';
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}j`;
    return `Rp ${(val / 1000).toFixed(0)}k`;
  };

  const RenderLegend = ({ data, total }: { data: any[], total: number }) => (
    <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 px-2">
      {data.map((item, idx) => {
        const val = item.Anggaran || item.Aktual || 0;
        const percent = total > 0 ? ((val / total) * 100).toFixed(0) : 0;
        return (
          <div key={idx} className="flex items-center gap-1.5 bg-slate-900/50 px-3 py-1.5 rounded-xl border border-white/5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.fill }}></div>
            <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: item.color || item.fill }}>
              {item.name} ({percent}%)
            </span>
          </div>
        );
      })}
    </div>
  );

  const totalPlanned = categories.reduce((a, b) => a + b.Anggaran, 0);
  const totalActual = categories.reduce((a, b) => a + b.Aktual, 0);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-10">
      <div className="glass-panel p-4 sm:p-8 rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
              <h3 className="text-base sm:text-xl font-black text-white uppercase tracking-tighter">Budget Performance</h3>
           </div>
           <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded bg-amber-400"></div>
                <span className="text-[8px] font-black text-slate-400 uppercase">Rencana</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded bg-emerald-500"></div>
                <span className="text-[8px] font-black text-slate-400 uppercase text-emerald-400">Aktual</span>
              </div>
           </div>
        </div>
        
        <div className="space-y-10">
          {categoryChunks.map((chunk, chunkIdx) => (
            <div key={chunkIdx} className="h-[250px] sm:h-[350px] w-full border-b border-slate-800/30 pb-4 last:border-0 last:pb-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chunk} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id={`planGrad-${chunkIdx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FDE047" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#EAB308" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id={`actualGrad-${chunkIdx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A7F3D0" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#10B981" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id={`overGrad-${chunkIdx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FDA4AF" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#F43F5E" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#FFFFFF" 
                    fontSize={8} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{fontWeight: 900, fill: '#FFFFFF'}} 
                    interval={0}
                    angle={0}
                    textAnchor="middle"
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={8} 
                    width={55} 
                    tickFormatter={yAxisFormatter} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{fill: 'rgba(255,255,255,0.03)'}} 
                  />
                  <Bar dataKey="Anggaran" name="Rencana" fill={`url(#planGrad-${chunkIdx})`} radius={[4, 4, 0, 0]} maxBarSize={25} />
                  <Bar dataKey="Aktual" name="Aktual" radius={[4, 4, 0, 0]} maxBarSize={25}>
                    {chunk.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.isOver ? `url(#overGrad-${chunkIdx})` : `url(#actualGrad-${chunkIdx})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-white/10 flex flex-col items-center">
           <h3 className="w-full text-xs font-black text-white uppercase tracking-widest mb-6 border-b border-slate-800 pb-2">Rencana Alokasi (%)</h3>
           <div className="h-[280px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={categories.filter(c => c.Anggaran > 0)} 
                    cx="50%" cy="50%" 
                    innerRadius={50} 
                    outerRadius={80} 
                    dataKey="Anggaran" 
                    stroke="#0f172a" 
                    strokeWidth={4} 
                    paddingAngle={3}
                    labelLine={{ stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1 }}
                    label={renderCustomLabel}
                  >
                    {categories.filter(c => c.Anggaran > 0).map((entry, index) => <Cell key={`p1-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip 
                    content={<CustomTooltip />} 
                  />
                </PieChart>
             </ResponsiveContainer>
           </div>
           <RenderLegend data={categories.filter(c => c.Anggaran > 0)} total={totalPlanned} />
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-white/10 flex flex-col items-center">
           <h3 className="w-full text-xs font-black text-white uppercase tracking-widest mb-6 border-b border-slate-800 pb-2">Realisasi Pengeluaran (%)</h3>
           <div className="h-[280px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={categories.filter(c => c.Aktual > 0)} 
                    cx="50%" cy="50%" 
                    innerRadius={50} 
                    outerRadius={80} 
                    dataKey="Aktual" 
                    stroke="#0f172a" 
                    strokeWidth={4} 
                    paddingAngle={3}
                    labelLine={{ stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1 }}
                    label={renderCustomLabel}
                  >
                    {categories.filter(c => c.Aktual > 0).map((entry, index) => <Cell key={`p2-${index}`} fill={entry.isOver ? '#F43F5E' : entry.color} />)}
                  </Pie>
                  <Tooltip 
                    content={<CustomTooltip />} 
                  />
                </PieChart>
             </ResponsiveContainer>
           </div>
           <RenderLegend 
            data={categories.filter(c => c.Aktual > 0).map(cat => ({...cat, color: cat.isOver ? '#F43F5E' : cat.color}))} 
            total={totalActual} 
           />
        </div>
      </div>
    </div>
  );
};

export default MonthlyCharts;
