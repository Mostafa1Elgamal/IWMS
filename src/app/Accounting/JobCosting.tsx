import { useState, useEffect } from "react";
import { Calculator, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { getOrders } from "../Sales/salesService";
import { generateInvoice } from "./accountingService";
import { toast } from "sonner";

interface JobCostingProps {
  onGenerateInvoice: () => void;
}

export function JobCosting({ onGenerateInvoice }: JobCostingProps) {
  const [selectedOrder, setSelectedOrder] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data.filter(o => ["Completed", "completed", "Delivered", "delivered"].includes(o.status)));
    } catch (error) {
      console.error("Failed to fetch orders", error);
    }
  };

  const selectedOrderData = orders.find((o) => o.id === selectedOrder);

  const handleGenerateInvoice = async () => {
    if (!selectedOrder) return;

    try {
      setIsLoading(true);
      await generateInvoice(selectedOrder);
      toast.success("Invoice generated successfully");
      onGenerateInvoice();
      setSelectedOrder("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to generate invoice");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-gray-900">Job Costing</h2>
          <p className="text-gray-600 mt-1">
            Calculate costs and generate invoices for completed jobs
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Cost Calculation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="order">Select Order *</Label>
                  <Select
                    value={selectedOrder}
                    onValueChange={setSelectedOrder}
                  >
                    <SelectTrigger id="order">
                      <SelectValue placeholder="Choose an order" />
                    </SelectTrigger>
                    <SelectContent>
                      {orders.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.id.substring(0, 8)} - {order.customerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedOrderData && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-2">
                      <p className="text-sm font-medium text-blue-900">
                        Order Details
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                        <span>Customer:</span>
                        <span className="font-semibold">{selectedOrderData.customerName}</span>
                        <span>Items:</span>
                        <span className="font-semibold">{selectedOrderData.items}</span>
                        <span>Date:</span>
                        <span className="font-semibold">{new Date(selectedOrderData.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={handleGenerateInvoice}
                  disabled={!selectedOrder || isLoading}
                >
                  <FileText className="w-4 h-4" />
                  {isLoading ? "Generating..." : "Generate Invoice"}
                </Button>
                
                <p className="text-xs text-gray-500 italic mt-4 text-center">
                  * Costs are calculated automatically based on materials used and production labor logs.
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Invoice Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedOrderData ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">Calculated by Backend</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (0%)</span>
                      <span className="font-medium">$0.00</span>
                    </div>
                    <div className="pt-4 border-t flex justify-between items-center">
                      <span className="font-semibold">Total Amount</span>
                      <span className="text-xl font-bold text-blue-600">
                        Automatic
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Select an order to see calculation details
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
