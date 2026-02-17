const { CustomerUser } = require('../models/CustomerUser');

async function getProfile(req, res) {
  try {
    if (!req.user?._id) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const user = await CustomerUser.findById(req.user._id).lean();
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getProfile };
