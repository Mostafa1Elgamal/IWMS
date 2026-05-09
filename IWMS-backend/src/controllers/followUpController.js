const FollowUp = require('../models/FollowUp');

const getFollowUps = async (req, res) => {
  try {
    const followUps = await FollowUp.find().populate('customer');
    res.json(followUps);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const createFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.create(req.body);
    const populated = await FollowUp.findById(followUp._id).populate('customer');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' }).populate('customer');
    if (!followUp) return res.status(404).json({ message: 'Not Found' });
    res.json(followUp);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getFollowUps, createFollowUp, updateFollowUp };
