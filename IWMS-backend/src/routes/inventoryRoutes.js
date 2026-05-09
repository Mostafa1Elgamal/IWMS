const express = require('express')
const router = express.Router()
const { protect, allowRoles } = require('../middlewares/authMiddleware')
const { addMaterial, getMaterials, updateMaterial, deleteMaterial, addCutOff, getCutOffs, updateCutOffStatus } = require('../controllers/inventoryController')

router.post('/materials', protect, allowRoles('inventory', 'manager'), addMaterial)
router.get('/materials', protect, getMaterials)
router.put('/materials/:id', protect, allowRoles('inventory', 'manager'), updateMaterial)
router.patch('/materials/:id', protect, allowRoles('inventory', 'manager'), updateMaterial)
router.delete('/materials/:id', protect, allowRoles('inventory', 'manager'), deleteMaterial)

router.post('/cutoffs', protect, allowRoles('technician', 'inventory'), addCutOff)
router.get('/cutoffs', protect, getCutOffs)
router.patch('/cutoffs/:id/status', protect, allowRoles('technician', 'inventory'), updateCutOffStatus)

module.exports = router