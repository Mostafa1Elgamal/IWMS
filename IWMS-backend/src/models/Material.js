const mongoose = require('mongoose')

const materialSchema = new mongoose.Schema({
    name: {type: String, required: true},
    type: String,
    supplier_name: String,
    quantity_in_stock: {type: Number, required: true},
    min_threshold: {type: Number, default: 10},
    cost_per_unit: Number, // Deprecated, keep for fallback
    commercial_price: {type: Number, default: 0},
    customer_price: {type: Number, default: 0},
    sheetDimensions: { height: Number, width: Number }
}, {timestamps: true})

module.exports = mongoose.model('Material',materialSchema)