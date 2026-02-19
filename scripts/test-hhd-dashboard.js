/**
 * Test Script for HHD Dashboard Endpoint
 * 
 * Usage:
 * 1. Make sure backend server is running
 * 2. Replace TOKEN with a valid JWT token (get from login)
 * 3. Run: node test-hhd-dashboard.js
 */

const BASE_URL = 'http://localhost:5001/api/v1/hhd';
const TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

async function testDashboardEndpoint() {
  console.log('🧪 Testing HHD Dashboard Endpoint...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
      },
    });

    const data = await response.json();

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('\n✅ Dashboard endpoint is working correctly!');
      console.log('\n📈 Dashboard Summary:');
      console.log(`   User: ${data.data.user.name} (${data.data.user.deviceId})`);
      console.log(`   Daily Target: ${data.data.goals.dailyTarget} orders`);
      console.log(`   Today Completed: ${data.data.statistics.todayCompleted} orders`);
      console.log(`   Accuracy: ${data.data.statistics.accuracyPercent}%`);
      console.log(`   Avg Pick Time: ${data.data.statistics.averagePickTimeSeconds}s`);
      console.log(`   SLA Compliance: ${data.data.statistics.slaCompliance}%`);
      console.log(`   Status: ${data.data.status.current} (${data.data.status.connectionStatus})`);
    } else {
      console.log('\n❌ Dashboard endpoint returned an error');
      console.log('Error:', data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('\n❌ Failed to test dashboard endpoint:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure backend server is running');
    console.log('2. Replace TOKEN with a valid JWT token');
    console.log('3. Check that BASE_URL is correct');
  }
}

// Instructions to get token
if (TOKEN === 'YOUR_JWT_TOKEN_HERE') {
  console.log('⚠️  Please replace TOKEN with a valid JWT token');
  console.log('\nTo get a token:');
  console.log('1. Send POST request to /api/v1/hhd/auth/send-otp with {"mobile": "9876543210"}');
  console.log('2. Send POST request to /api/v1/hhd/auth/verify-otp with {"mobile": "9876543210", "otp": "1234"}');
  console.log('3. Copy the token from the response');
  console.log('4. Paste it in this script where it says YOUR_JWT_TOKEN_HERE');
  console.log('\nOr use the test-hhd-otp.js script to get a token automatically\n');
} else {
  testDashboardEndpoint();
}
