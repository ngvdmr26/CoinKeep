export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'completed' | 'pending';
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingDay: number; // 1-31
  category: string;
  active: boolean;
}

export interface MonthlyData {
  name: string;
  income: number;
  expenses: number;
}

export interface AIInsight {
  title: string;
  description: string;
  type: 'warning' | 'success' | 'info';
}

export enum ChartView {
  Weekly = 'Weekly',
  Monthly = 'Monthly',
  Yearly = 'Yearly'
}