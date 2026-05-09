const User = require('../models/user')
const jwt = require('jsonwebtoken')
const bycrypt = require('bcryptjs')
const user = require('../models/user')


const generateToken = (id)=>{
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' } )
}

const register = async (req, res) => {
    try {
        const { name, userId, email, password, role, hourlyRate } = req.body

        if (!name || !userId || !password || !role) {
            return res.status(400).json({ message: 'Name, Employee ID, password, and role are required' })
        }

        const userExist = await User.findOne({ userId })
        if (userExist) {
            return res.status(409).json({ message: `Employee ID "${userId}" is already taken. Please choose a different one.` })
        }

        const salt = await bycrypt.genSalt(10)
        const hashedPassword = await bycrypt.hash(password, salt)

        const user = await User.create({
            name,
            userId,
            email: email || undefined,
            password: hashedPassword,
            role,
            hourlyRate: parseFloat(hourlyRate) || 0
        })

        res.status(201).json({
            _id: user._id,
            userId: user.userId,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        })
    } catch (error) {
        console.error('Register error:', error.message)
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Employee ID already exists. Please use a different ID.' })
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message).join(', ')
            return res.status(400).json({ message: messages })
        }
        res.status(500).json({ message: 'Server error: ' + error.message })
    }
}


const login = async (req,res) =>{
    const {userId, password} = req.body
    const user = await User.findOne({userId})
    if(!user){
        return res.status(401).json({message: "invalid Credentials"})
    }
    const verifyPass = await bycrypt.compare(password, user.password)
    if(!verifyPass){
        return res.status(401).json({message: "invalid Credentials"})
    }
    res.json({
        _id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
    })
}


const Attendance = require('../models/Attendance')

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password')
    
    // Get all attendance records for current month to calculate performance
    const date = new Date()
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0]
    
    const attendances = await Attendance.find({
      Date: { $gte: firstDay, $lte: lastDay }
    })

    const expectedHoursPerDay = 8
    // Calculate rough working days passed in this month
    const today = date.getDate()
    const expectedTotalHours = today * expectedHoursPerDay

    const userStats = users.map(u => {
      const userRecords = attendances.filter(a => a.Employee && a.Employee.toString() === u._id.toString())
      let totalHours = 0
      userRecords.forEach(r => {
        totalHours += (r.HoursWorked || 0)
      })
      
      let performanceScore = expectedTotalHours > 0 ? Math.round((totalHours / expectedTotalHours) * 100) : 100
      if (performanceScore > 100) performanceScore = 100
      
      return {
        ...u.toObject(),
        performanceScore,
        attendanceRate: `${userRecords.length}/${today} days`,
        status: userRecords.length > 0 && userRecords[userRecords.length - 1].Status === 'Sick Leave' ? 'Sick Leave' : 'Active'
      }
    })

    res.json(userStats)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { register, login, getUsers }