import apiClient from "../../api/client";

export interface Material {
  id: string;
  name: string;
  category: string;
  quantity: number;
  available: number;
  reserved: number;
  status: "Available" | "Low" | "Out of Stock" | "Cut Off";
  supplier: string;
  commercialPrice: number;
  customerPrice: number;
  isActive: boolean;
  lastUpdated: string;
  isSheet?: boolean;
  sheetDimensions?: { height: number; width: number };
  availableCutOffsCount?: number;
  availableCutOffsArea?: number;
}

export interface CutOff {
  id: string;
  material: string;
  materialId?: string;
  width: number;
  height: number;
  thickness: number;
  status: "Available" | "Reserved" | "Used";
  location: string;
  createdDate: string;
}

export const getMaterials = async (): Promise<Material[]> => {
  const response = await apiClient.get("/inventory/materials");
  return response.data.map((m: any) => ({
    id: m._id,
    name: m.name,
    category: m.type || "Uncategorized",
    quantity: m.quantity_in_stock,
    available: m.quantity_in_stock, // For now, assume available = total
    reserved: 0,
    status: (m.quantity_in_stock === 0 && (!m.availableCutOffsArea || m.availableCutOffsArea === 0)) ? "Out of Stock" : (m.lowStock ? "Low" : "Available"),
    supplier: m.supplier_name || "Unknown",
    commercialPrice: m.commercial_price || m.cost_per_unit || 0,
    customerPrice: m.customer_price || m.cost_per_unit || 0,
    isActive: true,
    lastUpdated: new Date(m.updatedAt).toLocaleDateString(),
    isSheet: !!m.sheetDimensions?.height,
    sheetDimensions: m.sheetDimensions,
    availableCutOffsCount: m.availableCutOffsCount || 0,
    availableCutOffsArea: m.availableCutOffsArea || 0
  }));
};

export const getCutOffs = async (): Promise<CutOff[]> => {
  const response = await apiClient.get("/inventory/cutoffs");
  return response.data.map((c: any) => ({
    id: c._id,
    material: c.material?.name || "Unknown",
    materialId: c.material?._id,
    width: c.dimensions?.width || 0,
    height: c.dimensions?.height || 0,
    thickness: c.dimensions?.thickness || 0,
    status: c.status === 'used' ? 'Used' : 'Available',
    location: "Workshop Floor",
    createdDate: new Date(c.createdAt).toLocaleDateString()
  }));
};

export const addMaterial = async (materialData: any) => {
  const response = await apiClient.post("/inventory/materials", materialData);
  return response.data;
};

export const updateMaterial = async (id: string, materialData: any) => {
  const response = await apiClient.put(`/inventory/materials/${id}`, materialData);
  return response.data;
};

export const deleteMaterial = async (id: string) => {
  const response = await apiClient.delete(`/inventory/materials/${id}`);
  return response.data;
};

export const getInventorySummary = async () => {
  const materials = await getMaterials();
  const lowStockCount = materials.filter(m => m.status === "Low").length;
  const outOfStockCount = materials.filter(m => m.status === "Out of Stock").length;
  
  const totalValue = materials.reduce((sum, m) => {
    let baseValue = m.quantity * m.commercialPrice;
    if (m.isSheet && m.sheetDimensions && m.availableCutOffsArea && m.availableCutOffsArea > 0) {
      const fullSheetArea = m.sheetDimensions.width * m.sheetDimensions.height;
      if (fullSheetArea > 0) {
        baseValue += (m.availableCutOffsArea / fullSheetArea) * m.commercialPrice;
      }
    }
    return sum + baseValue;
  }, 0);
  
  return {
    totalMaterials: materials.length,
    lowStockCount,
    outOfStockCount,
    totalValue,
    materials
  };
};

export const createCutOff = async (cutOffData: any) => {
  const response = await apiClient.post("/inventory/cutoffs", cutOffData);
  return response.data;
};

export const updateCutOffStatus = async (id: string, status: string) => {
  const response = await apiClient.patch(`/inventory/cutoffs/${id}/status`, { status });
  return response.data;
};
