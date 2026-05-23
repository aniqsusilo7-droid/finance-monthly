import React, { useMemo } from 'react';
import { BudgetData, AppState } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, LineChart, Line, AreaChart, Area } from 'recharts';
import { formatRupiah, calculateGrossIncome, calculateTax } from '../utils';
import { AlertTriangle, TrendingUp, Clock, Wallet } from 'lucide-react';

interface MonthlyChartsProps {
  budgetData: BudgetData;
  appState: AppState;
  income: number;
  isPrivacy?: boolean;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  'Pokok': '#4F46E5',     
  'Tabungan': '#059669',  
  'Cicilan': '#E11D48',   
  'Lainnya': '#7C3AED',   
};

const EXTRA_COLORS = [
  '#D97706', '#0891B2', '#DB2777', '#0D9488', '#EA580C'
];

const chunkArray = (arr: any[], size: number) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const MonthlyCharts: React.FC<MonthlyChartsProps> = ({ budgetData, appState, income, isPrivacy = false }) => {
  const currentYear = new Date().getFullYear();

  const trendData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthKey = `${currentYear}-${String(monthNum).padStart(2, '0')}`;
      const data = appState[monthKey];

      if (!data) {
        return {
          month: new Date(currentYear, i).toLocaleString('id-ID', { month: 'short' }),
          salary: 0,
          overtime: 0
        };
      }

      const { salary } = data;
      const otRupiah = ((salary.basicSalary + salary.housingAllowance) / 173) * salary.overtimeHours;
      const bonusRupiah = (salary.basicSalary + salary.housingAllowance) * salary.bonusMultiplier;
      const gross = calculateGrossIncome(
        salary.basicSalary, 
        salary.housingAllowance, 
        salary.shiftAllowance, 
        otRupiah, 
        bonusRupiah, 
        salary.thr, 
        salary.leavePay
      );
      const tax = calculateTax(gross, salary.taxRate);
      const netIncome = gross - tax - salary.otherDeductions;

      return {
        month: new Date(currentYear, i).toLocaleString('id-ID', { month: 'short' }),
        salary: netIncome,
        overtime: salary.overtimeHours
      };
    });
  }, [appState, currentYear]);

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

  addCategory(budgetData.needs?.name || 'Pokok', budgetData.needs?.items?.reduce((a, b) => a + (b.budget || 0), 0) || 0, budgetData.needs?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0, CATEGORY_COLORS['Pokok']);
  addCategory(budgetData.savings?.name || 'Tabungan', budgetData.savings?.items?.reduce((a, b) => a + (b.budget || 0), 0) || 0, budgetData.savings?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0, CATEGORY_COLORS['Tabungan']);
  addCategory(budgetData.debt?.name || 'Cicilan', budgetData.debt?.items?.reduce((a, b) => a + (b.budget || 0), 0) || 0, budgetData.debt?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0, CATEGORY_COLORS['Cicilan']);

  budgetData.custom?.forEach((cat, idx) => {
    addCategory(cat.name || 'Custom', cat.items?.reduce((a, b) => a + (b.budget || 0), 0) || 0, cat.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0, EXTRA_COLORS[idx % EXTRA_COLORS.length]);
  });

  addCategory('Lainnya', budgetData.others?.allocation || 0, budgetData.others?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0, CATEGORY_COLORS['Lainnya']);

  const categoryChunks = chunkArray(categories, 4);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && Array.isArray(payload) && payload.length) {
      const budgetVal = payload.find?.((p: any) => p.name === 'Rencana' || p.name === 'Anggaran')?.value || 0;
      const actualVal = payload.find?.((p: any) => p.name === 'Aktual')?.value || 0;
      const isOver = actualVal > budgetVal && budgetVal > 0;

      return (
        <div className="bg-[var(--tooltip-bg)] border-2 border-slate-700/20 p-3 rounded-xl shadow-2xl backdrop-blur-xl min-w-[160px]">
          <p className="font-black text-[var(--text-primary)] text-[10px] uppercase mb-2 border-b border-slate-700/10 pb-1">{label || payload[0]?.name}</p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-[var(--text-secondary)] text-[8px] sm:text-[9px] font-black uppercase">{entry.name}</span>
                </div>
                <span className={`font-mono text-[9px] font-black ${entry.name === 'Aktual' && isOver ? 'text-rose-600' : 'text-[var(--text-primary)]'}`}>
                  {formatRupiah(entry.value, isPrivacy)}
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
        fill="var(--chart-label)" 
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
    if (isPrivacy) return 'Rp •••';
    if (val === 0) return 'Rp 0';
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}jt`;
    return `Rp ${(val / 1000).toFixed(0)}rb`;
  };

  const RenderLegend = ({ data }: { data: any[] }) => (
    <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 px-2">
      {data.map((item, idx) => {
        return (
          <div key={idx} className="flex items-center gap-1.5 bg-slate-900/50 px-3 py-1.5 rounded-xl border border-white/5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.fill }}></div>
            <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: item.color || item.fill }}>
              {item.name}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-10">
      <div className="glass-panel p-4 sm:p-8 rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
              <h3 className="text-base sm:text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Budget Performance</h3>
           </div>
           <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded bg-amber-500"></div>
                <span className="text-[8px] font-black text-slate-500 uppercase">Rencana</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded bg-emerald-600"></div>
                <span className="text-[8px] font-black text-emerald-600 uppercase">Aktual</span>
              </div>
           </div>
        </div>
        
        <div className="space-y-12">
          {categoryChunks.map((chunk, chunkIdx) => (
            <div key={chunkIdx} className="h-[450px] sm:h-[400px] w-full border-b border-slate-800/30 pb-8 last:border-0 last:pb-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chunk} margin={{ top: 10, right: 5, left: 5, bottom: 25 }}>
                  <defs>
                    <linearGradient id={`planGrad-${chunkIdx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FDE047" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#CA8A04" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id={`actualGrad-${chunkIdx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34D399" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#059669" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id={`overGrad-${chunkIdx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FB7185" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#E11D48" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--chart-label)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{fontWeight: 900, fill: 'var(--chart-label)'}} 
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis 
                    stroke="var(--chart-label)" 
                    fontSize={10} 
                    width={65} 
                    tickFormatter={yAxisFormatter} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{fontWeight: 900, fill: 'var(--chart-label)'}}
                  />
                  <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{fill: 'rgba(0,0,0,0.05)'}} 
                  />
                  <Bar dataKey="Anggaran" name="Rencana" fill={`url(#planGrad-${chunkIdx})`} radius={[4, 4, 0, 0]} maxBarSize={35} />
                  <Bar dataKey="Aktual" name="Aktual" radius={[4, 4, 0, 0]} maxBarSize={35}>
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
           <h3 className="w-full text-xs font-black text-[var(--text-primary)] uppercase tracking-widest mb-6 border-b border-slate-700/10 pb-2">Rencana Alokasi (%)</h3>
           <div className="h-[380px] sm:h-[320px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={categories.filter(c => c.Anggaran > 0)} 
                    cx="50%" cy="50%" 
                    innerRadius={65} 
                    outerRadius={100} 
                    dataKey="Anggaran" 
                    stroke="var(--bg-app)" 
                    strokeWidth={4} 
                    paddingAngle={3}
                    labelLine={{ stroke: 'var(--text-secondary)', strokeWidth: 1 }}
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
           <RenderLegend data={categories.filter(c => c.Anggaran > 0)} />
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-white/10 flex flex-col items-center">
           <h3 className="w-full text-xs font-black text-[var(--text-primary)] uppercase tracking-widest mb-6 border-b border-slate-700/10 pb-2">Realisasi Pengeluaran (%)</h3>
           <div className="h-[380px] sm:h-[320px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={categories.filter(c => c.Aktual > 0)} 
                    cx="50%" cy="50%" 
                    innerRadius={65} 
                    outerRadius={100} 
                    dataKey="Aktual" 
                    stroke="var(--bg-app)" 
                    strokeWidth={4} 
                    paddingAngle={3}
                    labelLine={{ stroke: 'var(--text-secondary)', strokeWidth: 1 }}
                    label={renderCustomLabel}
                  >
                    {categories.filter(c => c.Aktual > 0).map((entry, index) => <Cell key={`p2-${index}`} fill={entry.isOver ? '#E11D48' : entry.color} />)}
                  </Pie>
                  <Tooltip 
                    content={<CustomTooltip />} 
                  />
                </PieChart>
             </ResponsiveContainer>
           </div>
           <RenderLegend 
            data={categories.filter(c => c.Aktual > 0).map(cat => ({...cat, color: cat.isOver ? '#E11D48' : cat.color}))} 
           />
        </div>
      </div>

      {/* Yearly Trends Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Gaji Bulanan */}
        <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-white/10 flex flex-col relative overflow-hidden">
           <div className="flex items-center gap-3 mb-6 border-b border-slate-700/10 pb-4">
              <div className="p-2 bg-indigo-600/20 rounded-xl">
                 <Wallet size={18} className="text-indigo-500" />
              </div>
              <div>
                 <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">Trend Gaji/Income</h3>
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter mt-1">Estimasi dalam setahun ({currentYear})</p>
              </div>
           </div>
           
           <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" opacity={0.3} />
                  <XAxis dataKey="month" stroke="var(--chart-label)" fontSize={9} tickLine={false} axisLine={false} tick={{fontWeight: 900, fill: 'var(--chart-label)'}} />
                  <YAxis stroke="var(--chart-label)" fontSize={9} tickFormatter={yAxisFormatter} tickLine={false} axisLine={false} tick={{fontWeight: 900, fill: 'var(--chart-label)'}} width={65} />
                  <Tooltip 
                    formatter={(v:any) => formatRupiah(v, isPrivacy)}
                    contentStyle={{backgroundColor: 'var(--tooltip-bg)', border: '1px solid var(--border-main)', borderRadius: '12px'}}
                    itemStyle={{ color: 'var(--text-primary)', fontWeight: '900', fontSize: '10px' }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase' }}
                  />
                  <Area type="monotone" dataKey="salary" name="Gaji Bersih" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSalary)" dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Trend Jam Lembur Bulanan */}
        <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-white/10 flex flex-col relative overflow-hidden">
           <div className="flex items-center gap-3 mb-6 border-b border-slate-700/10 pb-4">
              <div className="p-2 bg-amber-600/20 rounded-xl">
                 <Clock size={18} className="text-amber-500" />
              </div>
              <div>
                 <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">Trend Jam Lembur</h3>
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter mt-1">Total Jam Eqv dalam setahun ({currentYear})</p>
              </div>
           </div>
           
           <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" opacity={0.3} />
                  <XAxis dataKey="month" stroke="var(--chart-label)" fontSize={9} tickLine={false} axisLine={false} tick={{fontWeight: 900, fill: 'var(--chart-label)'}} />
                  <YAxis stroke="var(--chart-label)" fontSize={9} tickFormatter={(val) => `${val}j`} tickLine={false} axisLine={false} tick={{fontWeight: 900, fill: 'var(--chart-label)'}} width={50} />
                  <Tooltip 
                    formatter={(v:any) => [`${v.toFixed(1)} Jam`, 'Lembur']}
                    contentStyle={{backgroundColor: 'var(--tooltip-bg)', border: '1px solid var(--border-main)', borderRadius: '12px'}}
                    itemStyle={{ color: 'var(--text-primary)', fontWeight: '900', fontSize: '10px' }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase' }}
                  />
                  <Bar dataKey="overtime" name="Lembur" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={20} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyCharts;