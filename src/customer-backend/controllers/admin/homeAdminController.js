const { Category } = require('../../models/Category');
const { Banner } = require('../../models/Banner');
const { HomeConfig } = require('../../models/HomeConfig');
const { HomeSection } = require('../../models/HomeSection');
const { LifestyleItem } = require('../../models/LifestyleItem');
const { PromoBlock } = require('../../models/PromoBlock');

exports.listCategories = async (req, res) => {
  const items = await Category.find().sort({ order: 1 }).lean();
  res.json({ success: true, data: items });
};
exports.createCategory = async (req, res) => {
  const created = await Category.create(req.body);
  res.status(201).json({ success: true, data: created });
};
exports.updateCategory = async (req, res) => {
  const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
  res.json({ success: true, data: updated });
};
exports.deleteCategory = async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

exports.listBanners = async (req, res) => {
  const items = await Banner.find().sort({ slot: 1, order: 1 }).lean();
  res.json({ success: true, data: items });
};
exports.createBanner = async (req, res) => {
  const created = await Banner.create(req.body);
  res.status(201).json({ success: true, data: created });
};
exports.updateBanner = async (req, res) => {
  const updated = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
  res.json({ success: true, data: updated });
};
exports.deleteBanner = async (req, res) => {
  await Banner.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

exports.getHomeConfig = async (req, res) => {
  const cfg = await HomeConfig.findOne({ key: 'main' }).lean();
  res.json({ success: true, data: cfg });
};
exports.upsertHomeConfig = async (req, res) => {
  const updated = await HomeConfig.findOneAndUpdate({ key: 'main' }, req.body, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
  res.json({ success: true, data: updated });
};

exports.listHomeSections = async (req, res) => {
  const items = await HomeSection.find().sort({ order: 1 }).lean();
  res.json({ success: true, data: items });
};
exports.createHomeSection = async (req, res) => {
  const created = await HomeSection.create(req.body);
  res.status(201).json({ success: true, data: created });
};
exports.updateHomeSection = async (req, res) => {
  const updated = await HomeSection.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
  res.json({ success: true, data: updated });
};
exports.deleteHomeSection = async (req, res) => {
  await HomeSection.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

exports.listLifestyle = async (req, res) => {
  const items = await LifestyleItem.find().sort({ order: 1 }).lean();
  res.json({ success: true, data: items });
};
exports.createLifestyle = async (req, res) => {
  const created = await LifestyleItem.create(req.body);
  res.status(201).json({ success: true, data: created });
};
exports.updateLifestyle = async (req, res) => {
  const updated = await LifestyleItem.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
  res.json({ success: true, data: updated });
};
exports.deleteLifestyle = async (req, res) => {
  await LifestyleItem.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

exports.listPromoBlocks = async (req, res) => {
  const items = await PromoBlock.find().sort({ order: 1 }).lean();
  res.json({ success: true, data: items });
};
exports.createPromoBlock = async (req, res) => {
  const created = await PromoBlock.create(req.body);
  res.status(201).json({ success: true, data: created });
};
exports.updatePromoBlock = async (req, res) => {
  const updated = await PromoBlock.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
  res.json({ success: true, data: updated });
};
exports.deletePromoBlock = async (req, res) => {
  await PromoBlock.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};
