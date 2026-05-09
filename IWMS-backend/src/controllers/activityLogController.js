const ActivityLog = require('../models/ActivityLog')

const getLogs = async (req, res) => {
  try {
    const { actionType, targetType, userId, startDate, endDate, page = 1, limit = 50 } = req.query
    const filter = {}
    if (actionType) filter.actionType = actionType
    if (targetType) filter.targetType = targetType
    if (userId) filter.user = userId
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = new Date(startDate)
      if (endDate) filter.createdAt.$lte = new Date(endDate)
    }

    const skip = (Number(page) - 1) * Number(limit)
    const total = await ActivityLog.countDocuments(filter)
    const logs = await ActivityLog.find(filter)
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))

    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getLogs }
