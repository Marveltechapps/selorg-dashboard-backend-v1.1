/**
 * Test script for HHD OTP endpoints
 * Usage: node scripts/test-hhd-otp.js [mobile]
 * 
 * Tests:
 * 1. Send OTP
 * 2. Verify OTP (uses test mobile or dev mode)
 * 3. Resend OTP
 */

const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';
const TEST_MOBILE = process.argv[2] || '9698790921'; // Default to test mobile
const TEST_OTP = '8790'; // Fixed OTP for test mobile

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(path, method, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 5001,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testSendOTP(mobile) {
  log(`\n1. Testing Send OTP for ${mobile}...`, colors.blue);
  try {
    const response = await makeRequest('/api/v1/hhd/auth/send-otp', 'POST', { mobile });
    
    if (response.status === 200) {
      log(`✅ Send OTP Success`, colors.green);
      log(`Response: ${JSON.stringify(response.body, null, 2)}`);
      
      // Extract OTP if present (dev mode or test mobile)
      const otp = response.body?.data?.otp;
      if (otp) {
        log(`📱 OTP received: ${otp}`, colors.magenta);
        return otp;
      } else {
        log(`⚠️  OTP not in response (production mode)`, colors.yellow);
        return null;
      }
    } else {
      log(`❌ Send OTP Failed: ${response.status}`, colors.red);
      log(`Response: ${JSON.stringify(response.body, null, 2)}`);
      return null;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
    return null;
  }
}

async function testVerifyOTP(mobile, otp) {
  log(`\n2. Testing Verify OTP for ${mobile} with OTP: ${otp}...`, colors.blue);
  try {
    const response = await makeRequest('/api/v1/hhd/auth/verify-otp', 'POST', { mobile, otp });
    
    if (response.status === 200) {
      log(`✅ Verify OTP Success`, colors.green);
      log(`Response: ${JSON.stringify(response.body, null, 2)}`);
      
      const token = response.body?.data?.token;
      if (token) {
        log(`🔑 JWT Token received: ${token.substring(0, 50)}...`, colors.magenta);
        return token;
      }
    } else {
      log(`❌ Verify OTP Failed: ${response.status}`, colors.red);
      log(`Response: ${JSON.stringify(response.body, null, 2)}`);
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
  }
  return null;
}

async function testResendOTP(mobile) {
  log(`\n3. Testing Resend OTP for ${mobile}...`, colors.blue);
  try {
    const response = await makeRequest('/api/v1/hhd/auth/resend-otp', 'POST', { mobile });
    
    if (response.status === 200) {
      log(`✅ Resend OTP Success`, colors.green);
      log(`Response: ${JSON.stringify(response.body, null, 2)}`);
      
      const otp = response.body?.data?.otp;
      if (otp) {
        log(`📱 New OTP received: ${otp}`, colors.magenta);
        return otp;
      }
    } else {
      log(`❌ Resend OTP Failed: ${response.status}`, colors.red);
      log(`Response: ${JSON.stringify(response.body, null, 2)}`);
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
  }
  return null;
}

async function testGetMe(token) {
  log(`\n4. Testing Get Me (protected endpoint)...`, colors.blue);
  try {
    const url = new URL('/api/v1/hhd/auth/me', BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 5001,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    
    if (response.status === 200) {
      log(`✅ Get Me Success`, colors.green);
      log(`Response: ${JSON.stringify(response.body, null, 2)}`);
    } else {
      log(`❌ Get Me Failed: ${response.status}`, colors.red);
      log(`Response: ${JSON.stringify(response.body, null, 2)}`);
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
  }
}

async function runTests() {
  log(`\n${'='.repeat(60)}`, colors.blue);
  log(`HHD OTP Endpoint Test Suite`, colors.blue);
  log(`${'='.repeat(60)}`, colors.blue);
  log(`Base URL: ${BASE_URL}`);
  log(`Test Mobile: ${TEST_MOBILE}`);
  log(`${'='.repeat(60)}\n`, colors.blue);

  // Test 1: Send OTP
  let otp = await testSendOTP(TEST_MOBILE);
  
  // If OTP not received, use test OTP for test mobile
  if (!otp && TEST_MOBILE === '9698790921') {
    otp = TEST_OTP;
    log(`ℹ️  Using fixed test OTP: ${otp}`, colors.yellow);
  }
  
  if (!otp) {
    log(`\n⚠️  Cannot proceed with verify test - no OTP available`, colors.yellow);
    log(`💡 Either:`, colors.yellow);
    log(`   - Check SMS on your device and run verify manually`, colors.yellow);
    log(`   - Enable dev mode in config.json (otpDevMode: 1)`, colors.yellow);
    log(`   - Use test mobile: node scripts/test-hhd-otp.js 9698790921`, colors.yellow);
    return;
  }

  // Wait a second before verify
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Verify OTP
  const token = await testVerifyOTP(TEST_MOBILE, otp);
  
  if (token) {
    // Test 4: Get Me (protected endpoint)
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testGetMe(token);
  }

  // Test 3: Resend OTP
  await new Promise(resolve => setTimeout(resolve, 1000));
  await testResendOTP(TEST_MOBILE);

  log(`\n${'='.repeat(60)}`, colors.blue);
  log(`Test Suite Complete`, colors.blue);
  log(`${'='.repeat(60)}\n`, colors.blue);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Fatal Error: ${error.message}`, colors.red);
  process.exit(1);
});
