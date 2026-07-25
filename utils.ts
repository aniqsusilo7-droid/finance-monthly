export const formatRupiah = (value: number, isPrivacy: boolean = false): string => {
  if (isPrivacy) return 'Rp ••••••';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const parseRupiah = (value: string): number => {
  const clean = value.replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
};

// Logika Overtime dari Foto (Excel Formula)
export const calculateEqvHours = (actual: number, type: 'normal' | 'holiday'): number => {
  if (actual <= 0) return 0;

  if (type === 'normal') {
    // Rumus: =IF(K1585>1; 1,5 + (K1585-1)*2; K1585*1,5)
    return actual > 1 ? 1.5 + (actual - 1) * 2 : actual * 1.5;
  } else {
    // Rumus Holiday: 7 jam pertama 2x, jam ke-8 3x, jam ke-9 dst 4x
    if (actual <= 7) return actual * 2;
    if (actual <= 8) return 14 + (actual - 7) * 3;
    return 14 + 3 + (actual - 8) * 4;
  }
};

export const calculateOvertime = (basic: number, housing: number, hours: number) => {
  return ((basic + housing) / 173) * hours;
};

export const calculateBonus = (basic: number, housing: number, multiplier: number) => {
  return (basic + housing) * multiplier;
};

export const calculateGrossIncome = (
  basic: number,
  housing: number,
  shift: number,
  otValue: number,
  bonusValue: number,
  thr: number,
  leave: number
) => {
  return basic + housing + shift + otValue + bonusValue + thr + leave;
};

export const calculateTax = (gross: number, rate: number) => {
  return gross * (rate / 100);
};

export const getBudgetMonth = (dateString: string | Date): string => {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '';
  
  const day = date.getDate();
  let year = date.getFullYear();
  let month = date.getMonth(); // 0-indexed (0 is Jan, 11 is Dec)
  
  if (day >= 28) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return `${year}-${String(month + 1).padStart(2, '0')}`;
};

export const getBudgetPeriodLabel = (date: Date): string => {
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth(); // 0-indexed
  
  // Previous month details
  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const prevMonthName = prevMonthDate.toLocaleString('id-ID', { month: 'short' });
  const prevYear = prevMonthDate.getFullYear();
  
  // Current month details
  const currentMonthName = date.toLocaleString('id-ID', { month: 'short' });
  
  const prevYearLabel = prevYear !== currentYear ? ` ${prevYear}` : '';
  
  return `28 ${prevMonthName}${prevYearLabel} - 27 ${currentMonthName} ${currentYear}`;
};