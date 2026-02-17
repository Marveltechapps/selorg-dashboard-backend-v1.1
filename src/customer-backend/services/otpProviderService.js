const path = require('path');
const fs = require('fs');
function readConfig() {
  try {
    const candidates = [path.resolve(process.cwd(), 'config.json'), path.resolve(process.cwd(), 'backend', 'config.json'), path.resolve(__dirname, '..', '..', '..', 'config.json')];
    for (const cfgPath of candidates) {
      if (fs.existsSync(cfgPath)) return JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    }
  } catch (err) {}
  return {};
}
const config = readConfig();
async function sendSms({ to, text }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || config.TWILIO_ACCOUNT_SID || config.twilioAccountSid;
  const authToken = process.env.TWILIO_AUTH_TOKEN || config.TWILIO_AUTH_TOKEN || config.twilioAuthToken;
  const fromNumber = process.env.TWILIO_FROM || config.TWILIO_FROM || config.twilioFrom;
  if (accountSid && authToken && fromNumber) {
    try {
      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);
      const msg = await client.messages.create({ body: text, from: fromNumber, to });
      return { success: true, body: msg.sid || msg };
    } catch (err) {
      console.error('[otpProviderService] Twilio send error', err);
      return { success: false, error: err?.message || String(err) };
    }
  }
  const smsVendorBase = config.smsvendor || process.env.SMS_VENDOR_URL;
  if (smsVendorBase) {
    try {
      const mobileOnly = to.replace(/^\+/, '').replace(/^91/, '');
      const urlQuick = `${smsVendorBase}to_mobileno=${encodeURIComponent(mobileOnly)}&sms_text=${encodeURIComponent(text)}`;
      const quickResp = await fetch(urlQuick);
      const quickBody = await quickResp.text();
      if (quickResp.status >= 200 && quickResp.status < 300 && !String(quickBody).toLowerCase().includes('error')) return { success: true, body: quickBody };
      return { success: false, error: 'SMS vendor attempts failed' };
    } catch (err) {
      return { success: false, error: err?.message || String(err) };
    }
  }
  console.warn('[otpProviderService] No SMS provider configured; mock');
  await new Promise((r) => setTimeout(r, 50));
  return { success: true, body: `mock-${Date.now()}` };
}
module.exports = { sendSms };
