import { Download, Search, Filter, Eye, Edit, Package, TrendingUp, Clock, Trash2, Truck, CheckCircle } from 'lucide-react';
import type { SalesOrderRow } from './salesOrderTypes';
import { downloadSalesOrdersExport } from './downloadOrdersExport';

import { useState, useEffect } from 'react';
import { getOrderById, getCustomers, confirmDelivery } from './salesService';
import { getMaterials } from '../INVENTORYY/Inventory/inventoryService';
import { toast } from 'sonner';

interface OrdersScreenProps {
  orders: SalesOrderRow[];
  onViewOrder: (orderId: string | number) => void;
  onCreateOrder: () => void;
  onEditOrder?: (orderId: string, data: any) => Promise<void>;
  onDeleteOrder?: (orderId: string) => Promise<void>;
}

export function OrdersScreen({ orders, onViewOrder, onCreateOrder, onEditOrder, onDeleteOrder }: OrdersScreenProps) {
  const [editingOrder, setEditingOrder] = useState<SalesOrderRow | null>(null);
  const [fullEditingOrder, setFullEditingOrder] = useState<any>(null);
  const [editForm, setEditForm] = useState({ 
    status: '', deliveryDate: '', customer: '', 
    material: '', quantity: 1, totalCost: 0, 
    height: 0, width: 0, thickness: 0 
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Delivery confirmation modal
  const [deliverOrder, setDeliverOrder] = useState<SalesOrderRow | null>(null);
  const [deliverForm, setDeliverForm] = useState({ paymentAmount: '', paymentMethod: 'cash', notes: '' });
  const [isDelivering, setIsDelivering] = useState(false);
  const [deliverInvoice, setDeliverInvoice] = useState<any>(null);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const [custs, mats] = await Promise.all([getCustomers(), getMaterials()]);
      setCustomers(custs);
      setMaterials(mats);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditClick = async (order: SalesOrderRow) => {
    setEditingOrder(order);
    try {
      setIsLoadingLists(true);
      const full = await getOrderById(order.id);
      setFullEditingOrder(full);
      
      setEditForm({
        status: full.status || 'Pending',
        deliveryDate: full.deliveryDate ? full.deliveryDate.split('T')[0] : '',
        customer: full.customer?._id || full.customer || '',
        material: full.materialsUsed?.[0]?.material?._id || '',
        quantity: full.materialsUsed?.[0]?.quantity || 1,
        totalCost: full.totalCost || 0,
        height: full.dimensions?.height || 0,
        width: full.dimensions?.width || 0,
        thickness: full.dimensions?.thickness || 0,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLists(false);
    }
  };
  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    'pending':              { label: 'Pending',              color: 'bg-yellow-100 text-yellow-800' },
    'assigned':             { label: 'Assigned',             color: 'bg-blue-100 text-blue-800' },
    'in-progress':          { label: 'In Progress',          color: 'bg-indigo-100 text-indigo-800' },
    'waiting-for-parts':    { label: 'Waiting for Parts',    color: 'bg-orange-100 text-orange-800' },
    'technician-completed': { label: 'Tech Completed',       color: 'bg-teal-100 text-teal-800' },
    'ready-for-delivery':   { label: 'Ready for Delivery',   color: 'bg-cyan-100 text-cyan-800' },
    'delivery-pending':     { label: 'Delivery Pending',     color: 'bg-purple-100 text-purple-800' },
    'delivered':            { label: 'Delivered',            color: 'bg-green-100 text-green-800' },
    'closed':               { label: 'Closed',               color: 'bg-gray-100 text-gray-800' },
    'cancelled':            { label: 'Cancelled',            color: 'bg-red-100 text-red-800' },
    // Legacy support
    'cutting': { label: 'Cutting', color: 'bg-indigo-100 text-indigo-800' },
    'polishing': { label: 'Polishing', color: 'bg-indigo-100 text-indigo-800' },
    'assembly': { label: 'Assembly', color: 'bg-indigo-100 text-indigo-800' },
    'engraving': { label: 'Engraving', color: 'bg-indigo-100 text-indigo-800' },
    'completed': { label: 'Completed', color: 'bg-green-100 text-green-800' },
  };

  const getStatusColor = (status: string) => STATUS_CONFIG[status]?.color || 'bg-gray-100 text-gray-800';
  const getStatusLabel = (status: string) => STATUS_CONFIG[status]?.label || status;

  const handleExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadSalesOrdersExport(orders, `iwms-export-orders-${stamp}.csv`);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Orders</p>
              <p className="text-3xl font-semibold text-gray-900">{orders.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">In Progress</p>
              <p className="text-3xl font-semibold text-gray-900">
                {orders.filter((o) => o.status === 'In Progress').length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-semibold text-gray-900">
                {orders.filter((o) => o.status === 'Completed').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Delayed</p>
              <p className="text-3xl font-semibold text-gray-900">
                {orders.filter((o) => o.status === 'Delayed').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <Clock className="w-6 h-6 text-red-700" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
            <button
              onClick={onCreateOrder}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <span className="text-sm font-medium">Create New Order</span>
            </button>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">Filter</span>
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white"
            >
              <Download className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700 font-medium">Export</span>
            </button>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="technician-completed">Tech Completed</option>
              <option value="ready-for-delivery">Ready for Delivery</option>
              <option value="delivery-pending">Delivery Pending</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.filter(o => statusFilter === 'all' || o.status === statusFilter).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.product}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.deliveryDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{order.totalDisplay}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewOrder(order.id)}
                        className="p-1 hover:bg-blue-50 rounded transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>
                      <button 
                        onClick={() => handleEditClick(order)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors" 
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button 
                        onClick={() => onDeleteOrder?.(order.id)}
                        className="p-1 hover:bg-red-50 rounded transition-colors" 
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                      {['technician-completed', 'ready-for-delivery', 'delivery-pending'].includes(order.status) && (
                        <button
                          onClick={() => setDeliverOrder(order)}
                          className="p-1 hover:bg-green-50 rounded transition-colors"
                          title="Confirm Delivery"
                        >
                          <Truck className="w-4 h-4 text-green-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Order #{editingOrder.id.substring(0, 8)}</h3>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {isLoadingLists ? (
                <div className="text-center py-8 text-gray-500">Loading order details...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                    <select 
                      value={editForm.customer} 
                      onChange={e => setEditForm({ ...editForm, customer: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Customer</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select 
                      value={editForm.status} 
                      onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Delayed">Delayed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                    <input 
                      type="date"
                      value={editForm.deliveryDate} 
                      onChange={e => setEditForm({ ...editForm, deliveryDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2 mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Material Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                        <select 
                          value={editForm.material} 
                          onChange={e => setEditForm({ ...editForm, material: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Material</option>
                          {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input 
                          type="number"
                          value={editForm.quantity} 
                          onChange={e => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost override ($)</label>
                        <input 
                          type="number"
                          value={editForm.totalCost} 
                          onChange={e => setEditForm({ ...editForm, totalCost: Number(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                        <input 
                          type="number"
                          value={editForm.height} 
                          onChange={e => setEditForm({ ...editForm, height: Number(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Width (cm)</label>
                        <input 
                          type="number"
                          value={editForm.width} 
                          onChange={e => setEditForm({ ...editForm, width: Number(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button 
                  onClick={() => { setEditingOrder(null); setFullEditingOrder(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const finalPayload = {
                        customer: editForm.customer,
                        status: editForm.status,
                        deliveryDate: editForm.deliveryDate,
                        totalCost: editForm.totalCost,
                        dimensions: {
                          height: editForm.height,
                          width: editForm.width,
                          thickness: editForm.thickness
                        },
                        materialsUsed: [
                          { material: editForm.material, quantity: editForm.quantity }
                        ]
                      };
                      await onEditOrder?.(editingOrder.id, finalPayload);
                      setEditingOrder(null);
                      setFullEditingOrder(null);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  disabled={isLoadingLists}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-blue-300"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
