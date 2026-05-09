const express = require('express');
const router = express.Router();
const { getFollowUps, createFollowUp, updateFollowUp } = require('../controllers/followUpController');

router.get('/', getFollowUps);
router.post('/', createFollowUp);
router.patch('/:id', updateFollowUp);

module.exports = router;
