const { Router } = require('express');
const auth = require('../middleware/auth');
const {
  list,
  getDetail,
  create,
  cancel,
  status,
  rate,
} = require('../controllers/ordersController');

const router = Router();
router.get('/', auth, list);
router.get('/:id', auth, getDetail);
router.post('/', auth, create);
router.post('/:id/cancel', auth, cancel);
router.get('/:id/status', auth, status);
router.post('/:id/rate', auth, rate);

module.exports = router;
