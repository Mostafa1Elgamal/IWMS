import { Clock, AlertCircle, ArrowRight, LogOut } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { logout } from "../auth/authService";
import { useAuth } from "../auth/authContext";
import { useLocation } from "react-router";

export interface Job {
  id: string;
  orderId: string;
  stage: string;
  status: "Pending" | "In Progress" | "Completed";
  deadline: string;
  priority: "Low" | "Medium" | "High";
  product: string;
}

interface JobsDashboardProps {
  jobs: Job[];
  onViewJob: (job: Job) => void;
  onScanJob: () => void;
}

export function JobsDashboard({
  jobs,
  onViewJob,
  onScanJob,
}: JobsDashboardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const { logout } = useAuth();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Jobs</h1>
            <p className="text-sm text-gray-600 mt-1">
              {jobs.length} active assignments
            </p>
          </div>

          <div className="flex items-center gap-0">
            <Button onClick={onScanJob}>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                  strokeWidth="2"
                />
                <path d="M3 9h18M3 15h18" strokeWidth="2" />
              </svg>
              Scan Job
            </Button>

            <button
              onClick={logout}
              className="flex items-center px-4 py-3 rounded-lg transition-colors text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <LogOut size={20} />
              <span className="ml-2">Logout</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onViewJob(job)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        {job.orderId}
                      </span>
                      <Badge
                        variant="outline"
                        className={getPriorityColor(job.priority)}
                      >
                        {job.priority}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{job.product}</p>

                    <div className="flex flex-wrap gap-2 items-center text-sm">
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-700">{job.stage}</span>
                      <span className="text-gray-500">•</span>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{job.deadline}</span>
                      </div>
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
