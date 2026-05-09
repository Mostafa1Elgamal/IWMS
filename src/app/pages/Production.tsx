import { useState, useEffect } from "react";
import { Activity, Zap, Clock, CheckCircle } from "lucide-react";
import * as Progress from "@radix-ui/react-progress";
import { getProductionDashboard, ProductionDashboardData } from "../api/productionService";
import { toast } from "sonner";

export function Production() {
  const [data, setData] = useState<ProductionDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const dashboardData = await getProductionDashboard();
      setData(dashboardData);
    } catch (error) {
      console.error("Failed to fetch production dashboard:", error);
      toast.error("Failed to load live production data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return <div className="p-8 text-center">Loading production data...</div>;
  }

  const productionStats = [
    { label: 'Active Jobs', value: data.stats.activeJobs.toString(), icon: Activity, color: 'blue' },
    { label: 'Avg Efficiency', value: `${data.stats.efficiency}%`, icon: Zap, color: 'green' },
    { label: 'Total Time', value: data.stats.totalTime, icon: Clock, color: 'orange' },
    { label: 'Completed Today', value: data.stats.completedToday.toString(), icon: CheckCircle, color: 'emerald' },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Production Monitoring</h1>
        <p className="text-gray-500 mt-1">Real-time tracking of workshop production activities</p>
      </div>

      {/* Production Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {productionStats.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            orange: 'bg-orange-100 text-orange-600',
            emerald: 'bg-emerald-100 text-emerald-600',
          }[stat.color];

          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${colorClasses} rounded-lg flex items-center justify-center`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Workstations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.workstations.map((station) => (
          <div key={station.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{station.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Operator: {station.operator}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                station.status === 'Busy'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {station.status}
              </span>
            </div>

            {station.currentJob ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Current Job:</p>
                  <p className="font-medium text-gray-900">{station.currentJob}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-semibold text-gray-900">{station.progress}%</span>
                  </div>
                  <Progress.Root className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
                    <Progress.Indicator
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${station.progress}%` }}
                    />
                  </Progress.Root>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-gray-500">Efficiency</p>
                    <p className="text-lg font-semibold text-gray-900">{station.efficiency}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Time Remaining</p>
                    <p className="text-lg font-semibold text-gray-900">{station.timeRemaining}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-400">No active job</p>
                <p className="text-sm text-gray-500 mt-1">Station ready for work</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent Completions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Completions</h2>
          <p className="text-sm text-gray-500 mt-1">Jobs completed today</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.recentCompletions.length > 0 ? data.recentCompletions.map((completion, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{completion.order}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{completion.product}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{completion.completedAt}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {completion.quality}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No jobs completed today yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
