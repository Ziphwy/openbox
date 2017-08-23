const http = require('http');
const net = require('net');
const url = require('url');
const echo = require('./echo');
const requesthandler = require('./request-handler');
const httpsProxy = require('./https-proxy');

process.on('uncaughtException', (err) => {
  echo.error(err.message);
});

function _getSocket(sourceRequest, sourceSocket, head) {
  const urlObj = url.parse(`https://${sourceRequest.url}`);
  return httpsProxy.getServer(urlObj.hostname);
}

const server = http.createServer((sReq, sRes) => {
  requesthandler(sReq, sRes);
});

server.on('connect', (sourceRequest, sourceSocket, head) => {
  _getSocket(sourceRequest, sourceSocket, head).then((port) => {
    const forwardSocket = net.connect(port, () => {
      sourceSocket.write(`HTTP/${sourceRequest.httpVersion} 200 Connection Established\r\n\r\n`);
      forwardSocket.write(head);
    });
    sourceSocket.pipe(forwardSocket).pipe(sourceSocket);
    // sourceSocket.on('end', () => {
    //   sourceSocket.destroy();
    // });
    // forwardSocket.on('end', () => {
    //   forwardSocket.destroy();
    // });
  });
});

Promise.resolve()
  .then(() => httpsProxy.init())
  .then(() => {
    server.listen(3000);
    echo.log('the proxy server is listening on 3000');
  });

