import { useState, useEffect } from "react";
import {
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  X,
} from "lucide-react";
import { getInvoices, addExtraCharge } from "./salesService";
import { toast } from "sonner";

export interface SalesInvoice {
  id: string;
  orderId: number;
  customer: string;
  product: string;
  quantity: number;
  unitPrice: number;
  total: number;
  qrReference?: string;
}

interface RealInvoice {
  _id: string;
  jobOrder: {
    _id: string;
    customer?: { name: string; number?: string };
    notes?: string;
    dimensions?: { height: number; width: number };
    status: string;
  } | null;
  amount: number;
  materialsCost: number;
  laborCost: number;
  amountPaid: number;
  paymentStatus: "unpaid" | "partial" | "paid";
  createdAt: string;
  auditLog: Array<{
    action: string;
    newValue?: any;
    timestamp: string;
  }>;
}

interface SalesInvoicesScreenProps {
  invoices?: SalesInvoice[];
  onViewOrder?: (orderId: string) => void;
}

export function SalesInvoicesScreen({ invoices: _unused, onViewOrder }: SalesInvoicesScreenProps) {
  const [invoices, setInvoices] = useState<RealInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<RealInvoice | null>(null);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeDescription, setChargeDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error("Failed to fetch invoices", error);
      toast.error("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCharge = (invoice: RealInvoice) => {
    setSelectedInvoice(invoice);
    setChargeAmount("");
    setChargeDescription("");
    setShowChargeModal(true);
  };

  const handleSubmitCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    const amount = parseFloat(chargeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    try {
      setIsSubmitting(true);
      await addExtraCharge(selectedInvoice._id, amount, chargeDescription);
      toast.success(`Extra charge of $${amount.toFixed(2)} added successfully`);
      setShowChargeModal(false);
      fetchInvoices();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add charge");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" /> Paid
          </span>
        );
      case "partial":
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" /> Partial
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3" /> Unpaid
          </span>
        );
    }
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const unpaidCount = invoices.filter((i) => i.paymentStatus === "unpaid").length;
  const paidCount = invoices.filter((i) => i.paymentStatus === "paid").length;

  return (
    <div className="p-8 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Invoiced</p>
              <p className="text-2xl font-semibold text-gray-900">${totalRevenue.toFixed(0)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-700" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Collected</p>
              <p className="text-2xl font-semibold text-green-600">${totalPaid.toFixed(0)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-700" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Paid Invoices</p>
              <p className="text-2xl font-semibold text-gray-900">{paidCount}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="w-5 h-5 text-purple-700" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unpaid Invoices</p>
              <p className="text-2xl font-semibold text-red-600">{unpaidCount}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Accountant Invoices</h3>
          <p className="text-sm text-gray-500 mt-1">
            Invoices generated by the accountant. Sales reps can add extra service charges.
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No invoices yet</p>
            <p className="text-sm mt-1">The accountant will generate invoices once orders are completed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Ref</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Materials</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Labor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => {
                  const extraCharges = invoice.auditLog
                    .filter((log) => log.action === "extra_charge_added")
                    .map((log) => log.newValue?.extraCharge || 0)
                    .reduce((s, v) => s + v, 0);
                  return (
                    <tr key={invoice._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        #{invoice._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {invoice.jobOrder?.customer?.name || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {invoice.jobOrder?._id ? (
                          <button
                            onClick={() => onViewOrder?.(invoice.jobOrder!._id)}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                          >
                            #{invoice.jobOrder._id.slice(-6).toUpperCase()}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        ${invoice.materialsCost.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        ${invoice.laborCost.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        ${invoice.amount.toFixed(2)}
                        {extraCharges > 0 && (
                          <span className="ml-1 text-xs text-blue-600 font-normal">
                            (+${extraCharges.toFixed(2)} services)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600 font-medium">
                        ${invoice.amountPaid.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(invoice.paymentStatus)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleAddCharge(invoice)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Add Charge
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Extra Charge Modal */}
      {showChargeModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add Extra Service Charge</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Customer: {selectedInvoice.jobOrder?.customer?.name || "Unknown"}
                </p>
              </div>
              <button
                onClick={() => setShowChargeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmitCharge} className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Current invoice total:{" "}
                  <span className="font-semibold">${selectedInvoice.amount.toFixed(2)}</span>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Only add charges for services not already included by the accountant (e.g., delivery, rush fee, installation).
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={chargeDescription}
                  onChange={(e) => setChargeDescription(e.target.value)}
                  placeholder="e.g., Express delivery fee, On-site installation..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extra Charge Amount ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {chargeAmount && !isNaN(parseFloat(chargeAmount)) && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                  New total will be:{" "}
                  <span className="font-semibold text-gray-900">
                    ${(selectedInvoice.amount + parseFloat(chargeAmount)).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChargeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-60"
                >
                  {isSubmitting ? "Adding..." : "Add Charge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
