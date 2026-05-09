import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Package,
  CheckCircle,
  DollarSign,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getDashboardData, type DashboardData } from "../api/reportService";
import { getOrders } from "../Sales/salesService";

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [stats, orders] = await Promise.all([
          getDashboardData(),
          getOrders()
        ]);
        setDashboardData(stats);
        setRecentOrders(orders.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading || !dashboardData) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  const kpis = [
    {
      title: "Total Revenue",
      value: `$${dashboardData.totalRevenue.toLocaleString()}`,
      change: "+12%",
      icon: <DollarSign className="w-6 h-6 text-green-600" />,
      bg: "bg-green-100",
    },
    {
      title: "Active Orders",
      value: dashboardData.inProgress.toString(),
      change: "+5",
      icon: <ShoppingCart className="w-6 h-6 text-blue-600" />,
      bg: "bg-blue-100",
    },
    {
      title: "Completed Jobs",
      value: dashboardData.completed.toString(),
      change: "+18%",
      icon: <CheckCircle className="w-6 h-6 text-purple-600" />,
      bg: "bg-purple-100",
    },
    {
      title: "Stock Alerts",
      value: dashboardData.lowStockAlerts.length.toString(),
      change: "-2",
      icon: <AlertTriangle className="w-6 h-6 text-orange-600" />,
      bg: "bg-orange-100",
    },
  ];

  const ordersData = [
    { month: "Current", orders: dashboardData.totalOrders, revenue: dashboardData.totalRevenue },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">
          Welcome back! Here's what's happening in your workshop today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${kpi.bg}`}>{kpi.icon}</div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                {kpi.change}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-medium">{kpi.title}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {kpi.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Production & Revenue
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#3b82f6" name="Total Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Orders
            </h3>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-700">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-medium">
                    {order.customerName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-gray-500">{order.id.substring(0, 8)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      order.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {order.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{new Date(order.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Active Alerts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardData.lowStockAlerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border flex items-start gap-3 bg-orange-50 border-orange-100`}
            >
              <AlertTriangle className={`w-5 h-5 mt-0.5 text-orange-500`} />
              <div>
                <p className={`text-sm font-medium text-orange-800`}>
                  Low Stock Alert
                </p>
                <p className={`text-xs mt-1 text-orange-700`}>
                  {alert.name} - Only {alert.quantity} units remaining
                </p>
              </div>
            </div>
          ))}
          {dashboardData.lowStockAlerts.length === 0 && (
            <p className="text-sm text-gray-500 italic">No active alerts at this time.</p>
          )}
        </div>
      </div>
    </div>
  );
}
