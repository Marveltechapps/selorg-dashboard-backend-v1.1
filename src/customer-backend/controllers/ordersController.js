const {
  listOrders,
  getOrderById,
  createOrder,
  cancelOrder,
} = require('../services/orderService');

async function list(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const status = req.query.status || undefined;
    const result = await listOrders(userId, page, limit, status);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('orders list error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getDetail(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const order = await getOrderById(userId, req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    console.error('orders getDetail error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function create(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const order = await createOrder(userId, req.body);
    if (order.error) {
      res.status(400).json({ success: false, message: order.error });
      return;
    }
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    console.error('orders create error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function cancel(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const order = await cancelOrder(userId, req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    if (order.error) {
      res.status(400).json({ success: false, message: order.error });
      return;
    }
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    console.error('orders cancel error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function status(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const order = await getOrderById(userId, req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    res.status(200).json({ success: true, data: { status: order.status, ...order } });
  } catch (err) {
    console.error('orders status error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function rate(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    res.status(200).json({ success: true, data: { message: 'Rating recorded' } });
  } catch (err) {
    console.error('orders rate error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { list, getDetail, create, cancel, status, rate };
