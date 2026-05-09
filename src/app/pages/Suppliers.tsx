import { useState, useEffect } from "react";
import {
  Truck, Phone, Mail, MapPin, Star, Plus, X,
  Package, AlertCircle, CheckCircle, ShoppingCart
} from "lucide-react";
import { getSuppliers, createSupplier, type Supplier } from "../api/supplierService";
import { createPurchaseOrder } from "../api/purchaseOrderService";
import { toast } from "sonner";

interface PurchaseOrderForm {
  supplierId: string;
  supplierName: string;
  material: string;
  quantity: string;
  unitPrice: string;
  notes: string;
}

export function Suppliers() {
  const [supplierData, setSupplierData] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addForm, setAddForm] = useState({
    name: "", materials: "", contact: "", email: "", location: "",
    rating: "5", reliability: "100",
  });

  const [poForm, setPoForm] = useState<PurchaseOrderForm>({
    supplierId: "", supplierName: "", material: "", quantity: "", unitPrice: "", notes: ""
  });

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const data = await getSuppliers();
      setSupplierData(data);
    } catch (error) {
      console.error("Failed to fetch suppliers", error);
      toast.error("Failed to load supplier data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name) { toast.error("Supplier name is required"); return; }
    try {
      setIsSubmitting(true);
      await createSupplier({
        name: addForm.name,
        materials: addForm.materials.split(",").map(m => m.trim()).filter(Boolean),
        contact: addForm.contact,
        email: addForm.email,
        location: addForm.location,
        rating: parseFloat(addForm.rating) || 5,
        reliability: parseFloat(addForm.reliability) || 100,
      });
      toast.success(`Supplier "${addForm.name}" added successfully`);
      setShowAddModal(false);
      setAddForm({ name: "", materials: "", contact: "", email: "", location: "", rating: "5", reliability: "100" });
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPurchaseOrder = (supplier: Supplier) => {
    setPoForm({
      supplierId: supplier.id,
      supplierName: supplier.name,
      material: supplier.materials[0] || "",
      quantity: "",
      unitPrice: "",
      notes: ""
    });
    setShowPOModal(true);
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poForm.material || !poForm.quantity) { toast.error("Please fill required fields"); return; }
    try {
      setIsSubmitting(true);
      const quantity = parseFloat(poForm.quantity);
      const unitPrice = parseFloat(poForm.unitPrice || "0");
      const total = (quantity * unitPrice).toFixed(2);
      
      await createPurchaseOrder({
        supplierName: poForm.supplierName,
        material: poForm.material,
        quantity,
        unitPrice,
        totalPrice: parseFloat(total),
        notes: poForm.notes
      });

      toast.success(
        `Purchase Order created for ${poForm.supplierName}: ${poForm.quantity}x ${poForm.material}${total !== "0.00" ? ` — Total: $${total}` : ""}`
      );
      setShowPOModal(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create Purchase Order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    { label: "Total Suppliers", value: supplierData.length.toString(), color: "blue" },
    { label: "Active Suppliers", value: supplierData.filter(s => s.status === 'Active').length.toString(), color: "green" },
    {
      label: "Avg Rating",
      value: supplierData.length > 0
        ? (supplierData.reduce((s, sup) => s + sup.rating, 0) / supplierData.length).toFixed(1)
        : "—",
      color: "yellow"
    },
    {
      label: "Avg Reliability",
      value: supplierData.length > 0
        ? (supplierData.reduce((s, sup) => s + sup.reliability, 0) / supplierData.length).toFixed(1) + "%"
        : "—",
      color: "purple"
    },
  ];

  if (isLoading) return <div className="p-8 text-center">Loading suppliers...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers Management</h1>
          <p className="text-gray-500 mt-1">Manage supplier relationships and track orders</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Add Supplier
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const colorClasses = {
            blue: { bg: "bg-blue-100", icon: "text-blue-600" },
            green: { bg: "bg-green-100", icon: "text-green-600" },
            yellow: { bg: "bg-yellow-100", icon: "text-yellow-600" },
            purple: { bg: "bg-purple-100", icon: "text-purple-600" },
          }[stat.color as string];
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${colorClasses!.bg} rounded-lg flex items-center justify-center`}>
                  <Truck className={colorClasses!.icon} size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {supplierData.length === 0 ? (
          <div className="col-span-2 text-center text-gray-400 py-16 bg-white rounded-xl border border-gray-100">
            <Truck size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No suppliers yet</p>
            <p className="text-sm mt-1">Click "Add Supplier" to get started</p>
          </div>
        ) : supplierData.map((supplier) => (
          <div key={supplier.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="text-yellow-400 fill-yellow-400" size={16} />
                    <span className="text-sm font-medium text-gray-700">{supplier.rating}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    supplier.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>{supplier.status}</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Truck className="text-blue-600" size={24} />
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={14} className="text-gray-400 shrink-0" />
                <span>{supplier.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} className="text-gray-400 shrink-0" />
                <span>{supplier.contact}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={14} className="text-gray-400 shrink-0" />
                <span>{supplier.email}</span>
              </div>
            </div>

            {supplier.materials.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <Package size={12} /> Materials Supplied:
                </p>
                <div className="flex flex-wrap gap-2">
                  {supplier.materials.map((m, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">{m}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 mb-4">
              <div>
                <p className="text-xs text-gray-500">Total Orders</p>
                <p className="text-lg font-semibold text-gray-900">{supplier.totalOrders}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Reliability</p>
                <p className="text-lg font-semibold text-gray-900">{supplier.reliability}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Order</p>
                <p className="text-sm font-medium text-gray-700">{supplier.lastOrder}</p>
              </div>
            </div>

            <button
              onClick={() => openPurchaseOrder(supplier)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingCart size={16} /> Create Purchase Order
            </button>
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Add New Supplier</h3>
                <p className="text-sm text-gray-500 mt-0.5">Register a new supplier in the system</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name <span className="text-red-500">*</span></label>
                <input value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} required
                  placeholder="e.g. Global Glass Supply Co."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Materials Supplied</label>
                <input value={addForm.materials} onChange={e => setAddForm(p => ({ ...p, materials: e.target.value }))}
                  placeholder="e.g. Clear Glass, Tinted Glass, Mirror (comma-separated)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact / Phone</label>
                  <input value={addForm.contact} onChange={e => setAddForm(p => ({ ...p, contact: e.target.value }))}
                    placeholder="+966 5X XXX XXXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} type="email"
                    placeholder="supplier@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location / Address</label>
                <input value={addForm.location} onChange={e => setAddForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Riyadh, Saudi Arabia"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1–5)</label>
                  <input value={addForm.rating} onChange={e => setAddForm(p => ({ ...p, rating: e.target.value }))} type="number" min="1" max="5" step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reliability (%)</label>
                  <input value={addForm.reliability} onChange={e => setAddForm(p => ({ ...p, reliability: e.target.value }))} type="number" min="0" max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-60">
                  {isSubmitting ? "Adding..." : "Add Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Order Modal */}
      {showPOModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Create Purchase Order</h3>
                <p className="text-sm text-gray-500 mt-0.5">Ordering from: <span className="font-medium text-blue-600">{poForm.supplierName}</span></p>
              </div>
              <button onClick={() => setShowPOModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreatePO} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material <span className="text-red-500">*</span></label>
                <select 
                  value={poForm.material} 
                  onChange={e => setPoForm(p => ({ ...p, material: e.target.value }))} 
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select a material...</option>
                  {supplierData.find(s => s.id === poForm.supplierId)?.materials.map((m, i) => (
                    <option key={i} value={m}>{m}</option>
                  ))}
                  <option value="other">Other (Type below)</option>
                </select>
              </div>
              {(poForm.material === 'other' || !supplierData.find(s => s.id === poForm.supplierId)?.materials.length) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specify Material <span className="text-red-500">*</span></label>
                  <input 
                    required
                    onChange={e => setPoForm(p => ({ ...p, material: e.target.value }))}
                    placeholder="e.g. Special Glass"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price ($)</label>
                  <input value={poForm.unitPrice} onChange={e => setPoForm(p => ({ ...p, unitPrice: e.target.value }))} type="number" min="0" step="0.01"
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
                  rows={2} placeholder="Delivery instructions, quality requirements..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPOModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                  <ShoppingCart size={16} /> {isSubmitting ? "Creating..." : "Place Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
