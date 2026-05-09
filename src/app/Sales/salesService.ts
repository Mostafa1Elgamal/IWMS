import apiClient from "../api/client";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  note: string;
  orders: number;
  totalSpent: number;
  lastOrder: string;
  status: string;
}

export interface FollowUp {
  id: string;
  customer: string;
  customerId: string;
  lastContact: string;
  nextFollowUp: string;
  status: "Scheduled" | "Pending" | "Overdue" | "Completed";
  notes: string;
  method: "Phone" | "Email" | "Meeting" | "Other";
  customerPhone?: string;
}

export interface Order {
  id: string;
  customerName: string;
  date: string;
  total: number;
  status: "Pending" | "Processing" | "Ready" | "Delivered" | "Cancelled";
  items: number;
}

export const getCustomers = async (): Promise<Customer[]> => {
  const [customersRes, ordersRes] = await Promise.all([
    apiClient.get("/customer"),
    apiClient.get("/job-orders")
  ]);
  
  const orders = ordersRes.data;

  return customersRes.data.map((c: any) => {
    const custOrders = orders.filter((o: any) => (o.customer?.name === c.name) || (o.customer?._id === c._id));
    const totalSpent = custOrders.reduce((sum: number, o: any) => sum + (o.totalCost || 0), 0);

    return {
      id: c._id,
      name: c.name,
      phone: c.number,
      address: c.address || "N/A",
      note: c.note || "",
      orders: c.orderHistory?.length || custOrders.length || 0,
      totalSpent,
      lastOrder: new Date(c.updatedAt).toLocaleDateString(),
      status: (c.orderHistory?.length > 5 || custOrders.length > 5) ? "VIP" : ((c.orderHistory?.length > 0 || custOrders.length > 0) ? "Active" : "Inactive")
    };
  });
};

export const getOrders = async (): Promise<Order[]> => {
  const response = await apiClient.get("/job-orders");
  return response.data.map((o: any) => ({
    id: o._id,
    customerName: o.customer?.name || "Unknown",
    date: o.createdAt,
    total: o.totalCost || 0,
    status: o.status,
    items: o.materialsUsed?.length || 0,
    product: o.product || "Custom Job",
    deliveryDate: new Date(o.deliveryDate || o.createdAt).toLocaleDateString()
  }));
};

export const getOrderById = async (id: string) => {
  const response = await apiClient.get(`/job-orders/${id}`);
  return response.data;
};

export const createOrder = async (orderData: any) => {
  const response = await apiClient.post("/job-orders", orderData);
  return response.data;
};

export const updateOrder = async (id: string, orderData: any) => {
  const response = await apiClient.put(`/job-orders/${id}`, orderData);
  return response.data;
};

export const updateOrderStatus = async (id: string, status: string) => {
  const response = await apiClient.patch(`/job-orders/${id}/status`, { status });
  return response.data;
};

export const confirmDelivery = async (id: string, data: {
  paymentAmount?: number;
  paymentMethod?: string;
  notes?: string;
}) => {
  const response = await apiClient.post(`/job-orders/${id}/deliver`, data);
  return response.data;
};

export const deleteOrder = async (id: string) => {
  const response = await apiClient.delete(`/job-orders/${id}`);
  return response.data;
};

export const createCustomer = async (customerData: any) => {
  const response = await apiClient.post("/customer", customerData);
  return response.data;
};

export const updateCustomer = async (id: string, customerData: any) => {
  const response = await apiClient.patch(`/customer/${id}`, customerData);
  return response.data;
};

export const deleteCustomer = async (id: string) => {
  const response = await apiClient.delete(`/customer/${id}`);
  return response.data;
};

export const getFollowUps = async (): Promise<FollowUp[]> => {
  const response = await apiClient.get("/follow-ups");
  return response.data.map((f: any) => ({
    id: f._id,
    customer: f.customer?.name || "Unknown",
    customerId: f.customer?._id,
    customerPhone: f.customer?.number,
    lastContact: new Date(f.lastContact).toLocaleDateString(),
    nextFollowUp: new Date(f.nextFollowUp).toLocaleDateString(),
    status: f.status,
    notes: f.notes,
    method: f.method
  }));
};

export const createFollowUp = async (data: any) => {
  const response = await apiClient.post("/follow-ups", data);
  return response.data;
};

export const updateFollowUp = async (id: string, data: any) => {
  const response = await apiClient.patch(`/follow-ups/${id}`, data);
  return response.data;
};

export const getInvoices = async () => {
  const response = await apiClient.get("/invoices");
  return response.data;
};

export const addExtraCharge = async (id: string, extraCharge: number, chargeDescription: string) => {
  const response = await apiClient.patch(`/invoices/${id}/extra-charge`, { extraCharge, chargeDescription });
  return response.data;
};

export const getSalesSummary = async () => {
  const [orders, customers] = await Promise.all([
    getOrders(),
    getCustomers()
  ]);
  
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  
  return {
    totalOrders: orders.length,
    totalCustomers: customers.length,
    totalRevenue,
    recentOrders: orders.slice(0, 5),
    topCustomers: customers.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 3)
  };
};
