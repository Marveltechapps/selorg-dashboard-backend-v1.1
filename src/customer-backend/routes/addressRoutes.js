const { Router } = require('express');
const auth = require('../middleware/auth');
const { list, getDefault } = require('../controllers/addressController');

const router = Router();
router.get('/', auth, list);
router.get('/default', auth, getDefault);

module.exports = router;
