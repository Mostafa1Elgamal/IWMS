import { useState, useEffect } from "react";
import { Search, Filter, ClipboardList, RefreshCw } from "lucide-react";
import { getActivityLogs, type ActivityLogEntry } from "./accountingService";
import { toast } from "sonner";

const ACTION_LABELS: Record<string, string> = {
  order_created: "Order Created",
  order_status_changed: "Status Changed",
  order_deleted: "Order Deleted",
  invoice_generated: "Invoice Generated",
  payment_recorded: "Payment Recorded",
  delivery_confirmed: "Delivery Confirmed",
  technician_started: "Work Started",
  technician_completed: "Work Completed",
  technician_note: "Note Added",
  extra_charge_added: "Extra Charge Added",
  invoice_marked_paid: "Invoice Marked Paid",
};

const ACTION_COLORS: Record<string, string> = {
  order_created: "bg-blue-100 text-blue-800",
  order_status_changed: "bg-indigo-100 text-indigo-800",
  order_deleted: "bg-red-100 text-red-800",
  invoice_generated: "bg-purple-100 text-purple-800",
  payment_recorded: "bg-green-100 text-green-800",
  delivery_confirmed: "bg-teal-100 text-teal-800",
  technician_started: "bg-orange-100 text-orange-800",
  technician_completed: "bg-cyan-100 text-cyan-800",
  technician_note: "bg-gray-100 text-gray-800",
  extra_charge_added: "bg-amber-100 text-amber-800",
  invoice_marked_paid: "bg-emerald-100 text-emerald-800",
};

const ROLE_COLORS: Record<string, string> = {
  manager: "bg-purple-100 text-purple-700",
  sales: "bg-blue-100 text-blue-700",
  technician: "bg-orange-100 text-orange-700",
  accountant: "bg-green-100 text-green-700",
};

export function ActivityLogsScreen() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { fetchLogs(); }, [actionFilter, page]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await getActivityLogs({
        actionType: actionFilter !== "all" ? actionFilter : undefined,
        page
      });
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch (e) {
      toast.error("Failed to load activity logs");
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = logs.filter(l =>
    l.description.toLowerCase().includes(search.toLowerCase()) ||
    l.userName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 bg-gray-50 overflow-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Activity Logs</h2>
          <p className="text-gray-500 text-sm mt-1">{total} total events recorded</p>
        </div>
        <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search descriptions or users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={actionFilter}
              onChange={e => { setActionFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Actions</option>
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading logs...</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(log => (
              <div key={log.id} className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mt-0.5">
                  <ClipboardList className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLORS[log.actionType] || "bg-gray-100 text-gray-700"}`}>
                      {ACTION_LABELS[log.actionType] || log.actionType}
                    </span>
                    <span className="font-medium text-sm text-gray-900">{log.userName}</span>
                    {log.userRole && (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${ROLE_COLORS[log.userRole] || "bg-gray-100 text-gray-600"}`}>
                        {log.userRole}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{log.description}</p>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-1.5">
                      {Object.entries(log.metadata).filter(([k]) => ['amount', 'method', 'oldStatus', 'newStatus', 'workstation'].includes(k)).map(([k, v]) => (
                        <span key={k} className="text-xs text-gray-400">
                          <span className="font-medium text-gray-500">{k}:</span> {String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 mt-1">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">No log entries found.</div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
