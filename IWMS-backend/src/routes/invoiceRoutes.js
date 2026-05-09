const express = require("express")
const router = express.Router()
const { protect, allowRoles } = require('../middlewares/authMiddleware')
const { generateInvoice, updatePayment, getInvoices, getInvoiceById, addExtraCharge, markPaid } = require("../controllers/invoiceController")

router.post('/', protect, allowRoles('accountant', 'manager'), generateInvoice)
router.get('/', protect, getInvoices)
router.get('/:id', protect, getInvoiceById)
router.patch('/:id/payment', protect, allowRoles('accountant', 'manager', 'sales'), updatePayment)
router.patch('/:id/extra-charge', protect, allowRoles('sales', 'manager'), addExtraCharge)
router.patch('/:id/mark-paid', protect, allowRoles('accountant', 'manager'), markPaid)

module.exports = router