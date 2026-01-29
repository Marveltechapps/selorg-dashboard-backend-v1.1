const express = require('express');
const {
    getPricingSKUs,
    updateSKUPrice,
    getSurgeRules,
    createSurgeRule,
    updateSurgeRule,
    deleteSurgeRule,
    getPendingUpdates,
    handlePendingUpdate
} = require('../controllers/pricingController');

const router = express.Router();

router.route('/skus')
    .get(getPricingSKUs);

router.route('/skus/:id')
    .put(updateSKUPrice);

router.route('/surge-rules')
    .get(getSurgeRules)
    .post(createSurgeRule);

router.route('/surge-rules/:id')
    .put(updateSurgeRule)
    .delete(deleteSurgeRule);

router.route('/pending-updates')
    .get(getPendingUpdates);

router.route('/pending-updates/:id')
    .put(handlePendingUpdate);

module.exports = router;
