const jwt = require('jsonwebtoken')
const User = require('../models/user')

const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'Not authorized' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select('-password')
    next()
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' })
  }
}

const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: 'Not authorized for this role' })
  next()
}

module.exports = { protect, allowRoles }