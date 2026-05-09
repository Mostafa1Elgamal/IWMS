const Customer = require('../models/Customer')

const createCustomer = async(req, res) =>{
    const customer = await Customer.create(req.body)
    res.status(201).json(customer)
}

const getCustomer = async(req,res) => {
    const customers = await Customer.find().populate('orderHistory')
    res.json(customers)
}

const getCustomerByID = async(req, res) => {
    const customer = await Customer.findById(req.params.id).populate('orderHistory')
    if(!customer){
        return res.status(401).json({message: 'Customer not Found'})
    }else{
        res.status(201).json(customer)
    }
}

const updateCustomer = async(req, res)=> {
    const customer = await Customer.findByIdAndUpdate(req.params.id,req.body, {returnDocument: 'after'})
    if(!customer){
        return res.status(401).json({message: 'Customer not Found'})
    }
    res.json(customer)
}
const deleteCustomer = async(req, res) => {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({message: 'Customer not found'});
    res.json({ message: 'Customer deleted successfully' });
}

module.exports = {createCustomer, getCustomer, getCustomerByID, updateCustomer, deleteCustomer }