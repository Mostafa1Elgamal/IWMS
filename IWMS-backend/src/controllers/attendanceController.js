const Attendance = require('../models/Attendance')
const User = require('../models/User')

const checkIn = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const existing = await Attendance.findOne({ Employee: req.user._id, Date: today })
    if (existing) return res.status(400).json({ message: 'Already checked in today' })

    const record = await Attendance.create({
      Employee: req.user._id,
      CheckIn: new Date(),
      Date: today
    })
    res.status(201).json(record)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const checkOut = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const record = await Attendance.findOne({ Employee: req.user._id, Date: today })
    if (!record) return res.status(404).json({ message: 'No check-in found for today' })
    if (record.CheckOut) return res.status(400).json({ message: 'Already checked out' })

    record.CheckOut = new Date()
    record.HoursWorked = parseFloat(((record.CheckOut - record.CheckIn) / 3600000).toFixed(2))
    await record.save()
    res.json(record)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Manager: check in any employee
const managerCheckIn = async (req, res) => {
  try {
    const { employeeId } = req.params
    const today = new Date().toISOString().split('T')[0]
    const existing = await Attendance.findOne({ Employee: employeeId, Date: today })
    if (existing) return res.status(400).json({ message: 'Employee already checked in today' })

    const record = await Attendance.create({
      Employee: employeeId,
      CheckIn: new Date(),
      Date: today
    })
    const populated = await record.populate('Employee', 'name role')
    res.status(201).json(populated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Manager: check out any employee
const managerCheckOut = async (req, res) => {
  try {
    const { employeeId } = req.params
    const today = new Date().toISOString().split('T')[0]
    const record = await Attendance.findOne({ Employee: employeeId, Date: today })
    if (!record) return res.status(404).json({ message: 'No check-in found for this employee today' })
    if (record.CheckOut) return res.status(400).json({ message: 'Employee already checked out' })

    record.CheckOut = new Date()
    record.HoursWorked = parseFloat(((record.CheckOut - record.CheckIn) / 3600000).toFixed(2))
    await record.save()
    const populated = await record.populate('Employee', 'name role')
    res.json(populated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get today's attendance with all users joined
const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const allUsers = await User.find({}).select('name role')
    const records = await Attendance.find({ Date: today }).populate('Employee', 'name role')

    const attendanceMap = {}
    for (const r of records) {
      if (r.Employee) attendanceMap[r.Employee._id.toString()] = r
    }

    const result = allUsers.map(user => {
      const record = attendanceMap[user._id.toString()]
      return {
        employeeId: user._id,
        employeeName: user.name,
        role: user.role,
        department: user.role, // map role to dept
        hasCheckedIn: !!record,
        hasCheckedOut: !!(record?.CheckOut),
        checkIn: record?.CheckIn || null,
        checkOut: record?.CheckOut || null,
        hoursWorked: record?.HoursWorked || null,
        recordId: record?._id || null,
        status: record?.Status || (record ? (record.CheckOut ? 'Completed' : 'Present') : 'Absent')
      }
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const filter = {}
    if (startDate && endDate) filter.Date = { $gte: startDate, $lte: endDate }

    const records = await Attendance.find(filter)
      .populate('Employee', 'name role')
      .sort({ Date: -1 })
    res.json(records)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updateStatus = async (req, res) => {
  try {
    const { employeeId } = req.params
    const { status } = req.body
    const today = new Date().toISOString().split('T')[0]
    
    let record = await Attendance.findOne({ Employee: employeeId, Date: today })
    
    if (!record) {
      record = await Attendance.create({
        Employee: employeeId,
        Date: today,
        Status: status,
        CheckIn: new Date()
      })
    } else {
      record.Status = status
      await record.save()
    }
    
    const populated = await record.populate('Employee', 'name role')
    res.json(populated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { checkIn, checkOut, managerCheckIn, managerCheckOut, getTodayAttendance, getAttendanceReport, updateStatus }