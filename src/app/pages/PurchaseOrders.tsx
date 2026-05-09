import { useState, useEffect } from "react";
import { ShoppingCart, CheckCircle, Clock, XCircle, FileText, Download } from "lucide-react";
import { getPurchaseOrders, updatePurchaseOrderStatus, type PurchaseOrder } from "../api/purchaseOrderService";
import { toast } from "sonner";

export function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPOs();
  }, []);

  const fetchPOs = async () => {
    try {
      setIsLoading(true);
      const data = await getPurchaseOrders();
      setPurchaseOrders(data);
    } catch (error) {
      console.error("Failed to fetch purchase orders:", error);
      toast.error("Failed to load purchase orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      await updatePurchaseOrderStatus(id, newStatus);
      toast.success(`Purchase order status updated to ${newStatus}`);
      fetchPOs();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500">Loading purchase orders...</p>
        </div>
      </div>
    );
  }

  const summary = [
    { label: "Total Orders", value: purchaseOrders.length.toString(), color: "blue", icon: FileText },
    { label: "Pending", value: purchaseOrders.filter(po => po.status === "Pending").length.toString(), color: "orange", icon: Clock },
    { label: "Received", value: purchaseOrders.filter(po => po.status === "Received").length.toString(), color: "green", icon: CheckCircle },
    { label: "Cancelled", value: purchaseOrders.filter(po => po.status === "Cancelled").length.toString(), color: "red", icon: XCircle },
  ];

  const exportPOsCSV = () => {
    if (purchaseOrders.length === 0) return;
    const rows = [
      ["PO Number", "Supplier", "Material", "Qty", "Total ($)", "Status"],
      ...purchaseOrders.map(po => [
        po._id.slice(-6).toUpperCase(),
        po.supplierName,
        po.material,
        po.quantity.toString(),
        po.totalPrice.toString(),
        po.status
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PurchaseOrders_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Purchase orders exported");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-500 mt-1">Manage material requests and supplier orders</p>
        </div>
        <button onClick={exportPOsCSV} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition-colors">
          <Download size={18} /> Export POs
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {summary.map((item) => {
          const Icon = item.icon;
          const colors: any = {
            blue: { bg: "bg-blue-100", text: "text-blue-600" },
            orange: { bg: "bg-orange-100", text: "text-orange-600" },
            green: { bg: "bg-green-100", text: "text-green-600" },
            red: { bg: "bg-red-100", text: "text-red-600" },
          };
          const c = colors[item.color];
          
          return (
            <div key={item.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{item.value}</p>
                </div>
                <div className={`w-12 h-12 ${c.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={c.text} size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">All Purchase Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total ($)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                    No purchase orders found
                  </td>
                </tr>
              ) : purchaseOrders.map((po) => (
                <tr key={po._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                    #{po._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{po.supplierName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{po.material}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{po.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${po.totalPrice.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      po.status === 'Received' ? 'bg-green-100 text-green-800' :
                      po.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      po.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {po.status === 'Pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateStatus(po._id, 'Approved')}
                          disabled={updatingId === po._id}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(po._id, 'Cancelled')}
                          disabled={updatingId === po._id}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {po.status === 'Approved' && (
                      <button
                        onClick={() => handleUpdateStatus(po._id, 'Received')}
                        disabled={updatingId === po._id}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 flex items-center gap-1"
                      >
                        <CheckCircle size={14} /> Mark Received
                      </button>
                    )}
                    {po.status === 'Received' && <span className="text-gray-400 text-xs">Completed</span>}
                    {po.status === 'Cancelled' && <span className="text-gray-400 text-xs">Cancelled</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
