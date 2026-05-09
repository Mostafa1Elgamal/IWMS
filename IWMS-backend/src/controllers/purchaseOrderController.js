const PurchaseOrder = require('../models/PurchaseOrder')

const createPurchaseOrder = async (req, res) => {
  try {
    const { supplierName, material, quantity, unitPrice, notes } = req.body
    const totalPrice = quantity * unitPrice

    const po = await PurchaseOrder.create({
      supplierName,
      material,
      quantity,
      unitPrice,
      totalPrice,
      notes,
      createdBy: req.user._id
    })
    
    res.status(201).json(po)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getPurchaseOrders = async (req, res) => {
  try {
    const pos = await PurchaseOrder.find().populate('createdBy', 'name').sort({ createdAt: -1 })
    res.json(pos)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { status } = req.body
    const updateData = { status }
    if (status === 'Received') updateData.receivedAt = new Date()

    const po = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: 'after' }
    )
    if (!po) return res.status(404).json({ message: 'Purchase Order not found' })

    if (status === 'Received') {
      const Material = require('../models/Material')
      // Case-insensitive search for material
      const materialDoc = await Material.findOne({ 
        name: { $regex: new RegExp(`^${po.material.trim()}$`, 'i') } 
      })
      if (materialDoc) {
        materialDoc.quantity_in_stock += po.quantity
        await materialDoc.save()
      } else {
        await Material.create({
          name: po.material.trim(),
          type: 'Uncategorized',
          supplier_name: po.supplierName,
          quantity_in_stock: po.quantity,
          commercial_price: po.unitPrice,
          cost_per_unit: po.unitPrice,
          min_threshold: 10
        })
      }
    }

    res.json(po)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { createPurchaseOrder, getPurchaseOrders, updatePurchaseOrderStatus }
