import React from 'react';
import { formatRupiah, parseRupiah } from '../../utils';

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Rp 0',
  className = '',
  disabled = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseRupiah(e.target.value);
    onChange(numericValue);
  };

  const displayValue = value === 0 ? '' : formatRupiah(value).replace('Rp', '').trim();

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-bold pl-1">{label}</label>
      <div className="relative group">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-indigo-500 transition-colors">Rp</span>
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder="0"
          className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 text-right font-mono text-sm shadow-sm transition-all duration-200"
        />
      </div>
    </div>
  );
};

export default CurrencyInput;
