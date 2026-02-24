const { Router } = require('express');
const auth = require('../middleware/auth');
const { list, markOneRead, markAllReadHandler } = require('../controllers/notificationsController');

const router = Router();
router.get('/', auth, list);
router.put('/read-all', auth, markAllReadHandler);
router.put('/:id/read', auth, markOneRead);

module.exports = router;
