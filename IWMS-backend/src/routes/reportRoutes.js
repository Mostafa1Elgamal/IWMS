const express = require('express')
const router = express.Router()
const { protect, allowRoles } = require('../middlewares/authMiddleware')
const { getDashboard, getDeadStock, getProductionReport, getFinancialStats, getFullReport } = require('../controllers/reportController')

router.get('/dashboard', protect, allowRoles('manager'), getDashboard)
router.get('/dead-stock', protect, allowRoles ('manager', 'inventory'), getDeadStock)
router.get('/financials', protect, allowRoles('manager', 'accountant'), getFinancialStats)
router.get('/full', protect, allowRoles('manager', 'accountant'), getFullReport)

module.exports = router