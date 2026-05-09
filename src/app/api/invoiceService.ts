import apiClient from "./client";

export interface Invoice {
  id: string;
  orderId?: string;
  customer: string;
  amount: string;
  status: string;
  dueDate: string;
  paidDate: string;
  materialsCost: number;
  laborCost: number;
  rawAmount: number;
}

export interface FinancialData {
  invoices: Invoice[];
  revenueData: { month: string; revenue: number; expenses: number }[];
  costBreakdown: { name: string; value: number; color: string }[];
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    pendingAmount: number;
    pendingCount: number;
  };
}

export const getFinancialData = async (): Promise<FinancialData> => {
  const response = await apiClient.get("/reports/financials");
  return response.data;
};
