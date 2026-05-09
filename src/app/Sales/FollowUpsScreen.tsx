import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { getFollowUps, createFollowUp, updateFollowUp, type FollowUp } from "./salesService";
import { toast } from "sonner";

export function FollowUpsScreen() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const fetchFollowUps = async () => {
    try {
      setIsLoading(true);
      const data = await getFollowUps();
      setFollowUps(data);
    } catch (error) {
      console.error("Failed to fetch follow-ups", error);
      toast.error("Failed to load follow-ups");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-100 text-blue-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "Phone":
        return <Phone className="w-4 h-4" />;
      case "Email":
        return <Mail className="w-4 h-4" />;
      case "Meeting":
        return <Calendar className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const handleAddNote = (followUpId: string) => {
    setSelectedFollowUp(followUpId);
    setShowModal(true);
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowUp) return;
    try {
      await updateFollowUp(selectedFollowUp, { notes: noteText });
      toast.success("Note added successfully");
      setShowModal(false);
      setNoteText("");
      setSelectedFollowUp(null);
      fetchFollowUps();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add note");
    }
  };

  const handleContactCustomer = (followUp: FollowUp) => {
    if (followUp.customerPhone) {
      // Clean phone number: remove non-digits, and if it starts with a country code, ensure it has +
      const cleanNumber = followUp.customerPhone.replace(/[^0-9+]/g, '');
      window.open(`https://wa.me/${cleanNumber}`, "_blank");
    } else {
      toast.error("No phone number available for this customer.");
    }
  };

  const handleMarkCompleted = async (followUpId: string) => {
    try {
      await updateFollowUp(followUpId, { status: "Completed" });
      toast.success("Follow-up marked as completed");
      fetchFollowUps();
    } catch (error) {
      toast.error("Failed to complete follow-up");
    }
  };

  const pendingCount = followUps.filter(f => f.status === "Pending" || f.status === "Scheduled").length;
  const overdueCount = followUps.filter(f => f.status === "Overdue").length;

  return (
    <div className="p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Follow-ups</p>
              <p className="text-3xl font-semibold text-gray-900">{followUps.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Scheduled / Pending</p>
              <p className="text-3xl font-semibold text-gray-900">{pendingCount}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Phone className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overdue</p>
              <p className="text-3xl font-semibold text-gray-900">{overdueCount}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-red-700" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Follow-ups</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Schedule Follow-up</span>
            </button>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search follow-ups..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>All Status</option>
              <option>Scheduled</option>
              <option>Pending</option>
              <option>Overdue</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {followUps.map((followUp) => (
            <div
              key={followUp.id}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">
                        {followUp.customer.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {followUp.customer}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(followUp.status)}`}
                        >
                          {followUp.status}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          {getMethodIcon(followUp.method)}
                          {followUp.method}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-3 ml-13">
                    {followUp.notes}
                  </p>

                  <div className="flex items-center gap-6 text-sm text-gray-600 ml-13">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Last: {followUp.lastContact}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Next: {followUp.nextFollowUp}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddNote(followUp.id)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Add Note
                  </button>
                  <button 
                    onClick={() => handleContactCustomer(followUp)}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Contact Customer
                  </button>
                  {followUp.status !== "Completed" && (
                    <button 
                      onClick={() => handleMarkCompleted(followUp.id)}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Follow-up Note
              </h3>
            </div>

            <form onSubmit={handleSubmitNote} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your note..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setNoteText("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
