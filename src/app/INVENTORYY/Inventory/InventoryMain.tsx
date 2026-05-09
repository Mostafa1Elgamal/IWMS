import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { InventoryDashboard } from "./InventoryDashboard";
import { InventoryList, type Material } from "./InventoryList";

import { AlertsScreen } from "./AlertsScreen";
import { CutOffMaterials } from "./CutOffMaterials";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { getMaterials, addMaterial as apiAddMaterial, updateMaterial as apiUpdateMaterial, deleteMaterial as apiDeleteMaterial } from "./inventoryService";
import { toast } from "sonner";

type Screen = "dashboard" | "inventory" | "add" | "edit" | "alerts" | "cutoffs";

export default function InventoryMain() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    category: "",
    quantity: "",
    commercialPrice: "",
    customerPrice: "",
    supplier: "",
    isSheet: false,
    sheetWidth: "",
    sheetHeight: "",
  });
  const [addMaterialError, setAddMaterialError] = useState("");
  const [editingMaterial, setEditingMaterial] = useState<
    Material | undefined
  >();

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const data = await getMaterials();
      setMaterials(data);
    } catch (error) {
      console.error("Failed to fetch materials", error);
      toast.error("Failed to load inventory data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen as Screen);
    if (screen !== "edit") {
      setEditingMaterial(undefined);
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setNewMaterial({
      name: material.name,
      category: material.category,
      quantity: String(material.quantity),
      commercialPrice: String(material.commercialPrice || 0),
      customerPrice: String(material.customerPrice || 0),
      supplier: material.supplier,
      isSheet: material.isSheet || false,
      sheetWidth: material.sheetDimensions?.width ? String(material.sheetDimensions.width) : "",
      sheetHeight: material.sheetDimensions?.height ? String(material.sheetDimensions.height) : "",
    });
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      try {
        await apiDeleteMaterial(id);
        toast.success("Material deleted successfully");
        fetchMaterials();
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to delete material");
      }
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMaterialError("");
    const quantity = Number(newMaterial.quantity);
    const commercialPrice = Number(newMaterial.commercialPrice);
    const customerPrice = Number(newMaterial.customerPrice);
    if (!newMaterial.name.trim() || !newMaterial.category.trim()) {
      setAddMaterialError("Material name and category are required.");
      return;
    }
    if (Number.isNaN(quantity) || quantity < 0) {
      setAddMaterialError("Quantity must be a number ≥ 0.");
      return;
    }
    if (Number.isNaN(commercialPrice) || commercialPrice < 0 || Number.isNaN(customerPrice) || customerPrice < 0) {
      setAddMaterialError("Prices must be numbers ≥ 0.");
      return;
    }

    try {
      const materialData: any = {
        name: newMaterial.name.trim(),
        type: newMaterial.category.trim(),
        quantity_in_stock: quantity,
        commercial_price: commercialPrice,
        customer_price: customerPrice,
        cost_per_unit: commercialPrice, // fallback
        supplier_name: newMaterial.supplier.trim() || "N/A",
      };

      if (newMaterial.isSheet) {
        materialData.sheetDimensions = {
          width: Number(newMaterial.sheetWidth) || 0,
          height: Number(newMaterial.sheetHeight) || 0,
        };
      }

      if (editingMaterial) {
        await apiUpdateMaterial(editingMaterial.id, materialData);
        toast.success("Material updated successfully");
      } else {
        await apiAddMaterial(materialData);
        toast.success("Material added successfully");
      }

      fetchMaterials();
      setIsAddModalOpen(false);
      setEditingMaterial(undefined);
      setNewMaterial({
        name: "",
        category: "",
        quantity: "",
        commercialPrice: "",
        customerPrice: "",
        supplier: "",
        isSheet: false,
        sheetWidth: "",
        sheetHeight: "",
      });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Operation failed";
      setAddMaterialError(message);
    }
  };

  const handleCutOff = (id: string) => {
    setMaterials((prev) =>
      prev.map((material) =>
        material.id === id
          ? {
              ...material,
              isActive: false,
              status: "Cut Off",
              available: 0,
              lastUpdated: new Date().toISOString().split("T")[0],
            }
          : material,
      ),
    );
  };



  const handleViewMaterial = (material: Material) => {
    handleEdit(material);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentScreen={currentScreen} onNavigate={handleNavigate} />

      {currentScreen === "dashboard" && <InventoryDashboard />}

      {currentScreen === "inventory" && (
        <InventoryList
          materials={materials}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCutOff={handleCutOff}
          onAddMaterial={() => {
            setEditingMaterial(undefined);
            setNewMaterial({
              name: "",
              category: "",
              quantity: "",
              commercialPrice: "",
              customerPrice: "",
              supplier: "",
              isSheet: false,
              sheetWidth: "",
              sheetHeight: "",
            });
            setAddMaterialError("");
            setIsAddModalOpen(true);
          }}
        />
      )}

      {currentScreen === "alerts" && (
        <AlertsScreen
          materials={materials}
          onViewMaterial={handleViewMaterial}
        />
      )}

      {currentScreen === "cutoffs" && <CutOffMaterials />}

      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) {
            setAddMaterialError("");
            setEditingMaterial(undefined);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMaterial ? "Edit Material" : "Add Material"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMaterial} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material-name">Material name *</Label>
              <Input
                id="material-name"
                value={newMaterial.name}
                onChange={(e) =>
                  setNewMaterial((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="material-category">Category *</Label>
              <Input
                id="material-category"
                value={newMaterial.category}
                onChange={(e) =>
                  setNewMaterial((prev) => ({ ...prev, category: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="material-quantity">Quantity *</Label>
              <Input
                id="material-quantity"
                type="number"
                min={0}
                value={newMaterial.quantity}
                onChange={(e) =>
                  setNewMaterial((prev) => ({ ...prev, quantity: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commercial-price">Commercial Price {newMaterial.isSheet ? "(per m²)" : ""} *</Label>
                <Input
                  id="commercial-price"
                  type="number"
                  min={0}
                  value={newMaterial.commercialPrice}
                  onChange={(e) =>
                    setNewMaterial((prev) => ({ ...prev, commercialPrice: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-price">Customer Price {newMaterial.isSheet ? "(per m²)" : ""} *</Label>
                <Input
                  id="customer-price"
                  type="number"
                  min={0}
                  value={newMaterial.customerPrice}
                  onChange={(e) =>
                    setNewMaterial((prev) => ({ ...prev, customerPrice: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 py-2">
              <input
                type="checkbox"
                id="is-sheet"
                checked={newMaterial.isSheet}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, isSheet: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <Label htmlFor="is-sheet" className="font-medium">Material is a Sheet</Label>
            </div>

            {newMaterial.isSheet && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sheet-width">Width (cm)</Label>
                  <Input
                    id="sheet-width"
                    type="number"
                    min={0}
                    value={newMaterial.sheetWidth}
                    onChange={(e) =>
                      setNewMaterial((prev) => ({ ...prev, sheetWidth: e.target.value }))
                    }
                    required={newMaterial.isSheet}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sheet-height">Height (cm)</Label>
                  <Input
                    id="sheet-height"
                    type="number"
                    min={0}
                    value={newMaterial.sheetHeight}
                    onChange={(e) =>
                      setNewMaterial((prev) => ({ ...prev, sheetHeight: e.target.value }))
                    }
                    required={newMaterial.isSheet}
                  />
                </div>
              </div>
            )}
            
            {addMaterialError && (
              <p className="text-sm text-red-600">{addMaterialError}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="material-supplier">Supplier (optional)</Label>
              <Input
                id="material-supplier"
                value={newMaterial.supplier}
                onChange={(e) =>
                  setNewMaterial((prev) => ({ ...prev, supplier: e.target.value }))
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setAddMaterialError("");
                  setEditingMaterial(undefined);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{editingMaterial ? "Update" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
