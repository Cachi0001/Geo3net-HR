const fetch = require('node-fetch');

async function testAuthMe() {
  try {
    // You'll need to replace this with a valid token from your browser's localStorage
    const token = 'YOUR_TOKEN_HERE';
    
    const response = await fetch('http://localhost:5004/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Auth /me response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error testing auth/me:', error);
  }
}

console.log('To test the auth/me endpoint:');
console.log('1. Open browser dev tools');
console.log('2. Go to Application/Storage > Local Storage');
console.log('3. Copy the accessToken value');
console.log('4. Replace YOUR_TOKEN_HERE in this file with the token');
console.log('5. Run: node test-auth-me.js');