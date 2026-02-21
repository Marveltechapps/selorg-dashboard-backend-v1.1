const { HomeConfig } = require('../models/HomeConfig');
const { Category } = require('../models/Category');
const { Banner } = require('../models/Banner');
const { HomeSection } = require('../models/HomeSection');
const { Product } = require('../models/Product');
const { LifestyleItem } = require('../models/LifestyleItem');
const { PromoBlock } = require('../models/PromoBlock');
const { getDefaultAddress } = require('./addressService');

async function resolveProducts(productIds = []) {
  if (!Array.isArray(productIds) || productIds.length === 0) return [];
  const products = await Product.find({ _id: { $in: productIds }, isActive: true })
    .lean()
    .select('name images price originalPrice discount quantity');
  const map = new Map(products.map((p) => [String(p._id), p]));
  return productIds.map((id) => map.get(String(id))).filter(Boolean);
}

async function getHomePayload(req = {}) {
  const config = await HomeConfig.findOne({ key: 'main' }).lean();
  const categories = await Category.find({ isActive: true }).sort({ order: 1 }).lean();
  const heroBanners = await Banner.find({ slot: 'hero', isActive: true }).sort({ order: 1 }).lean();
  const midBanners = await Banner.find({ slot: 'mid', isActive: true }).sort({ order: 1 }).lean();
  const sectionsDocs = await HomeSection.find({ isActive: true }).lean();
  const sections = {};
  for (const s of sectionsDocs) {
    const products = await resolveProducts(s.productIds || []);
    sections[s.sectionKey] = { title: s.title, products };
  }
  const lifestyle = await LifestyleItem.find({ isActive: true }).sort({ order: 1 }).lean();
  const promoBlocksList = await PromoBlock.find({ isActive: true }).lean();
  const promoBlocks = {};
  for (const p of promoBlocksList) {
    promoBlocks[p.blockKey] = { imageUrl: p.imageUrl, link: p.link };
  }

  let defaultAddress = null;
  const userId = req?.user?._id;
  if (userId) {
    defaultAddress = await getDefaultAddress(userId);
  }

  return {
    config: config || null,
    categories: categories || [],
    heroBanners: heroBanners || [],
    midBanners: midBanners || [],
    sections,
    lifestyle,
    promoBlocks,
    defaultAddress: defaultAddress || null,
  };
}

module.exports = { getHomePayload };
