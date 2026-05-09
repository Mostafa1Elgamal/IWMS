import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../components/ui/select";
import type { Material } from "./InventoryList";

interface MaterialFormProps {
  material?: Material;
  onSave: (material: Partial<Material>) => void;
  onCancel: () => void;
}

export function MaterialForm({
  material,
  onSave,
  onCancel,
}: MaterialFormProps) {
  const [formData, setFormData] = useState({
    name: material?.name || "",
    category: material?.category || "",
    quantity: material?.quantity || 0,
    available: material?.available || 0,
    reserved: material?.reserved || 0,
    unitPrice: material?.unitPrice || 0,
    supplier: material?.supplier || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      status:
        formData.quantity === 0
          ? "Out of Stock"
          : formData.available === 0
            ? "Low"
            : "Available",
      isActive: true,
      lastUpdated: new Date().toLocaleDateString(),
    });
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="p-8">
        <Button variant="ghost" onClick={onCancel} className="gap-2 mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Inventory
        </Button>

        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-gray-900">
            {material ? "Edit Material" : "Add New Material"}
          </h2>
          <p className="text-gray-600 mt-1">
            {material
              ? "Update material information"
              : "Add a new material to inventory"}
          </p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Material Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Material Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g., Oak Wood Planks"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleChange("category", value)}
                    required
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Wood">Wood</SelectItem>
                      <SelectItem value="Metal">Metal</SelectItem>
                      <SelectItem value="Glass">Glass</SelectItem>
                      <SelectItem value="Hardware">Hardware</SelectItem>
                      <SelectItem value="Finishing">Finishing</SelectItem>
                      <SelectItem value="Adhesives">Adhesives</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Current Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) =>
                      handleChange("quantity", parseInt(e.target.value) || 0)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="available">Available *</Label>
                  <Input
                    id="available"
                    type="number"
                    min="0"
                    value={formData.available}
                    onChange={(e) =>
                      handleChange("available", parseInt(e.target.value) || 0)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reserved">Reserved *</Label>
                  <Input
                    id="reserved"
                    type="number"
                    min="0"
                    value={formData.reserved}
                    onChange={(e) =>
                      handleChange("reserved", parseInt(e.target.value) || 0)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price *</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) =>
                      handleChange("unitPrice", parseInt(e.target.value) || 0)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => handleChange("supplier", e.target.value)}
                    placeholder="e.g., TimberCo Ltd"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {material ? "Update Material" : "Add Material"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
