const express = require('express')
const router = express.Router()
const { protect, allowRoles } = require('../middlewares/authMiddleware')
const { scanQR, addNote, getProductionLogs, getProductionDashboard, getMyJobs } = require('../controllers/productionController')

router.post('/scan', protect, allowRoles('technician', 'manager'), scanQR)
router.post('/note', protect, allowRoles('technician', 'manager'), addNote)
router.get('/dashboard', protect, getProductionDashboard)
router.get('/my-jobs', protect, allowRoles('technician', 'manager'), getMyJobs)
router.get('/:jobOrderId', protect, getProductionLogs)

module.exports = router