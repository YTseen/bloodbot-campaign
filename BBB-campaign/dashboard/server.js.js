const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;
const base = path.join(__dirname);

http.createServer((req, res) => {
  const filePath = path.join(base, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.json': 'application/json',
    '.js': 'text/javascript',
    '.css': 'text/css'
  };
  const contentType = contentTypes[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}).listen(port, () => {
  console.log(`🧠 BloodBot Dashboard running at http://localhost:${port}`);
});
