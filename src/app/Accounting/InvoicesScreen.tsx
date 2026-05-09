import { useState, useEffect } from "react";
import { Search, Eye, DollarSign, Filter, CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { getInvoices, recordPayment, markInvoicePaid, type Invoice, type PaymentMethod } from "./accountingService";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  unpaid: "Unpaid",
  "partially-paid": "Partially Paid",
  paid: "Paid",
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  vodafone_cash: "Vodafone Cash",
  card: "Card",
  bank_transfer: "Bank Transfer",
};

export function InvoicesScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Payment modal
  const [payModal, setPayModal] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [payNotes, setPayNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchInvoices(); }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await getInvoices(statusFilter !== "all" ? { paymentStatus: statusFilter } : undefined);
      setInvoices(data);
    } catch (e) {
      toast.error("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = invoices.filter(inv =>
    inv.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.orderId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAmount = filtered.reduce((s, i) => s + i.amount, 0);
  const totalPaid = filtered.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalOutstanding = filtered.reduce((s, i) => s + i.remaining, 0);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModal || !payAmount) return;
    try {
      setIsSaving(true);
      await recordPayment({
        invoiceId: payModal.id,
        amount: parseFloat(payAmount),
        method: payMethod,
        notes: payNotes
      });
      toast.success("Payment recorded successfully!");
      setPayModal(null);
      setPayAmount("");
      setPayNotes("");
      fetchInvoices();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to record payment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkPaid = async (inv: Invoice) => {
    if (!window.confirm(`Mark invoice for ${inv.customer} as fully paid?`)) return;
    try {
      await markInvoicePaid(inv.id);
      toast.success("Invoice marked as paid!");
      fetchInvoices();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === "paid") return "bg-green-100 text-green-800";
    if (status === "partially-paid") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getStatusIcon = (status: string) => {
    if (status === "paid") return <CheckCircle className="w-3 h-3" />;
    if (status === "partially-paid") return <Clock className="w-3 h-3" />;
    return <AlertTriangle className="w-3 h-3" />;
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-auto p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Invoices</h2>
        <p className="text-gray-500 text-sm mt-1">All invoices auto-generated from orders</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Invoiced", value: `$${totalAmount.toLocaleString()}`, color: "bg-blue-50 text-blue-700" },
          { label: "Total Collected", value: `$${totalPaid.toLocaleString()}`, color: "bg-green-50 text-green-700" },
          { label: "Outstanding Balance", value: `$${totalOutstanding.toLocaleString()}`, color: "bg-red-50 text-red-700" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.color.split(' ')[1]}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially-paid">Partially Paid</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading invoices...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Invoice", "Order", "Customer", "Total", "Paid", "Remaining", "Due Date", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(inv => (
                <>
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">#{inv.id.slice(-8)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">#{inv.orderId.slice(-8)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{inv.customer}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">${inv.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-green-700 font-medium">${inv.amountPaid.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-red-600">
                      {inv.remaining > 0 ? `$${inv.remaining.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusStyle(inv.status)}`}>
                        {getStatusIcon(inv.status)}
                        {STATUS_LABELS[inv.status] || inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                          className="p-1.5 hover:bg-gray-100 rounded"
                          title="View payments"
                        >
                          {expandedId === inv.id ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                        </button>
                        {inv.status !== "paid" && (
                          <button
                            onClick={() => { setPayModal(inv); setPayAmount(String(inv.remaining)); }}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded text-blue-700"
                            title="Record payment"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        {inv.status !== "paid" && (
                          <button
                            onClick={() => handleMarkPaid(inv)}
                            className="p-1.5 bg-green-50 hover:bg-green-100 rounded text-green-700"
                            title="Mark fully paid"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === inv.id && (
                    <tr>
                      <td colSpan={9} className="bg-blue-50 px-6 py-4">
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Payment History</p>
                        {inv.payments.length === 0 ? (
                          <p className="text-sm text-gray-500">No payments recorded yet.</p>
                        ) : (
                          <div className="space-y-1">
                            {inv.payments.map((p, i) => (
                              <div key={i} className="flex gap-4 text-sm text-gray-700 bg-white rounded p-2 border border-gray-100">
                                <span className="font-semibold text-green-700">${p.amount.toLocaleString()}</span>
                                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">{METHOD_LABELS[p.method] || p.method}</span>
                                <span className="text-gray-400">{new Date(p.paidAt).toLocaleString()}</span>
                                {p.notes && <span className="text-gray-500 italic">"{p.notes}"</span>}
                                {p.recordedBy && <span className="text-gray-400">by {p.recordedBy.name}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">No invoices found.</div>
        )}
      </div>

      {/* Payment modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-1">Record Payment</h3>
            <p className="text-sm text-gray-500 mb-4">Invoice for <strong>{payModal.customer}</strong> — Remaining: <strong className="text-red-600">${payModal.remaining.toLocaleString()}</strong></p>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={payModal.remaining}
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">💵 Cash</option>
                  <option value="vodafone_cash">📱 Vodafone Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Received at store"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setPayModal(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300">
                  {isSaving ? "Saving..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
