const { ErrorResponse } = require('../../utils/ErrorResponse');
const HHDUser = require('../../models/User.model');
const { createOTP, verifyOTP } = require('../../services/otp.service');
const { logger } = require('../../utils/logger');
const db = require('../../../config/db');
const mongoose = require('mongoose');

async function sendSMSAsync(mobile, otp) {
  logger.info(`[Send OTP] SMS would be sent to ${mobile} with OTP: ${otp}`);
}

async function sendOTP(req, res, next) {
  const startTime = Date.now();
  const { mobile } = req.body;
  logger.info(`[Send OTP] Request received for mobile: ${mobile || 'N/A'}`);

  try {
    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a mobile number',
        error: 'Mobile number is required',
      });
    }
    const normalizedMobile = String(mobile).trim();
    if (!/^[6-9]\d{9}$/.test(normalizedMobile)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number starting with 6-9',
        error: 'Invalid mobile number format',
      });
    }

    if (!db.isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Please try again in a moment.',
        error: 'Database connection not available',
      });
    }

    let otp;
    try {
      otp = await Promise.race([
        createOTP(normalizedMobile),
        new Promise((_, rej) => setTimeout(() => rej(new Error('OTP generation timeout')), 10000)),
      ]);
    } catch (otpError) {
      let errorMessage = 'Failed to generate OTP. Please try again.';
      if (otpError.message.includes('Database not available') || otpError.message.includes('timeout')) {
        errorMessage = 'Service temporarily unavailable. Please try again in a moment.';
      }
      return res.status(500).json({ success: false, message: errorMessage, error: 'OTP generation failed' });
    }

    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        data: { mobile: normalizedMobile, otp },
      });
    }

    try {
      sendSMSAsync(mobile, otp).catch((smsError) => logger.error(`[Send OTP] SMS failed: ${smsError.message}`));
      return res.status(200).json({ success: true, message: 'OTP sent successfully' });
    } catch (smsError) {
      return res.status(200).json({
        success: true,
        message: 'OTP generated successfully. SMS delivery may be delayed.',
      });
    }
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'An error occurred while sending OTP. Please try again.',
        error: error.message || 'Internal server error',
      });
    }
  }
}

async function verifyOTPHandler(req, res, next) {
  const startTime = Date.now();
  const { mobile, otp } = req.body;
  logger.info(`[Verify OTP] Request received for mobile: ${mobile || 'N/A'}`);

  try {
    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Please provide mobile number', error: 'Mobile number is required' });
    }
    if (!otp) {
      return res.status(400).json({ success: false, message: 'Please provide OTP', error: 'OTP is required' });
    }
    const normalizedMobile = String(mobile).trim();
    const normalizedOtp = String(otp).trim();
    if (!/^\d{4}$/.test(normalizedOtp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP format. Please enter a 4-digit code.',
        error: 'Invalid OTP format',
      });
    }

    if (!db.isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Please try again in a moment.',
        error: 'Database connection not available',
      });
    }

    let isValid;
    try {
      isValid = await Promise.race([
        verifyOTP(normalizedMobile, normalizedOtp),
        new Promise((_, rej) => setTimeout(() => rej(new Error('OTP verification timeout')), 10000)),
      ]);
    } catch (verifyError) {
      let errorMessage = 'Failed to verify OTP. Please try again.';
      if (verifyError.message.includes('Database not available') || verifyError.message.includes('timeout')) {
        errorMessage = 'Service temporarily unavailable. Please try again in a moment.';
      }
      return res.status(500).json({ success: false, message: errorMessage, error: 'OTP verification failed' });
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please try again.',
        error: 'Invalid OTP',
      });
    }

    let user = await HHDUser.findOne({ mobile: normalizedMobile });
    if (!user) {
      user = await HHDUser.create({ mobile: normalizedMobile, isActive: true });
    }
    user.lastLogin = new Date();
    await user.save().catch(() => {});

    const token = user.getSignedJwtToken();
    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        token,
        user: {
          id: user._id.toString(),
          mobile: user.mobile,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'An error occurred while verifying OTP. Please try again.',
        error: error.message || 'Internal server error',
      });
    }
  }
}

async function getMe(req, res, next) {
  try {
    const user = await HHDUser.findById(req.user?.id).select('-password');
    if (!user) throw new ErrorResponse('User not found', 404);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = { sendOTP, verifyOTP: verifyOTPHandler, getMe, logout };
