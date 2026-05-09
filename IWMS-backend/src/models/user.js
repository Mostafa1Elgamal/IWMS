const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    userId: {type: String, required: true, unique: true},
    email: {type: String},
    password: {type: String, required: true},
    hourlyRate:{type: Number, required: true},
    role:{ type: String, enum:["manager","accountant","sales","technician","inventory"],
        required: true
    }
},{timestamps: true})

module.exports = mongoose.models.User || mongoose.model('User', userSchema)