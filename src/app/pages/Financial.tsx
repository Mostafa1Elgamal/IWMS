import { useState, useEffect } from "react";
import { Link } from "react-router";
import { DollarSign, TrendingUp, FileText, AlertCircle, CheckCircle, RefreshCw, Download } from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import apiClient from "../api/client";
import { getFinancialData, type FinancialData, type Invoice } from "../api/invoiceService";
import { toast } from "sonner";

export function Financial() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  useEffect(() => { fetchFinancials(); }, []);

  const fetchFinancials = async () => {
    try {
      setIsLoading(true);
      const finData = await getFinancialData();
      setData(finData);
    } catch (error) {
      console.error("Failed to fetch financials:", error);
      toast.error("Failed to load financial data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchFinancials();
    setIsRefreshing(false);
    toast.success("Financial data refreshed");
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    if (invoice.status === "Paid") {
      toast.info("Invoice is already marked as paid");
      return;
    }
    try {
      setMarkingPaid(invoice.id);
      await apiClient.patch(`/invoices/${invoice.id}`, { paymentStatus: "paid" });
      toast.success(`Invoice marked as paid`);
      fetchFinancials();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update invoice");
    } finally {
      setMarkingPaid(null);
    }
  };

  const exportInvoicesCSV = () => {
    if (!data) return;
    const rows = [
      ["Invoice ID", "Customer", "Amount ($)", "Status", "Due Date", "Paid Date"],
      ...data.invoices.map(inv => [inv.id, inv.customer, inv.rawAmount.toString(), inv.status, inv.dueDate, inv.paidDate])
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoices_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Invoices exported");
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500">Loading financial data...</p>
        </div>
      </div>
    );
  }

  const netProfit = data.summary.totalRevenue - data.summary.totalExpenses;

  const financialSummary = [
    {
      label: "Total Revenue",
      value: `$${(data.summary.totalRevenue / 1000).toFixed(1)}K`,
      sub: `From ${data.invoices.filter(i => i.status === "Paid").length} paid invoices`,
      icon: DollarSign, color: "green",
    },
    {
      label: "Total Expenses",
      value: `$${(data.summary.totalExpenses / 1000).toFixed(1)}K`,
      sub: "Materials + Labor + Operations",
      icon: TrendingUp, color: "blue",
    },
    {
      label: "Net Profit",
      value: `$${(netProfit / 1000).toFixed(1)}K`,
      sub: netProfit >= 0 ? "Positive margin ✓" : "Negative margin ✗",
      icon: TrendingUp, color: netProfit >= 0 ? "emerald" : "red",
    },
    {
      label: "Pending Invoices",
      value: `$${(data.summary.pendingAmount / 1000).toFixed(1)}K`,
      sub: `${data.summary.pendingCount} unpaid invoice${data.summary.pendingCount !== 1 ? "s" : ""}`,
      icon: AlertCircle, color: "orange",
    },
  ];

  const colorMap: Record<string, { bg: string; text: string }> = {
    green:   { bg: "bg-green-100",   text: "text-green-600" },
    blue:    { bg: "bg-blue-100",    text: "text-blue-600" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
    red:     { bg: "bg-red-100",     text: "text-red-600" },
    orange:  { bg: "bg-orange-100",  text: "text-orange-600" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
          <p className="text-gray-500 mt-1">Track revenue, expenses, and financial performance</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh}
            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
          </button>
          <button onClick={exportInvoicesCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            <Download size={16} /> Export Invoices
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {financialSummary.map((item) => {
          const Icon = item.icon;
          const c = colorMap[item.color];
          return (
            <div key={item.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{item.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.sub}</p>
                </div>
                <div className={`w-12 h-12 ${c.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={c.text} size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Expenses</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Breakdown Pie */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.costBreakdown}
                cx="50%" cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={90}
                dataKey="value"
              >
                {data.costBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {data.costBreakdown.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div>
                  <p className="text-xs text-gray-500">{item.name}</p>
                  <p className="text-sm font-semibold text-gray-900">${item.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profit Trend */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profit Trend</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data.revenueData.map(item => ({ ...item, profit: item.revenue - item.expenses }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue ($)" dot={false} />
            <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} name="Net Profit ($)" dot />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">All Invoices</h2>
              <p className="text-sm text-gray-500 mt-1">
                {data.invoices.length} total — {data.invoices.filter(i => i.status === "Paid").length} paid,{" "}
                {data.summary.pendingCount} pending
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 bg-green-400 rounded-full inline-block"></span>
              <span className="text-gray-500">Paid</span>
              <span className="w-3 h-3 bg-yellow-400 rounded-full inline-block ml-2"></span>
              <span className="text-gray-500">Unpaid</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Ref</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                    No invoices found. Invoices are created automatically when job orders are completed.
                  </td>
                </tr>
              ) : data.invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                    #{invoice.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {invoice.orderId ? (
                      <Link to="/Manager/orders" className="text-blue-600 hover:text-blue-800 underline font-medium">
                        #{invoice.orderId.slice(-6).toUpperCase()}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{invoice.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      invoice.status === "Paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.dueDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.paidDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {invoice.status !== "Paid" ? (
                      <button
                        onClick={() => handleMarkPaid(invoice)}
                        disabled={markingPaid === invoice.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
                      >
                        <CheckCircle size={13} />
                        {markingPaid === invoice.id ? "..." : "Mark Paid"}
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                        <CheckCircle size={14} /> Paid
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
