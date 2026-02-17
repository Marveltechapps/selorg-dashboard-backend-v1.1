"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSmsToParam = exports.getSmsVendorUrl = void 0;

var _path = require("path");
var _fs = require("fs");

var _configPath = _path.join(__dirname, "config.json");
var _config = null;

function loadConfig() {
  if (_config !== null) return _config;
  try {
    var raw = (0, _fs.readFileSync)(_configPath, "utf8");
    _config = JSON.parse(raw);
    return _config;
  } catch (e) {
    return {};
  }
}

var getSmsVendorUrl = exports.getSmsVendorUrl = function getSmsVendorUrl() {
  if (process.env.SMS_VENDOR_URL && process.env.SMS_VENDOR_URL.trim()) {
    return process.env.SMS_VENDOR_URL.trim();
  }
  var c = loadConfig();
  return (c.smsvendor && String(c.smsvendor).trim()) || null;
};

// Recipient parameter name for SMS API (e.g. "to" or "mobile"). Set in config.json as "smsToParam" if gateway expects "mobile".
var getSmsToParam = exports.getSmsToParam = function getSmsToParam() {
  if (process.env.SMS_TO_PARAM && process.env.SMS_TO_PARAM.trim()) {
    return process.env.SMS_TO_PARAM.trim();
  }
  var c = loadConfig();
  return (c.smsToParam && String(c.smsToParam).trim()) || "to";
};
