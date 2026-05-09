import { useState, useEffect } from 'react';
import { SalesSidebar } from '../Sales/SalesSidebar';
import { SalesHeader } from '../Sales/SalesHeader';
import { DashboardScreen } from '../Sales/DashboardScreen';
import { CustomersScreen } from '../Sales/CustomersScreen';
import { CreateOrderScreen } from '../sales/CreateOrderScreen';
import { OrderDetailsScreen } from '../sales/OrderDetailsScreen';
import { FollowUpsScreen } from '../sales/FollowUpsScreen';
import { OrdersScreen } from '../sales/OrdersScreen';
import { SalesInvoicesScreen } from './SalesInvoicesScreen';
import { type SalesOrderRow } from './salesOrderTypes';
import type { FinalizeOrderPayload } from './CreateOrderScreen';
import { getOrders, createOrder, updateOrder, deleteOrder } from './salesService';
import { toast } from 'sonner';

export default function App() {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<SalesOrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const data = await getOrders();
      // Map Order to SalesOrderRow
      const mappedOrders: SalesOrderRow[] = data.map(o => ({
        id: o.id,
        customer: o.customerName,
        customerPhone: "N/A",
        product: "Custom Job",
        status: o.status as any,
        deliveryDate: o.date,
        totalDisplay: `$${o.total.toFixed(2)}`,
        quantity: 1,
        unitPrice: o.total,
        lineTotal: o.total,
        qrReference: `QR-${o.id}`,
        qrPayload: "",
      }));
      setOrders(mappedOrders);
    } catch (error) {
      console.error("Failed to fetch orders", error);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (screen: string) => {
    setActiveScreen(screen);
  };

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setActiveScreen('order-details');
  };

  const handleBackToOrders = () => {
    setActiveScreen('orders');
  };

  const getScreenTitle = () => {
    switch (activeScreen) {
      case 'dashboard':
        return 'Dashboard';
      case 'customers':
        return 'Customers';
      case 'orders':
        return 'Orders';
      case 'create-order':
        return 'Create New Order';
      case 'order-details':
        return 'Order Details';
      case 'follow-ups':
        return 'Follow-ups';
      case 'invoices':
        return 'Invoice';
      default:
        return 'Dashboard';
    }
  };

  const handleFinalizeOrder = async (payload: FinalizeOrderPayload) => {
    try {
      const response = await createOrder({
        customer: payload.customer, // This should be an ID in the final version
        materialsUsed: [{ material: payload.materialId, quantity: payload.quantity }],
        dimensions: payload.dimensions,
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        totalCost: payload.totalCost,
      });

      toast.success("Order created successfully!");
      fetchOrders(); // Refresh list
      return {
        orderId: response._id,
        qrReference: `QR-${response._id.substring(0, 8)}`,
        qrImageUrl: response.qrCode,
      };
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create order");
      throw error;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <SalesSidebar activeScreen={activeScreen} onNavigate={handleNavigate} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <SalesHeader title={getScreenTitle()} />

        <main className="flex-1 overflow-y-auto">
          {activeScreen === 'dashboard' && <DashboardScreen onNavigate={handleNavigate} />}
          {activeScreen === 'customers' && <CustomersScreen onViewOrder={handleViewOrder} />}
          {activeScreen === 'orders' && (
            <OrdersScreen
              orders={orders}
              onViewOrder={handleViewOrder}
              onCreateOrder={() => handleNavigate('create-order')}
              onEditOrder={async (id, data) => {
                await updateOrder(id, data);
                toast.success("Order updated successfully");
                fetchOrders();
              }}
              onDeleteOrder={async (id) => {
                if (window.confirm("Are you sure you want to delete this order?")) {
                  await deleteOrder(id);
                  toast.success("Order deleted successfully");
                  fetchOrders();
                }
              }}
            />
          )}
          {activeScreen === 'create-order' && (
            <CreateOrderScreen
              onBack={handleBackToOrders}
              onFinalizeOrder={handleFinalizeOrder}
            />
          )}
          {activeScreen === 'order-details' && selectedOrderId && (
            <OrderDetailsScreen 
              orderId={selectedOrderId} 
              onBack={handleBackToOrders} 
              onViewInvoice={() => handleNavigate('invoices')}
            />
          )}
          {activeScreen === 'invoices' && <SalesInvoicesScreen onViewOrder={handleViewOrder} />}
          {activeScreen === 'follow-ups' && <FollowUpsScreen />}
        </main>
      </div>
    </div>
  );
}