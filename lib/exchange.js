const url = require('url');
const http = require('http');
const https = require('https');

function _isMatch(mainObj, testObj) {
  const keys = Object.keys(testObj);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];
    if (typeof testObj[key] === 'object') {
      if (!_isMatch(mainObj[key], testObj[key])) {
        return false;
      }
    } else if (testObj[key] !== '' && mainObj[key] !== testObj[key]) {
      return false;
    }
  }
  return true;
}

function _extend(source, target) {
  const result = source;
  const keys = Object.keys(target);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];
    if (typeof source[key] === 'object') {
      _extend(result[key], target[key]);
    } else {
      result[key] = target[key].toString();
    }
  }
}

function _streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const data = [];
    stream
      .on('data', (chunk) => {
        data.push(chunk);
      })
      .on('end', () => {
        resolve(Buffer.from(data));
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

function Exchange(serverResponse) {
  if (!(this instanceof Exchange)) {
    return new Exchange(serverResponse);
  }

  this.request = {
    option: {},
    data: null,
  };

  this.response = {
    statusCode: 0,
    headers: {},
    data: null,
  };

  this.modify = [];

  this._sReq = null;
  this._sRes = serverResponse;
  this._rRes = null;
}

Exchange.prototype.setRequest = function setRequest(request) {
  this._sReq = request;

  const urlObject = url.parse(request.url);
  this.request.option = {
    protocal: urlObject.protocol,
    hostname: urlObject.hostname,
    port: urlObject.port,
    method: request.method,
    headers: request.headers,
  };

  return _streamToBuffer(request).then((buffer) => {
    this.request.data = buffer;
    return this;
  });
};

Exchange.prototype.setResponse = function setResponse(response) {
  this._rRes = response;

  this.response = {
    statusCode: response.statusCode,
    headers: response.headers,
  };

  return _streamToBuffer(response).then((buffer) => {
    this.response.data = buffer;
    return this;
  });
};

Exchange.prototype.replace = function replace(rules) {
  for (let i = 0, len = rules.length; i < len; i++) {
    if (_isMatch(this, rules[i].condition)) {
      _extend(this, rules[i].content);
    }
  }
  return this;
};


Exchange.prototype.forward = function forward() {
  const option = this.request.option;
  const protocal = option.protocal === 'https' ? https : http;

  return new Promise((resolve, reject) => {
    const req = protocal.request(option, (res) => {
      this.setResponse(res).then(resolve);
    });
    req.write(this.request.data);
    req.end();
    req.on('error', (err) => {
      reject(err);
    });
  });
};


Exchange.prototype.replyAndEnd = function replyAndEnd() {
  this._sRes.writeHead(this.responseStatusCode, this.responseHeaders);
  this._sRes.write(this.responseBody);
  this._sRes.end();
};

module.exports = Exchange;
