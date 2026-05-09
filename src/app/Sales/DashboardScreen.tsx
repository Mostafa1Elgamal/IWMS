import { useState, useEffect } from "react";
import { TrendingUp, Users, ShoppingCart, DollarSign, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { getSalesSummary } from "./salesService";

interface DashboardScreenProps {
  onNavigate: (screen: string) => void;
}

export function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        const data = await getSalesSummary();
        setSummary(data);
      } catch (error) {
        console.error("Failed to fetch sales summary", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (isLoading || !summary) {
    return <div className="p-8 text-center">Loading sales dashboard...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome back!</h2>
        <p className="text-gray-600">Here's what's happening with your sales today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-semibold text-gray-900">${(summary.totalRevenue / 1000).toFixed(1)}K</p>
              <p className="text-sm text-green-600 mt-2">Based on completed jobs</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Orders</p>
              <p className="text-3xl font-semibold text-gray-900">{summary.totalOrders}</p>
              <p className="text-sm text-blue-600 mt-2">All time</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Customers</p>
              <p className="text-3xl font-semibold text-gray-900">{summary.totalCustomers}</p>
              <p className="text-sm text-purple-600 mt-2">Registered customers</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
              <p className="text-3xl font-semibold text-gray-900">
                {summary.totalCustomers > 0 ? Math.round((summary.totalOrders / summary.totalCustomers) * 100) : 0}%
              </p>
              <p className="text-sm text-orange-600 mt-2">Orders per customer</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-700" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {summary.recentOrders.map((order: any) => (
              <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">#{order.id.substring(0, 8)}</span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{order.customerName}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(order.date).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">${order.total.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => onNavigate('orders')}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Orders
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {summary.topCustomers.map((customer: any, index: number) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">{customer.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.orders} orders</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">${customer.totalSpent.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => onNavigate('customers')}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Customers
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-700" />
            </div>
            <h3 className="font-semibold text-gray-900">Orders in Progress</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900 mb-2">
            {summary.recentOrders.filter((o: any) => o.status === 'in-progress').length}
          </p>
          <p className="text-sm text-gray-600">Being processed currently</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-700" />
            </div>
            <h3 className="font-semibold text-gray-900">Pending Orders</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900 mb-2">
            {summary.recentOrders.filter((o: any) => o.status === 'pending').length}
          </p>
          <p className="text-sm text-gray-600">Awaiting production</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-700" />
            </div>
            <h3 className="font-semibold text-gray-900">Completed Recently</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900 mb-2">
            {summary.recentOrders.filter((o: any) => o.status === 'completed').length}
          </p>
          <p className="text-sm text-gray-600">Successfully delivered</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
            <p className="text-blue-100 text-sm mb-4">Start a new task to boost your productivity</p>
            <div className="flex gap-3">
              <button
                onClick={() => onNavigate('create-order')}
                className="px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
              >
                Create Order
              </button>
              <button
                onClick={() => onNavigate('customers')}
                className="px-4 py-2 bg-blue-700 text-white border border-blue-500 rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
              >
                Add Customer
              </button>
            </div>
          </div>
          <AlertCircle className="w-16 h-16 text-blue-400 opacity-50" />
        </div>
      </div>
    </div>
  );
}
