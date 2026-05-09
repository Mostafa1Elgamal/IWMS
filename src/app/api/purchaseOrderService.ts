import apiClient from "./client";

export interface PurchaseOrder {
  _id: string;
  supplierName: string;
  material: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string;
  status: string;
  createdAt: string;
}

export const createPurchaseOrder = async (poData: Partial<PurchaseOrder>) => {
  const response = await apiClient.post("/purchase-orders", poData);
  return response.data;
};

export const getPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  const response = await apiClient.get("/purchase-orders");
  return response.data;
};

export const updatePurchaseOrderStatus = async (id: string, status: string) => {
  const response = await apiClient.patch(`/purchase-orders/${id}/status`, { status });
  return response.data;
};
