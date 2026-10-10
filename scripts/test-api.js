const http = require('http');
const req = http.get('http://localhost:3000/api/students', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
req.end();
