import React, { useState } from 'react';
import { formatRupiah, parseRupiah } from '../../utils';

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isPrivacy?: boolean;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  value,
  onChange,
  placeholder = '0',
  className = '',
  disabled = false,
  isPrivacy = false
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseRupiah(e.target.value);
    onChange(numericValue);
  };

  const displayValue = value === 0 ? '' : formatRupiah(value).replace('Rp', '').trim();
  const maskedValue = '••••••';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-bold pl-1 transition-colors group-focus-within:text-indigo-400">
        {label}
      </label>
      <div className="relative group">
        <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black transition-colors ${isFocused ? 'text-indigo-400' : 'text-slate-500'}`}>
          Rp
        </span>
        <input
          type="text"
          value={isPrivacy && !isFocused ? maskedValue : displayValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full bg-slate-900/60 border border-slate-700/60 rounded-xl py-2.5 sm:py-3 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 disabled:opacity-50 text-right font-mono text-sm font-bold shadow-inner transition-all duration-200 ${isPrivacy && !isFocused ? 'tracking-[0.3em] font-black' : ''}`}
        />
      </div>
    </div>
  );
};

export default CurrencyInput;