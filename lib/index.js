const http = require('http');
const url = require('url');
const net = require('net');
const common = require('./common');

const httpServer = http.createServer(httpProxyHandler);
httpServer.on('connect', connectHandler);
common.catchStreamError([httpServer]);


/**
 * handle the http request and response
 * 
 * @param {Request} sourceRequest 
 * @param {Response} sourceResponse 
 */
function httpProxyHandler(sourceRequest, sourceResponse) {
  const urlObj = url.parse(sourceRequest.url);

  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port,
    path: urlObj.path,
    headers: sourceRequest.headers,
  };
  // create a request to real server
  const proxyRequest = http.request(options, (proxyResponse) => {
    sourceResponse.writeHead(proxyResponse.statusCode, proxyResponse.headers);
    proxyResponse.on('error', common.defaultErrorHandle);
    proxyResponse.pipe(sourceResponse);
  });
  // pipe the request's body
  sourceRequest.pipe(proxyRequest);

  common.catchStreamError([sourceRequest, sourceResponse, proxyRequest]);
}


/**
 * intercept the CONNECT request, forward to https-proxy-server
 * 
 * @param {any} sourceRequest 
 * @param {Socket} sourceSocket 
 * @param {any} head 
 */
function connectHandler(sourceRequest, sourceSocket, head) {
  const forwardSocket = net.connect(3001, '127.0.0.1', () => {
    sourceSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    forwardSocket.write(head);
  });

  sourceSocket.pipe(forwardSocket).pipe(sourceSocket);

  common.catchStreamError([sourceSocket, forwardSocket]);
}
