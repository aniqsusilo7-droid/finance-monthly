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

      // Calculate Expense (Actuals)
      const { budget } = data;
      const expense = 
        budget.needs.items.reduce((a, b) => a + b.actual, 0) +
        budget.savings.items.reduce((a, b) => a + b.actual, 0) + 
        budget.debt.items.reduce((a, b) => a + b.actual, 0) +
        budget.others.items.reduce((a, b) => a + b.actual, 0);

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
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xl">
          <p className="font-bold text-slate-800 mb-2">{label} {year}</p>
          <div className="space-y-1">
             <p className="text-emerald-600 text-sm">Income: {formatRupiah(payload[0].value)}</p>
             <p className="text-rose-500 text-sm">Expense: {formatRupiah(payload[1].value)}</p>
             <div className="border-t border-slate-100 pt-1 mt-1">
                <p className="text-indigo-600 text-sm font-bold">Profit: {formatRupiah(payload[0].value - payload[1].value)}</p>
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
       {/* Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-12 -mt-12 blur-xl"></div>
            <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total Pendapatan {year}</h4>
            <div className="text-3xl font-bold text-slate-800 tracking-tight">{formatRupiah(totalIncome)}</div>
          </div>
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full -mr-12 -mt-12 blur-xl"></div>
            <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total Pengeluaran {year}</h4>
            <div className="text-3xl font-bold text-rose-500 tracking-tight">{formatRupiah(totalExpense)}</div>
          </div>
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full -mr-12 -mt-12 blur-xl"></div>
            <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Net Profit {year}</h4>
            <div className={`text-3xl font-bold tracking-tight ${netProfit >= 0 ? 'text-indigo-600' : 'text-rose-500'}`}>{formatRupiah(netProfit)}</div>
          </div>
       </div>

       {/* Trend Chart */}
       <div className="glass-panel p-6 rounded-2xl">
         <h3 className="text-lg font-bold text-slate-800 mb-6">Trend Keuangan</h3>
         <div className="h-80 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={summaryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `${val/1000000}M`} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#F43F5E" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
             </AreaChart>
           </ResponsiveContainer>
         </div>
       </div>

       {/* Table */}
       <div className="glass-panel rounded-2xl overflow-hidden">
         <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800">Ringkasan Detail</h3>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-left text-sm text-slate-600">
             <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
               <tr>
                 <th className="px-6 py-4">Bulan</th>
                 <th className="px-6 py-4 text-right">Pendapatan</th>
                 <th className="px-6 py-4 text-right">Pengeluaran</th>
                 <th className="px-6 py-4 text-right">Margin</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {summaryData.map((row) => (
                 <tr key={row.month} className="hover:bg-slate-50 transition-colors group">
                   <td className="px-6 py-4 font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">{row.month}</td>
                   <td className="px-6 py-4 text-right text-emerald-600 font-mono">{formatRupiah(row.income)}</td>
                   <td className="px-6 py-4 text-right text-rose-500 font-mono">{formatRupiah(row.expense)}</td>
                   <td className="px-6 py-4 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${row.margin > 20 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : row.margin > 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
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
