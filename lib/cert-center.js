const forge = require('node-forge');
const fs = require('fs');
const path = require('path');
const os = require('os');
const common = require('./common');

function resolve(uri) {
  return path.resolve(__dirname, uri);
}

const pki = forge.pki;
const certDir = resolve('../cert');
const rootCertPath = path.join(certDir, 'openbox.crt');
const rootKeyPath = path.join(certDir, 'openbox.pem');
let rootCertInfo = null;

module.exports.init = init;
function init() {
  try {
    const key = fs.readFileSync(rootKeyPath);
    const cert = fs.readFileSync(rootCertPath);
    rootCertInfo = {
      key: pki.privateKeyFromPem(key),
      cert: pki.certificateFromPem(cert),
    };
  } catch (err) {
    rootCertInfo = _createCertInfo(os.hostname);
    common.mkdir(path.dirname(rootCertPath)).then(() => {
      fs.writeFile(rootKeyPath, rootCertInfo.key);
      fs.writeFile(rootCertPath, rootCertInfo.cert);
    });
  }
}

module.exports.getRootCertInfo = getRootCertInfo;
function getRootCertInfo() {
  return rootCertInfo;
}

module.exports.getCertInfo = getCertInfo;
function getCertInfo(domain) {
  return _createCertInfo(domain, rootCertInfo);
}

function _createCertInfo(domain, certInfo) {
  const keys = pki.rsa.generateKeyPair();
  const cert = pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 50);

  const attrs = _getsubject(domain);
  cert.setSubject(attrs);
  cert.setExtensions(_getExtensions(domain));

  // pass the cert to sign, or self-sign
  if (certInfo && certInfo.cert && certInfo.key) {
    cert.setIssuer(certInfo.cert.subject.attributes);
    cert.sign(certInfo.key, forge.md.sha256.create());
  } else {
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey, forge.md.sha256.create());
  }

  return {
    key: pki.privateKeyToPem(keys.privateKey),
    cert: pki.certificateToPem(cert),
  };
}

function _getsubject(domain) {
  return [{
    name: 'commonName',
    value: domain,
  }, {
    name: 'countryName',
    value: 'CN',
  }, {
    shortName: 'ST',
    value: 'openbox',
  }, {
    name: 'localityName',
    value: 'Varlon',
  }, {
    name: 'organizationName',
    value: 'openbox',
  }, {
    shortName: 'OU',
    value: 'openbox',
  }];
}

function _getExtensions(domain) {
  return [{
    name: 'basicConstraints',
    cA: false,
  }, {
    name: 'keyUsage',
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true,
  }, {
    name: 'extKeyUsage',
    serverAuth: true,
    clientAuth: true,
    codeSigning: true,
    emailProtection: true,
    timeStamping: true,
  }, {
    name: 'nsCertType',
    client: true,
    server: true,
    email: true,
    objsign: true,
    sslCA: true,
    emailCA: true,
    objCA: true,
  }, {
    name: 'subjectAltName',
    altNames: [{
      type: 2,
      value: domain,
    }],
  }, {
    name: 'subjectKeyIdentifier',
  }];
}
