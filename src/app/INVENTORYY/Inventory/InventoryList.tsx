import { useState } from "react";
import { Search, Filter, Edit, Trash2, Plus, Scissors } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

export interface Material {
  id: string;
  name: string;
  category: string;
  quantity: number;
  available: number;
  reserved: number;
  status: "Available" | "Low" | "Out of Stock" | "Cut Off";
  supplier: string;
  unitPrice: number;
  isActive: boolean;
  lastUpdated: string;
  isSheet?: boolean;
  availableCutOffsCount?: number;
  availableCutOffsArea?: number;
}

interface InventoryListProps {
  materials: Material[];
  onEdit: (material: Material) => void;
  onDelete: (id: string) => void;
  onAddMaterial: () => void;
}

export function InventoryList({
  materials,
  onEdit,
  onDelete,
  onAddMaterial,
}: InventoryListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || material.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || material.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800";
      case "Low":
        return "bg-orange-100 text-orange-800";
      case "Out of Stock":
        return "bg-red-100 text-red-800";

      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-3xl font-semibold text-gray-900">
              Inventory List
            </h2>
            <Button onClick={onAddMaterial} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Material
            </Button>
          </div>
          <p className="text-gray-600 mt-1">
            Manage and track all workshop materials
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row gap-4 justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search materials or suppliers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Wood">Wood</SelectItem>
                    <SelectItem value="Metal">Metal</SelectItem>
                    <SelectItem value="Glass">Glass</SelectItem>
                    <SelectItem value="Hardware">Hardware</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Low">Low Stock</SelectItem>
                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Prices</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">
                      {material.name}
                    </TableCell>
                    <TableCell>{material.category}</TableCell>
                    <TableCell>
                      {material.quantity} {material.isSheet ? 'Sheets' : 'Units'}
                    </TableCell>
                    <TableCell>
                      {material.available}
                      {material.isSheet && material.availableCutOffsArea ? (
                        <div className="text-xs text-gray-500 mt-1">
                          + {material.availableCutOffsCount} cut-offs ({(material.availableCutOffsArea / 10000).toFixed(2)}m²)
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Comm: ${material.commercialPrice} {material.isSheet ? '/m²' : ''}</div>
                        <div className="text-gray-500">Cust: ${material.customerPrice} {material.isSheet ? '/m²' : ''}</div>
                      </div>
                    </TableCell>
                    <TableCell>{material.reserved}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(material.status)}>
                        {material.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {material.lastUpdated}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(material)}
                          disabled={material.status === "Cut Off"}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(material.id)}
                          disabled={material.status === "Cut Off"}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                        {/* <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCutOff(material.id)}
                          disabled={material.status === 'Cut Off'}
                          title="Cut Off"
                        >
                          <Scissors className="w-4 h-4 text-red-700" />
                        </Button> */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredMaterials.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  No materials found matching your filters
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
