import { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, Send } from 'lucide-react';
import { getCustomers, type Customer } from './salesService';
import { getMaterials, type Material } from '../INVENTORYY/Inventory/inventoryService';

export interface FinalizeOrderPayload {
  customer: string;
  customerPhone: string;
  product: string;
  materialId: string;
  quantity: number;
  totalCost: number;
  dimensions: { height: number; width: number; thickness: number };
}

export interface FinalizeOrderResult {
  orderId: string;
  qrReference: string;
  qrImageUrl: string;
}

interface CreateOrderScreenProps {
  onBack: () => void;
  onFinalizeOrder: (order: FinalizeOrderPayload) => Promise<FinalizeOrderResult>;
}

type CustomerMode = 'existing' | 'new';

export function CreateOrderScreen({ onBack, onFinalizeOrder }: CreateOrderScreenProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  const [customerMode, setCustomerMode] = useState<CustomerMode>('existing');
  const [existingCustomerId, setExistingCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [thickness, setThickness] = useState('');
  
  const [priceType, setPriceType] = useState<'commercial' | 'customer'>('commercial');

  const [finalizeResult, setFinalizeResult] = useState<FinalizeOrderResult | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custs, mats] = await Promise.all([getCustomers(), getMaterials()]);
        setCustomers(custs);
        setMaterials(mats);
      } catch (err) {
        console.error("Failed to load data for order creation", err);
      }
    };
    fetchData();
  }, []);

  const resolvedCustomer = useMemo(() => {
    if (customerMode === 'existing') {
      const c = customers.find((x) => String(x.id) === existingCustomerId);
      return c ? { id: c.id, name: c.name, phone: c.phone } : { id: '', name: '', phone: '' };
    }
    return {
      id: '',
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
    };
  }, [customerMode, existingCustomerId, newCustomerName, newCustomerPhone, customers]);

  const selectedMaterial = useMemo(() => {
    return materials.find(m => m.id === selectedMaterialId);
  }, [selectedMaterialId, materials]);

  const step1Valid =
    customerMode === 'existing'
      ? Boolean(existingCustomerId)
      : Boolean(newCustomerName.trim() && newCustomerPhone.trim());

  const step2Valid =
    Boolean(selectedMaterialId) &&
    Number(quantity) > 0 &&
    Number(height) > 0 &&
    Number(width) > 0;

  const steps = [
    { number: 1, title: 'Customer', completed: currentStep > 1 },
    { number: 2, title: 'Order details', completed: currentStep > 2 },
    { number: 3, title: 'Confirmation', completed: false },
  ];

  const switchCustomerMode = (mode: CustomerMode) => {
    setError('');
    setCustomerMode(mode);
    if (mode === 'existing') {
      setNewCustomerName('');
      setNewCustomerPhone('');
    } else {
      setExistingCustomerId('');
    }
  };

  const handleNext = () => {
    setError('');
    if (currentStep === 1) {
      if (!step1Valid) {
        setError(customerMode === 'existing' ? 'Please select a customer.' : 'Please enter customer details.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!step2Valid) {
        setError('Please select material and enter dimensions.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevious = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  const selectedPrice = priceType === 'commercial' ? selectedMaterial?.commercialPrice : selectedMaterial?.customerPrice;
  const quantityNum = Number(quantity) || 0;
  
  const lineTotal = useMemo(() => {
    let total = 0;
    if (selectedMaterial?.isSheet) {
       const areaM2 = (Number(height) * Number(width)) / 10000;
       total = quantityNum * areaM2 * (selectedPrice || 0);
    } else {
       total = quantityNum * (selectedPrice || 0);
    }
    return total;
  }, [selectedMaterial, height, width, quantityNum, selectedPrice]);

  const handleSendToCustomer = async () => {
    try {
      setIsLoading(true);
      setError('');
      const result = await onFinalizeOrder({
        customer: resolvedCustomer.id || resolvedCustomer.name,
        customerPhone: resolvedCustomer.phone,
        product: selectedMaterial?.name || 'Custom Job',
        materialId: selectedMaterialId,
        quantity: quantityNum,
        totalCost: lineTotal,
        dimensions: {
          height: Number(height),
          width: Number(width),
          thickness: Number(thickness) || 0
        }
      });
      setFinalizeResult(result);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to finalize order");
    } finally {
      setIsLoading(false);
    }
  };

  if (finalizeResult) {
    return (
      <div className="p-8">
        <div className="max-w-lg mx-auto bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-green-700" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Order created</h2>
          <p className="text-sm text-gray-600 mt-2">
            Order #{finalizeResult.orderId.substring(0, 8)} · {finalizeResult.qrReference}
          </p>
          <div className="mt-6 flex justify-center">
            <img
              src={finalizeResult.qrImageUrl}
              alt="Order QR code"
              className="w-44 h-44 border border-gray-200 rounded-lg bg-white p-2"
            />
          </div>
          <p className="text-xs text-gray-500 mt-4">Scan links this shipment to the order in IWMS.</p>
          <button
            type="button"
            onClick={onBack}
            className="mt-8 w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Back to orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Orders</span>
          </button>
          <h2 className="text-2xl font-semibold text-gray-900">Create new job order</h2>
          <p className="text-sm text-gray-500 mt-1">Step-by-step wizard</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.completed
                          ? 'bg-green-600 text-white'
                          : currentStep === step.number
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {step.completed ? <Check className="w-5 h-5" /> : step.number}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{step.title}</p>
                      <p className="text-xs text-gray-500">Step {step.number}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && <div className="flex-1 h-0.5 bg-gray-200 mx-4" />}
                </div>
              ))}
            </div>
          </div>

          <div className="p-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Customer selection</h3>
                <p className="text-sm text-gray-600">Choose one option only.</p>

                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="customerMode"
                      checked={customerMode === 'existing'}
                      onChange={() => switchCustomerMode('existing')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Select existing customer</span>
                      {customerMode === 'existing' && (
                        <select
                          value={existingCustomerId}
                          onChange={(e) => setExistingCustomerId(e.target.value)}
                          className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select a customer</option>
                          {customers.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                              {c.name} — {c.phone}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="customerMode"
                      checked={customerMode === 'new'}
                      onChange={() => switchCustomerMode('new')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Create new customer</span>
                      {customerMode === 'new' && (
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                            <input
                              type="text"
                              value={newCustomerName}
                              onChange={(e) => setNewCustomerName(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Customer name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Phone *</label>
                            <input
                              type="tel"
                              value={newCustomerPhone}
                              onChange={(e) => setNewCustomerPhone(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Phone number"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Order details</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Material *</label>
                  <select
                    value={selectedMaterialId}
                    onChange={(e) => setSelectedMaterialId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select material</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} 
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Price Type *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="priceType" 
                        checked={priceType === 'commercial'} 
                        onChange={() => setPriceType('commercial')}
                      />
                      <span className="text-sm">Commercial (${selectedMaterial?.commercialPrice || 0}{selectedMaterial?.isSheet ? '/m²' : '/unit'})</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="priceType" 
                        checked={priceType === 'customer'} 
                        onChange={() => setPriceType('customer')}
                      />
                      <span className="text-sm">Customer (${selectedMaterial?.customerPrice || 0}{selectedMaterial?.isSheet ? '/m²' : '/unit'})</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thickness (cm)</label>
                    <input
                      type="number"
                      min={0}
                      value={thickness}
                      onChange={(e) => setThickness(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm) *</label>
                    <input
                      type="number"
                      min={1}
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Width (cm) *</label>
                    <input
                      type="number"
                      min={1}
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 50"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Confirmation</h3>
                <div className="bg-gray-50 rounded-lg p-6 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Customer</span>
                    <span className="font-medium text-gray-900 text-right">{resolvedCustomer.name}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Phone</span>
                    <span className="font-medium text-gray-900 text-right">{resolvedCustomer.phone}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Material</span>
                    <span className="font-medium text-gray-900 text-right">{selectedMaterial?.name}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Dimensions</span>
                    <span className="font-medium text-gray-900">{height} x {width} x {thickness || 0} cm</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Quantity</span>
                    <span className="font-medium text-gray-900">{quantity}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-gray-200 pt-3">
                    <span className="font-semibold text-gray-900">Estimated Total</span>
                    <span className="font-semibold text-blue-600">${lineTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendToCustomer}
                  disabled={isLoading}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:bg-green-400"
                >
                  <Send className="w-4 h-4" />
                  {isLoading ? "Processing..." : "Create Order"}
                </button>
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-between">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={currentStep === 1 ? !step1Valid : !step2Valid}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                  (currentStep === 1 ? !step1Valid : !step2Valid)
                    ? 'bg-blue-300 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
