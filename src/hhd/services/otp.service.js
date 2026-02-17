const HHDOTP = require('../models/OTP.model');
const { logger } = require('../utils/logger');
const db = require('../../config/db');

async function ensureConnection() {
  if (!db.isConnected()) {
    logger.warn('[OTP Service] MongoDB not connected, waiting...');
    try {
      await db.waitForConnection(5000);
    } catch (err) {
      throw new Error(`Database not available: ${err.message}`);
    }
  }
}

function generateOTP(retryCount = 0) {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  if (otp.length !== 4) {
    if (retryCount < 3) return generateOTP(retryCount + 1);
    return otp.padStart(4, '0').slice(0, 4);
  }
  return otp;
}

async function createOTP(mobile) {
  const normalizedMobile = String(mobile).trim();
  logger.info(`[OTP Service] Creating OTP for mobile: ${normalizedMobile}`);
  await ensureConnection();
  const otp = generateOTP();
  const expiresAt = new Date();
  const expireMinutes = Math.max(5, Math.min(30, parseInt(process.env.OTP_EXPIRE_MINUTES || '10', 10)));
  expiresAt.setMinutes(expiresAt.getMinutes() + expireMinutes);

  try {
    await HHDOTP.deleteMany({ mobile: normalizedMobile, isUsed: false });
  } catch (e) {
    logger.warn(`[OTP Service] Failed to delete existing OTPs: ${e.message}`);
  }

  const otpString = String(otp).trim();
  if (!/^\d{4}$/.test(otpString)) throw new Error(`Invalid OTP format: ${otpString}`);

  const created = await Promise.race([
    HHDOTP.create({ mobile: normalizedMobile, otp: otpString, expiresAt }),
    new Promise((_, rej) => setTimeout(() => rej(new Error('Save OTP timeout')), 5000)),
  ]);
  const saved = await HHDOTP.findById(created._id);
  if (!saved) throw new Error('OTP was not saved correctly');
  return otpString;
}

async function verifyOTP(mobile, otp) {
  const normalizedMobile = String(mobile).trim();
  const normalizedOtp = String(otp).trim();
  await ensureConnection();
  const currentTime = new Date();
  let otpRecord = await Promise.race([
    HHDOTP.findOne({
      mobile: normalizedMobile,
      otp: normalizedOtp,
      isUsed: false,
      expiresAt: { $gt: currentTime },
    }).sort({ createdAt: -1 }),
    new Promise((_, rej) => setTimeout(() => rej(new Error('Verify OTP timeout')), 5000)),
  ]);

  if (!otpRecord) {
    const allOtps = await HHDOTP.find({ mobile: normalizedMobile }).sort({ createdAt: -1 }).limit(5);
    const validOtps = allOtps.filter((r) => !r.isUsed && r.expiresAt > currentTime);
    for (const record of validOtps) {
      const recordOtp = String(record.otp).trim();
      if (recordOtp === normalizedOtp) {
        otpRecord = record;
        break;
      }
      const rNum = parseInt(recordOtp, 10);
      const pNum = parseInt(normalizedOtp, 10);
      if (!isNaN(rNum) && !isNaN(pNum) && rNum === pNum) {
        otpRecord = record;
        break;
      }
    }
  }

  if (!otpRecord) return false;
  await Promise.race([
    HHDOTP.updateOne({ _id: otpRecord._id, isUsed: false }, { $set: { isUsed: true } }),
    new Promise((_, rej) => setTimeout(() => rej(new Error('Mark OTP timeout')), 5000)),
  ]);
  return true;
}

module.exports = {
  OTPService: { generateOTP, createOTP, verifyOTP },
  createOTP,
  verifyOTP,
};
