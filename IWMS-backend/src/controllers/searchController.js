const JobOrder = require('../models/JobOrder')
const Customer = require('../models/Customer')
const Material = require('../models/Material')

const globalSearch = async (req, res) => {
  try {
    const query = req.query.q
    if (!query) return res.json([])

    const regex = new RegExp(query, 'i')
    const results = []

    // Search Job Orders
    const orders = await JobOrder.find().populate('customer')
    orders.forEach(order => {
      if (order._id.toString().toLowerCase().includes(query.toLowerCase()) || 
          (order.customer && order.customer.name && order.customer.name.match(regex))) {
        results.push({
          type: 'order',
          label: `Order #${order._id.toString().slice(-6).toUpperCase()} - ${order.customer ? order.customer.name : 'Unknown'}`,
          path: '/Manager/orders'
        })
      }
    })

    // Search Customers
    const customers = await Customer.find({ name: regex })
    customers.forEach(customer => {
      results.push({
        type: 'customer',
        label: customer.name,
        path: '/Manager/orders' // Or wherever customers are viewed
      })
    })

    // Search Materials
    const materials = await Material.find({ name: regex })
    materials.forEach(material => {
      results.push({
        type: 'material',
        label: material.name,
        path: '/Manager/inventory'
      })
    })

    res.json(results.slice(0, 10)) // Limit to 10 results
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { globalSearch }
