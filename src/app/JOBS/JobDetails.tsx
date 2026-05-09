import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, Circle, Clock, Package } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import type { Job } from "./JobsDashboard";
import { scanJob, getProductionLogs } from "./productionService";
import { toast } from "sonner";

interface JobDetailsProps {
  job: Job;
  onBack: () => void;
}

interface Stage {
  id: string;
  name: string;
  status: "pending" | "in-progress" | "completed";
}

export function JobDetails({ job, onBack }: JobDetailsProps) {
  const [stages, setStages] = useState<Stage[]>([
    { id: "cutting", name: "Cutting", status: "pending" },
    { id: "polishing", name: "Polishing", status: "pending" },
    { id: "engraving", name: "Engraving", status: "pending" },
    { id: "assembly", name: "Assembly", status: "pending" },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProductionLogs();
  }, [job.id]);

  const fetchProductionLogs = async () => {
    try {
      const logs = await getProductionLogs(job.id);
      setStages(prev => prev.map(stage => {
        const stageLogs = logs.filter((l: any) => l.workstation.toLowerCase() === stage.id.toLowerCase());
        if (stageLogs.some((l: any) => l.status === 'completed')) {
          return { ...stage, status: 'completed' };
        }
        if (stageLogs.some((l: any) => l.status === 'in-progress')) {
          return { ...stage, status: 'in-progress' };
        }
        return { ...stage, status: 'pending' };
      }));
    } catch (error) {
      console.error("Failed to fetch production logs", error);
    }
  };

  const completedCount = stages.filter((s) => s.status === "completed").length;
  const progressPercentage = (completedCount / stages.length) * 100;

  const handleStartStage = async (stageId: string) => {
    try {
      setIsLoading(true);
      await scanJob(job.id, stageId, 'start');
      toast.success(`Started ${stageId} stage`);
      fetchProductionLogs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to start ${stageId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteStage = async (stageId: string) => {
    try {
      setIsLoading(true);
      await scanJob(job.id, stageId, 'complete');
      toast.success(`Completed ${stageId} stage`);
      fetchProductionLogs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to complete ${stageId}`);
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="gap-2 mb-4 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {job.orderId}
              </h1>
              <p className="text-sm text-gray-600 mt-1">{job.product}</p>
            </div>
            <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Deadline</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{job.deadline}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <Badge
                    variant="outline"
                    className={`mt-1 ${
                      job.priority === "High"
                        ? "bg-red-100 text-red-800"
                        : job.priority === "Medium"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {job.priority}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Product Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Type</p>
                      <p className="font-medium mt-1">Custom Cabinet Door</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Material</p>
                      <p className="font-medium mt-1">Oak Wood</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Dimensions</p>
                      <p className="font-medium mt-1">800mm × 400mm × 18mm</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Finish</p>
                      <p className="font-medium mt-1">Matte Lacquer</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-gray-600 text-sm">Notes</p>
                    <p className="text-sm mt-1">
                      Handle grooves on left side, grain direction horizontal
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Production Stages</CardTitle>
                <span className="text-sm text-gray-600">
                  {completedCount} of {stages.length} completed
                </span>
              </div>
              <Progress value={progressPercentage} className="mt-3" />
            </CardHeader>
            <CardContent className="space-y-3">
              {stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className={`p-4 rounded-lg border-2 ${
                    stage.status === "completed"
                      ? "bg-green-50 border-green-200"
                      : stage.status === "in-progress"
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      {stage.status === "completed" ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                      ) : stage.status === "in-progress" ? (
                        <div className="w-6 h-6 rounded-full border-4 border-blue-600 flex-shrink-0" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {stage.name}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {stage.status.replace("-", " ")}
                        </p>
                      </div>
                    </div>

                    {stage.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartStage(stage.id)}
                      >
                        Start Stage
                      </Button>
                    )}

                    {stage.status === "in-progress" && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteStage(stage.id)}
                      >
                        Complete Stage
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
