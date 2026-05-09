import { useState, useEffect } from "react";
import { JobsDashboard, type Job } from "./JobsDashboard";
import { ScanJob } from "./ScanJob";
import { JobDetails } from "./JobDetails";
import { getOrders } from "../Sales/salesService";
import { toast } from "sonner";

type Screen = "dashboard" | "scan" | "details";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const data = await getOrders();
      const mappedJobs: Job[] = data.map(o => ({
        id: o.id,
        orderId: o.id.substring(0, 8),
        stage: o.status,
        status: o.status === 'completed' ? 'Completed' : 'In Progress',
        deadline: new Date(o.date).toLocaleDateString(),
        priority: "Medium",
        product: `Order for ${o.customerName}`,
      }));
      setJobs(mappedJobs);
    } catch (error) {
      console.error("Failed to fetch jobs", error);
      toast.error("Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewJob = (job: Job) => {
    setSelectedJob(job);
    setCurrentScreen("details");
  };

  const handleScanJob = () => {
    setCurrentScreen("scan");
  };

  const handleStartJob = (orderId: string) => {
    const job = jobs.find((j) => j.orderId === orderId || j.id === orderId);
    if (job) {
      setSelectedJob(job);
      setCurrentScreen("details");
    } else {
      toast.error("Job not found");
    }
  };

  const handleBack = () => {
    setCurrentScreen("dashboard");
    setSelectedJob(null);
    fetchJobs(); // Refresh jobs list
  };

  return (
    <div className="min-h-screen">
      {currentScreen === "dashboard" && (
        <JobsDashboard
          jobs={jobs}
          onViewJob={handleViewJob}
          onScanJob={handleScanJob}
        />
      )}

      {currentScreen === "scan" && (
        <ScanJob onBack={handleBack} onStartJob={handleStartJob} />
      )}

      {currentScreen === "details" && selectedJob && (
        <JobDetails job={selectedJob} onBack={handleBack} />
      )}
    </div>
  );
}
