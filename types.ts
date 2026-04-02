export interface SalaryData {
  basicSalary: number;
  housingAllowance: number;
  shiftAllowance: number;
  overtimeHours: number;
  bonusMultiplier: number;
  thr: number;
  leavePay: number;
  taxRate: number;
  otherDeductions: number;
}

export interface UserProfile {
  name: string;
  nik: string;
  dept: string;
  group: string;
}

export interface OvertimeEntry {
  id: string;
  date: string;
  type: 'normal' | 'holiday';
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  actualHours: number;
  purpose: string;
}

export interface BudgetItem {
  id: string;
  name: string;
  budget: number;
  actual: number;
}

export interface OtherBudgetItem {
  id: string;
  name: string;
  actual: number;
}

export interface BudgetCategory {
  items: BudgetItem[];
  name?: string;
}

export interface CustomBudgetCategory extends BudgetCategory {
  id: string;
  name: string;
}

export interface OtherBudgetCategory {
  allocation: number;
  items: OtherBudgetItem[];
}

export interface BudgetData {
  needs?: BudgetCategory;
  savings?: BudgetCategory;
  debt?: BudgetCategory;
  others?: OtherBudgetCategory;
  custom?: CustomBudgetCategory[];
}

export interface InvestmentItem {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
}

export interface MonthlyData {
  salary: SalaryData;
  budget: BudgetData;
  investments: InvestmentItem[];
  overtimeEntries: OvertimeEntry[];
  profile?: UserProfile;
}

export interface AppState {
  [key: string]: MonthlyData;
}

export const DEFAULT_SALARY: SalaryData = {
  basicSalary: 0,
  housingAllowance: 0,
  shiftAllowance: 0,
  overtimeHours: 0,
  bonusMultiplier: 0,
  thr: 0,
  leavePay: 0,
  taxRate: 0,
  otherDeductions: 0,
};

export const DEFAULT_PROFILE: UserProfile = {
  name: '',
  nik: '',
  dept: '',
  group: ''
};

export const DEFAULT_BUDGET: BudgetData = {
  needs: { items: [], name: 'Kebutuhan Pokok' },
  savings: { items: [], name: 'Tabungan & Investasi' },
  debt: { items: [], name: 'Hutang & Cicilan' },
  others: { allocation: 0, items: [] },
  custom: []
};