const mongoose = require('mongoose');
const { Order } = require('../models/Order');
const { CustomerAddress } = require('../models/CustomerAddress');
const { Cart } = require('../models/Cart');
const { Product } = require('../models/Product');

function formatOrderForApp(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    orderNumber: o.orderNumber,
    items: (o.items || []).map((it) => ({
      id: String(it._id),
      productId: String(it.productId),
      productName: it.productName,
      variantId: it.variantId || '',
      variantSize: it.variantSize || '',
      quantity: it.quantity,
      price: it.price,
      originalPrice: it.originalPrice,
      image: it.image || '',
    })),
    status: o.status,
    deliveryAddress: o.deliveryAddress
      ? {
          id: String(o.addressId || ''),
          address: [o.deliveryAddress.line1, o.deliveryAddress.line2].filter(Boolean).join(', '),
          city: o.deliveryAddress.city,
          state: o.deliveryAddress.state || '',
          pincode: o.deliveryAddress.pincode || '',
          landmark: o.deliveryAddress.landmark,
        }
      : {},
    paymentMethod: o.paymentMethod
      ? {
          id: o.paymentMethodId || '',
          type: o.paymentMethod.methodType || 'cash',
          last4: o.paymentMethod.last4,
        }
      : { id: '', type: 'cash' },
    itemTotal: o.itemTotal,
    handlingCharge: o.handlingCharge,
    deliveryFee: o.deliveryFee,
    discount: o.discount,
    totalBill: o.totalBill,
    createdAt: o.createdAt,
    estimatedDelivery: o.estimatedDelivery,
  };
}

async function generateOrderNumber() {
  const count = await Order.countDocuments();
  const prefix = 'ORD';
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${prefix}-${date}-${String(count + 1).padStart(5, '0')}`;
}

async function listOrders(userId, page = 1, limit = 20, status) {
  const q = { userId: new mongoose.Types.ObjectId(userId) };
  if (status) q.status = status;
  const skip = (Math.max(1, page) - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(q),
  ]);
  return {
    data: orders.map((o) => formatOrderForApp({ ...o, _id: o._id })),
    pagination: {
      page: Math.max(1, page),
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getOrderById(userId, orderId) {
  const order = await Order.findOne({ _id: orderId, userId }).lean();
  return order ? formatOrderForApp({ ...order, _id: order._id }) : null;
}

async function createOrder(userId, body) {
  const { items, addressId, paymentMethodId, couponCode, deliveryTip } = body || {};
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { error: 'Items required' };
  }
  const address = await CustomerAddress.findOne({ _id: addressId, userId }).lean();
  if (!address) return { error: 'Address not found' };

  let itemTotal = 0;
  const orderItems = [];
  for (const line of items) {
    const product = await Product.findById(line.productId).lean();
    if (!product) return { error: `Product not found: ${line.productId}` };
    let price = product.price;
    let variantSize = '';
    if (product.variants && product.variants.length) {
      const v = product.variants.find((x) => String(x._id) === String(line.variantId)) || product.variants[0];
      price = v.price ?? product.price;
      variantSize = v.size || '';
    }
    const qty = Math.max(1, line.quantity || 1);
    itemTotal += price * qty;
    orderItems.push({
      productId: product._id,
      productName: product.name,
      variantId: line.variantId || '',
      variantSize,
      quantity: qty,
      price,
      originalPrice: product.originalPrice,
      image: (product.images && product.images[0]) || '',
    });
  }

  const deliveryFee = 0;
  const handlingCharge = 0;
  const discount = 0;
  const totalBill = itemTotal + deliveryFee + handlingCharge - discount + (deliveryTip || 0);

  const orderNumber = await generateOrderNumber();
  const estimatedDelivery = new Date(Date.now() + 60 * 60 * 1000 * 24); // +1 day

  const order = await Order.create({
    userId: new mongoose.Types.ObjectId(userId),
    orderNumber,
    items: orderItems,
    status: 'pending',
    addressId: address._id,
    deliveryAddress: {
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.label,
    },
    paymentMethodId: paymentMethodId || '',
    paymentMethod: { methodType: 'cash', last4: '' },
    itemTotal,
    handlingCharge,
    deliveryFee,
    discount,
    totalBill,
    estimatedDelivery,
  });

  await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

  const populated = await Order.findById(order._id).lean();
  return formatOrderForApp({ ...populated, _id: populated._id });
}

async function cancelOrder(userId, orderId) {
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) return null;
  if (!['pending', 'confirmed'].includes(order.status)) {
    return { error: 'Order cannot be cancelled' };
  }
  order.status = 'cancelled';
  await order.save();
  return formatOrderForApp(order);
}

module.exports = {
  listOrders,
  getOrderById,
  createOrder,
  cancelOrder,
};
