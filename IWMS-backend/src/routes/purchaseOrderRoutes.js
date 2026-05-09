const express = require('express')
const router = express.Router()
const { createPurchaseOrder, getPurchaseOrders, updatePurchaseOrderStatus } = require('../controllers/purchaseOrderController')
const { protect } = require('../middlewares/authMiddleware')

router.route('/')
  .post(protect, createPurchaseOrder)
  .get(protect, getPurchaseOrders)

router.route('/:id/status')
  .patch(protect, updatePurchaseOrderStatus)

module.exports = router
