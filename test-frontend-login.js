const axios = require('axios');

// Test frontend login functionality
async function testFrontendLogin() {
  try {
    console.log('🔐 Testing frontend login...');
    
    // Try multiple possible credentials
    const credentials = [
      { email: 'admin@go3net.com', password: 'Admin123!' },
      { email: 'admin@test.com', password: 'Admin123!' },
      { email: 'test@admin.com', password: 'TestAdmin123!' },
      { email: 'kayode@go3net.com.ng', password: 'Admin123!@#' }
    ];
    
    for (const loginData of credentials) {
      console.log(`\n🔍 Trying: ${loginData.email}`);
    
      try {
        const response = await axios.post('http://localhost:5003/api/auth/login', loginData);
        
        if (response.data.success) {
          console.log('✅ Login successful!');
          console.log('User:', response.data.data.user);
          console.log('Access Token:', response.data.data.accessToken);
          
          // Test API call with token
          try {
            const dashboardResponse = await axios.get('http://localhost:5003/api/dashboard/super-admin', {
              headers: {
                'Authorization': `Bearer ${response.data.data.accessToken}`
              }
            });
            
            console.log('✅ Dashboard API call successful!');
            console.log('Dashboard data:', dashboardResponse.data);
          } catch (apiError) {
            console.log('⚠️ Dashboard API call failed:', apiError.response?.data || apiError.message);
          }
          
          // Instructions for manual testing
          console.log('\n📝 Manual testing instructions:');
          console.log('1. Open browser developer tools (F12)');
          console.log('2. Go to Application/Storage tab');
          console.log('3. In localStorage, add:');
          console.log(`   Key: accessToken`);
          console.log(`   Value: ${response.data.data.accessToken}`);
          console.log('4. Refresh the page');
          console.log('5. You should now be logged in as super-admin');
          
          return; // Exit on successful login
        } else {
          console.log('❌ Login failed:', response.data.message);
        }
      } catch (error) {
        console.log('❌ Login error:', error.response?.data?.message || error.message);
      }
    }
    
    console.log('\n❌ All login attempts failed!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testFrontendLogin();