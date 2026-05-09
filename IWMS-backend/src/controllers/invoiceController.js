const Invoice = require('../models/Invoice')
const JobOrder = require('../models/JobOrder')
const Payment = require('../models/Payment')
const ActivityLog = require('../models/ActivityLog')

const generateInvoice = async (req, res) => {
  try {
    const { jobOrderId } = req.body
    const order = await JobOrder.findById(jobOrderId).populate('materialsUsed.material')
    if (!order) return res.status(404).json({ message: 'Job order not found' })

    const existingInvoice = await Invoice.findOne({ jobOrder: jobOrderId })
    if (existingInvoice) return res.status(400).json({ message: 'Invoice already exists for this order' })

    let materialsCost = 0
    for (let item of order.materialsUsed) {
      const price = item.material?.commercial_price || item.material?.cost_per_unit || 0
      materialsCost += price * item.quantity
    }

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    const invoice = await Invoice.create({
      jobOrder: jobOrderId,
      amount: materialsCost || order.totalCost,
      materialsCost,
      laborCost: 0,
      paymentStatus: 'unpaid',
      dueDate
    })

    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      actionType: 'invoice_generated',
      targetType: 'invoice',
      targetId: invoice._id,
      description: `Invoice generated manually for order ${jobOrderId}`,
      metadata: { invoiceId: invoice._id, orderId: jobOrderId, amount: invoice.amount }
    })

    res.status(201).json(invoice)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updatePayment = async (req, res) => {
  try {
    const { amountPaid } = req.body
    const invoice = await Invoice.findById(req.params.id)
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' })

    const oldAmountPaid = invoice.amountPaid
    invoice.amountPaid = amountPaid

    if (amountPaid >= invoice.amount) {
      invoice.paymentStatus = 'paid'
    } else if (amountPaid > 0) {
      invoice.paymentStatus = 'partially-paid'
    } else {
      invoice.paymentStatus = 'unpaid'
    }

    invoice.auditLog.push({
      action: 'payment_updated',
      changedBy: req.user._id,
      oldValue: { amountPaid: oldAmountPaid, status: invoice.paymentStatus },
      newValue: { amountPaid, status: invoice.paymentStatus },
      timestamp: new Date()
    })

    await invoice.save()

    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      actionType: 'payment_recorded',
      targetType: 'invoice',
      targetId: invoice._id,
      description: `Invoice payment updated to $${amountPaid}`,
      metadata: { invoiceId: invoice._id, amountPaid, status: invoice.paymentStatus }
    })

    res.json(invoice)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getInvoices = async (req, res) => {
  try {
    const { paymentStatus, startDate, endDate } = req.query
    const filter = {}
    if (paymentStatus) filter.paymentStatus = paymentStatus
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = new Date(startDate)
      if (endDate) filter.createdAt.$lte = new Date(endDate)
    }

    const invoices = await Invoice.find(filter)
      .populate({ path: 'jobOrder', populate: [{ path: 'customer', select: 'name number' }, { path: 'createdBy', select: 'name' }] })
      .sort({ createdAt: -1 })

    // Attach payments for each invoice
    const invoiceIds = invoices.map(i => i._id)
    const payments = await Payment.find({ invoice: { $in: invoiceIds } })
      .populate('recordedBy', 'name role')

    const result = invoices.map(inv => {
      const invPayments = payments.filter(p => p.invoice.toString() === inv._id.toString())
      return {
        ...inv.toObject(),
        payments: invPayments,
        remaining: Math.max(0, inv.amount - inv.amountPaid)
      }
    })

    res.json(result)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const addExtraCharge = async (req, res) => {
  try {
    const { extraCharge, chargeDescription } = req.body
    const invoice = await Invoice.findById(req.params.id)
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' })
    if (extraCharge <= 0) return res.status(400).json({ message: 'Extra charge must be greater than 0' })

    const oldAmount = invoice.amount
    invoice.amount = oldAmount + extraCharge
    invoice.extraCharges.push({ description: chargeDescription || 'Additional service', amount: extraCharge })

    invoice.auditLog.push({
      action: 'extra_charge_added',
      changedBy: req.user._id,
      oldValue: { amount: oldAmount },
      newValue: { amount: invoice.amount, extraCharge, chargeDescription },
      timestamp: new Date()
    })

    await invoice.save()

    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      actionType: 'extra_charge_added',
      targetType: 'invoice',
      targetId: invoice._id,
      description: `Extra charge of $${extraCharge} added: ${chargeDescription || 'Additional service'}`,
      metadata: { invoiceId: invoice._id, extraCharge, chargeDescription }
    })

    res.json(invoice)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const markPaid = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' })

    invoice.amountPaid = invoice.amount
    invoice.paymentStatus = 'paid'
    invoice.auditLog.push({
      action: 'marked_paid',
      changedBy: req.user._id,
      oldValue: { paymentStatus: invoice.paymentStatus },
      newValue: { paymentStatus: 'paid' },
      timestamp: new Date()
    })
    await invoice.save()

    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      actionType: 'invoice_marked_paid',
      targetType: 'invoice',
      targetId: invoice._id,
      description: `Invoice manually marked as fully paid`,
      metadata: { invoiceId: invoice._id, amount: invoice.amount }
    })

    res.json(invoice)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate({ path: 'jobOrder', populate: [{ path: 'customer', select: 'name number address' }, { path: 'materialsUsed.material', select: 'name type' }] })
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' })

    const payments = await Payment.find({ invoice: invoice._id }).populate('recordedBy', 'name role')
    res.json({ ...invoice.toObject(), payments, remaining: Math.max(0, invoice.amount - invoice.amountPaid) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { generateInvoice, updatePayment, getInvoices, getInvoiceById, addExtraCharge, markPaid }