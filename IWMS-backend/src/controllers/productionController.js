const ProductionLog = require('../models/ProductionLog')
const JobOrder = require('../models/JobOrder')
const ActivityLog = require('../models/ActivityLog')

const scanQR = async (req, res) => {
  const { jobOrderId, workstation, action, notes } = req.body

  const order = await JobOrder.findById(jobOrderId)
  if (!order) return res.status(404).json({ message: 'Job order not found' })
  if (order.status === 'cancelled' || order.status === 'delivered' || order.status === 'closed')
    return res.status(400).json({ message: 'Order is already closed' })

  if (action === 'start') {
    const existingLog = await ProductionLog.findOne({
      jobOrder: jobOrderId,
      workstation,
      status: 'in-progress'
    })
    if (existingLog) return res.status(400).json({ message: 'This workstation is already active for this order' })

    const log = await ProductionLog.create({
      jobOrder: jobOrderId,
      workstation,
      technician: req.user._id,
      status: 'in-progress',
      notes: notes || ''
    })

    // Order status → in-progress
    order.status = 'in-progress'
    await order.save()

    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      actionType: 'technician_started',
      targetType: 'order',
      targetId: order._id,
      description: `${req.user.name} started working on ${workstation} stage`,
      metadata: { workstation, logId: log._id, orderId: order._id }
    })

    return res.status(201).json(log)
  }

  if (action === 'pause') {
    const log = await ProductionLog.findOne({
      jobOrder: jobOrderId,
      workstation,
      status: 'in-progress'
    })
    if (!log) return res.status(404).json({ message: 'No active log found for this workstation' })

    log.status = 'paused'
    log.notes = notes ? `${log.notes}\n[Pause] ${notes}` : log.notes
    await log.save()

    return res.json({ log, message: 'Workstation paused' })
  }

  if (action === 'complete') {
    const log = await ProductionLog.findOne({
      jobOrder: jobOrderId,
      workstation,
      status: { $in: ['in-progress', 'paused'] }
    })
    if (!log) return res.status(404).json({ message: 'No active log found for this workstation' })

    log.endTime = Date.now()
    log.status = 'completed'
    const diffMins = log.endTime - log.startTime
    log.durationMinutes = Math.round(diffMins / 60000)
    if (notes) log.notes = `${log.notes}\n[Complete] ${notes}`
    await log.save()

    // When assembly is complete → technician-completed, then ready-for-delivery
    if (workstation === 'assembly') {
      order.status = 'technician-completed'
    }
    await order.save()

    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      actionType: 'technician_completed',
      targetType: 'order',
      targetId: order._id,
      description: `${req.user.name} completed ${workstation} stage${workstation === 'assembly' ? ' — order ready for delivery' : ''}`,
      metadata: { workstation, logId: log._id, orderId: order._id, durationMinutes: log.durationMinutes }
    })

    return res.json({ log, message: 'Workstation completed' })
  }

  res.status(400).json({ message: 'Invalid action. Use: start, pause, complete' })
}

const addNote = async (req, res) => {
  try {
    const { logId, note } = req.body
    const log = await ProductionLog.findById(logId)
    if (!log) return res.status(404).json({ message: 'Production log not found' })

    log.notes = log.notes ? `${log.notes}\n${note}` : note
    await log.save()

    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      actionType: 'technician_note',
      targetType: 'order',
      targetId: log.jobOrder,
      description: `${req.user.name} added a note`,
      metadata: { note, logId: log._id }
    })

    res.json(log)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getProductionLogs = async (req, res) => {
  const logs = await ProductionLog.find({ jobOrder: req.params.jobOrderId })
    .populate('technician', 'name role')
  res.json(logs)
}

const getProductionDashboard = async (req, res) => {
  const activeLogs = await ProductionLog.find({ status: 'in-progress' })
    .populate('technician', 'name')
    .populate('jobOrder', 'customer status')

  const completedToday = await ProductionLog.find({
    status: 'completed',
    endTime: { $gte: new Date().setHours(0, 0, 0, 0) }
  }).populate('jobOrder', 'customer totalCost')

  const totalDuration = completedToday.reduce((s, l) => s + (l.durationMinutes || 0), 0)
  const avgDuration = completedToday.length > 0 ? Math.round(totalDuration / completedToday.length) : 0

  res.json({
    activeLogs,
    completedToday,
    stats: {
      activeJobs: activeLogs.length,
      completedTodayCount: completedToday.length,
      avgDurationMinutes: avgDuration
    }
  })
}

const getMyJobs = async (req, res) => {
  try {
    const { status } = req.query
    const filter = {}
    if (status) filter.status = status

    // Find orders where this technician has active/recent production logs
    const myLogs = await ProductionLog.find({ technician: req.user._id })
      .distinct('jobOrder')

    const orders = await JobOrder.find({
      _id: { $in: myLogs },
      ...filter
    })
      .populate('customer', 'name')
      .populate('materialsUsed.material', 'name')
      .sort({ createdAt: -1 })

    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { scanQR, addNote, getProductionLogs, getProductionDashboard, getMyJobs }