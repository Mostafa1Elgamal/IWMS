import { useState, useEffect } from "react";
import { Package, AlertTriangle, CheckCircle, XCircle, Download } from "lucide-react";
import { getInventory, Material } from "../api/inventoryService";
import { toast } from "sonner";
import { createPurchaseOrder } from "../api/purchaseOrderService";

export function Inventory() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPOModal, setShowPOModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [poForm, setPoForm] = useState({
    supplierName: "", material: "", quantity: "", unitPrice: "", notes: ""
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const data = await getInventory();
      setMaterials(data);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      toast.error("Failed to load inventory data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poForm.supplierName || !poForm.material || !poForm.quantity || !poForm.unitPrice) {
      toast.error("Please fill all required fields");
      return;
    }
    const qty = Number(poForm.quantity);
    const price = Number(poForm.unitPrice);
    if (qty <= 0 || price < 0) {
      toast.error("Quantity must be greater than 0 and price cannot be negative");
      return;
    }
    try {
      setIsSubmitting(true);
      await createPurchaseOrder({
        supplierName: poForm.supplierName,
        material: poForm.material,
        quantity: qty,
        unitPrice: price,
        totalPrice: qty * price,
        notes: poForm.notes
      });
      toast.success("Purchase Order created successfully");
      setShowPOModal(false);
      setPoForm({ supplierName: "", material: "", quantity: "", unitPrice: "", notes: "" });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create PO");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inventorySummary = [
    { label: 'Total Materials', value: materials.length.toString(), color: 'blue' },
    { label: 'Low Stock Items', value: materials.filter(m => m.status === 'Low Stock').length.toString(), color: 'orange' },
    { label: 'Out of Stock', value: materials.filter(m => m.status === 'Out of Stock').length.toString(), color: 'red' },
    { label: 'Well Stocked', value: materials.filter(m => m.status === 'Available').length.toString(), color: 'green' },
  ];

  const alerts = materials
    .filter(m => m.status === 'Low Stock' || m.status === 'Out of Stock')
    .map(m => ({
      severity: m.status === 'Out of Stock' ? 'critical' : 'warning',
      message: m.status === 'Out of Stock' ? `${m.type} is OUT OF STOCK - Reorder immediately` : `${m.type} is below minimum stock level (${m.quantity} remaining)`,
      material: m.type
    }));

  if (isLoading) {
    return <div className="p-8 text-center">Loading inventory...</div>;
  }

  const exportInventoryCSV = () => {
    if (materials.length === 0) return;
    const rows = [
      ["Material Type", "Current Qty", "Min Stock", "Max Stock", "Status", "Location", "Last Updated"],
      ...materials.map(m => [
        m.type,
        m.quantity.toString(),
        m.minStock.toString(),
        m.maxStock.toString(),
        m.status,
        m.location,
        m.lastUpdated
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Inventory_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Inventory exported");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Monitoring</h1>
          <p className="text-gray-500 mt-1">Track and manage workshop materials and supplies</p>
        </div>
        <button onClick={exportInventoryCSV} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition-colors">
          <Download size={18} /> Export Inventory
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {inventorySummary.map((item) => {
          const colorClasses = {
            blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
            orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
            red: { bg: 'bg-red-100', text: 'text-red-600' },
            green: { bg: 'bg-green-100', text: 'text-green-600' },
          }[item.color];

          return (
            <div key={item.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{item.value}</p>
                </div>
                <div className={`w-12 h-12 ${colorClasses.bg} rounded-lg flex items-center justify-center`}>
                  <Package className={colorClasses.text} size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts Panel */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="text-orange-500" size={20} />
          Inventory Alerts
        </h2>
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                alert.severity === 'critical'
                  ? 'bg-red-50 border-red-500'
                  : 'bg-yellow-50 border-yellow-500'
              }`}
            >
              <div className="flex items-start gap-3">
                {alert.severity === 'critical' ? (
                  <XCircle className="text-red-600 mt-0.5" size={20} />
                ) : (
                  <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    alert.severity === 'critical' ? 'text-red-800' : 'text-yellow-800'
                  }`}>
                    {alert.message}
                  </p>
                  <button 
                    onClick={() => {
                      setPoForm(prev => ({ ...prev, material: alert.material }));
                      setShowPOModal(true);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 mt-1"
                  >
                    Create Purchase Order →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Materials Inventory</h2>
          <p className="text-sm text-gray-500 mt-1">Complete list of all materials in stock</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {materials.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{material.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`font-semibold ${
                      material.quantity === 0 ? 'text-red-600' :
                      material.quantity < material.minStock ? 'text-orange-600' :
                      'text-gray-900'
                    }`}>
                      {material.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.minStock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.maxStock}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      material.status === 'Available'
                        ? 'bg-green-100 text-green-800'
                        : material.status === 'Low Stock'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <span className="flex items-center gap-1">
                        {material.status === 'Available' && <CheckCircle size={12} />}
                        {material.status === 'Low Stock' && <AlertTriangle size={12} />}
                        {material.status === 'Out of Stock' && <XCircle size={12} />}
                        {material.status}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Order Modal */}
      {showPOModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Create Purchase Order</h3>
                <p className="text-sm text-gray-500 mt-0.5">Order low-stock materials</p>
              </div>
              <button onClick={() => setShowPOModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreatePO} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name <span className="text-red-500">*</span></label>
                <input value={poForm.supplierName} onChange={e => setPoForm(p => ({ ...p, supplierName: e.target.value }))} required
                  placeholder="e.g. Global Glass Supply"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material <span className="text-red-500">*</span></label>
                <select 
                  value={poForm.material} 
                  onChange={e => setPoForm(p => ({ ...p, material: e.target.value }))} 
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select a material...</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.type}>{m.type}</option>
                  ))}
                  <option value="other">New Material (Type below)</option>
                </select>
              </div>
              {poForm.material === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Material Name <span className="text-red-500">*</span></label>
                  <input 
                    required
                    onChange={e => setPoForm(p => ({ ...p, material: e.target.value }))}
                    placeholder="e.g. Mirror 5mm"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity <span className="text-red-500">*</span></label>
                  <input value={poForm.quantity} onChange={e => setPoForm(p => ({ ...p, quantity: e.target.value }))} required type="number" min="1"
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price ($) <span className="text-red-500">*</span></label>
                  <input value={poForm.unitPrice} onChange={e => setPoForm(p => ({ ...p, unitPrice: e.target.value }))} required type="number" min="0" step="0.01"
                    placeholder="e.g. 25.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {poForm.quantity && poForm.unitPrice && (
                <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm font-medium text-blue-700">
                  Estimated Total: ${(parseFloat(poForm.quantity) * parseFloat(poForm.unitPrice)).toFixed(2)}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={poForm.notes} onChange={e => setPoForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2} placeholder="Delivery instructions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPOModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                  {isSubmitting ? "Creating..." : "Place Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
