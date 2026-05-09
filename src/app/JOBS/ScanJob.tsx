import { useState } from "react";
import { ArrowLeft, ScanLine } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";

interface ScanJobProps {
  onBack: () => void;
  onStartJob: (orderId: string) => void;
}

export function ScanJob({ onBack, onStartJob }: ScanJobProps) {
  const [orderId, setOrderId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      onStartJob(orderId.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="gap-2 mb-4 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <h1 className="text-2xl font-semibold text-gray-900">Scan Job</h1>
          <p className="text-sm text-gray-600 mt-1">
            Scan QR code or enter order ID manually
          </p>
        </div>

        <div className="space-y-6">
          <Card className="border-2 border-dashed border-gray-300 bg-white">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <ScanLine className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">
                  QR Code Scanner
                </h3>
                <p className="text-sm text-gray-600">
                  Position QR code within frame
                </p>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800">
                    Camera access required
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 text-gray-500">OR</span>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="orderId"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Enter Order ID
                  </label>
                  <Input
                    id="orderId"
                    type="text"
                    placeholder="e.g., WO-2024-001"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="text-base"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!orderId.trim()}
                >
                  Start Job
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
