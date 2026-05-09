const Payment = require('../models/Payment')
const Invoice = require('../models/Invoice')
const JobOrder = require('../models/JobOrder')
const ActivityLog = require('../models/ActivityLog')

// Helper: recalc invoice + order payment status after a payment
const syncPaymentStatus = async (invoice, jobOrder, user) => {
  const wasStatus = invoice.paymentStatus
  if (invoice.amountPaid >= invoice.amount) {
    invoice.paymentStatus = 'paid'
    jobOrder.status = 'fully-paid'
  } else if (invoice.amountPaid > 0) {
    invoice.paymentStatus = 'partially-paid'
    jobOrder.status = 'partially-paid'
  } else {
    invoice.paymentStatus = 'unpaid'
  }
  await invoice.save()
  await jobOrder.save()
}

const recordPayment = async (req, res) => {
  try {
    const { invoiceId, amount, method, notes } = req.body

    const invoice = await Invoice.findById(invoiceId).populate('jobOrder')
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' })

    const jobOrder = await JobOrder.findById(invoice.jobOrder._id || invoice.jobOrder)
    if (!jobOrder) return res.status(404).json({ message: 'Order not found' })

    if (amount <= 0) return res.status(400).json({ message: 'Payment amount must be greater than 0' })

    const remaining = invoice.amount - invoice.amountPaid
    if (amount > remaining + 0.01) {
      return res.status(400).json({ message: `Amount exceeds remaining balance of $${remaining.toFixed(2)}` })
    }

    // Create Payment record
    const payment = await Payment.create({
      invoice: invoice._id,
      jobOrder: jobOrder._id,
      amount,
      method,
      recordedBy: req.user._id,
      notes: notes || ''
    })

    // Update invoice paid total
    invoice.amountPaid = (invoice.amountPaid || 0) + amount
    invoice.auditLog.push({
      action: 'payment_recorded',
      changedBy: req.user._id,
      oldValue: { amountPaid: invoice.amountPaid - amount, status: invoice.paymentStatus },
      newValue: { amountPaid: invoice.amountPaid, amount, method },
      timestamp: new Date()
    })

    await syncPaymentStatus(invoice, jobOrder, req.user)

    // ActivityLog
    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      actionType: 'payment_recorded',
      targetType: 'payment',
      targetId: payment._id,
      description: `Payment of $${amount} recorded via ${method} for order ${jobOrder._id}`,
      metadata: { invoiceId: invoice._id, orderId: jobOrder._id, amount, method, remaining: invoice.amount - invoice.amountPaid }
    })

    res.status(201).json({ payment, invoice, jobOrder })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getPayments = async (req, res) => {
  try {
    const { method, startDate, endDate, invoiceId } = req.query
    const filter = {}
    if (method) filter.method = method
    if (invoiceId) filter.invoice = invoiceId
    if (startDate || endDate) {
      filter.paidAt = {}
      if (startDate) filter.paidAt.$gte = new Date(startDate)
      if (endDate) filter.paidAt.$lte = new Date(endDate)
    }

    const payments = await Payment.find(filter)
      .populate('recordedBy', 'name role')
      .populate({ path: 'invoice', populate: { path: 'jobOrder', populate: { path: 'customer', select: 'name' } } })
      .sort({ paidAt: -1 })

    res.json(payments)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getPaymentSummary = async (req, res) => {
  try {
    const totalCollected = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
    const byMethod = await Payment.aggregate([
      { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ])
    const unpaidInvoices = await Invoice.find({ paymentStatus: { $ne: 'paid' } })
      .populate({ path: 'jobOrder', populate: { path: 'customer', select: 'name' } })
    const totalOutstanding = unpaidInvoices.reduce((s, inv) => s + (inv.amount - inv.amountPaid), 0)

    res.json({
      totalCollected: totalCollected[0]?.total || 0,
      totalOutstanding,
      byMethod,
      unpaidCount: unpaidInvoices.length
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { recordPayment, getPayments, getPaymentSummary }
