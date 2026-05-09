const JobOrder = require('../models/JobOrder')
const Material = require('../models/Material')
const CutOff = require('../models/CutOff')
const QRCode = require('qrcode')
const Invoice = require('../models/Invoice')
const ActivityLog = require('../models/ActivityLog')
const Payment = require('../models/Payment')

const createJobOrder = async (req, res) => {
  const { customer, dimensions, materialsUsed, deliveryDate, notes, totalCost } = req.body

  // 1. Check inventory
  let finalMaterialsUsed = [];
  let newCutOffsToCreate = [];
  let calculatedTotalCost = 0;

  for (let item of materialsUsed) {
    const material = await Material.findById(item.material);
    if (!material) return res.status(404).json({ message: `Material not found` });

    calculatedTotalCost += item.quantity * (material.commercial_price || material.cost_per_unit || 0);

    let reqW = dimensions?.width || 0;
    let reqH = dimensions?.height || 0;
    let reqThickness = dimensions?.thickness || 0;

    let quantityRemaining = item.quantity;
    let cutOffsUsed = [];
    let mainStockDeducted = 0;

    while (quantityRemaining > 0) {
      // 1. Try to find a CutOff that fits (check both orientations)
      const availableCutOffs = await CutOff.find({
        material: item.material,
        status: 'available',
        _id: { $nin: cutOffsUsed } 
      });

      let selectedCutOff = null;
      let rotated = false;
      let bestArea = Infinity;

      for (let c of availableCutOffs) {
         let cw = c.dimensions?.width || 0;
         let ch = c.dimensions?.height || 0;
         let fitsNormal = cw >= reqW && ch >= reqH;
         let fitsRotated = cw >= reqH && ch >= reqW;
         
         if (fitsNormal || fitsRotated) {
             let area = cw * ch;
             if (area < bestArea) {
                 bestArea = area;
                 selectedCutOff = c;
                 let normMax = -1;
                 if (fitsNormal) normMax = Math.max((cw - reqW) * ch, reqW * (ch - reqH));
                 let rotMax = -1;
                 if (fitsRotated) rotMax = Math.max((cw - reqH) * ch, reqH * (ch - reqW));
                 rotated = rotMax > normMax;
             }
         }
      }

      if (selectedCutOff) {
        cutOffsUsed.push(selectedCutOff._id);
        
        let cw = selectedCutOff.dimensions.width;
        let ch = selectedCutOff.dimensions.height;
        let cutW = rotated ? reqH : reqW;
        let cutH = rotated ? reqW : reqH;

        // Guillotine cut remnants
        let rem1W = cw - cutW;
        let rem1H = ch;
        let rem2W = cutW;
        let rem2H = ch - cutH;

        // Save remnants if area > 5cm
        if (rem1W > 5 && rem1H > 5) {
            newCutOffsToCreate.push({ material: item.material, dimensions: { width: rem1W, height: rem1H, thickness: reqThickness }});
        }
        if (rem2W > 5 && rem2H > 5) {
            newCutOffsToCreate.push({ material: item.material, dimensions: { width: rem2W, height: rem2H, thickness: reqThickness }});
        }
        quantityRemaining--;
      } else {
        // 2. No cutoff fits -> deduct main stock
        mainStockDeducted++;
        if (material.quantity_in_stock < mainStockDeducted) {
            return res.status(400).json({ message: `Insufficient stock for ${material.name}` });
        }
        
        let sheetW = material.sheetDimensions?.width || 0;
        let sheetH = material.sheetDimensions?.height || 0;
        
        if (sheetW > 0 && sheetH > 0) {
            let fitsNormal = sheetW >= reqW && sheetH >= reqH;
            let fitsRotated = sheetW >= reqH && sheetH >= reqW;

            if (!fitsNormal && !fitsRotated) {
                 return res.status(400).json({ message: `Requested dimensions (${reqW}x${reqH}) are larger than full sheet for ${material.name}` });
            }

            let normMax = -1;
            if (fitsNormal) normMax = Math.max((sheetW - reqW) * sheetH, reqW * (sheetH - reqH));
            let rotMax = -1;
            if (fitsRotated) rotMax = Math.max((sheetW - reqH) * sheetH, reqH * (sheetH - reqW));
            
            let cutW = rotMax > normMax ? reqH : reqW;
            let cutH = rotMax > normMax ? reqW : reqH;

            let rem1W = sheetW - cutW;
            let rem1H = sheetH;
            let rem2W = cutW;
            let rem2H = sheetH - cutH;

            if (rem1W > 5 && rem1H > 5) {
                newCutOffsToCreate.push({ material: item.material, dimensions: { width: rem1W, height: rem1H, thickness: reqThickness }});
            }
            if (rem2W > 5 && rem2H > 5) {
                newCutOffsToCreate.push({ material: item.material, dimensions: { width: rem2W, height: rem2H, thickness: reqThickness }});
            }
        }
        quantityRemaining--;
      }
    }

    if (mainStockDeducted > 0) {
        material.quantity_in_stock -= mainStockDeducted;
        await material.save();
        if(material.quantity_in_stock <= material.min_threshold) {
            console.log(`{Alert ybny}: Material ${material.name} is running low`)
        }
    }

    if (cutOffsUsed.length > 0) {
        await CutOff.updateMany({ _id: { $in: cutOffsUsed } }, { $set: { status: 'used' } });
    }

    finalMaterialsUsed.push({
      material: item.material,
      quantity: item.quantity,
      cutOffUsed: cutOffsUsed,
      mainStockDeducted: mainStockDeducted
    });
  }

  if (newCutOffsToCreate.length > 0) {
      await CutOff.insertMany(newCutOffsToCreate);
  }

  
  const finalTotalCost = totalCost !== undefined ? totalCost : calculatedTotalCost;

  const order = await JobOrder.create({
    customer, dimensions, materialsUsed: finalMaterialsUsed,
    deliveryDate, notes, totalCost: finalTotalCost,
    createdBy: req.user._id
  })

  // 3. Generate QR
  const qrCode = await QRCode.toDataURL(order._id.toString())
  order.qrCode = qrCode
  await order.save()

  // 4. Auto-create Invoice
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  await Invoice.create({
    jobOrder: order._id,
    amount: finalTotalCost,
    materialsCost: finalTotalCost,
    laborCost: 0,
    paymentStatus: 'unpaid',
    dueDate
  })

  // 5. Activity log
  await ActivityLog.create({
    user: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    actionType: 'order_created',
    targetType: 'order',
    targetId: order._id,
    description: `New order created for customer`,
    metadata: { totalCost: finalTotalCost, materialsCount: finalMaterialsUsed.length }
  })

  res.status(201).json(order)
}

const getJobOrders = async (req, res) => {
  const { status } = req.query
  const filter = status ? { status } : {}
  const orders = await JobOrder.find(filter).populate('customer').populate('materialsUsed.material').populate('materialsUsed.cutOffUsed')
  res.json(orders)
}

const updateJobOrderStatus = async (req, res) => {
  try {
    const order = await JobOrder.findById(req.params.id).populate('customer')
    if (!order) return res.status(404).json({ message: 'Order not found' })

    const oldStatus = order.status
    order.status = req.body.status
    await order.save()

    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      actionType: 'order_status_changed',
      targetType: 'order',
      targetId: order._id,
      description: `Order status changed from '${oldStatus}' to '${req.body.status}'`,
      metadata: { oldStatus, newStatus: req.body.status, orderId: order._id }
    })

    res.json(order)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const cancelJobOrder = async (req, res) => {
  const order = await JobOrder.findById(req.params.id)
  if (order.status === 'cancelled')
    return res.status(400).json({ message: 'Already cancelled' })

  // Return materials to stock
  for (let item of order.materialsUsed) {
    if(item.cutOffUsed && item.cutOffUsed.length > 0){
      await CutOff.updateMany(
        { _id: { $in: item.cutOffUsed } },
        { $set: { status: 'available' } }
      )
    }

     
      if(item.mainStockDeducted > 0){
        await Material.findByIdAndUpdate(
          item.material,
          { $inc: { quantity_in_stock: item.mainStockDeducted } }
        )
    }
  }
  order.status = 'cancelled'
  await order.save()
  res.json({ message: 'Order cancelled and materials returned' })
}


const getJobOrderById = async (req, res) => {
  try {
    const order = await JobOrder.findById(req.params.id)
      .populate('customer')
      .populate('createdBy', 'name')
      .populate('materialsUsed.material')
      .populate('materialsUsed.cutOffUsed')
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json(order)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteJobOrder = async (req, res) => {
  try {
    const order = await JobOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status !== 'cancelled') {
      // Return materials to stock
      for (let item of order.materialsUsed) {
        if(item.cutOffUsed && item.cutOffUsed.length > 0){
          await CutOff.updateMany(
            { _id: { $in: item.cutOffUsed } },
            { $set: { status: 'available' } }
          );
        }
        if(item.mainStockDeducted > 0){
          await Material.findByIdAndUpdate(
            item.material,
            { $inc: { quantity_in_stock: item.mainStockDeducted } }
          );
        }
      }
    }

    await JobOrder.findByIdAndDelete(req.params.id);
    await Invoice.findOneAndDelete({ jobOrder: req.params.id });
    await Payment.deleteMany({ jobOrder: req.params.id });

    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      actionType: 'order_deleted',
      targetType: 'order',
      targetId: req.params.id,
      description: `Order deleted`,
      metadata: { orderId: req.params.id }
    })

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

const confirmDelivery = async (req, res) => {
  try {
    const { paymentAmount, paymentMethod, notes } = req.body
    const order = await JobOrder.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    if (!['technician-completed', 'ready-for-delivery', 'delivery-pending'].includes(order.status)) {
      return res.status(400).json({ message: 'Order is not ready for delivery confirmation' })
    }

    const invoice = await Invoice.findOne({ jobOrder: order._id })
    if (!invoice) return res.status(404).json({ message: 'Invoice not found for this order' })

    // Collect remaining payment if provided
    if (paymentAmount && paymentAmount > 0) {
      const remaining = invoice.amount - invoice.amountPaid
      if (paymentAmount > remaining + 0.01) {
        return res.status(400).json({ message: `Payment of $${paymentAmount} exceeds remaining balance of $${remaining.toFixed(2)}` })
      }
      if (!paymentMethod) {
        return res.status(400).json({ message: 'Payment method is required when collecting payment' })
      }

      // Record payment
      const payment = await Payment.create({
        invoice: invoice._id,
        jobOrder: order._id,
        amount: paymentAmount,
        method: paymentMethod,
        recordedBy: req.user._id,
        notes: notes || 'Collected at delivery'
      })

      invoice.amountPaid = (invoice.amountPaid || 0) + paymentAmount
      invoice.auditLog.push({
        action: 'payment_at_delivery',
        changedBy: req.user._id,
        oldValue: { amountPaid: invoice.amountPaid - paymentAmount },
        newValue: { amountPaid: invoice.amountPaid, method: paymentMethod },
        timestamp: new Date()
      })
    }

    // Check final payment status
    const remaining = invoice.amount - invoice.amountPaid
    if (remaining > 0.01) {
      return res.status(400).json({
        message: `Cannot confirm delivery. There is still a remaining balance of $${remaining.toFixed(2)}`,
        remaining
      })
    }

    // Fully paid
    invoice.paymentStatus = 'paid'
    await invoice.save()

    // Confirm delivery
    order.status = 'delivered'
    order.deliveryConfirmedBy = req.user._id
    order.deliveryConfirmedAt = new Date()
    order.deliveryNotes = notes || ''
    await order.save()

    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      actionType: 'delivery_confirmed',
      targetType: 'order',
      targetId: order._id,
      description: `Delivery confirmed by ${req.user.name}. Payment completed.`,
      metadata: {
        orderId: order._id,
        invoiceId: invoice._id,
        totalAmount: invoice.amount,
        collectedAtDelivery: paymentAmount || 0,
        paymentMethod: paymentMethod || 'N/A',
        notes: notes || ''
      }
    })

    res.json({ message: 'Delivery confirmed successfully', order, invoice })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updateJobOrder = async (req, res) => {
  try {
    const { customer, dimensions, materialsUsed, deliveryDate, notes, totalCost, status } = req.body;
    const order = await JobOrder.findById(req.params.id);
    
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Step 1: Revert old inventory if we are replacing materials
    // To simplify, we always revert the old inventory and apply the new one.
    if (order.status !== 'cancelled') {
      for (let item of order.materialsUsed) {
        if(item.cutOffUsed && item.cutOffUsed.length > 0){
          await CutOff.updateMany(
            { _id: { $in: item.cutOffUsed } },
            { $set: { status: 'available' } }
          );
        }
        if(item.mainStockDeducted > 0){
          await Material.findByIdAndUpdate(
            item.material,
            { $inc: { quantity_in_stock: item.mainStockDeducted } }
          );
        }
      }
    }

    // Step 2: Apply new inventory deductions
    let finalMaterialsUsed = [];
    let newCutOffsToCreate = [];
    let calculatedTotalCost = 0;

    for (let item of materialsUsed) {
      const material = await Material.findById(item.material);
      if (!material) return res.status(404).json({ message: `Material not found` });

      calculatedTotalCost += item.quantity * (material.commercial_price || material.cost_per_unit || 0);

      let reqW = dimensions?.width || 0;
      let reqH = dimensions?.height || 0;
      let reqThickness = dimensions?.thickness || 0;

      let quantityRemaining = item.quantity;
      let cutOffsUsed = [];
      let mainStockDeducted = 0;

      while (quantityRemaining > 0) {
        const availableCutOffs = await CutOff.find({
          material: item.material,
          status: 'available',
          _id: { $nin: cutOffsUsed } 
        });

        let selectedCutOff = null;
        let rotated = false;
        let bestArea = Infinity;

        for (let c of availableCutOffs) {
           let cw = c.dimensions?.width || 0;
           let ch = c.dimensions?.height || 0;
           let fitsNormal = cw >= reqW && ch >= reqH;
           let fitsRotated = cw >= reqH && ch >= reqW;
           
           if (fitsNormal || fitsRotated) {
               let area = cw * ch;
               if (area < bestArea) {
                   bestArea = area;
                   selectedCutOff = c;
                   let normMax = -1;
                   if (fitsNormal) normMax = Math.max((cw - reqW) * ch, reqW * (ch - reqH));
                   let rotMax = -1;
                   if (fitsRotated) rotMax = Math.max((cw - reqH) * ch, reqH * (ch - reqW));
                   rotated = rotMax > normMax;
               }
           }
        }

        if (selectedCutOff) {
          cutOffsUsed.push(selectedCutOff._id);
          
          let cw = selectedCutOff.dimensions.width;
          let ch = selectedCutOff.dimensions.height;
          let cutW = rotated ? reqH : reqW;
          let cutH = rotated ? reqW : reqH;

          let rem1W = cw - cutW;
          let rem1H = ch;
          let rem2W = cutW;
          let rem2H = ch - cutH;

          if (rem1W > 5 && rem1H > 5) {
              newCutOffsToCreate.push({ material: item.material, dimensions: { width: rem1W, height: rem1H, thickness: reqThickness }});
          }
          if (rem2W > 5 && rem2H > 5) {
              newCutOffsToCreate.push({ material: item.material, dimensions: { width: rem2W, height: rem2H, thickness: reqThickness }});
          }
          quantityRemaining--;
        } else {
          mainStockDeducted++;
          if (material.quantity_in_stock < mainStockDeducted) {
              return res.status(400).json({ message: `Insufficient stock for ${material.name}` });
          }
          
          let sheetW = material.sheetDimensions?.width || 0;
          let sheetH = material.sheetDimensions?.height || 0;
          
          if (sheetW > 0 && sheetH > 0) {
              let fitsNormal = sheetW >= reqW && sheetH >= reqH;
              let fitsRotated = sheetW >= reqH && sheetH >= reqW;

              if (!fitsNormal && !fitsRotated) {
                   return res.status(400).json({ message: `Requested dimensions (${reqW}x${reqH}) are larger than full sheet for ${material.name}` });
              }

              let normMax = -1;
              if (fitsNormal) normMax = Math.max((sheetW - reqW) * sheetH, reqW * (sheetH - reqH));
              let rotMax = -1;
              if (fitsRotated) rotMax = Math.max((sheetW - reqH) * sheetH, reqH * (sheetH - reqW));
              
              let cutW = rotMax > normMax ? reqH : reqW;
              let cutH = rotMax > normMax ? reqW : reqH;

              let rem1W = sheetW - cutW;
              let rem1H = sheetH;
              let rem2W = cutW;
              let rem2H = sheetH - cutH;

              if (rem1W > 5 && rem1H > 5) {
                  newCutOffsToCreate.push({ material: item.material, dimensions: { width: rem1W, height: rem1H, thickness: reqThickness }});
              }
              if (rem2W > 5 && rem2H > 5) {
                  newCutOffsToCreate.push({ material: item.material, dimensions: { width: rem2W, height: rem2H, thickness: reqThickness }});
              }
          }
          quantityRemaining--;
        }
      }

      if (mainStockDeducted > 0) {
          material.quantity_in_stock -= mainStockDeducted;
          await material.save();
      }

      if (cutOffsUsed.length > 0) {
          await CutOff.updateMany({ _id: { $in: cutOffsUsed } }, { $set: { status: 'used' } });
      }

      finalMaterialsUsed.push({
        material: item.material,
        quantity: item.quantity,
        cutOffUsed: cutOffsUsed,
        mainStockDeducted: mainStockDeducted
      });
    }

    if (newCutOffsToCreate.length > 0) {
        await CutOff.insertMany(newCutOffsToCreate);
    }

    const finalTotalCost = totalCost !== undefined ? totalCost : calculatedTotalCost;

    // Step 3: Update Order Document
    order.customer = customer;
    order.dimensions = dimensions;
    order.materialsUsed = finalMaterialsUsed;
    order.deliveryDate = deliveryDate;
    order.notes = notes;
    order.totalCost = finalTotalCost;
    if (status) order.status = status;
    
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = { createJobOrder, getJobOrders, getJobOrderById, updateJobOrderStatus, cancelJobOrder, deleteJobOrder, updateJobOrder, confirmDelivery }