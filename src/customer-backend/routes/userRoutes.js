const { Router } = require('express');
const { getProfile } = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = Router();
router.get('/profile', auth, getProfile);
module.exports = router;
