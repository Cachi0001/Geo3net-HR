// Using built-in fetch (Node.js 18+)

async function testTaskSearch() {
  try {
    console.log('Testing task search endpoint...');
    
    const response = await fetch('http://localhost:5004/api/tasks/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '',
        filters: {},
        page: 1,
        limit: 10
      })
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Task search working!');
    } else {
      console.log('❌ Task search failed');
    }
  } catch (error) {
    console.error('❌ Error testing task search:', error);
  }
}

testTaskSearch();