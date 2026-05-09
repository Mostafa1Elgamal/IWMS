import { useState } from "react";
import { Download, Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const monthlyData = [
  { month: "Jan", revenue: 45000, expenses: 28000, profit: 17000 },
  { month: "Feb", revenue: 52000, expenses: 31000, profit: 21000 },
  { month: "Mar", revenue: 48000, expenses: 29000, profit: 19000 },
  { month: "Apr", revenue: 61000, expenses: 35000, profit: 26000 },
  { month: "May", revenue: 55000, expenses: 33000, profit: 22000 },
];

const expenseBreakdown = [
  { category: "Materials", amount: 18000 },
  { category: "Labor", amount: 12000 },
  { category: "Overhead", amount: 5000 },
  { category: "Equipment", amount: 3000 },
  { category: "Utilities", amount: 2000 },
];

const quarterlyData = [
  { quarter: "Q1 2025", revenue: 145000, expenses: 88000, profit: 57000 },
  { quarter: "Q2 2025", revenue: 168000, expenses: 99000, profit: 69000 },
  { quarter: "Q3 2025", revenue: 152000, expenses: 92000, profit: 60000 },
  { quarter: "Q4 2025", revenue: 176000, expenses: 103000, profit: 73000 },
];

export function FinancialReports() {
  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [reportType, setReportType] = useState("all");

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="p-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900">
              Financial Reports
            </h2>
            <p className="text-gray-600 mt-1">
              Analyze your financial performance and trends
            </p>
          </div>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="period" className="mb-2 block">
                  Report Period
                </Label>
                <Select value={reportPeriod} onValueChange={setReportPeriod}>
                  <SelectTrigger id="period">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="type" className="mb-2 block">
                  Report Type
                </Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reports</SelectItem>
                    <SelectItem value="profit">Profit & Loss</SelectItem>
                    <SelectItem value="expenses">Expenses</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {(reportType === "all" || reportType === "profit") && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart
                  data={
                    reportPeriod === "quarterly" ? quarterlyData : monthlyData
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey={reportPeriod === "quarterly" ? "quarter" : "month"}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stackId="2"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                    name="Expenses"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stackId="3"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                    name="Profit"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {(reportType === "all" || reportType === "revenue") && (
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {(reportType === "all" || reportType === "expenses") && (
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={expenseBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="category" type="category" width={100} />
                    <Tooltip
                      formatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Bar dataKey="amount" fill="#f59e0b" name="Amount" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-900">
                  Total Revenue
                </p>
                <p className="text-2xl font-semibold text-green-600 mt-2">
                  $261,000
                </p>
                <p className="text-xs text-green-700 mt-1">YTD 2026</p>
              </div>
              <div className="p-6 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-900">
                  Total Expenses
                </p>
                <p className="text-2xl font-semibold text-red-600 mt-2">
                  $156,000
                </p>
                <p className="text-xs text-red-700 mt-1">YTD 2026</p>
              </div>
              <div className="p-6 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Net Profit</p>
                <p className="text-2xl font-semibold text-blue-600 mt-2">
                  $105,000
                </p>
                <p className="text-xs text-blue-700 mt-1">40.2% margin</p>
              </div>
              <div className="p-6 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-900">
                  Avg. Monthly Profit
                </p>
                <p className="text-2xl font-semibold text-purple-600 mt-2">
                  $21,000
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  Based on 5 months
                </p>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b-2">
                  <tr className="text-left">
                    <th className="pb-2 font-semibold">Period</th>
                    <th className="pb-2 font-semibold text-right">Revenue</th>
                    <th className="pb-2 font-semibold text-right">Expenses</th>
                    <th className="pb-2 font-semibold text-right">Profit</th>
                    <th className="pb-2 font-semibold text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((data) => (
                    <tr key={data.month} className="border-b">
                      <td className="py-3">{data.month} 2026</td>
                      <td className="py-3 text-right text-green-600 font-medium">
                        ${data.revenue.toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-red-600 font-medium">
                        ${data.expenses.toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-blue-600 font-semibold">
                        ${data.profit.toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        {((data.profit / data.revenue) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
