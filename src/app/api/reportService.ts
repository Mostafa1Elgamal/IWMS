import apiClient from "./client";
import { getFinancialData } from "./invoiceService";
import { getProductionDashboard } from "./productionService";
import { getInventory } from "./inventoryService";
import { getJobOrders } from "./jobOrderService";

export interface ReportData {
  productionEfficiency: { date: string; efficiency: number; target: number }[];
  inventoryUsage: { material: string; used: number; purchased: number }[];
  financialPerformance: { week: string; revenue: number; costs: number }[];
  ordersByCategory: { category: string; orders: number; revenue: number }[];
  kpis: {
    avgEfficiency: number;
    materialUsage: number;
    profitMargin: number;
    onTimeDelivery: number;
  };
}

export const getReportData = async (): Promise<ReportData> => {
  const response = await apiClient.get("/reports/full");
  return response.data;
};

export interface DashboardData {
  totalRevenue: number;
  totalExpenses: number;
  totalOrders: number;
  completed: number;
  inProgress: number;
  lowStockAlerts: { name: string; quantity: number }[];
}

export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    const [financials, orders, inventory] = await Promise.all([
      getFinancialData(),
      getJobOrders(),
      getInventory()
    ]);

    const completed = orders.filter(o => o.status === 'Completed').length;
    const inProgress = orders.filter(o => o.status === 'In Progress').length;
    
    const lowStockAlerts = inventory
      .filter(m => m.status === 'Low Stock' || m.status === 'Out of Stock')
      .map(m => ({ name: m.type, quantity: m.quantity }));

    return {
      totalRevenue: financials.summary.totalRevenue,
      totalExpenses: financials.summary.totalExpenses || 0,
      totalOrders: orders.length,
      completed,
      inProgress,
      lowStockAlerts
    };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      totalOrders: 0,
      completed: 0,
      inProgress: 0,
      lowStockAlerts: []
    };
  }
};
