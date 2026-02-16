import React, { useMemo } from 'react';
import { AppState } from '../types';
import { calculateGrossIncome, calculateTax, formatRupiah } from '../utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface YearlySummaryProps {
  appState: AppState;
  year: number;
}

const YearlySummary: React.FC<YearlySummaryProps> = ({ appState, year }) => {
  const summaryData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`;
      const data = appState[monthKey];

      if (!data) {
        return {
          month: new Date(year, i).toLocaleString('id-ID', { month: 'short' }),
          income: 0,
          expense: 0,
          margin: 0,
          profit: 0
        };
      }

      // Calculate Income
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

      // Calculate Expense (Actuals) - Secure accumulation with optional chaining
      const { budget } = data;
      const expense = 
        (budget.needs?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0) +
        (budget.savings?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0) + 
        (budget.debt?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0) +
        (budget.others?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0) +
        (budget.custom || []).reduce((acc, cat) => acc + (cat.items?.reduce((ia, ii) => ia + (ii.actual || 0), 0) || 0), 0);

      const profit = netIncome - expense;
      const margin = netIncome > 0 ? (profit / netIncome) * 100 : 0;

      return {
        month: new Date(year, i).toLocaleString('id-ID', { month: 'short' }),
        income: netIncome,
        expense: expense,
        margin: margin,
        profit: profit
      };
    });
    return months;
  }, [appState, year]);

  const totalIncome = summaryData.reduce((acc, curr) => acc + curr.income, 0);
  const totalExpense = summaryData.reduce((acc, curr) => acc + curr.expense, 0);
  const netProfit = totalIncome - totalExpense;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl">
          <p className="font-black text-white mb-2 uppercase tracking-widest border-b border-slate-800 pb-2">{label} {year}</p>
          <div className="space-y-1">
             <p className="text-emerald-400 text-sm font-black uppercase">Income: {formatRupiah(payload[0].value)}</p>
             <p className="text-rose-400 text-sm font-black uppercase">Expense: {formatRupiah(payload[1].value)}</p>
             <div className="border-t border-slate-800 pt-1 mt-1">
                <p className="text-indigo-400 text-sm font-black uppercase">Profit: {formatRupiah(payload[0].value - payload[1].value)}</p>
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
       {/* Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group border-l-4 border-emerald-500">
            <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Pendapatan {year}</h4>
            <div className="text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">{formatRupiah(totalIncome)}</div>
          </div>
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border-l-4 border-rose-500">
            <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Pengeluaran {year}</h4>
            <div className="text-3xl font-black text-rose-400 tracking-tight">{formatRupiah(totalExpense)}</div>
          </div>
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border-l-4 border-indigo-500">
            <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Net Profit {year}</h4>
            <div className={`text-3xl font-black tracking-tight ${netProfit >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>{formatRupiah(netProfit)}</div>
          </div>
       </div>

       {/* Trend Chart */}
       <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl">
         <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tighter flex items-center gap-2">
            <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
            Trend Keuangan {year}
         </h3>
         <div className="h-80 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={summaryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tick={{fontWeight: 900}} />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `${val/1000000}M`} tickLine={false} axisLine={false} tick={{fontWeight: 900}} />
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#F43F5E" strokeWidth={4} fillOpacity={1} fill="url(#colorExpense)" />
             </AreaChart>
           </ResponsiveContainer>
         </div>
       </div>

       {/* Table */}
       <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
         <div className="p-6 border-b border-slate-800 bg-slate-800/30">
            <h3 className="text-lg font-black text-white uppercase tracking-widest">Ringkasan Detail Bulanan</h3>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-left text-sm">
             <thead className="bg-slate-900/50 text-slate-500 uppercase text-[10px] font-black tracking-[0.2em]">
               <tr>
                 <th className="px-6 py-4">Bulan</th>
                 <th className="px-6 py-4 text-right">Pendapatan</th>
                 <th className="px-6 py-4 text-right">Pengeluaran</th>
                 <th className="px-6 py-4 text-right">Margin</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-800/50">
               {summaryData.map((row) => (
                 <tr key={row.month} className="hover:bg-white/5 transition-colors group">
                   <td className="px-6 py-4 font-black text-white uppercase">{row.month}</td>
                   <td className="px-6 py-4 text-right text-emerald-400 font-mono font-black">{formatRupiah(row.income)}</td>
                   <td className="px-6 py-4 text-right text-rose-400 font-mono font-black">{formatRupiah(row.expense)}</td>
                   <td className="px-6 py-4 text-right">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${row.margin > 20 ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/20' : row.margin > 0 ? 'bg-amber-900/40 text-amber-300 border border-amber-500/20' : 'bg-rose-900/40 text-rose-300 border border-rose-500/20'}`}>
                        {row.margin.toFixed(1)}%
                      </span>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       </div>
    </div>
  );
};

export default YearlySummary;