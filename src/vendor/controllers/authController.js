<<<<<<< HEAD
const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const payload = req.body;
    const created = await authService.registerUser(payload);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password, role } = req.body;
    const result = await authService.authenticateUser(email, password, role);
    if (!result) return res.status(401).json({ code: 401, message: 'Invalid credentials' });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };

=======
const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const payload = req.body;
    const created = await authService.registerUser(payload);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password, role } = req.body;
    const result = await authService.authenticateUser(email, password, role);
    if (!result) return res.status(401).json({ code: 401, message: 'Invalid credentials' });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
