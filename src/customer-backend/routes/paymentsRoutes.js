const { Router } = require('express');
const auth = require('../middleware/auth');
const {
  getMethods,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultMethod,
} = require('../controllers/paymentsController');

const router = Router();
router.get('/methods', auth, getMethods);
router.post('/methods', auth, addPaymentMethod);
router.delete('/methods/:id', auth, removePaymentMethod);
router.post('/methods/:id/default', auth, setDefaultMethod);

module.exports = router;
