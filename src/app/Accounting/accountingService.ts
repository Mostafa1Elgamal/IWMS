import apiClient from "../api/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentStatus = "unpaid" | "partially-paid" | "paid";
export type PaymentMethod = "cash" | "vodafone_cash" | "card" | "bank_transfer";

export interface InvoicePayment {
  _id: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  notes: string;
  recordedBy?: { name: string; role: string };
}

export interface Invoice {
  id: string;
  orderId: string;
  customer: string;
  customerPhone?: string;
  amount: number;
  amountPaid: number;
  remaining: number;
  status: PaymentStatus;
  issueDate: string;
  dueDate?: string;
  payments: InvoicePayment[];
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  orderId: string;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  notes: string;
  recordedBy?: string;
}

export interface ActivityLogEntry {
  id: string;
  userName: string;
  userRole: string;
  actionType: string;
  targetType: string;
  description: string;
  metadata: any;
  createdAt: string;
}

export interface PaymentSummary {
  totalCollected: number;
  totalOutstanding: number;
  unpaidCount: number;
  byMethod: { _id: string; total: number; count: number }[];
}

// ─── Invoice API ──────────────────────────────────────────────────────────────

export const getInvoices = async (filters?: {
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Invoice[]> => {
  const params = new URLSearchParams();
  if (filters?.paymentStatus) params.append("paymentStatus", filters.paymentStatus);
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  
  const response = await apiClient.get(`/invoices?${params.toString()}`);
  return response.data.map((inv: any) => ({
    id: inv._id,
    orderId: inv.jobOrder?._id || "N/A",
    customer: inv.jobOrder?.customer?.name || "Unknown",
    customerPhone: inv.jobOrder?.customer?.number || "",
    amount: inv.amount,
    amountPaid: inv.amountPaid || 0,
    remaining: inv.remaining ?? Math.max(0, inv.amount - (inv.amountPaid || 0)),
    status: inv.paymentStatus,
    issueDate: inv.createdAt,
    dueDate: inv.dueDate,
    payments: (inv.payments || []).map((p: any) => ({
      _id: p._id,
      amount: p.amount,
      method: p.method,
      paidAt: p.paidAt,
      notes: p.notes,
      recordedBy: p.recordedBy
    })),
    notes: inv.notes
  }));
};

export const getInvoiceById = async (id: string) => {
  const response = await apiClient.get(`/invoices/${id}`);
  const inv = response.data;
  return {
    id: inv._id,
    orderId: inv.jobOrder?._id,
    customer: inv.jobOrder?.customer?.name || "Unknown",
    customerPhone: inv.jobOrder?.customer?.number || "",
    amount: inv.amount,
    amountPaid: inv.amountPaid || 0,
    remaining: inv.remaining ?? Math.max(0, inv.amount - (inv.amountPaid || 0)),
    status: inv.paymentStatus,
    issueDate: inv.createdAt,
    dueDate: inv.dueDate,
    payments: inv.payments || [],
    notes: inv.notes,
    auditLog: inv.auditLog || []
  };
};

export const generateInvoice = async (jobOrderId: string) => {
  const response = await apiClient.post("/invoices", { jobOrderId });
  return response.data;
};

export const addExtraCharge = async (invoiceId: string, extraCharge: number, chargeDescription: string) => {
  const response = await apiClient.patch(`/invoices/${invoiceId}/extra-charge`, { extraCharge, chargeDescription });
  return response.data;
};

export const markInvoicePaid = async (invoiceId: string) => {
  const response = await apiClient.patch(`/invoices/${invoiceId}/mark-paid`, {});
  return response.data;
};

// ─── Payment API ──────────────────────────────────────────────────────────────

export const recordPayment = async (data: {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
}) => {
  const response = await apiClient.post("/payments", data);
  return response.data;
};

export const getPayments = async (filters?: {
  method?: string;
  startDate?: string;
  endDate?: string;
  invoiceId?: string;
}): Promise<PaymentRecord[]> => {
  const params = new URLSearchParams();
  if (filters?.method) params.append("method", filters.method);
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.invoiceId) params.append("invoiceId", filters.invoiceId);

  const response = await apiClient.get(`/payments?${params.toString()}`);
  return response.data.map((p: any) => ({
    id: p._id,
    invoiceId: p.invoice?._id || p.invoice,
    orderId: p.invoice?.jobOrder?._id || p.jobOrder,
    customerName: p.invoice?.jobOrder?.customer?.name || "Unknown",
    amount: p.amount,
    method: p.method,
    paidAt: p.paidAt,
    notes: p.notes,
    recordedBy: p.recordedBy?.name || "—"
  }));
};

export const getPaymentSummary = async (): Promise<PaymentSummary> => {
  const response = await apiClient.get("/payments/summary");
  return response.data;
};

// ─── Activity Logs API ────────────────────────────────────────────────────────

export const getActivityLogs = async (filters?: {
  actionType?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
}): Promise<{ logs: ActivityLogEntry[]; total: number; pages: number }> => {
  const params = new URLSearchParams();
  if (filters?.actionType) params.append("actionType", filters.actionType);
  if (filters?.targetType) params.append("targetType", filters.targetType);
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.page) params.append("page", String(filters.page));

  const response = await apiClient.get(`/activity-logs?${params.toString()}`);
  return {
    logs: response.data.logs.map((l: any) => ({
      id: l._id,
      userName: l.userName || l.user?.name || "System",
      userRole: l.userRole || l.user?.role || "",
      actionType: l.actionType,
      targetType: l.targetType,
      description: l.description,
      metadata: l.metadata,
      createdAt: l.createdAt
    })),
    total: response.data.total,
    pages: response.data.pages
  };
};

// ─── Legacy compat ────────────────────────────────────────────────────────────
export const updatePayment = async (invoiceId: string, amountPaid: number) => {
  const response = await apiClient.patch(`/invoices/${invoiceId}/payment`, { amountPaid });
  return response.data;
};
