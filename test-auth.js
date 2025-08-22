const API_BASE_URL = 'http://localhost:5003/api';

// Test authentication and token handling
async function testAuthentication() {
  console.log('=== Authentication Test ===');
  
  // Check if tokens exist in storage
  const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
  
  console.log('Access Token exists:', !!accessToken);
  console.log('Refresh Token exists:', !!refreshToken);
  
  if (accessToken) {
    console.log('Access Token (first 20 chars):', accessToken.substring(0, 20) + '...');
  }
  
  // Test current user endpoint
  try {
    console.log('\n--- Testing /auth/me endpoint ---');
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok && data.success) {
      console.log('✅ User is authenticated');
      console.log('User info:', data.data);
    } else {
      console.log('❌ Authentication failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Error testing authentication:', error);
  }
  
  // Test time-tracking check-in endpoint
  try {
    console.log('\n--- Testing /time-tracking/checkin endpoint ---');
    const checkInData = {
      location: {
        latitude: 6.5244,
        longitude: 3.3792
      },
      notes: 'Test check-in'
    };
    
    const response = await fetch(`${API_BASE_URL}/time-tracking/checkin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkInData)
    });
    
    console.log('Check-in response status:', response.status);
    const data = await response.json();
    console.log('Check-in response data:', data);
    
    if (response.ok && data.success) {
      console.log('✅ Check-in successful');
    } else {
      console.log('❌ Check-in failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Error testing check-in:', error);
  }
  
  // Test dashboard endpoint
  try {
    console.log('\n--- Testing /dashboard/data endpoint ---');
    const response = await fetch(`${API_BASE_URL}/dashboard/data`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Dashboard response status:', response.status);
    const data = await response.json();
    console.log('Dashboard response data:', data);
    
    if (response.ok && data.success) {
      console.log('✅ Dashboard data retrieved successfully');
    } else {
      console.log('❌ Dashboard data failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Error testing dashboard:', error);
  }
  
  console.log('\n=== Test Complete ===');
  console.log('\nManual Steps:');
  console.log('1. Open browser console and run: testAuthentication()');
  console.log('2. If no tokens found, please log in again');
  console.log('3. Check if backend server is running on port 5003');
  console.log('4. Verify CORS settings allow frontend origin');
}

// Make function available globally (browser only)
if (typeof window !== 'undefined') {
  window.testAuthentication = testAuthentication;
  // Auto-run the test in browser
  testAuthentication();
} else {
  console.log('This script is designed to run in a browser environment.');
  console.log('Please open the browser console and paste this script there.');
}