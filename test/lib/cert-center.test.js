require('should');
const pki = require('node-forge').pki;
const certCenter = require('../../lib/cert-center');

describe('test certificate center', () => {
  it('init the root certificate', (done) => {
    certCenter.init();
    const certInfo = certCenter.getRootCertInfo();
    pki.privateKeyToPem(certInfo.key).should.be.startWith('-----BEGIN RSA PRIVATE KEY-----');
    pki.certificateToPem(certInfo.cert).should.be.startWith('-----BEGIN CERTIFICATE-----');
    done();
  });

  it('get the certificate by domain', (done) => {
    certCenter.init();
    const certInfo = certCenter.getCertInfo('192.168.1.1');
    certInfo.key.should.be.startWith('-----BEGIN RSA PRIVATE KEY-----');
    certInfo.cert.should.be.startWith('-----BEGIN CERTIFICATE-----');
    done();
  });
});

