/**
 * Customer app Express sub-app: onboarding, auth, home, products, user, admin/home.
 * Mounted at /api/v1/customer by root server.js (routes are relative to that).
 */
const express = require('express');
const cors = require('cors');

const onboardingRoutes = require('./routes/onboardingRoutes');
const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const productsRoutes = require('./routes/productsRoutes');
const adminHomeRoutes = require('./routes/admin/homeAdminRoutes');
const userRoutes = require('./routes/userRoutes');
const legalRoutes = require('./routes/legalRoutes');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/onboarding', onboardingRoutes);
app.use('/auth', authRoutes);
app.use('/home', homeRoutes);
app.use('/products', productsRoutes);
app.use('/admin/home', adminHomeRoutes);
app.use('/user', userRoutes);
app.use('/legal', legalRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

module.exports = app;
