import { useState, useEffect } from "react";
import { Scissors, Check, Lock, Trash2, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { getCutOffs, createCutOff, updateCutOffStatus, getMaterials, type CutOff, type Material } from "./inventoryService";
import { toast } from "sonner";

export function CutOffMaterials() {
  const [cutOffs, setCutOffs] = useState<CutOff[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCutOff, setNewCutOff] = useState({
    materialId: "",
    width: "",
    height: "",
    thickness: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [cutOffsData, materialsData] = await Promise.all([
        getCutOffs(),
        getMaterials()
      ]);
      setCutOffs(cutOffsData);
      setMaterials(materialsData);
    } catch (error) {
      console.error("Failed to load cut-offs", error);
      toast.error("Failed to load cut-offs data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateCutOffStatus(id, status);
      toast.success(`Cut-off marked as ${status}`);
      fetchData();
    } catch (error) {
      toast.error(`Failed to update status`);
    }
  };

  const handleAddCutOff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCutOff({
        material: newCutOff.materialId,
        dimensions: {
          width: Number(newCutOff.width),
          height: Number(newCutOff.height),
          thickness: Number(newCutOff.thickness),
        },
        status: "available"
      });
      toast.success("Cut-off added successfully");
      setIsAddModalOpen(false);
      setNewCutOff({ materialId: "", width: "", height: "", thickness: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add cut-off");
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800";
      case "Reserved":
        return "bg-blue-100 text-blue-800";
      case "Used":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const availableCount = cutOffs.filter(
    (c) => c.status === "Available" || c.status === "available",
  ).length;
  const reservedCount = cutOffs.filter(
    (c) => c.status === "Reserved" || c.status === "reserved",
  ).length;
  const totalArea = cutOffs
    .filter((c) => c.status !== "Used" && c.status !== "used")
    .reduce((sum, c) => sum + (c.width * c.height) / 10000, 0);

  if (isLoading) {
    return <div className="p-8 text-center">Loading cut-offs...</div>;
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900">
                Cut-Off Materials
              </h2>
              <p className="text-gray-600 mt-1">
                Track and manage material remnants and offcuts
              </p>
            </div>
            <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Cut-Off
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Scissors className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Available</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {availableCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Reserved</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {reservedCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Scissors className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Area
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {totalArea.toFixed(2)} m²
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Remnants Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Dimensions (cm)</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cutOffs.map((cutoff) => (
                  <TableRow key={cutoff.id}>
                    <TableCell className="font-medium">
                      {cutoff.material}
                    </TableCell>
                    <TableCell>
                      {cutoff.width} × {cutoff.height} × {cutoff.thickness}
                    </TableCell>
                    <TableCell>
                      {((cutoff.width * cutoff.height) / 10000).toFixed(2)} m²
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(cutoff.status)}>
                        {cutoff.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{cutoff.location}</TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {cutoff.createdDate}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {cutoff.status !== "Used" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Mark as used"
                              onClick={() => handleUpdateStatus(cutoff.id, 'used')}
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </Button>
                            {cutoff.status !== "Reserved" && (
                              <Button variant="ghost" size="sm" title="Reserve" onClick={() => handleUpdateStatus(cutoff.id, 'reserved')}>
                                <Lock className="w-4 h-4 text-blue-600" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" title="Dispose" onClick={() => handleUpdateStatus(cutoff.id, 'used')}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Oak Wood</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {
                    cutOffs.filter(
                      (c) => c.material.includes("Oak") && c.status !== "Used",
                    ).length
                  }{" "}
                  pieces
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Walnut</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {
                    cutOffs.filter(
                      (c) => c.material.includes("Walnut") && c.status !== "Used",
                    ).length
                  }{" "}
                  pieces
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Maple</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {
                    cutOffs.filter(
                      (c) => c.material.includes("Maple") && c.status !== "Used",
                    ).length
                  }{" "}
                  pieces
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Pine</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {
                    cutOffs.filter(
                      (c) => c.material.includes("Pine") && c.status !== "Used",
                    ).length
                  }{" "}
                  pieces
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cut-Off Material</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCutOff} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material">Source Material *</Label>
              <Select
                value={newCutOff.materialId}
                onValueChange={(value) => setNewCutOff(prev => ({ ...prev, materialId: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width">Width (cm) *</Label>
                <Input
                  id="width"
                  type="number"
                  min={1}
                  required
                  value={newCutOff.width}
                  onChange={(e) => setNewCutOff(prev => ({ ...prev, width: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm) *</Label>
                <Input
                  id="height"
                  type="number"
                  min={1}
                  required
                  value={newCutOff.height}
                  onChange={(e) => setNewCutOff(prev => ({ ...prev, height: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thickness">Thickness (cm) *</Label>
              <Input
                id="thickness"
                type="number"
                min={0}
                required
                value={newCutOff.thickness}
                onChange={(e) => setNewCutOff(prev => ({ ...prev, thickness: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Cut-Off</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
