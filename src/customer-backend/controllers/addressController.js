const { getAddressesByUserId, getDefaultAddress } = require('../services/addressService');

async function list(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const addresses = await getAddressesByUserId(userId);
    res.status(200).json({ success: true, data: addresses });
  } catch (err) {
    console.error('address list error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getDefault(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const address = await getDefaultAddress(userId);
    res.status(200).json({ success: true, data: address || null });
  } catch (err) {
    console.error('address getDefault error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { list, getDefault };
