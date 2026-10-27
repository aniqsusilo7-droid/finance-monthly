import React, { useMemo } from 'react';
import { AppState } from '../types';
import { calculateGrossIncome, calculateTax, formatRupiah } from '../utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUpRight, Percent, Award, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface YearlySummaryProps {
  appState: AppState;
  year: number;
  isPrivacy?: boolean;
}

const YearlySummary: React.FC<YearlySummaryProps> = ({ appState, year, isPrivacy = false }) => {
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

      const { budget } = data;
      const expense = budget ? (
        (budget.needs?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0) +
        (budget.savings?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0) + 
        (budget.debt?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0) +
        (budget.others?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0) +
        (budget.custom || []).reduce((acc, cat) => acc + (cat.items?.reduce((ia, ii) => ia + (ii.actual || 0), 0) || 0), 0)
      ) : 0;

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
  const overallMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const inc = payload[0]?.value || 0;
      const exp = payload[1]?.value || 0;
      const pft = inc - exp;
      return (
        <div className="bg-slate-900/95 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl min-w-[200px]">
          <p className="font-black text-white text-xs mb-3 uppercase tracking-wider border-b border-white/10 pb-2 flex items-center justify-between">
            <span>{label} {year}</span>
            <span className={`text-[10px] font-mono ${pft >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {inc > 0 ? `${((pft/inc)*100).toFixed(0)}% Sisa` : ''}
            </span>
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400"></div>Income:</span>
              <span className="font-mono font-bold text-emerald-400">{formatRupiah(inc, isPrivacy)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-400"></div>Expense:</span>
              <span className="font-mono font-bold text-rose-400">{formatRupiah(exp, isPrivacy)}</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between items-center font-bold">
              <span className="text-white">Net Profit:</span>
              <span className={`font-mono ${pft >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>{formatRupiah(pft, isPrivacy)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 sm:p-7 rounded-3xl relative overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-emerald-950/20 shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Pendapatan {year}</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono mb-2">
            {formatRupiah(totalIncome, isPrivacy)}
          </div>
          <span className="text-[10px] text-emerald-400/90 font-bold uppercase tracking-wider">Akumulasi Gaji & Tunjangan 12 Bulan</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel p-6 sm:p-7 rounded-3xl relative overflow-hidden border border-rose-500/20 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-rose-950/20 shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Pengeluaran {year}</span>
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight font-mono mb-2">
            {formatRupiah(totalExpense, isPrivacy)}
          </div>
          <span className="text-[10px] text-rose-400/90 font-bold uppercase tracking-wider">Realisasi Anggaran & Belanja</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 sm:p-7 rounded-3xl relative overflow-hidden border border-indigo-500/20 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-indigo-950/20 shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Net Profit Tahunan</span>
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Award size={18} />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black tracking-tight font-mono mb-2 ${netProfit >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
            {formatRupiah(netProfit, isPrivacy)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Savings Margin:</span>
            <span className={`text-[11px] font-black font-mono ${overallMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {overallMargin.toFixed(1)}%
            </span>
          </div>
        </motion.div>
      </div>

      {/* Chart Section */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl"
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">Tren Arus Kas Tahunan {year}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Perbandingan Pemasukan vs Pengeluaran Tiap Bulan</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div> Pemasukan
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div> Pengeluaran
            </span>
          </div>
        </div>

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
              <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tick={{fontWeight: 700, fill: '#94a3b8'}} />
              <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => isPrivacy ? '•••' : `${(val/1000000).toFixed(0)}jt`} tickLine={false} axisLine={false} tick={{fontWeight: 700, fill: '#94a3b8'}} width={50} />
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income" name="Pemasukan" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#F43F5E" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Monthly Breakdown Table */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-xl"
      >
        <div className="p-5 sm:p-6 border-b border-white/10 bg-slate-900/50 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">Rincian Finansial Bulanan</h3>
          <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            Tahun {year}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/80 border-b border-white/10 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                <th className="py-4 px-6">Bulan</th>
                <th className="py-4 px-6">Pemasukan</th>
                <th className="py-4 px-6">Pengeluaran</th>
                <th className="py-4 px-6">Net Profit</th>
                <th className="py-4 px-6 text-right">Saving Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {summaryData.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-white uppercase">{row.month}</td>
                  <td className="py-3.5 px-6 text-emerald-400 font-mono font-bold">{formatRupiah(row.income, isPrivacy)}</td>
                  <td className="py-3.5 px-6 text-rose-400 font-mono font-bold">{formatRupiah(row.expense, isPrivacy)}</td>
                  <td className={`py-3.5 px-6 font-mono font-black ${row.profit >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
                    {formatRupiah(row.profit, isPrivacy)}
                  </td>
                  <td className="py-3.5 px-6 text-right font-mono">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${row.margin >= 20 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : (row.margin > 0 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20')}`}>
                      {row.margin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default YearlySummary;