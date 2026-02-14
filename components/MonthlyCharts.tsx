import React from 'react';
import { BudgetData } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatRupiah } from '../utils';

interface MonthlyChartsProps {
  budgetData: BudgetData;
  income: number;
}

const MonthlyCharts: React.FC<MonthlyChartsProps> = ({ budgetData, income }) => {
  // Aggregate data
  const needsAlloc = budgetData.needs.items.reduce((a, b) => a + b.budget, 0);
  const needsActual = budgetData.needs.items.reduce((a, b) => a + b.actual, 0);
  
  const savingsAlloc = budgetData.savings.items.reduce((a, b) => a + b.budget, 0);
  const savingsActual = budgetData.savings.items.reduce((a, b) => a + b.actual, 0);
  
  const debtAlloc = budgetData.debt.items.reduce((a, b) => a + b.budget, 0);
  const debtActual = budgetData.debt.items.reduce((a, b) => a + b.actual, 0);

  const othersAlloc = budgetData.others.allocation;
  const othersActual = budgetData.others.items.reduce((a, b) => a + b.actual, 0);

  const totalAllocated = needsAlloc + savingsAlloc + debtAlloc + othersAlloc;
  const totalActual = needsActual + savingsActual + debtActual + othersActual;

  const barData = [
    { name: 'Total', Anggaran: totalAllocated, Aktual: totalActual },
    { name: 'Pokok', Anggaran: needsAlloc, Aktual: needsActual },
    { name: 'Tabungan', Anggaran: savingsAlloc, Aktual: savingsActual },
    { name: 'Cicilan', Anggaran: debtAlloc, Aktual: debtActual },
    { name: 'Lainnya', Anggaran: othersAlloc, Aktual: othersActual },
  ];

  const pieAllocData = [
    { name: 'Pokok', value: needsAlloc },
    { name: 'Tabungan', value: savingsAlloc },
    { name: 'Cicilan', value: debtAlloc },
    { name: 'Lainnya', value: othersAlloc },
  ].filter(d => d.value > 0);

  const pieActualData = [
    { name: 'Pokok', value: needsActual },
    { name: 'Tabungan', value: savingsActual },
    { name: 'Cicilan', value: debtActual },
    { name: 'Lainnya', value: othersActual },
  ].filter(d => d.value > 0);

  // Vibrant Palette from Reference Image
  // Blue, Green, Orange, Purple
  const COLORS = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-xl shadow-lg">
          <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2 text-xs sm:text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-slate-500 text-[10px] sm:text-xs">{entry.name}:</span>
              <span className="text-slate-800 font-mono text-[10px] sm:text-xs font-bold">{formatRupiah(entry.value)}</span>
              <span className="text-slate-400 text-[10px] ml-1">
                ({(entry.value / (entry.payload.payload?.total || (entry.dataKey === 'value' ? payload.reduce((a:any,b:any)=>a+b.value,0) : 1)) * 100).toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Performance Bar Chart */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl">
        <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-6 border-l-4 border-indigo-500 pl-3">Kinerja Anggaran</h3>
        <div className="h-64 sm:h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
                width={80}
                tickFormatter={(val) => formatRupiah(val)} 
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
              <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#475569' }} />
              <Bar dataKey="Anggaran" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Aktual" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Allocation Pie */}
        <div className="glass-panel p-4 sm:p-6 rounded-2xl">
           <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-6 border-l-4 border-blue-500 pl-3">Rencana Alokasi</h3>
           <div className="h-56 sm:h-72">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieAllocData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    labelLine={true}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    paddingAngle={5}
                    stroke="none"
                  >
                    {pieAllocData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px', color: '#475569' }}/>
                </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Realization Pie */}
        <div className="glass-panel p-4 sm:p-6 rounded-2xl">
           <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-6 border-l-4 border-orange-500 pl-3">Realisasi Pengeluaran</h3>
           <div className="h-56 sm:h-72">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieActualData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    labelLine={true}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    paddingAngle={5}
                    stroke="none"
                  >
                    {pieActualData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px', color: '#475569' }}/>
                </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyCharts;