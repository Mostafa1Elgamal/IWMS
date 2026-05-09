/** Export / sales order row used in Orders list and CSV export */
export interface SalesOrderRow {
  id: string | number;
  customer: string;
  customerPhone?: string;
  product: string;
  status: string;
  deliveryDate: string;
  totalDisplay: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  /** Stable token stored with the order for QR / scanning */
  qrReference?: string;
  /** Payload encoded in the QR (JSON) */
  qrPayload?: string;
}

function seedQrPayload(row: {
  id: number;
  qrReference: string;
  customer: string;
  product: string;
  quantity: number;
  unitPrice: number;
}): string {
  return JSON.stringify({
    v: 1,
    orderId: row.id,
    qrReference: row.qrReference,
    customer: row.customer,
    product: row.product,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
  });
}

export const SEED_SALES_ORDERS: SalesOrderRow[] = [
  {
    id: 1001,
    customer: "Emma Wilson",
    product: "Glass Partition",
    status: "Completed",
    deliveryDate: "2026-05-05",
    totalDisplay: "$3,450.00",
    quantity: 1,
    unitPrice: 3450,
    lineTotal: 3450,
    qrReference: "IWMS-QR-1001",
    qrPayload: seedQrPayload({
      id: 1001,
      qrReference: "IWMS-QR-1001",
      customer: "Emma Wilson",
      product: "Glass Partition",
      quantity: 1,
      unitPrice: 3450,
    }),
  },
  {
    id: 1002,
    customer: "David Lee",
    product: "Decorative Mirror",
    status: "In Progress",
    deliveryDate: "2026-05-08",
    totalDisplay: "$5,200.00",
    quantity: 1,
    unitPrice: 5200,
    lineTotal: 5200,
    qrReference: "IWMS-QR-1002",
    qrPayload: seedQrPayload({
      id: 1002,
      qrReference: "IWMS-QR-1002",
      customer: "David Lee",
      product: "Decorative Mirror",
      quantity: 1,
      unitPrice: 5200,
    }),
  },
  {
    id: 1003,
    customer: "Sarah Johnson",
    product: "Glass Door",
    status: "Pending",
    deliveryDate: "2026-05-10",
    totalDisplay: "$2,890.00",
    quantity: 1,
    unitPrice: 2890,
    lineTotal: 2890,
    qrReference: "IWMS-QR-1003",
    qrPayload: seedQrPayload({
      id: 1003,
      qrReference: "IWMS-QR-1003",
      customer: "Sarah Johnson",
      product: "Glass Door",
      quantity: 1,
      unitPrice: 2890,
    }),
  },
  {
    id: 1004,
    customer: "Michael Chen",
    product: "Window Installation",
    status: "In Progress",
    deliveryDate: "2026-05-07",
    totalDisplay: "$4,100.00",
    quantity: 1,
    unitPrice: 4100,
    lineTotal: 4100,
    qrReference: "IWMS-QR-1004",
    qrPayload: seedQrPayload({
      id: 1004,
      qrReference: "IWMS-QR-1004",
      customer: "Michael Chen",
      product: "Window Installation",
      quantity: 1,
      unitPrice: 4100,
    }),
  },
  {
    id: 1005,
    customer: "James Brown",
    product: "Custom Glass Table",
    status: "Delayed",
    deliveryDate: "2026-05-03",
    totalDisplay: "$6,780.00",
    quantity: 1,
    unitPrice: 6780,
    lineTotal: 6780,
    qrReference: "IWMS-QR-1005",
    qrPayload: seedQrPayload({
      id: 1005,
      qrReference: "IWMS-QR-1005",
      customer: "James Brown",
      product: "Custom Glass Table",
      quantity: 1,
      unitPrice: 6780,
    }),
  },
  {
    id: 1006,
    customer: "Lisa Anderson",
    product: "Glass Shelves",
    status: "Pending",
    deliveryDate: "2026-05-12",
    totalDisplay: "$1,950.00",
    quantity: 1,
    unitPrice: 1950,
    lineTotal: 1950,
    qrReference: "IWMS-QR-1006",
    qrPayload: seedQrPayload({
      id: 1006,
      qrReference: "IWMS-QR-1006",
      customer: "Lisa Anderson",
      product: "Glass Shelves",
      quantity: 1,
      unitPrice: 1950,
    }),
  },
  {
    id: 1007,
    customer: "Emma Wilson",
    product: "Glass Wall System",
    status: "Completed",
    deliveryDate: "2026-04-28",
    totalDisplay: "$8,340.00",
    quantity: 1,
    unitPrice: 8340,
    lineTotal: 8340,
    qrReference: "IWMS-QR-1007",
    qrPayload: seedQrPayload({
      id: 1007,
      qrReference: "IWMS-QR-1007",
      customer: "Emma Wilson",
      product: "Glass Wall System",
      quantity: 1,
      unitPrice: 8340,
    }),
  },
];
