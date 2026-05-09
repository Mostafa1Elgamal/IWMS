import apiClient from "./client";

export interface Material {
  id: string;
  type: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  status: string;
  location: string;
  lastUpdated: string;
}

export const getInventory = async (): Promise<Material[]> => {
  const response = await apiClient.get("/inventory/materials");
  return response.data.map((m: any) => ({
    id: m._id,
    type: m.name || m.materialType || "Unknown Material",
    quantity: m.quantity_in_stock || 0,
    minStock: m.min_threshold || 10,
    maxStock: 100, // Or m.max_threshold if backend has it
    status: (m.quantity_in_stock || 0) <= 0 ? 'Out of Stock' : (m.lowStock ? 'Low Stock' : 'Available'),
    location: m.location || 'Warehouse',
    lastUpdated: new Date(m.updatedAt).toLocaleDateString()
  }));
};

export const addMaterial = async (materialData: any) => {
  const response = await apiClient.post("/inventory/materials", materialData);
  return response.data;
};
