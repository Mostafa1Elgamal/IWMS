const express = require('express')
const router = express.Router()
const { protect, allowRoles } = require('../middlewares/authMiddleware')
const { createJobOrder, getJobOrders, getJobOrderById, updateJobOrderStatus, cancelJobOrder, deleteJobOrder, updateJobOrder, confirmDelivery } = require('../controllers/jobOrderController')

router.post('/', protect, allowRoles('sales', 'manager'), createJobOrder)
router.get('/', protect, getJobOrders)
router.get('/:id', protect, getJobOrderById)
router.patch('/:id/status', protect, allowRoles('manager', 'technician', 'sales'), updateJobOrderStatus)
router.patch('/:id/cancel', protect, allowRoles('sales', 'manager'), cancelJobOrder)
router.delete('/:id', protect, allowRoles('sales', 'manager'), deleteJobOrder)
router.put('/:id', protect, allowRoles('sales', 'manager'), updateJobOrder)
router.post('/:id/deliver', protect, allowRoles('sales', 'manager'), confirmDelivery)

module.exports = router