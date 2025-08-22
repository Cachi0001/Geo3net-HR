// Test script to check if user is logged in and has valid token
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5003/api';

async function testTokenStatus() {
  console.log('🔍 Testing token status...');
  
  // Check if we can access a protected endpoint without token
  try {
    console.log('\n1. Testing without token...');
    const response = await axios.get(`${API_BASE_URL}/dashboard/super-admin`);
    console.log('❌ Unexpected: Got response without token:', response.status);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Expected: 401 Unauthorized without token');
    } else {
      console.log('❌ Unexpected error:', error.response?.status, error.message);
    }
  }
  
  // Test with admin credentials
  try {
    console.log('\n2. Testing login with admin@go3net.com...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@go3net.com',
      password: 'Admin123!'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful!');
      const token = loginResponse.data.data.accessToken;
      console.log('🔑 Token received:', token ? 'Yes' : 'No');
      
      if (token) {
        console.log('\n3. Testing protected endpoint with token...');
        const dashboardResponse = await axios.get(`${API_BASE_URL}/dashboard/super-admin`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (dashboardResponse.data.success) {
          console.log('✅ Dashboard access successful!');
          console.log('📊 Dashboard data:', JSON.stringify(dashboardResponse.data.data, null, 2));
        } else {
          console.log('❌ Dashboard access failed:', dashboardResponse.data.message);
        }
      }
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
  }
}

testTokenStatus()
  .then(() => {
    console.log('\n🏁 Test completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });