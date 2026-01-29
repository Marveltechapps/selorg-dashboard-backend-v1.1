const express = require('express');
<<<<<<< HEAD
// Use admin-specific auth service that includes permissions
const authService = require('../services/authService');
=======
// Reuse vendor auth service (same User model)
const authService = require('../../vendor/services/authService');
>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const payload = req.body;
    const created = await authService.registerUser(payload);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
<<<<<<< HEAD
    console.log('Login request:', { email, role: role || 'admin' });
    
    if (!email || !password) {
      return res.status(400).json({ 
        code: 400, 
        message: 'Email and password are required' 
      });
    }
    
    const result = await authService.authenticateUser(email, password, role || 'admin');
    
    if (!result) {
      console.log('Authentication failed for:', email);
      return res.status(401).json({ 
        code: 401, 
        message: 'Invalid credentials. Please check your email and password.' 
      });
    }
    
    console.log('Login successful for:', email);
    res.json(result);
  } catch (err) {
    console.error('Login error:', err);
=======
    const result = await authService.authenticateUser(email, password, role || 'admin');
    if (!result) return res.status(401).json({ code: 401, message: 'Invalid credentials' });
    res.json(result);
  } catch (err) {
>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
    next(err);
  }
});

module.exports = router;
