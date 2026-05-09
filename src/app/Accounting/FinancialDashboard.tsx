import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getDashboardData } from "../api/reportService";
import { getInvoices } from "./accountingService";

export function FinancialDashboard() {
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [stats, invoices] = await Promise.all([
          getDashboardData(),
          getInvoices()
        ]);
        setDashboardStats(stats);
        setRecentInvoices(invoices.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch financial data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading || !dashboardStats) {
    return <div className="p-8 text-center">Loading financial dashboard...</div>;
  }

  const totalRevenue = dashboardStats.totalRevenue;
  const totalCosts = dashboardStats.totalExpenses || 0;
  const netProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0";

  const revenueData = [
    { month: "Current", revenue: totalRevenue, costs: totalCosts },
  ];

  const invoiceStatusData = [
    { name: "Paid", value: recentInvoices.filter(i => i.status === 'paid').length, color: "#10b981" },
    { name: "Pending", value: recentInvoices.filter(i => i.status === 'unpaid').length, color: "#f59e0b" },
    { name: "Partial", value: recentInvoices.filter(i => i.status === 'partial').length, color: "#3b82f6" },
  ];

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-gray-900">
            Financial Dashboard
          </h2>
          <p className="text-gray-600 mt-1">
            Overview of your workshop's financial performance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Revenue
                  </p>
                  <p className="text-3xl font-semibold text-gray-900 mt-2">
                    ${(totalRevenue / 1000).toFixed(1)}K
                  </p>
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Live Data
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Net Profit
                  </p>
                  <p className="text-3xl font-semibold text-gray-900 mt-2">
                    ${(netProfit / 1000).toFixed(1)}K
                  </p>
                  <p className="text-sm text-blue-600 mt-2">
                    {profitMargin}% margin
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Recent Invoices
                  </p>
                  <p className="text-3xl font-semibold text-gray-900 mt-2">
                    {recentInvoices.length}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Last 5 transactions
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={invoiceStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {invoiceStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">#{inv.id.substring(0, 8)}</p>
                      <p className="text-sm text-gray-600">
                        Customer: {inv.customerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${inv.status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                        ${inv.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(inv.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {recentInvoices.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No recent transactions found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
