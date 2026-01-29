<<<<<<< HEAD
const SKU = require('../models/SKU');
const SurgeRule = require('../models/SurgeRule');
const PriceChange = require('../models/PriceChange');
const ErrorResponse = require('../../core/utils/ErrorResponse');

// @desc    Get all SKUs for pricing management
// @route   GET /api/v1/pricing/skus
const getPricingSKUs = async (req, res, next) => {
    try {
        const skus = await SKU.find();
        res.status(200).json({ success: true, count: skus.length, data: skus });
    } catch (err) {
        next(err);
    }
};

// @desc    Update SKU pricing
// @route   PUT /api/v1/pricing/skus/:id
const updateSKUPrice = async (req, res, next) => {
    try {
        let sku = await SKU.findById(req.params.id);

        if (!sku) {
            return next(new ErrorResponse(`SKU not found with id of ${req.params.id}`, 404));
        }

        sku = await SKU.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: sku });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all surge rules
// @route   GET /api/v1/pricing/surge-rules
const getSurgeRules = async (req, res, next) => {
    try {
        const rules = await SurgeRule.find();
        res.status(200).json({ success: true, count: rules.length, data: rules });
    } catch (err) {
        next(err);
    }
};

// @desc    Create surge rule
// @route   POST /api/v1/pricing/surge-rules
const createSurgeRule = async (req, res, next) => {
    try {
        const rule = await SurgeRule.create(req.body);
        res.status(201).json({ success: true, data: rule });
    } catch (err) {
        next(err);
    }
};

// @desc    Update surge rule
// @route   PUT /api/v1/pricing/surge-rules/:id
const updateSurgeRule = async (req, res, next) => {
    try {
        let rule = await SurgeRule.findById(req.params.id);

        if (!rule) {
            return next(new ErrorResponse(`Surge rule not found with id of ${req.params.id}`, 404));
        }

        rule = await SurgeRule.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: rule });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete surge rule
// @route   DELETE /api/v1/pricing/surge-rules/:id
const deleteSurgeRule = async (req, res, next) => {
    try {
        const rule = await SurgeRule.findById(req.params.id);

        if (!rule) {
            return next(new ErrorResponse(`Surge rule not found with id of ${req.params.id}`, 404));
        }

        await rule.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

// @desc    Get pending price updates
// @route   GET /api/v1/pricing/pending-updates
const getPendingUpdates = async (req, res, next) => {
    try {
        const updates = await PriceChange.find({ status: 'Pending' });
        res.status(200).json({ success: true, count: updates.length, data: updates });
    } catch (err) {
        next(err);
    }
};

// @desc    Approve/Reject price update
// @route   PUT /api/v1/pricing/pending-updates/:id
const handlePendingUpdate = async (req, res, next) => {
    try {
        let update = await PriceChange.findById(req.params.id);

        if (!update) {
            return next(new ErrorResponse(`Price update not found with id of ${req.params.id}`, 404));
        }

        update = await PriceChange.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // If approved, update the actual SKU price
        if (req.body.status === 'Approved' && update && update.sku && update.proposedPrice) {
            await SKU.findOneAndUpdate(
                { code: update.sku },
                { sellingPrice: update.proposedPrice }
            );
        }

        res.status(200).json({ success: true, data: update });
    } catch (err) {
        next(err);
    }
};



module.exports = {
  getPricingSKUs,
  updateSKUPrice,
  getSurgeRules,
  createSurgeRule,
  updateSurgeRule,
  deleteSurgeRule,
  getPendingUpdates,
  handlePendingUpdate
};
=======
const SKU = require('../models/SKU');
const SurgeRule = require('../models/SurgeRule');
const PriceChange = require('../models/PriceChange');
const ErrorResponse = require('../../core/utils/ErrorResponse');

// @desc    Get all SKUs for pricing management
// @route   GET /api/v1/pricing/skus
const getPricingSKUs = async (req, res, next) => {
    try {
        const skus = await SKU.find();
        res.status(200).json({ success: true, count: skus.length, data: skus });
    } catch (err) {
        next(err);
    }
};

// @desc    Update SKU pricing
// @route   PUT /api/v1/pricing/skus/:id
const updateSKUPrice = async (req, res, next) => {
    try {
        let sku = await SKU.findById(req.params.id);

        if (!sku) {
            return next(new ErrorResponse(`SKU not found with id of ${req.params.id}`, 404));
        }

        sku = await SKU.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: sku });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all surge rules
// @route   GET /api/v1/pricing/surge-rules
const getSurgeRules = async (req, res, next) => {
    try {
        const rules = await SurgeRule.find();
        res.status(200).json({ success: true, count: rules.length, data: rules });
    } catch (err) {
        next(err);
    }
};

// @desc    Create surge rule
// @route   POST /api/v1/pricing/surge-rules
const createSurgeRule = async (req, res, next) => {
    try {
        const rule = await SurgeRule.create(req.body);
        res.status(201).json({ success: true, data: rule });
    } catch (err) {
        next(err);
    }
};

// @desc    Update surge rule
// @route   PUT /api/v1/pricing/surge-rules/:id
const updateSurgeRule = async (req, res, next) => {
    try {
        let rule = await SurgeRule.findById(req.params.id);

        if (!rule) {
            return next(new ErrorResponse(`Surge rule not found with id of ${req.params.id}`, 404));
        }

        rule = await SurgeRule.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: rule });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete surge rule
// @route   DELETE /api/v1/pricing/surge-rules/:id
const deleteSurgeRule = async (req, res, next) => {
    try {
        const rule = await SurgeRule.findById(req.params.id);

        if (!rule) {
            return next(new ErrorResponse(`Surge rule not found with id of ${req.params.id}`, 404));
        }

        await rule.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

// @desc    Get pending price updates
// @route   GET /api/v1/pricing/pending-updates
const getPendingUpdates = async (req, res, next) => {
    try {
        const updates = await PriceChange.find({ status: 'Pending' });
        res.status(200).json({ success: true, count: updates.length, data: updates });
    } catch (err) {
        next(err);
    }
};

// @desc    Approve/Reject price update
// @route   PUT /api/v1/pricing/pending-updates/:id
const handlePendingUpdate = async (req, res, next) => {
    try {
        let update = await PriceChange.findById(req.params.id);

        if (!update) {
            return next(new ErrorResponse(`Price update not found with id of ${req.params.id}`, 404));
        }

        update = await PriceChange.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // If approved, update the actual SKU price
        if (req.body.status === 'Approved' && update && update.sku && update.proposedPrice) {
            await SKU.findOneAndUpdate(
                { code: update.sku },
                { sellingPrice: update.proposedPrice }
            );
        }

        res.status(200).json({ success: true, data: update });
    } catch (err) {
        next(err);
    }
};



module.exports = {
  getPricingSKUs,
  updateSKUPrice,
  getSurgeRules,
  createSurgeRule,
  updateSurgeRule,
  deleteSurgeRule,
  getPendingUpdates,
  handlePendingUpdate
};
>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
