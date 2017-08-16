require('should');
const path = require('path');
const fs = require('fs');
const common = require('../../lib/common');

describe('test common dependence', () => {
  it('mkdir', (done) => {
    const testUri = path.resolve(__dirname, './a/b/c');
    common.mkdir(testUri).then(() => {
      fs.readdirSync(testUri).should.be.a.Array;
      done();
    });
  });
});
