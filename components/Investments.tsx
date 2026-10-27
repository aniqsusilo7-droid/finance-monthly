import React, { useState } from 'react';
import { InvestmentItem, AppState } from '../types';
import CurrencyInput from './ui/CurrencyInput';
import DeleteModal from './ui/DeleteModal';
import { formatRupiah } from '../utils';
import { 
  Plus, Trash2, TrendingUp, Briefcase, PieChart as PieChartIcon, 
  TrendingDown, Sparkles, Target, Layers, Calendar, Filter, 
  ArrowUpRight, ArrowDownRight, Activity, BarChart3, LineChart as LineChartIcon
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, 
  XAxis, YAxis, AreaChart, Area, CartesianGrid, Legend 
} from 'recharts';
import { motion } from 'motion/react';

interface InvestmentsProps {
  items: InvestmentItem[];
  appState: AppState;
  isPrivacy?: boolean;
  onChange: (items: InvestmentItem[]) => void;
}

const COLORS = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6', '#06B6D4', '#E11D48'];

const Investments: React.FC<InvestmentsProps> = ({ items = [], appState = {}, isPrivacy = false, onChange }) => {
  const [deleteTarget, setDeleteTarget] = useState<InvestmentItem | null>(null);
  
  // Historical chart controls
  const [timeFrame, setTimeFrame] = useState<'3m' | '6m' | '1y' | 'all'>('all');
  const [selectedAssetFilter, setSelectedAssetFilter] = useState<string>('all_total');

  // Compute aggregated timeline data across all recorded months in appState
  const historicalTimeline = React.useMemo(() => {
    const allKeys = Array.from(new Set(Object.keys(appState))).sort();
    
    if (allKeys.length === 0) {
      const today = new Date();
      const currentKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const sumCurrent = items.reduce((acc, i) => acc + (i.currentValue || 0), 0);
      const entry: any = {
        monthKey: currentKey,
        label: today.toLocaleString('id-ID', { month: 'short', year: '2-digit' }).toUpperCase(),
        fullMonth: today.toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
        totalValue: sumCurrent,
      };
      items.forEach(it => {
        if (it.name) {
          entry[it.name] = it.currentValue || 0;
        }
      });
      return [entry];
    }

    return allKeys.map(key => {
      const monthData = appState[key];
      const date = new Date(`${key}-01T00:00:00`);
      const monthInvestments = monthData?.investments || [];
      const sumMonth = monthInvestments.reduce((acc, i) => acc + (i.currentValue || 0), 0);

      const entry: any = {
        monthKey: key,
        label: date.toLocaleString('id-ID', { month: 'short', year: '2-digit' }).toUpperCase(),
        fullMonth: date.toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
        totalValue: sumMonth,
      };

      // Add each individual asset for multi-line view
      monthInvestments.forEach(it => {
        if (it.name) {
          entry[it.name] = it.currentValue || 0;
        }
      });

      return entry;
    });
  }, [appState, items]);

  // Unique asset names across all history
  const allAssetNames = React.useMemo(() => {
    const names = new Set<string>();
    items.forEach(i => { if (i.name?.trim()) names.add(i.name.trim()); });
    Object.values(appState).forEach(m => {
      m?.investments?.forEach(i => { if (i.name?.trim()) names.add(i.name.trim()); });
    });
    return Array.from(names);
  }, [items, appState]);

  // Filter based on selected timeFrame
  const filteredTimeline = React.useMemo(() => {
    if (timeFrame === '3m') {
      return historicalTimeline.slice(-3);
    }
    if (timeFrame === '6m') {
      return historicalTimeline.slice(-6);
    }
    if (timeFrame === '1y') {
      return historicalTimeline.slice(-12);
    }
    return historicalTimeline;
  }, [historicalTimeline, timeFrame]);

  // Calculate growth statistics for the selected timeframe and filter
  const stats = React.useMemo(() => {
    if (filteredTimeline.length === 0) {
      return { startVal: 0, currentVal: 0, delta: 0, percent: 0, isPositive: true, avgMonthly: 0 };
    }

    const isSingleAsset = selectedAssetFilter !== 'all_total' && selectedAssetFilter !== 'multi_asset';
    const firstPoint = filteredTimeline[0];
    const lastPoint = filteredTimeline[filteredTimeline.length - 1];

    const startVal = isSingleAsset ? (firstPoint[selectedAssetFilter] || 0) : (firstPoint.totalValue || 0);
    const currentVal = isSingleAsset ? (lastPoint[selectedAssetFilter] || 0) : (lastPoint.totalValue || 0);
    const delta = currentVal - startVal;
    const percent = startVal > 0 ? (delta / startVal) * 100 : (currentVal > 0 ? 100 : 0);
    const isPositive = delta >= 0;
    const monthsCount = Math.max(filteredTimeline.length - 1, 1);
    const avgMonthly = delta / monthsCount;

    return { startVal, currentVal, delta, percent, isPositive, avgMonthly };
  }, [filteredTimeline, selectedAssetFilter]);

  const getHistoryForAsset = (assetName: string) => {
    if (!assetName.trim()) return [];
    
    const sortedKeys = Object.keys(appState).sort();
    
    return sortedKeys.map(key => {
      const monthData = appState[key];
      const asset = monthData?.investments?.find(i => i && i.name && i.name.toLowerCase() === assetName.toLowerCase());
      
      const date = new Date(key + '-01');
      return {
        month: date.toLocaleString('id-ID', { month: 'short' }),
        value: asset ? asset.currentValue : 0,
        fullDate: key
      };
    }).filter(d => d.value > 0);
  };

  const addItem = () => {
    const newItem: InvestmentItem = { id: Date.now().toString() + Math.random().toString(36).substr(2, 5), name: '', currentValue: 0, targetValue: 0 };
    onChange([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof InvestmentItem, val: any) => {
    const newItems = items.map(item => item.id === id ? { ...item, [field]: val } : item);
    onChange(newItems);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    onChange(items.filter(item => item.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const totalPortfolio = items.reduce((acc, item) => acc + (item.currentValue || 0), 0);
  const totalTarget = items.reduce((acc, item) => acc + (item.targetValue || 0), 0);
  const progress = totalTarget > 0 ? (totalPortfolio / totalTarget) * 100 : 0;

  const validPieItems = items.filter(i => (i.currentValue || 0) > 0).map((item, idx) => ({
    ...item,
    color: COLORS[idx % COLORS.length]
  }));

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

  // Format short axis values (e.g. 50 Jt / 1.2 M)
  const formatShortValue = (val: number) => {
    if (isPrivacy) return '•••';
    if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)} M`;
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(0)} Jt`;
    if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)} Rb`;
    return `Rp ${val}`;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* Portfolio Overview KPI & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Hero Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-6 glass-panel p-6 sm:p-8 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/40 shadow-xl relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp size={160} className="text-indigo-400" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl text-white shadow-md">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">Total Nilai Portofolio</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{items.length} Aset Terdaftar</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                <Sparkles size={12} />
                <span>Akumulasi</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="text-3xl sm:text-5xl font-black text-white tracking-tight font-mono">
                {formatRupiah(totalPortfolio, isPrivacy)}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-400">
                <span>Target Portofolio:</span>
                <span className="font-bold text-slate-200">{formatRupiah(totalTarget, isPrivacy)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 relative z-10 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Target size={14} className="text-indigo-400" /> Pencapaian Target
              </span>
              <span className="text-indigo-400 font-mono font-black text-sm">{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="bg-gradient-to-r from-indigo-600 via-blue-500 to-emerald-400 h-full rounded-full shadow-md"
              />
            </div>
          </div>
        </motion.div>

        {/* Right Asset Allocation Donut Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-6 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                <PieChartIcon size={18} />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Distribusi Alokasi Aset</h3>
            </div>
            <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-700/50">
              {validPieItems.length} Aktif
            </span>
          </div>

          {validPieItems.length > 0 ? (
            <div className="space-y-4">
              <div className="w-full h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={validPieItems} 
                      cx="50%" cy="50%" 
                      innerRadius={45} 
                      outerRadius={75} 
                      dataKey="currentValue" 
                      stroke="#0f172a" 
                      strokeWidth={3} 
                      labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                      label={renderCustomLabel}
                      paddingAngle={3}
                    >
                      {validPieItems.map((entry, index) => <Cell key={`asset-p-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip 
                      formatter={(v:any)=>formatRupiah(v, isPrivacy)} 
                      contentStyle={{backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'}}
                      itemStyle={{ color: '#ffffff', fontWeight: '800' }}
                      labelStyle={{ color: '#ffffff', fontWeight: '800' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap justify-center gap-2 max-h-24 overflow-y-auto px-1">
                {validPieItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 gap-3 py-12 text-center">
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                <PieChartIcon size={36} className="text-slate-600" />
              </div>
              <p className="font-bold text-xs text-slate-400">Belum ada saldo aset yang diinput</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* NEW: Historical Performance Chart Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl text-white shadow-lg border border-white/10">
              <Activity size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">Kinerja Historis & Pertumbuhan Aset</h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-wider">
                  <BarChart3 size={11} /> Growth Analytics
                </span>
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Visualisasi akumulasi portofolio & tren aset dari waktu ke waktu
              </p>
            </div>
          </div>

          {/* Timeframe Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700/80 self-start md:self-auto">
            {[
              { id: '3m', label: '3 Bulan' },
              { id: '6m', label: '6 Bulan' },
              { id: '1y', label: '1 Tahun' },
              { id: 'all', label: 'Semua' },
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeFrame(tf.id as any)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 whitespace-nowrap ${
                  timeFrame === tf.id
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode & Specific Asset Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Filter size={12} className="text-indigo-400" /> Mode Tampilan:
            </span>
            <button
              onClick={() => setSelectedAssetFilter('all_total')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                selectedAssetFilter === 'all_total'
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/60 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              Total Portofolio
            </button>
            {allAssetNames.length > 1 && (
              <button
                onClick={() => setSelectedAssetFilter('multi_asset')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                  selectedAssetFilter === 'multi_asset'
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/60 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                }`}
              >
                Multi-Aset (Perbandingan)
              </button>
            )}
          </div>

          {/* Asset Dropdown Selector */}
          {allAssetNames.length > 0 && selectedAssetFilter !== 'multi_asset' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Pilih Instrumen:</span>
              <select
                value={selectedAssetFilter}
                onChange={(e) => setSelectedAssetFilter(e.target.value)}
                className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-black uppercase text-indigo-300 outline-none focus:border-indigo-500 cursor-pointer shadow-inner"
              >
                <option value="all_total">Semua Aset (Agregat)</option>
                {allAssetNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Growth Statistics KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-white/5">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
              Nilai Awal ({filteredTimeline[0]?.label || '-'})
            </span>
            <span className="text-xs sm:text-base font-black text-slate-200 font-mono">
              {formatRupiah(stats.startVal, isPrivacy)}
            </span>
          </div>

          <div className="bg-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-white/5">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
              Nilai Terkini ({filteredTimeline[filteredTimeline.length - 1]?.label || '-'})
            </span>
            <span className="text-xs sm:text-base font-black text-white font-mono">
              {formatRupiah(stats.currentVal, isPrivacy)}
            </span>
          </div>

          <div className="bg-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-white/5">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
              Pertumbuhan Bersih
            </span>
            <div className="flex items-center gap-1.5">
              {stats.isPositive ? (
                <ArrowUpRight size={16} className="text-emerald-400 shrink-0" />
              ) : (
                <ArrowDownRight size={16} className="text-rose-400 shrink-0" />
              )}
              <span className={`text-xs sm:text-base font-black font-mono ${stats.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.isPositive ? '+' : ''}{formatRupiah(stats.delta, isPrivacy)}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-white/5">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
              Tingkat Kenaikan (ROI)
            </span>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs sm:text-sm font-black font-mono ${
                stats.isPositive 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {stats.isPositive ? '+' : ''}{stats.percent.toFixed(1)}%
              </span>
              <span className="text-[9px] text-slate-400 font-bold hidden sm:inline">
                {filteredTimeline.length} bln
              </span>
            </div>
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="h-[280px] sm:h-[340px] w-full pt-2">
          {filteredTimeline.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {selectedAssetFilter === 'multi_asset' ? (
                <LineChart data={filteredTimeline} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={formatShortValue}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    formatter={(v: any, name: any) => [formatRupiah(Number(v) || 0, isPrivacy), name]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.fullMonth || label;
                    }}
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      border: '1px solid rgba(255,255,255,0.15)', 
                      borderRadius: '16px',
                      boxShadow: '0 15px 35px -5px rgba(0,0,0,0.6)',
                      padding: '12px'
                    }}
                    itemStyle={{ color: '#ffffff', fontWeight: '800', fontSize: '12px' }}
                    labelStyle={{ color: '#818cf8', fontWeight: '900', fontSize: '13px', marginBottom: '6px', textTransform: 'uppercase' }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '12px' }}
                    formatter={(value) => <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 mr-2">{value}</span>}
                  />
                  {allAssetNames.map((assetName, idx) => (
                    <Line
                      key={assetName}
                      type="monotone"
                      dataKey={assetName}
                      name={assetName}
                      stroke={COLORS[idx % COLORS.length]}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: COLORS[idx % COLORS.length], strokeWidth: 0 }}
                      activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  ))}
                </LineChart>
              ) : (
                <AreaChart data={filteredTimeline} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="assetGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={stats.isPositive ? "#10b981" : "#6366f1"} stopOpacity={0.45}/>
                      <stop offset="95%" stopColor={stats.isPositive ? "#10b981" : "#6366f1"} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={formatShortValue}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    formatter={(v: any) => [
                      formatRupiah(Number(v) || 0, isPrivacy), 
                      selectedAssetFilter === 'all_total' ? 'Total Portofolio' : selectedAssetFilter
                    ]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.fullMonth || label;
                    }}
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      border: '1px solid rgba(255,255,255,0.15)', 
                      borderRadius: '16px',
                      boxShadow: '0 15px 35px -5px rgba(0,0,0,0.6)',
                      padding: '12px'
                    }}
                    itemStyle={{ color: '#ffffff', fontWeight: '800', fontSize: '13px' }}
                    labelStyle={{ color: '#818cf8', fontWeight: '900', fontSize: '13px', marginBottom: '4px', textTransform: 'uppercase' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={selectedAssetFilter === 'all_total' ? "totalValue" : selectedAssetFilter} 
                    stroke={stats.isPositive ? "#10b981" : "#6366f1"} 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#assetGrowthGradient)"
                    dot={{ r: 4, fill: stats.isPositive ? "#10b981" : "#6366f1", stroke: '#ffffff', strokeWidth: 1.5 }}
                    activeDot={{ r: 7, fill: '#ffffff', stroke: stats.isPositive ? "#10b981" : "#6366f1", strokeWidth: 3 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <Activity size={32} className="mb-2 text-slate-600" />
              <p className="text-xs font-bold text-slate-400">Belum ada riwayat data aset yang tercatat.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Asset List Section */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-xl">
        <div className="p-5 sm:p-7 border-b border-white/10 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-tight">Daftar Portofolio Aset</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kelola Instrumen Investasi & Tabungan Berjangka</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={addItem} 
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 active:scale-95 border border-indigo-400/30"
          >
            <Plus size={16} /> TAMBAH ASET BARU
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {items.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-slate-600 mb-3">
                <Layers size={32} />
              </div>
              <h4 className="text-white font-bold text-sm mb-1">Belum Ada Aset Terdaftar</h4>
              <p className="text-slate-400 text-xs max-w-sm mb-4">Tambahkan emas, reksa dana, saham, deposito atau tabungan berjangka Anda.</p>
              <button 
                onClick={addItem}
                className="px-4 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all"
              >
                Tambah Aset Sekarang
              </button>
            </div>
          ) : (
            items.map((item) => {
              const history = getHistoryForAsset(item.name);
              const isGrowing = history.length > 1 ? history[history.length - 1].value >= history[history.length - 2].value : true;
              const itemProgress = item.targetValue > 0 ? (item.currentValue / item.targetValue) * 100 : 0;

              return (
                <div key={item.id} className="bg-slate-900/70 p-4 sm:p-6 rounded-2xl border border-white/5 flex flex-col gap-4 transition-all hover:border-indigo-500/30 hover:bg-slate-900/90 shadow-md">
                  <div className="grid grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 items-end">
                    <div className="col-span-2 md:col-span-4">
                      <label className="text-[10px] sm:text-xs text-slate-400 uppercase font-bold mb-1.5 block pl-1 tracking-wider">Nama Instrumen / Aset</label>
                      <input 
                        type="text" 
                        value={item.name} 
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)} 
                        className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl p-3 text-white text-xs sm:text-sm font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner" 
                        placeholder="Contoh: Emas Batangan, Reksadana Pasar Uang" 
                      />
                    </div>
                    <div className="col-span-1 md:col-span-3">
                      <CurrencyInput label="Saldo Saat Ini" value={item.currentValue} isPrivacy={isPrivacy} onChange={(v) => updateItem(item.id, 'currentValue', v)} />
                    </div>
                    <div className="col-span-1 md:col-span-3">
                      <CurrencyInput label="Target Nilai" value={item.targetValue} isPrivacy={isPrivacy} onChange={(v) => updateItem(item.id, 'targetValue', v)} />
                    </div>
                    <div className="col-span-2 md:col-span-2 flex justify-between items-center h-full pt-1 sm:pt-0">
                      <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-indigo-500/20 font-mono font-black text-indigo-400 text-xs flex items-center gap-1.5">
                        <span className="text-[9px] text-slate-400 uppercase font-sans">Goal:</span>
                        {itemProgress.toFixed(0)}%
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setDeleteTarget(item)} 
                        className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all active:scale-95"
                        title="Hapus aset"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar under each asset */}
                  {item.targetValue > 0 && (
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(itemProgress, 100)}%` }}
                      />
                    </div>
                  )}

                  {/* Chart Per Asset */}
                  {history.length > 1 && (
                    <div className="mt-1 pt-3 border-t border-white/5">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <div className="flex items-center gap-1.5">
                          {isGrowing ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-rose-400" />}
                          <span className={`text-[10px] font-black uppercase tracking-wider ${isGrowing ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isGrowing ? 'Pertumbuhan Positif' : 'Penurunan Nilai'}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">Riwayat: {history.length} Bulan</span>
                      </div>
                      <div className="h-[90px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={history}>
                            <defs>
                              <linearGradient id={`grad-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isGrowing ? "#10b981" : "#f43f5e"} stopOpacity={0.4}/>
                                <stop offset="95%" stopColor={isGrowing ? "#10b981" : "#f43f5e"} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Area 
                              type="monotone" 
                              dataKey="value" 
                              stroke={isGrowing ? "#10b981" : "#f43f5e"} 
                              strokeWidth={2.5} 
                              fillOpacity={1} 
                              fill={`url(#grad-${item.id})`}
                              dot={{ r: 3, fill: isGrowing ? "#10b981" : "#f43f5e", strokeWidth: 0 }} 
                            />
                            <Tooltip 
                              formatter={(v:any)=>formatRupiah(v, isPrivacy)} 
                              contentStyle={{backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}}
                              itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                              labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                            />
                            <XAxis dataKey="month" hide />
                            <YAxis hide domain={['auto', 'auto']} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <DeleteModal isOpen={!!deleteTarget} title="Hapus Aset" itemName={deleteTarget?.name || ""} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    </div>
  );
};

export default Investments;