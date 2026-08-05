const http = require('http');

const postData = JSON.stringify({ phone: '0987654321', password: 'password123' });
const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Login res:', data);
    const result = JSON.parse(data);
    if (result.token) {
        const req2 = http.request({
            hostname: 'localhost',
            port: 8080,
            path: '/api/users',
            headers: { 'Authorization': 'Bearer ' + result.token }
        }, (res2) => {
            let data2 = '';
            res2.on('data', chunk => data2+=chunk);
            res2.on('end', () => {
                console.log('Users res:', data2.substring(0, 500));
            });
        });
        req2.end();
    }
  });
});

req.on('error', (e) => {
  console.error('problem with request:', e.message);
});

req.write(postData);
req.end();
