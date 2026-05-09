const express = require('express')
const router = express.Router()
const { protect, allowRoles } = require('../middlewares/authMiddleware')
const { recordPayment, getPayments, getPaymentSummary } = require('../controllers/paymentController')

router.post('/', protect, allowRoles('sales', 'accountant', 'manager'), recordPayment)
router.get('/', protect, getPayments)
router.get('/summary', protect, getPaymentSummary)

module.exports = router
