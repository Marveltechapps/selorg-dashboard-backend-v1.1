/**
 * Customer app Express sub-app: onboarding, auth, home, products, categories, user, admin/home.
 * Mounted at /api/v1/customer by root server.js (routes are relative to that).
 */
const express = require('express');
const cors = require('cors');

const onboardingRoutes = require('./routes/onboardingRoutes');
const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const productsRoutes = require('./routes/productsRoutes');
const categoriesRoutes = require('./routes/categoriesRoutes');
const adminHomeRoutes = require('./routes/admin/homeAdminRoutes');
const userRoutes = require('./routes/userRoutes');
const legalRoutes = require('./routes/legalRoutes');
const addressRoutes = require('./routes/addressRoutes');
const cartRoutes = require('./routes/cartRoutes');
const ordersRoutes = require('./routes/ordersRoutes');
const paymentsRoutes = require('./routes/paymentsRoutes');
const couponsRoutes = require('./routes/couponsRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const { cacheMiddleware } = require('../core/middleware');
const appConfig = require('../config/app');
app.use(cacheMiddleware(appConfig.cache.customer.default));

app.use('/onboarding', onboardingRoutes);
app.use('/auth', authRoutes);
app.use('/home', homeRoutes);
app.use('/products', productsRoutes);
app.use('/categories', categoriesRoutes);
app.use('/admin/home', adminHomeRoutes);
app.use('/user', userRoutes);
app.use('/legal', legalRoutes);
app.use('/addresses', addressRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', ordersRoutes);
app.use('/payments', paymentsRoutes);
app.use('/coupons', couponsRoutes);
app.use('/notifications', notificationsRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

module.exports = app;
