const express = require('express')
const router = express.Router()
const { protect } = require('../middlewares/authMiddleware')
const { getLogs } = require('../controllers/activityLogController')

router.get('/', protect, getLogs)

module.exports = router
