import apiClient from "./client";

export interface JobOrder {
  id: string;
  customer: string;
  product: string;
  quantity: number;
  status: string;
  deliveryDate: string;
  value: string;
}

export const getJobOrders = async (): Promise<JobOrder[]> => {
  const response = await apiClient.get("/job-orders");
  return response.data.map((order: any) => ({
    id: order._id,
    customer: order.customer?.name || "Unknown Customer",
    product: order.productDetails || "Unknown Product",
    quantity: order.materialsUsed?.reduce((sum: number, m: any) => sum + (m.quantity || 0), 0) || 1,
    status: mapStatus(order.status),
    deliveryDate: order.dueDate ? new Date(order.dueDate).toLocaleDateString() : "-",
    value: `$${(order.value || 0).toLocaleString()}`,
  }));
};

const mapStatus = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed': return 'Completed';
    case 'in-progress': return 'In Progress';
    case 'cancelled': return 'Cancelled';
    default: return 'Pending';
  }
};

export const createJobOrder = async (orderData: any) => {
  const response = await apiClient.post("/job-orders", orderData);
  return response.data;
};

export const updateJobOrderStatus = async (id: string, status: string) => {
  const response = await apiClient.patch(`/job-orders/${id}/status`, { status });
  return response.data;
};
