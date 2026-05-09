import { useState, useEffect } from "react";
import { Search, Eye, Download, X, Package, Calendar, User, FileText } from "lucide-react";
import { getJobOrders, type JobOrder } from "../api/jobOrderService";
import apiClient from "../api/client";
import { toast } from "sonner";

export function Orders() {
  const [filter, setFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [allOrders, setAllOrders] = useState<JobOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const data = await getJobOrders();
      setAllOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  const exportOrdersCSV = () => {
    const rows = [
      ["Order ID", "Customer", "Product", "Quantity", "Value", "Status", "Delivery Date"],
      ...filteredOrders.map(o => [
        o.id.slice(-6).toUpperCase(),
        o.customer,
        o.product,
        o.quantity.toString(),
        o.value,
        o.status,
        o.deliveryDate
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Orders_${filter}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredOrders.length} orders`);
  };


  const handleViewOrder = async (orderId: string) => {
    try {
      setIsLoadingDetail(true);
      setSelectedOrder({ _loading: true });
      const response = await apiClient.get(`/job-orders/${orderId}`);
      setSelectedOrder(response.data);
    } catch (error) {
      toast.error("Failed to load order details");
      setSelectedOrder(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const filteredOrders = allOrders.filter((order) => {
    const matchesFilter = filter === "All" || order.status === filter;
    const matchesSearch =
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    All: allOrders.length,
    Pending: allOrders.filter((o) => o.status === "Pending").length,
    "In Progress": allOrders.filter((o) => o.status === "In Progress").length,
    Completed: allOrders.filter((o) => o.status === "Completed").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800";
      case "In Progress": case "cutting": case "polishing": case "engraving": case "assembly": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-500 mt-1">Manage and track all customer orders</p>
        </div>
        <button onClick={exportOrdersCSV} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition-colors">
          <Download size={18} /> Export Orders
        </button>
      </div>

      {/* Filter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(["All", "Pending", "In Progress", "Completed"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              filter === status ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <p className="text-sm text-gray-500">{status} Orders</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{statusCounts[status]}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by order ID, customer, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                    #{order.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.customer}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{order.product}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.value}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.deliveryDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleViewOrder(order.id)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition-colors"
                    >
                      <Eye size={16} /> View
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-400">No orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Order Details
                  {!selectedOrder._loading && <span className="ml-2 text-sm font-normal text-gray-500">#{selectedOrder._id?.slice(-6).toUpperCase()}</span>}
                </h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {selectedOrder._loading ? (
              <div className="p-12 text-center text-gray-400">Loading details...</div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Status Banner */}
                <div className={`px-4 py-3 rounded-lg ${getStatusColor(selectedOrder.status)} flex items-center justify-between`}>
                  <span className="font-semibold capitalize">{selectedOrder.status}</span>
                  <span className="text-sm">Created: {new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    <User size={15} /> Customer Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-gray-500">Name</p><p className="font-medium">{selectedOrder.customer?.name || 'Unknown'}</p></div>
                    <div><p className="text-gray-500">Phone</p><p className="font-medium">{selectedOrder.customer?.number || '—'}</p></div>
                    <div className="col-span-2"><p className="text-gray-500">Address</p><p className="font-medium">{selectedOrder.customer?.address || '—'}</p></div>
                  </div>
                </div>

                {/* Order Info */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    <Package size={15} /> Order Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-gray-500">Dimensions</p>
                      <p className="font-medium">
                        {selectedOrder.dimensions?.height && selectedOrder.dimensions?.width
                          ? `${selectedOrder.dimensions.height}cm × ${selectedOrder.dimensions.width}cm`
                          : '—'}
                      </p>
                    </div>
                    <div><p className="text-gray-500">Delivery Date</p>
                      <p className="font-medium">{selectedOrder.deliveryDate ? new Date(selectedOrder.deliveryDate).toLocaleDateString() : '—'}</p>
                    </div>
                    <div><p className="text-gray-500">Total Cost</p>
                      <p className="font-semibold text-gray-900">${selectedOrder.totalCost?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div><p className="text-gray-500">Created By</p>
                      <p className="font-medium">{selectedOrder.createdBy?.name || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Materials Used */}
                {selectedOrder.materialsUsed?.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                      <FileText size={15} /> Materials Used
                    </h4>
                    <div className="space-y-2">
                      {selectedOrder.materialsUsed.map((m: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-gray-200 text-sm">
                          <span className="font-medium">{m.material?.name || 'Material'}</span>
                          <span className="text-gray-600">Qty: {m.quantity}</span>
                          {m.cutOffUsed?.length > 0 && (
                            <span className="text-blue-600 text-xs">{m.cutOffUsed.length} cut-off(s) used</span>
                          )}
                          {m.mainStockDeducted > 0 && (
                            <span className="text-orange-600 text-xs">{m.mainStockDeducted} from main stock</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="bg-yellow-50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-2">Notes</h4>
                    <p className="text-sm text-yellow-700">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
