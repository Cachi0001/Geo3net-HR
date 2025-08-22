async function testLogin() {
  const { default: fetch } = await import('node-fetch');
  try {
    console.log('Testing login API...');
    
    const response = await fetch('http://localhost:5003/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@go3net.com',
        password: 'Admin123!'
      })
    });
    
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.log('❌ Login failed with status:', response.status);
      console.log('Error details:', data);
    } else {
      console.log('✅ Login successful!');
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testLogin();