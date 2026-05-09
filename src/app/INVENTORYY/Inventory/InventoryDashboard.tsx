import { useState, useEffect } from "react";
import { Package, AlertTriangle, Archive, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getInventorySummary } from "./inventoryService";

export function InventoryDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setIsLoading(true);
      const data = await getInventorySummary();
      setSummary(data);
    } catch (error) {
      console.error("Failed to fetch inventory summary", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !summary) {
    return <div className="p-8 text-center">Loading inventory data...</div>;
  }

  const categoryCounts = summary.materials.reduce((acc: any, m: any) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.entries(categoryCounts).map(([name, value], index) => ({
    name,
    value,
    color: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 5]
  }));

  const getEquivalentQuantity = (m: any) => {
    let eq = m.quantity;
    if (m.isSheet && m.sheetDimensions && m.availableCutOffsArea && m.availableCutOffsArea > 0) {
      const fullSheetArea = m.sheetDimensions.width * m.sheetDimensions.height;
      if (fullSheetArea > 0) {
        eq += m.availableCutOffsArea / fullSheetArea;
      }
    }
    return eq;
  };

  const stockData = [
    { 
      month: 'Current', 
      wood: summary.materials.filter((m: any) => m.category === 'Wood').reduce((s: number, m: any) => s + getEquivalentQuantity(m), 0), 
      metal: summary.materials.filter((m: any) => m.category === 'Metal').reduce((s: number, m: any) => s + getEquivalentQuantity(m), 0), 
      glass: summary.materials.filter((m: any) => m.category === 'Glass').reduce((s: number, m: any) => s + getEquivalentQuantity(m), 0) 
    }
  ];

  const usageData = [
    { week: 'Current', usage: summary.materials.reduce((s: number, m: any) => s + getEquivalentQuantity(m), 0) * 0.1 }, // Simplified usage metric
  ];

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-gray-900">Inventory Dashboard</h2>
          <p className="text-gray-600 mt-1">Overview of your workshop materials and stock levels</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Materials</p>
                  <p className="text-3xl font-semibold text-gray-900 mt-2">{summary.totalMaterials}</p>
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +0% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-3xl font-semibold text-gray-900 mt-2">{summary.lowStockCount}</p>
                  <p className="text-sm text-orange-600 mt-2">Needs reordering</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                  <p className="text-3xl font-semibold text-gray-900 mt-2">{summary.outOfStockCount}</p>
                  <p className="text-sm text-red-600 mt-2">Review required</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Archive className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-3xl font-semibold text-gray-900 mt-2">${(summary.totalValue / 1000).toFixed(1)}K</p>
                  <p className="text-sm text-gray-600 mt-2">Inventory worth</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Stock Levels by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stockData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="wood" fill="#8b5cf6" name="Wood" />
                  <Bar dataKey="metal" fill="#3b82f6" name="Metal" />
                  <Bar dataKey="glass" fill="#10b981" name="Glass" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Material Usage Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="usage" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
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
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Oak Wood added</p>
                    <p className="text-xs text-gray-600">Added 50 units - 2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Low stock alert</p>
                    <p className="text-xs text-gray-600">Steel plates - 3 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Material used</p>
                    <p className="text-xs text-gray-600">Walnut - 20 units for WO-2024-001 - 5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Supplier update</p>
                    <p className="text-xs text-gray-600">Glass sheets reordered - Yesterday</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Dead stock identified</p>
                    <p className="text-xs text-gray-600">Pine boards - 2 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
