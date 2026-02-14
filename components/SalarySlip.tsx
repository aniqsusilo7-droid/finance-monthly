import React from 'react';
import { SalaryData } from '../types';
import CurrencyInput from './ui/CurrencyInput';
import { calculateOvertime, calculateBonus, calculateGrossIncome, calculateTax, formatRupiah } from '../utils';

interface SalarySlipProps {
  data: SalaryData;
  onChange: (data: SalaryData) => void;
}

const SalarySlip: React.FC<SalarySlipProps> = ({ data, onChange }) => {
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

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Pendapatan Section */}
      <div className="glass-panel p-5 sm:p-8 rounded-2xl relative overflow-hidden group border-l-4 border-indigo-500">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs sm:text-sm">1</span>
          Pendapatan
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <CurrencyInput 
            label="Gaji Pokok" 
            value={data.basicSalary} 
            onChange={(v) => updateField('basicSalary', v)} 
          />
          <CurrencyInput 
            label="Tunjangan Perumahan" 
            value={data.housingAllowance} 
            onChange={(v) => updateField('housingAllowance', v)} 
          />
          <CurrencyInput 
            label="Tunjangan Shift" 
            value={data.shiftAllowance} 
            onChange={(v) => updateField('shiftAllowance', v)} 
          />
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-bold pl-1">Lembur (Jam)</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.1"
                value={data.overtimeHours === 0 ? '' : data.overtimeHours}
                onChange={(e) => updateField('overtimeHours', parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-right shadow-sm font-mono text-sm"
                placeholder="0"
              />
            </div>
            <p className="text-[10px] sm:text-xs text-indigo-500 text-right mt-1 font-medium">Konversi: {formatRupiah(otRupiah)}</p>
          </div>

          <div className="md:col-span-2 bg-indigo-50/50 p-3 sm:p-4 rounded-xl flex justify-between items-center border border-indigo-100">
            <span className="text-slate-600 font-medium text-sm sm:text-base">Total Rutin</span>
            <span className="text-base sm:text-lg font-bold text-indigo-600">{formatRupiah(totalIncomeComponents)}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-bold pl-1">Bonus Multiplier</label>
            <input 
              type="number" 
              step="0.1"
              value={data.bonusMultiplier === 0 ? '' : data.bonusMultiplier}
              onChange={(e) => updateField('bonusMultiplier', parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-right shadow-sm font-mono text-sm"
              placeholder="Ex: 1.0"
            />
            <p className="text-[10px] sm:text-xs text-indigo-500 text-right mt-1 font-medium">Nominal: {formatRupiah(bonusRupiah)}</p>
          </div>

          <CurrencyInput 
            label="THR / Bonus Hari Raya" 
            value={data.thr} 
            onChange={(v) => updateField('thr', v)} 
          />
          <CurrencyInput 
            label="Uang Cuti / Lainnya" 
            value={data.leavePay} 
            onChange={(v) => updateField('leavePay', v)} 
          />
          
          <div className="md:col-span-2 mt-2 bg-slate-50 p-4 sm:p-5 rounded-xl flex justify-between items-center border border-slate-200">
            <span className="text-slate-600 font-bold text-xs sm:text-sm uppercase tracking-wide">Gross Income (Kotor)</span>
            <span className="text-lg sm:text-2xl font-bold text-slate-800 tracking-tight">{formatRupiah(grossIncome)}</span>
          </div>
        </div>
      </div>

      {/* Potongan Section */}
      <div className="glass-panel p-5 sm:p-8 rounded-2xl shadow-lg relative overflow-hidden border-l-4 border-rose-500">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
           <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 text-xs sm:text-sm">2</span>
           Potongan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-bold pl-1">Pajak PPh (%)</label>
            <input 
              type="number" 
              step="0.1"
              value={data.taxRate === 0 ? '' : data.taxRate}
              onChange={(e) => updateField('taxRate', parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-right shadow-sm font-mono text-sm"
              placeholder="0"
            />
            <p className="text-[10px] sm:text-xs text-rose-500 text-right mt-1 font-medium">Nominal: {formatRupiah(taxNominal)}</p>
          </div>

          <CurrencyInput 
            label="Potongan Lainnya" 
            value={data.otherDeductions} 
            onChange={(v) => updateField('otherDeductions', v)} 
          />

          <div className="md:col-span-2 bg-rose-50 p-3 sm:p-4 rounded-xl flex justify-between items-center border border-rose-100">
            <span className="text-slate-600 font-medium text-sm sm:text-base">Total Potongan</span>
            <span className="text-base sm:text-lg font-bold text-rose-500">{formatRupiah(totalDeductions)}</span>
          </div>
        </div>
      </div>

      {/* Net Pay Card */}
      <div className="relative overflow-hidden rounded-3xl shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-600"></div>
        <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-10 -translate-y-10">
            <div className="w-40 h-40 rounded-full bg-white blur-3xl"></div>
        </div>
        <div className="relative p-6 sm:p-10 text-center text-white">
          <h2 className="text-sm sm:text-lg font-medium mb-2 sm:mb-4 uppercase tracking-[0.2em] opacity-90">Take Home Pay</h2>
          <div className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter drop-shadow-sm">
            {formatRupiah(takeHomePay)}
          </div>
          <p className="mt-3 sm:mt-4 text-indigo-100 text-xs sm:text-sm">Dana bersih yang masuk ke rekening.</p>
        </div>
      </div>
    </div>
  );
};

export default SalarySlip;
