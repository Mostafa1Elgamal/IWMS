import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Edit,
  Package,
  Calendar,
  User,
  FileText,
} from "lucide-react";
import { getOrderById } from "./salesService";

interface OrderDetailsScreenProps {
  orderId: string | number;
  onBack: () => void;
  onViewInvoice?: () => void;
}

export function OrderDetailsScreen({
  orderId,
  onBack,
  onViewInvoice,
}: OrderDetailsScreenProps) {
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const data = await getOrderById(String(orderId));
        setOrder(data);
      } catch (error) {
        console.error("Failed to load order", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (isLoading || !order) {
    return <div className="p-8 text-center">Loading order details...</div>;
  }

  const statusSteps = [
    { label: "Pending", completed: true, date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "" },
    { label: "In-Progress", completed: ["in-progress", "completed"].includes(order.status), date: "" },
    { label: "Completed", completed: order.status === "completed", date: "" },
  ];

  let progress = 0;
  if (order.status === "pending") progress = 25;
  if (order.status === "in-progress") progress = 60;
  if (order.status === "completed") progress = 100;

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Orders</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Order #{String(order._id).substring(0, 8)}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Created on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Edit className="w-4 h-4" />
              Edit Order
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Order Progress
                </h3>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Progress: {progress}%
                    </span>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 bg-blue-600 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-4">
                  {statusSteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            step.completed
                              ? "bg-green-600 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {step.completed ? "✓" : index + 1}
                        </div>
                        {index < statusSteps.length - 1 && (
                          <div
                            className={`w-0.5 h-12 ${
                              step.completed ? "bg-green-600" : "bg-gray-200"
                            }`}
                          ></div>
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <p
                          className={`font-medium ${step.completed ? "text-gray-900" : "text-gray-500"}`}
                        >
                          {step.label}
                        </p>
                        {step.date && (
                          <p className="text-xs text-gray-500 mt-1">
                            {step.date}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Product Details
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Product</p>
                    <p className="font-medium text-gray-900">{order.product || "Custom Job"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Dimensions</p>
                    <p className="font-medium text-gray-900">
                      {order.dimensions?.height}cm × {order.dimensions?.width}cm {order.dimensions?.thickness ? `× ${order.dimensions.thickness}mm` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Quantity</p>
                    <p className="font-medium text-gray-900">
                      {order.materialsUsed?.[0]?.quantity || 1} units
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Expected Delivery</p>
                    <p className="font-medium text-gray-900">
                      {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-700">{order.notes}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Customer Info
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Customer Name</p>
                    <p className="font-medium text-gray-900">
                      {order.customer?.name || order.customer || "Unknown"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{order.customer?.number || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-gray-900 text-xs">
                      {order.customer?.address || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Cost Breakdown
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Material Cost</span>
                  <span className="font-medium text-gray-900">
                    N/A
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Labor Cost</span>
                  <span className="font-medium text-gray-900">
                    N/A
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-semibold text-blue-600">
                    ${order.totalCost?.toFixed(2) || '0.00'}
                  </span>
                </div>
                {order.status === 'completed' && onViewInvoice && (
                  <div className="pt-4 flex justify-end">
                    <button 
                      onClick={onViewInvoice}
                      className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      View Invoice
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
