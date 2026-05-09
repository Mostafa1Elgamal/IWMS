import apiClient from "../api/client";

export const scanJob = async (jobOrderId: string, workstation: string, action: 'start' | 'complete') => {
  const response = await apiClient.post("/production/scan", {
    jobOrderId,
    workstation,
    action,
  });
  return response.data;
};

export const getProductionLogs = async (jobOrderId: string) => {
  const response = await apiClient.get(`/production/logs/${jobOrderId}`);
  return response.data;
};
