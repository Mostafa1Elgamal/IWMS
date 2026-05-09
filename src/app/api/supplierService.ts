import apiClient from "./client";

export interface Supplier {
  id: string;
  name: string;
  materials: string[];
  contact: string;
  email: string;
  location: string;
  rating: number;
  status: string;
  totalOrders: number;
  lastOrder: string;
  reliability: number;
}

export const getSuppliers = async (): Promise<Supplier[]> => {
  const response = await apiClient.get("/suppliers");
  return response.data.map((s: any) => ({
    id: s._id,
    name: s.name,
    materials: s.materials || [],
    contact: s.contact || '—',
    email: s.email || '—',
    location: s.location || '—',
    rating: s.rating || 5,
    status: s.status || 'Active',
    totalOrders: s.totalOrders || 0,
    lastOrder: s.lastOrder ? new Date(s.lastOrder).toLocaleDateString() : '—',
    reliability: s.reliability || 100,
  }));
};

export const createSupplier = async (supplierData: any) => {
  const response = await apiClient.post("/suppliers", supplierData);
  return response.data;
};
