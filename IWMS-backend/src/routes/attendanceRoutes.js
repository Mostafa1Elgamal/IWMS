// routes/attendanceRoutes. Js — ملف جديد
const express = require('express')
const router = express.Router()
const { protect, allowRoles } = require('../middlewares/authMiddleware')
const { checkIn, checkOut, managerCheckIn, managerCheckOut, getTodayAttendance, getAttendanceReport, updateStatus } = require('../controllers/attendanceController')

router.post('/checkin', protect, checkIn)
router.post('/checkout', protect, checkOut)
router.post('/manager/checkin/:employeeId', protect, allowRoles('manager'), managerCheckIn)
router.post('/manager/checkout/:employeeId', protect, allowRoles('manager'), managerCheckOut)
router.patch('/manager/status/:employeeId', protect, allowRoles('manager'), updateStatus)
router.get('/today', protect, allowRoles('manager'), getTodayAttendance)
router.get('/report', protect, allowRoles('manager'), getAttendanceReport)
router.get('/', protect, getTodayAttendance)

module.exports = router