const http = require('http');

// Test if the server is running
const testServer = () => {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/documents',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Server is running on port 3001`);
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ API is responding');
      console.log('Response:', data);
      process.exit(0);
    });
  });

  req.on('error', (err) => {
    console.log('❌ Server is not running');
    console.log('Error:', err.message);
    console.log('Make sure to start the server with: cd backend && npm run dev');
    process.exit(1);
  });

  req.end();
};

// Test after a small delay
setTimeout(testServer, 1000);