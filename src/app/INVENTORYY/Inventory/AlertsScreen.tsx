import { AlertTriangle, Archive, Package, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button'
import type { Material } from './InventoryList';

interface AlertsScreenProps {
  materials: Material[];
  onViewMaterial: (material: Material) => void;
}

export function AlertsScreen({ materials, onViewMaterial }: AlertsScreenProps) {
  const lowStockMaterials = materials.filter(m => m.status === 'Low');
  const outOfStockMaterials = materials.filter(m => m.status === 'Out of Stock');
  const deadStockMaterials = materials.filter(m => {
    return m.quantity > 0 && m.lastUpdated &&
           new Date().getTime() - new Date(m.lastUpdated).getTime() > 90 * 24 * 60 * 60 * 1000;
  });

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-gray-900">Inventory Alerts</h2>
          <p className="text-gray-600 mt-1">Critical notifications and stock warnings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-900">Low Stock Alerts</p>
                  <p className="text-2xl font-semibold text-orange-600">{lowStockMaterials.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-900">Out of Stock</p>
                  <p className="text-2xl font-semibold text-red-600">{outOfStockMaterials.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Archive className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-900">Dead Stock</p>
                  <p className="text-2xl font-semibold text-purple-600">{deadStockMaterials.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {lowStockMaterials.length > 0 && (
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <AlertTriangle className="w-5 h-5" />
                  Low Stock Materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockMaterials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-4 bg-orange-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-gray-900">{material.name}</h4>
                          <Badge variant="outline" className="bg-orange-100 text-orange-800">
                            {material.category}
                          </Badge>
                        </div>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                          <span>Current: {material.quantity}</span>
                          <span>•</span>
                          <span>Available: {material.available}</span>
                          <span>•</span>
                          <span>Supplier: {material.supplier}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewMaterial(material)}
                      >
                        Reorder
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {outOfStockMaterials.length > 0 && (
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <Package className="w-5 h-5" />
                  Out of Stock Materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {outOfStockMaterials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-4 bg-red-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-gray-900">{material.name}</h4>
                          <Badge variant="outline" className="bg-red-100 text-red-800">
                            Urgent
                          </Badge>
                        </div>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                          <span>Supplier: {material.supplier}</span>
                          <span>•</span>
                          <span>Category: {material.category}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewMaterial(material)}
                        className="border-red-300 text-red-700 hover:bg-red-100"
                      >
                        Order Now
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {deadStockMaterials.length > 0 && (
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <TrendingDown className="w-5 h-5" />
                  Dead Stock - No Movement in 90+ Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deadStockMaterials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-4 bg-purple-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-gray-900">{material.name}</h4>
                          <Badge variant="outline" className="bg-purple-100 text-purple-800">
                            Review Required
                          </Badge>
                        </div>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                          <span>Quantity: {material.quantity}</span>
                          <span>•</span>
                          <span>Last Updated: {material.lastUpdated}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewMaterial(material)}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {lowStockMaterials.length === 0 && outOfStockMaterials.length === 0 && deadStockMaterials.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">All Clear!</h3>
                <p className="text-gray-600">No critical alerts at this time</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
