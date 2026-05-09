import type { SalesOrderRow } from "./salesOrderTypes";

function escapeCsvCell(value: unknown): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Excel-friendly CSV (UTF-8 BOM) with full order fields from app state */
export function downloadSalesOrdersExport(orders: SalesOrderRow[], filename = "export-orders.csv") {
  if (orders.length === 0) return;

  const rows = orders.map((o) => ({
    orderId: o.id,
    customer: o.customer,
    customerPhone: o.customerPhone ?? "",
    product: o.product,
    status: o.status,
    deliveryDate: o.deliveryDate,
    totalDisplay: o.totalDisplay,
    quantity: o.quantity ?? "",
    unitPrice: o.unitPrice ?? "",
    lineTotal: o.lineTotal ?? "",
    qrReference: o.qrReference ?? "",
    qrPayload: o.qrPayload ?? "",
  }));

  const keys = Object.keys(rows[0]) as (keyof (typeof rows)[0])[];
  const header = keys.map((k) => escapeCsvCell(k)).join(",");
  const body = rows.map((r) => keys.map((k) => escapeCsvCell(r[k])).join(",")).join("\r\n");
  const csv = `\ufeff${header}\r\n${body}`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
