import apiClient from "./client";

export interface Workstation {
  id: string;
  name: string;
  status: string;
  currentJob: string | null;
  operator: string;
  progress: number;
  efficiency: number;
  timeRemaining: string;
}

export interface RecentCompletion {
  order: string;
  product: string;
  completedAt: string;
  quality: string;
}

export interface ProductionDashboardData {
  workstations: Workstation[];
  stats: {
    activeJobs: number;
    efficiency: number;
    totalTime: string;
    completedToday: number;
  };
  recentCompletions: RecentCompletion[];
}

export const getProductionDashboard = async (): Promise<ProductionDashboardData> => {
  const response = await apiClient.get("/production/dashboard");
  const data = response.data;
  
  // Create an array of our default 7 workstations
  const allStations = [
    { id: "1", name: 'Cutting Station #1', status: 'Idle', currentJob: null, operator: 'Available', progress: 0, efficiency: 95, timeRemaining: '-' },
    { id: "2", name: 'Cutting Station #2', status: 'Idle', currentJob: null, operator: 'Available', progress: 0, efficiency: 95, timeRemaining: '-' },
    { id: "3", name: 'Polishing Station #1', status: 'Idle', currentJob: null, operator: 'Available', progress: 0, efficiency: 95, timeRemaining: '-' },
    { id: "4", name: 'Polishing Station #2', status: 'Idle', currentJob: null, operator: 'Available', progress: 0, efficiency: 95, timeRemaining: '-' },
    { id: "5", name: 'Assembly Station #1', status: 'Idle', currentJob: null, operator: 'Available', progress: 0, efficiency: 95, timeRemaining: '-' },
    { id: "6", name: 'Assembly Station #2', status: 'Idle', currentJob: null, operator: 'Available', progress: 0, efficiency: 95, timeRemaining: '-' },
    { id: "7", name: 'Quality Check Station', status: 'Idle', currentJob: null, operator: 'Available', progress: 0, efficiency: 95, timeRemaining: '-' }
  ];

  // Map active logs to the workstations
  data.activeLogs?.forEach((log: any) => {
    // Find matching workstation by name (e.g. log.workstation = 'cutting')
    const ws = allStations.find(s => s.name.toLowerCase().includes(log.workstation.toLowerCase()) && s.status === 'Idle');
    if (ws) {
      ws.status = 'Busy';
      ws.currentJob = log.jobOrder?._id || "Unknown Job";
      ws.operator = log.technician?.name || "Unknown Technician";
      ws.progress = Math.floor(Math.random() * 80) + 10; // Mock progress since backend doesn't store exact %
      ws.efficiency = 92;
      ws.timeRemaining = 'In Progress';
    }
  });

  const recentCompletions = data.completedToday?.map((log: any) => ({
    order: log.jobOrder?._id || "Unknown Job",
    product: log.jobOrder?.productDetails || "Unknown Product",
    completedAt: new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    quality: 'Passed'
  })) || [];

  return {
    workstations: allStations,
    stats: {
      activeJobs: data.stats?.activeJobs || 0,
      efficiency: data.stats?.efficiency || 90,
      totalTime: 'N/A', // Require calculation from logs
      completedToday: data.stats?.completedTodayCount || 0
    },
    recentCompletions
  };
};
