import { useState, useEffect } from "react";
import { Calendar, Download, BarChart3, TrendingUp, RefreshCw } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { getReportData, type ReportData } from "../api/reportService";
import { toast } from "sonner";

const DATE_RANGES = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "This Year"];

export function Reports() {
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const reportData = await getReportData();
      setData(reportData);
    } catch (error) {
      console.error("Failed to fetch report data:", error);
      toast.error("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    toast.success("Reports refreshed");
  };

  const exportReportCSV = () => {
    if (!data) return;

    // Build CSV rows
    const rows: string[][] = [];

    rows.push(["=== KPI SUMMARY ==="]);
    rows.push(["Metric", "Value"]);
    rows.push(["Avg Efficiency", `${data.kpis.avgEfficiency.toFixed(1)}%`]);
    rows.push(["Material Usage", `${data.kpis.materialUsage}%`]);
    rows.push(["Profit Margin", `${data.kpis.profitMargin.toFixed(1)}%`]);
    rows.push(["On-Time Delivery", `${data.kpis.onTimeDelivery}%`]);
    rows.push([]);

    rows.push(["=== FINANCIAL PERFORMANCE ==="]);
    rows.push(["Week/Month", "Revenue ($)", "Costs ($)", "Net Profit ($)"]);
    data.financialPerformance.forEach(r => {
      rows.push([r.week, r.revenue.toString(), r.costs.toString(), (r.revenue - r.costs).toString()]);
    });
    rows.push([]);

    rows.push(["=== INVENTORY USAGE ==="]);
    rows.push(["Material", "Used", "Purchased"]);
    data.inventoryUsage.forEach(r => {
      rows.push([r.material, r.used.toString(), r.purchased.toString()]);
    });
    rows.push([]);

    rows.push(["=== ORDERS BY CATEGORY ==="]);
    rows.push(["Category", "Orders", "Revenue ($)", "Avg Order Value ($)"]);
    data.ordersByCategory.forEach(r => {
      const avg = r.orders > 0 ? Math.round(r.revenue / r.orders) : 0;
      rows.push([r.category, r.orders.toString(), r.revenue.toString(), avg.toString()]);
    });

    const csvContent = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `IWMS_Report_${dateRange.replace(/ /g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported as CSV");
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          >
            {DATE_RANGES.map(r => <option key={r}>{r}</option>)}
          </select>
          <button
            onClick={handleRefresh}
            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={exportReportCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Download size={18} /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: "Avg Efficiency", value: `${data.kpis.avgEfficiency.toFixed(1)}%`,
            sub: "Production efficiency", icon: TrendingUp, bg: "bg-green-100", text: "text-green-600",
          },
          {
            label: "Material Usage", value: `${data.kpis.materialUsage}%`,
            sub: "Utilization rate", icon: BarChart3, bg: "bg-blue-100", text: "text-blue-600",
          },
          {
            label: "Profit Margin", value: `${data.kpis.profitMargin.toFixed(1)}%`,
            sub: "Revenue minus costs", icon: TrendingUp, bg: "bg-emerald-100", text: "text-emerald-600",
          },
          {
            label: "On-Time Delivery", value: `${data.kpis.onTimeDelivery}%`,
            sub: "Delivery performance", icon: Calendar, bg: "bg-purple-100", text: "text-purple-600",
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{kpi.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
                </div>
                <div className={`w-12 h-12 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={kpi.text} size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Production Efficiency Trend */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Production Efficiency Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.productionEfficiency}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" domain={[70, 100]} />
            <Tooltip formatter={(v: number) => `${v}%`} />
            <Legend />
            <Area type="monotone" dataKey="efficiency" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} name="Actual %" />
            <Area type="monotone" dataKey="target" stroke="#10b981" fill="#10b981" fillOpacity={0.05} strokeDasharray="5 5" name="Target %" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Two Column Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Usage */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Usage vs Purchased</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.inventoryUsage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="material" stroke="#6b7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="purchased" fill="#94a3b8" name="Purchased" />
              <Bar dataKey="used" fill="#3b82f6" name="Used" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Financial Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Performance</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.financialPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="week" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue ($)" dot={false} />
              <Line type="monotone" dataKey="costs" stroke="#ef4444" strokeWidth={2} name="Costs ($)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders by Category Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Orders by Category</h2>
          <p className="text-sm text-gray-500 mt-1">Revenue breakdown by order type</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Order Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% of Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.ordersByCategory.map((item) => {
                const avg = item.orders > 0 ? Math.round(item.revenue / item.orders) : 0;
                const totalRev = data.ordersByCategory.reduce((s, c) => s + c.revenue, 0);
                const pct = totalRev > 0 ? ((item.revenue / totalRev) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={item.category} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.orders}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${item.revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${avg.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="text-sm text-gray-700 tabular-nums">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
