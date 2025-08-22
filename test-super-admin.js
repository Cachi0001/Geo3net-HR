const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:5003/api';
const FRONTEND_URL = 'http://localhost:3000';

// Super-admin credentials
const SUPER_ADMIN_CREDENTIALS = {
  email: 'kayode@go3net.com.ng',
  password: 'Kayode123$'
};

// Test functions
async function testLogin() {
  try {
    console.log('🔐 Testing super-admin login...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, SUPER_ADMIN_CREDENTIALS);
    
    if (response.data.success) {
      console.log('✅ Login successful!');
      console.log('User:', response.data.user?.email || 'Email not available');
      console.log('Role:', response.data.user?.role || 'Role not available');
      console.log('Token received:', !!response.data.token);
      console.log('Full response:', JSON.stringify(response.data, null, 2));
      return response.data.token;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testDashboardData(token) {
  try {
    console.log('\n📊 Testing dashboard data...');
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // Test system metrics
    const metricsResponse = await axios.get(`${API_BASE_URL}/dashboard/system-metrics`, { headers });
    console.log('✅ System metrics:', metricsResponse.data.success ? 'Available' : 'Failed');
    
    // Test locations
    const locationsResponse = await axios.get(`${API_BASE_URL}/locations`, { headers });
    console.log('✅ Locations:', locationsResponse.data.success ? 'Available' : 'Failed');
    
    // Test attendance policies
    const policiesResponse = await axios.get(`${API_BASE_URL}/attendance/policies`, { headers });
    console.log('✅ Attendance policies:', policiesResponse.data.success ? 'Available' : 'Failed');
    
  } catch (error) {
    console.log('❌ Dashboard data error:', error.response?.data?.message || error.message);
  }
}

async function testTimeTracking(token) {
  try {
    console.log('\n⏰ Testing time tracking...');
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // Test get active time entry
    const activeResponse = await axios.get(`${API_BASE_URL}/time-tracking/active`, { headers });
    console.log('✅ Active time entry check:', activeResponse.data.success ? 'Available' : 'No active entry');
    
    // Test get time entries
    const entriesResponse = await axios.get(`${API_BASE_URL}/time-tracking/entries`, { headers });
    console.log('✅ Time entries:', entriesResponse.data.success ? 'Available' : 'Failed');
    
  } catch (error) {
    console.log('❌ Time tracking error:', error.response?.data?.message || error.message);
  }
}

async function testFrontendAccess() {
  try {
    console.log('\n🌐 Testing frontend access...');
    
    const response = await axios.get(FRONTEND_URL);
    console.log('✅ Frontend accessible:', response.status === 200 ? 'Yes' : 'No');
    
  } catch (error) {
    console.log('❌ Frontend access error:', error.message);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Go3net HR System Tests\n');
  console.log('Testing with super-admin credentials:');
  console.log('Email:', SUPER_ADMIN_CREDENTIALS.email);
  console.log('Password: [HIDDEN]\n');
  
  // Test login
  const token = await testLogin();
  
  if (token) {
    // Test dashboard data
    await testDashboardData(token);
    
    // Test time tracking
    await testTimeTracking(token);
  }
  
  // Test frontend
  await testFrontendAccess();
  
  console.log('\n🏁 Tests completed!');
  console.log('\n📝 Manual testing steps:');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Login with:', SUPER_ADMIN_CREDENTIALS.email);
  console.log('3. Test super-admin dashboard features:');
  console.log('   - Location Management');
  console.log('   - Attendance Policies');
  console.log('   - System Configuration');
  console.log('   - User Management');
  console.log('   - Analytics');
  console.log('4. Test employee time tracking:');
  console.log('   - Navigate to Time Tracking');
  console.log('   - Test check-in/check-out functionality');
  console.log('   - Verify location-based restrictions');
}

// Run tests
runTests().catch(console.error);