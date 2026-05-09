const express = require('express');
const router = express.Router();
const { getSuppliers, createSupplier } = require('../controllers/supplierController');

router.get('/', getSuppliers);
router.post('/', createSupplier);

module.exports = router;
