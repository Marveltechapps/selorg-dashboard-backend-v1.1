const { ErrorResponse } = require('../../utils/ErrorResponse');
const HHDItem = require('../../models/Item.model');
const { ITEM_STATUS } = require('../../utils/constants');

async function getOrderItems(req, res, next) {
  try {
    const { orderId } = req.params;
    const { status } = req.query;
    const query = { orderId };
    if (status) query.status = status;
    const items = await HHDItem.find(query).sort({ createdAt: 1 });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    next(error);
  }
}

async function scanItem(req, res, next) {
  try {
    const { orderId, itemCode } = req.body;
    if (!orderId || !itemCode) throw new ErrorResponse('Please provide orderId and itemCode', 400);
    const item = await HHDItem.findOne({ orderId, itemCode });
    if (!item) throw new ErrorResponse('Item not found', 404);
    item.status = ITEM_STATUS.SCANNED;
    item.scannedAt = new Date();
    await item.save();
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

async function markItemNotFound(req, res, next) {
  try {
    const { itemId } = req.params;
    const { notes } = req.body;
    const item = await HHDItem.findById(itemId);
    if (!item) throw new ErrorResponse(`Item not found with id of ${itemId}`, 404);
    item.status = ITEM_STATUS.NOT_FOUND;
    if (notes) item.notes = notes;
    await item.save();
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

async function updateItem(req, res, next) {
  try {
    const { itemId } = req.params;
    const { status, location, notes } = req.body;
    const item = await HHDItem.findById(itemId);
    if (!item) throw new ErrorResponse(`Item not found with id of ${itemId}`, 404);
    if (status) item.status = status;
    if (location) item.location = location;
    if (notes) item.notes = notes;
    await item.save();
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

module.exports = { getOrderItems, scanItem, markItemNotFound, updateItem };
