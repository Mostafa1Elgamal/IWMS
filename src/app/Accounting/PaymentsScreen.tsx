import { useState, useEffect } from "react";
import { Search, Filter, Banknote, CreditCard, Smartphone, Building2 } from "lucide-react";
import { getPayments, getPaymentSummary, type PaymentRecord, type PaymentSummary } from "./accountingService";
import { toast } from "sonner";

const METHOD_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote className="w-4 h-4" />,
  vodafone_cash: <Smartphone className="w-4 h-4" />,
  card: <CreditCard className="w-4 h-4" />,
  bank_transfer: <Building2 className="w-4 h-4" />,
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  vodafone_cash: "Vodafone Cash",
  card: "Card",
  bank_transfer: "Bank Transfer",
};

const METHOD_COLORS: Record<string, string> = {
  cash: "bg-green-100 text-green-800",
  vodafone_cash: "bg-red-100 text-red-800",
  card: "bg-blue-100 text-blue-800",
  bank_transfer: "bg-purple-100 text-purple-800",
};

export function PaymentsScreen() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

  useEffect(() => { fetchData(); }, [methodFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [pays, sum] = await Promise.all([
        getPayments(methodFilter !== "all" ? { method: methodFilter } : undefined),
        getPaymentSummary()
      ]);
      setPayments(pays);
      setSummary(sum);
    } catch (e) {
      toast.error("Failed to load payment data");
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = payments.filter(p =>
    p.customerName.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 bg-gray-50 overflow-auto p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Payment History</h2>
        <p className="text-gray-500 text-sm mt-1">All recorded payments across all invoices</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-semibold">Total Collected</p>
            <p className="text-2xl font-bold text-green-700 mt-1">${summary.totalCollected.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-semibold">Outstanding</p>
            <p className="text-2xl font-bold text-red-600 mt-1">${summary.totalOutstanding.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-semibold">Unpaid Invoices</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{summary.unpaidCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">By Method</p>
            <div className="space-y-1">
              {summary.byMethod.map(m => (
                <div key={m._id} className="flex justify-between text-xs text-gray-600">
                  <span>{METHOD_LABELS[m._id] || m._id}</span>
                  <span className="font-semibold">${m.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="vodafone_cash">Vodafone Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading payments...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Date", "Customer", "Amount", "Method", "Order", "Notes", "Recorded By"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(p.paidAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.customerName}</td>
                  <td className="px-4 py-3 text-sm font-bold text-green-700">${p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${METHOD_COLORS[p.method] || "bg-gray-100 text-gray-700"}`}>
                      {METHOD_ICONS[p.method]}
                      {METHOD_LABELS[p.method] || p.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">#{p.orderId?.slice(-8) || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 italic">{p.notes || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.recordedBy || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">No payment records found.</div>
        )}
      </div>
    </div>
  );
}
