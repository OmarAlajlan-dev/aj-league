const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  const cleanUrl = decodeURIComponent(req.url.split('?')[0]);
  const safeRel = path.normalize(cleanUrl === '/' ? 'index.html' : cleanUrl).replace(/^(\.\.[/\\])+/, '');
  const primaryPath = path.join(__dirname, safeRel);
  const publicPath = path.join(__dirname, 'public', safeRel);
  const ext = path.extname(safeRel).toLowerCase();

  const serveFile = (targetPath, onMissing) => {
    fs.readFile(targetPath, (err, content) => {
      if (err) {
        onMissing();
      } else {
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(content);
      }
    });
  };

  serveFile(primaryPath, () => {
    serveFile(publicPath, () => {
      if (ext && ext !== '.html') {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      fs.readFile(path.join(__dirname, 'index.html'), (err2, indexContent) => {
        if (err2) {
          res.writeHead(500);
          res.end('Server Error');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(indexContent);
        }
      });
    });
  });
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});