const express = require('express');
// Use admin-specific auth service that includes permissions
const authService = require('../services/authService');

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
    next(err);
  }
});

module.exports = router;
