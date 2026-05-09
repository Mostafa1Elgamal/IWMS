const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema({
    name: {type: String, required: true},
    number: {type: String, required: true},
    address: String,
    note: {type: String, default: ""},
    category: { type: String, enum: ['Commercial', 'Residential', 'Industrial', 'Retail'], default: 'Retail' },
    orderHistory:[{ type: mongoose.Schema.Types.ObjectId, ref: 'JobOrder'}]
},{timestamps: true})

module.exports = mongoose.model('Customer',customerSchema)