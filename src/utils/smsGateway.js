/**
 * Shared SMS Gateway for OTP delivery.
 * Reads credentials from src/config.json per OTP_PROCESS_WORKFLOW.md.
 *
 * Config keys: smsvendor, smsParamMobile, smsParamMessage, smsMethod, otpDevMode
 * Message template: "Dear Applicant, Your OTP for Mobile No. Verification is {otp} . MJPTBCWREIS - EVOLGN"
 */
const path = require('path');
const https = require('https');
const http = require('http');

const CONFIG_PATH = path.resolve(__dirname, '..', 'config.json');
const SMS_TIMEOUT_MS = 15000;
const SIGNIN_SMS_MESSAGE = 'Dear Applicant, Your OTP for Mobile No. Verification is {otp} . MJPTBCWREIS - EVOLGN';

let _config = null;

function loadConfig() {
  if (_config !== null) return _config;
  try {
    const fs = require('fs');
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    _config = JSON.parse(raw);
    return _config;
  } catch (e) {
    _config = {};
    return _config;
  }
}

/** Generate 4-digit OTP (1000–9999) per workflow */
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Build SMS URL for GET or return params for POST.
 * Uses smsParamMobile and smsParamMessage from config, fallback to to_mobileno/sms_text.
 */
function buildSmsRequest(mobileNumber, otp) {
  const config = loadConfig();
  const base = (config.smsvendor || process.env.SMS_VENDOR_URL || '').trim();
  if (!base) return null;

  const mobile = String(mobileNumber).replace(/\D/g, '').slice(-10);
  if (mobile.length !== 10) return null;

  const paramMobile = config.smsParamMobile || 'to_mobileno';
  const paramMessage = config.smsParamMessage || 'sms_text';
  const message = SIGNIN_SMS_MESSAGE.replace(/{otp}/g, otp);
  const method = (config.smsMethod || 'GET').toUpperCase();

  const sep = base.includes('?') && !base.endsWith('&') && !base.endsWith('?') ? '&' : '';
  const url = `${base}${sep}${paramMobile}=${encodeURIComponent(mobile)}&${paramMessage}=${encodeURIComponent(message)}`;

  return { url, mobile, message, method, paramMobile, paramMessage };
}

/**
 * Parse gateway response. Success when: 2xx and body indicates success.
 */
function isSuccess(statusCode, body) {
  if (statusCode < 200 || statusCode >= 300) return false;
  const raw = (body || '').trim();
  const lower = raw.toLowerCase();
  try {
    const j = JSON.parse(raw);
    const s = (j?.status ?? j?.result ?? j?.Status ?? j?.data?.status ?? '').toString().toLowerCase();
    if (s === 'fail' || s === 'error' || s === 'failure') return false;
    if (s === 'success' || s === 'sent' || s === 'ok') return true;
  } catch (_) {}
  if (/\b(success|sent|ok|delivered)\b/.test(lower) && !/\b(fail|error|invalid|denied)\b/.test(lower)) return true;
  return false;
}

/** Per OTP_PROCESS_WORKFLOW.md: test mobile → no SMS sent, return success */
const TEST_MOBILE = '9698790921';

/**
 * Send OTP via SMS gateway.
 * @param {string} mobileNumber - 10-digit mobile
 * @param {string} otp - 4-digit OTP
 * @returns {Promise<{success: boolean}>}
 */
function sendOtpSms(mobileNumber, otp) {
  const digits = String(mobileNumber).replace(/\D/g, '').slice(-10);
  if (digits === TEST_MOBILE) {
    return Promise.resolve({ success: true });
  }
  const req = buildSmsRequest(mobileNumber, otp);
  if (!req) return Promise.resolve({ success: false });

  return new Promise((resolve) => {
    const parsed = require('url').parse(req.url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const opts = { timeout: SMS_TIMEOUT_MS, headers: { 'User-Agent': 'Selorg-OTP/1.0', Accept: '*/*' } };

    const clientReq = lib.get(req.url, opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        const ok = isSuccess(res.statusCode, data);
        resolve({ success: !!ok, statusCode: res.statusCode, body: data });
      });
    });
    clientReq.on('error', (err) => resolve({ success: false, error: err?.message }));
    clientReq.setTimeout(SMS_TIMEOUT_MS, () => {
      clientReq.destroy();
      resolve({ success: false, error: 'Request timeout' });
    });
  });
}

/** Check if OTP dev mode is on (no real SMS) */
function isOtpDevMode() {
  const config = loadConfig();
  return config.otpDevMode === 1 || config.otpDevMode === true || process.env.OTP_DEV_MODE === '1' || process.env.OTP_DEV_MODE === 'true';
}

/** Optional test mobile – return fixed OTP instead of sending SMS */
const TEST_OTP = '8790';

function getTestOtpIfApplicable(mobileNumber) {
  const digits = String(mobileNumber).replace(/\D/g, '').slice(-10);
  return digits === TEST_MOBILE ? TEST_OTP : null;
}

module.exports = {
  generateOTP,
  sendOtpSms,
  isOtpDevMode,
  getTestOtpIfApplicable,
  SIGNIN_SMS_MESSAGE,
};
