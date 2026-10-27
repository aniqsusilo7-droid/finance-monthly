import React from 'react';
import { SalaryData } from '../types';
import CurrencyInput from './ui/CurrencyInput';
import { calculateOvertime, calculateBonus, calculateGrossIncome, calculateTax, formatRupiah } from '../utils';
import { 
  DollarSign, TrendingUp, TrendingDown, Clock, 
  Percent, Sparkles, ShieldAlert, Award, FileText, CheckCircle 
} from 'lucide-react';

interface SalarySlipProps {
  data: SalaryData;
  isPrivacy?: boolean;
  onChange: (data: SalaryData) => void;
}

const SalarySlip: React.FC<SalarySlipProps> = ({ data, isPrivacy = false, onChange }) => {
  const updateField = (field: keyof SalaryData, value: number) => {
    onChange({ ...data, [field]: value });
  };

  // Calculations
  const otRupiah = calculateOvertime(data.basicSalary, data.housingAllowance, data.overtimeHours);
  const totalIncomeComponents = data.basicSalary + data.housingAllowance + data.shiftAllowance + otRupiah;
  const bonusRupiah = calculateBonus(data.basicSalary, data.housingAllowance, data.bonusMultiplier);
  const grossIncome = calculateGrossIncome(
    data.basicSalary,
    data.housingAllowance,
    data.shiftAllowance,
    otRupiah,
    bonusRupiah,
    data.thr,
    data.leavePay
  );
  
  const taxNominal = calculateTax(grossIncome, data.taxRate);
  const totalDeductions = taxNominal + data.otherDeductions;
  const takeHomePay = grossIncome - totalDeductions;
  const deductionRate = grossIncome > 0 ? (totalDeductions / grossIncome) * 100 : 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-6">
      {/* Modern Take Home Pay Hero Card */}
      <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-white/15 group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-950"></div>
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl group-hover:bg-indigo-500/30 transition-all duration-700"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-emerald-500/10 blur-2xl"></div>

        <div className="relative p-6 sm:p-10 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                <FileText size={18} className="text-indigo-300" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Kalkulasi Penghasilan Bersih</span>
                <h2 className="text-sm sm:text-base font-black tracking-wide text-white uppercase">Take Home Pay (THP)</h2>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md self-start sm:self-auto">
              <CheckCircle size={14} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Siap Dialokasikan</span>
            </div>
          </div>

          <div className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6 drop-shadow-md text-white">
            {formatRupiah(takeHomePay, isPrivacy)}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 border-t border-white/10">
            <div className="bg-white/5 rounded-2xl p-3.5 backdrop-blur-sm border border-white/10">
              <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider block mb-1">Gross (Kotor)</span>
              <span className="text-sm sm:text-lg font-black text-white font-mono">{formatRupiah(grossIncome, isPrivacy)}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3.5 backdrop-blur-sm border border-white/10">
              <span className="text-[10px] uppercase font-bold text-rose-300 tracking-wider block mb-1">Potongan Total</span>
              <span className="text-sm sm:text-lg font-black text-rose-300 font-mono">-{formatRupiah(totalDeductions, isPrivacy)}</span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-white/5 rounded-2xl p-3.5 backdrop-blur-sm border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider block mb-1">Rasio Potongan</span>
              <span className="text-sm sm:text-lg font-black text-slate-200 font-mono">{deductionRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pendapatan Section */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-white/10 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">Komponen Pendapatan</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gaji Pokok, Tunjangan & Lembur</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CurrencyInput 
              label="Gaji Pokok" 
              value={data.basicSalary} 
              isPrivacy={isPrivacy}
              onChange={(v) => updateField('basicSalary', v)} 
            />
            <CurrencyInput 
              label="Tunjangan Perumahan" 
              value={data.housingAllowance} 
              isPrivacy={isPrivacy}
              onChange={(v) => updateField('housingAllowance', v)} 
            />
            <CurrencyInput 
              label="Tunjangan Shift" 
              value={data.shiftAllowance} 
              isPrivacy={isPrivacy}
              onChange={(v) => updateField('shiftAllowance', v)} 
            />
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-bold pl-1 flex items-center justify-between">
                <span>Lembur (Jam Eqv)</span>
                <span className="text-indigo-400 font-bold text-[9px]">*Auto Ot</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                  <Clock size={14} />
                </span>
                <input 
                  type="number" 
                  step="0.1"
                  value={data.overtimeHours.toFixed(2)}
                  readOnly
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl py-2.5 sm:py-3 pl-10 pr-4 text-indigo-400 font-black focus:outline-none text-right font-mono text-sm shadow-inner cursor-not-allowed"
                  title="Otomatis dihitung dari tab Lembur"
                />
              </div>
              <p className="text-[10px] text-indigo-400 text-right font-bold uppercase mt-0.5">
                Konversi: {formatRupiah(otRupiah, isPrivacy)}
              </p>
            </div>

            <div className="sm:col-span-2 bg-indigo-950/40 p-4 rounded-2xl flex justify-between items-center border border-indigo-500/30">
              <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">Subtotal Rutin Bulanan</span>
              <span className="text-sm sm:text-base font-black text-indigo-400 font-mono">{formatRupiah(totalIncomeComponents, isPrivacy)}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-bold pl-1">Multiplier Bonus</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.1"
                  value={data.bonusMultiplier === 0 ? '' : data.bonusMultiplier}
                  onChange={(e) => updateField('bonusMultiplier', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl py-2.5 sm:py-3 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 text-right font-mono text-sm font-bold shadow-inner"
                  placeholder="Contoh: 1.0"
                />
              </div>
              <p className="text-[10px] text-indigo-400 text-right font-bold uppercase mt-0.5">
                Nominal: {formatRupiah(bonusRupiah, isPrivacy)}
              </p>
            </div>

            <CurrencyInput 
              label="THR / Bonus Hari Raya" 
              value={data.thr} 
              isPrivacy={isPrivacy}
              onChange={(v) => updateField('thr', v)} 
            />

            <div className="sm:col-span-2">
              <CurrencyInput 
                label="Uang Cuti / Kompensasi Lainnya" 
                value={data.leavePay} 
                isPrivacy={isPrivacy}
                onChange={(v) => updateField('leavePay', v)} 
              />
            </div>
            
            <div className="sm:col-span-2 bg-slate-900/80 p-4 rounded-2xl flex justify-between items-center border border-slate-700/70 shadow-inner">
              <span className="text-slate-400 font-black text-[11px] uppercase tracking-wider">Total Gross Income</span>
              <span className="text-base sm:text-xl font-black text-white font-mono">{formatRupiah(grossIncome, isPrivacy)}</span>
            </div>
          </div>
        </div>

        {/* Potongan Section */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-white/10 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <TrendingDown size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">Komponen Potongan</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PPh 21 & Potongan Wajib Lainnya</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-bold pl-1 flex items-center justify-between">
                  <span>Pajak Penghasilan (PPh 21)</span>
                  <span className="text-rose-400 font-bold text-[9px]">% Rate</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">%</span>
                  <input 
                    type="number" 
                    step="0.1"
                    value={data.taxRate === 0 ? '' : data.taxRate}
                    onChange={(e) => updateField('taxRate', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl py-2.5 sm:py-3 pl-10 pr-4 text-white focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 text-right font-mono text-sm font-bold shadow-inner"
                    placeholder="Contoh: 5.0"
                  />
                </div>
                <p className="text-[10px] text-rose-400 text-right font-bold uppercase mt-0.5">
                  Nominal Pajak: {formatRupiah(taxNominal, isPrivacy)}
                </p>
              </div>

              <CurrencyInput 
                label="Potongan Lain-lain (BPJS/Koperasi/Dll)" 
                value={data.otherDeductions} 
                isPrivacy={isPrivacy}
                onChange={(v) => updateField('otherDeductions', v)} 
              />
            </div>
          </div>

          <div className="space-y-3 pt-6">
            <div className="bg-rose-950/40 p-4 rounded-2xl flex justify-between items-center border border-rose-500/30">
              <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">Total Seluruh Potongan</span>
              <span className="text-base sm:text-lg font-black text-rose-400 font-mono">-{formatRupiah(totalDeductions, isPrivacy)}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-700/50 text-[11px] text-slate-400 leading-relaxed">
              <p className="font-medium">
                💡 <strong className="text-slate-200">Tips Penggajian:</strong> Pastikan potongan BPJS Ketenagakerjaan dan Kesehatan telah diperiksa sesuai bukti potong resmi perusahaan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalarySlip;