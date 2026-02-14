export const formatRupiah = (value: number): string => {
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

// Calculations based on requirements
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
