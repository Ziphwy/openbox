const https = require('https');
const tls = require('tls');
const utils = require('./utils');
const requestHandler = require('./request-handler');
const certCenter = require('./cert-center');
const echo = require('./echo');

const httpsProxy = module.exports = {
  useSni: true,
  sniServerPort: null,
  secureCtxMap: {},
  serverPortMap: {},
};


/**
 * foige certificate by hostname
 * 
 * @param {String} hostname 
 * @returns {{ key: String , cert: String }}
 */
function _forgeContext(hostname) {
  const wildcartHost = utils.getWildcard(hostname);
  if (!httpsProxy.secureCtxMap[wildcartHost]) {
    const certInfo = certCenter.getCertInfo(wildcartHost);
    const secureCtx = tls.createSecureContext({
      key: certInfo.key,
      cert: certInfo.cert,
    });
    httpsProxy.secureCtxMap[wildcartHost] = secureCtx;
  }
  return httpsProxy.secureCtxMap[wildcartHost];
}


function _startServer(httpsServer) {
  return new Promise((resolve, reject) => {
    httpsServer.on('request', requestHandler);

    httpsServer.on('error', (err) => {
      reject(err);
    });

    httpsServer.listen(0, () => {
      echo.log(`(SRVR) New httpsProxy is listening on ${httpsServer.address().port}`);
      resolve(httpsServer.address().port);
    });
  });
}


httpsProxy.init = function init(option = {}) {
  const { useSni = true } = option;
  this.useSni = useSni;
  return certCenter.init()
    .then(() => this.useSni && this.createSNIServer())
    .then((port) => {
      echo.log('(SRVR) The SNI service is opened');
      this.sniServerPort = port;
    });
};


httpsProxy.getServer = function getServer(domain) {
  if (this.useSni) {
    return Promise.resolve(this.sniServerPort);
  }
  if (this.ServerPortMap[domain]) {
    return Promise.resolve(this.ServerPortMap[domain]);
  }
  return this.createServer(domain).then((port) => {
    this.serverPortMap[domain] = port;
  });
};


httpsProxy.createSNIServer = function createSNIServer() {
  const httpsServer = https.createServer({
    SNICallback(hostname, done) {
      done(null, _forgeContext(hostname));
    },
  });
  return _startServer(httpsServer);
};


httpsProxy.createServer = function createServer(domain) {
  const wildcartHost = utils.getWildcard(domain);
  const certInfo = certCenter.getCertInfo(wildcartHost);
  const httpsServer = https.createServer({
    key: certInfo.key,
    cert: certInfo.cert,
  });
  return _startServer(httpsServer);
};

