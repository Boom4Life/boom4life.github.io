
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;


const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.mp3': 'audio/mpeg',
};


function parseMultipartForm(request, callback) {
  const chunks = [];
  let boundary = '';

  const contentType = request.headers['content-type'];
  if (contentType && contentType.includes('multipart/form-data')) {
    boundary = contentType.split('boundary=')[1];
    console.log('Boundary:', boundary);
  } else {
    console.error('Content-Type missing or incorrect:', contentType);
    return callback(new Error('Not a multipart form'));
  }
  
  request.on('data', chunk => {
    chunks.push(chunk);
  });
  
  request.on('error', (err) => {
    console.error('Error in request stream:', err);
    callback(err);
  });
  
  request.on('end', () => {
    try {
      const buffer = Buffer.concat(chunks);
      console.log('Received data size:', buffer.length, 'bytes');
      
      if (buffer.length === 0) {
        return callback(new Error('Empty request body'));
      }
      
      const bodyStr = buffer.toString();
      

      const parts = bodyStr.split(`--${boundary}`);
      console.log('Found', parts.length, 'parts in multipart form');
      
      let fileName = '';
      let fileBuffer = null;
      let fileStartIndex = -1;
      let fileEndIndex = -1;
      
      for (const part of parts) {
        if (part.includes('filename=')) {
          const filenameMatch = part.match(/filename="(.+?)"/);
          if (filenameMatch) {
            fileName = filenameMatch[1];
            console.log('Found file:', fileName);
            
            const headerEndIndex = part.indexOf('\r\n\r\n');
            if (headerEndIndex !== -1) {
              fileStartIndex = bodyStr.indexOf(part) + headerEndIndex + 4;
              
              const endBoundaryIndex = bodyStr.indexOf(`\r\n--${boundary}`, fileStartIndex);
              if (endBoundaryIndex !== -1) {
                fileEndIndex = endBoundaryIndex;
                fileBuffer = buffer.slice(fileStartIndex, fileEndIndex);
                console.log('File size:', fileBuffer.length, 'bytes');
              } else {
                console.error('Could not find end boundary');
              }
            } else {
              console.error('Could not find header end');
            }
            break;
          }
        }
      }
      
      if (fileBuffer && fileName) {
        callback(null, { fileName, fileData: fileBuffer });
      } else {
        console.error('File not found in form data');
        callback(new Error('File not found in form data'));
      }
    } catch (error) {
      console.error('Error parsing multipart form:', error);
      callback(error);
    }
  });
}

function parseJSON(request, callback) {
  let body = '';
  
  request.on('data', chunk => {
    body += chunk.toString();
  });
  
  request.on('end', () => {
    try {
      const data = JSON.parse(body);
      callback(null, data);
    } catch (error) {
      callback(error);
    }
  });
}

const server = http.createServer((req, res) => {
  const pathname = url.parse(req.url).pathname;

  if (pathname === '/list-files') {

    fs.readdir('.', (err, files) => {
      if (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to read directory' }));
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(files));
    });
    return;
  }

  let filePath = '.' + pathname;
  if (filePath === './') {
    filePath = './index.html';
  }
  
  const extname = path.extname(filePath);
  const contentType = MIME_TYPES[extname] || 'text/plain';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.writeHead(404);
        res.end('File not found');
      } else {
        // Server error
        res.writeHead(500);
        res.end('Server error');
      }
      return;
    }
    
 
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
});
