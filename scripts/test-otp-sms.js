#!/usr/bin/env node
/**
 * Test OTP SMS delivery - exercises smsGateway with current config.
 * Run: node scripts/test-otp-sms.js [10-digit-mobile]
 * Uses 9876543210 if no mobile provided.
 */
const mobile = process.argv[2] || '9876543210';
const digits = String(mobile).replace(/\D/g, '').slice(-10);
if (digits.length !== 10) {
  console.error('Usage: node scripts/test-otp-sms.js [10-digit-mobile]');
  process.exit(1);
}

const { sendOtpSms, generateOTP } = require('../src/utils/smsGateway');
const otp = generateOTP();

console.log('Testing send OTP to', digits, '| OTP:', otp);
sendOtpSms(digits, otp)
  .then((r) => {
    console.log(r.success ? 'SUCCESS' : 'FAILED', r);
    process.exit(r.success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
