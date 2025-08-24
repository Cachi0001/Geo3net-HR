const axios = require('axios');

const BASE_URL = 'http://localhost:5004';

async function testEndpoints() {
    console.log('🧪 Testing Employee Endpoints...\n');
    
    try {
        // Test 1: Health check
        console.log('1. Testing health endpoint...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health check:', healthResponse.data);
        
        // Test 2: Test unauthenticated access to employees
        console.log('\n2. Testing unauthenticated access to /api/employees...');
        try {
            const employeesResponse = await axios.get(`${BASE_URL}/api/employees`);
            console.log('❌ Unexpected success (should require auth):', employeesResponse.data);
        } catch (error) {
            console.log('✅ Expected auth error:', error.response?.status, error.response?.data?.message);
        }
        
        // Test 3: Test unauthenticated access to dashboard/employees
        console.log('\n3. Testing unauthenticated access to /api/dashboard/employees...');
        try {
            const dashboardEmployeesResponse = await axios.get(`${BASE_URL}/api/dashboard/employees`);
            console.log('❌ Unexpected success (should require auth):', dashboardEmployeesResponse.data);
        } catch (error) {
            console.log('✅ Expected auth error:', error.response?.status, error.response?.data?.message);
        }
        
        // Test 4: Create a test user and get token (if possible)
        console.log('\n4. Creating test super-admin user...');
        try {
            const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
                fullName: 'Test Super Admin',
                email: 'testsuperadmin@example.com',
                password: 'TestPassword123!',
                role: 'super-admin'
            });
            console.log('✅ Test user created:', registerResponse.data?.message);
            
            // Login with test user
            console.log('\n5. Logging in with test user...');
            const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: 'testsuperadmin@example.com',
                password: 'TestPassword123!'
            });
            
            if (loginResponse.data?.success && loginResponse.data?.data?.token) {
                const token = loginResponse.data.data.token;
                console.log('✅ Login successful, token received');
                
                // Test authenticated access
                console.log('\n6. Testing authenticated access to /api/employees...');
                const authEmployeesResponse = await axios.get(`${BASE_URL}/api/employees`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ Authenticated employees access:', {
                    success: authEmployeesResponse.data?.success,
                    employeeCount: authEmployeesResponse.data?.data?.employees?.length || 0,
                    total: authEmployeesResponse.data?.data?.total
                });
                
                // Test authenticated access to dashboard/employees
                console.log('\n7. Testing authenticated access to /api/dashboard/employees...');
                const authDashboardResponse = await axios.get(`${BASE_URL}/api/dashboard/employees`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ Authenticated dashboard/employees access:', {
                    success: authDashboardResponse.data?.success,
                    employeeCount: authDashboardResponse.data?.data?.employees?.length || 0,
                    total: authDashboardResponse.data?.data?.total
                });
                
            } else {
                console.log('❌ Login failed:', loginResponse.data);
            }
            
        } catch (error) {
            console.log('⚠️ Test user creation/login error:', error.response?.data?.message || error.message);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

// Run the tests
testEndpoints();