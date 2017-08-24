const url = require('url');
const http = require('http');
const https = require('https');
const utils = require('./utils');

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

function Exchange(serverResponse) {
  if (!(this instanceof Exchange)) {
    return new Exchange(serverResponse);
  }

  this.request = {
    url: '',
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

  if (request.connection.encrypted) {
    this.url = `https://${request.headers.host}${request.url}`;
  } else {
    this.url = request.url;
  }

  const urlObject = url.parse(this.url);
  let port = urlObject.port;
  if (!port) {
    if (request.connection.encrypted) {
      port = 443;
    } else {
      port = 80;
    }
  }
  this.request.option = {
    protocal: urlObject.protocol,
    hostname: urlObject.hostname,
    port,
    path: urlObject.path,
    method: request.method,
    headers: request.headers,
  };

  return utils.streamToBuffer(request).then((buffer) => {
    this.request.data = buffer;
  });
};

Exchange.prototype.setResponse = function setResponse(response) {
  this._rRes = response;

  this.response = {
    statusCode: response.statusCode,
    headers: response.headers,
  };

  return utils.streamToBuffer(response).then((buffer) => {
    this.response.data = buffer;
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
  const protocal = /https/.test(option.protocal) ? https : http;

  return new Promise((resolve, reject) => {
    const req = protocal.request(option, (res) => {
      this.setResponse(res).then(resolve);
    });
    utils.bufferToStream(this.request.data)
      .on('error', err => reject(err))
      .pipe(req);
  });
};


Exchange.prototype.replyAndEnd = function replyAndEnd() {
  const response = this.response;
  this._sRes.writeHead(response.statusCode, response.headers);
  utils.bufferToStream(response.data).pipe(this._sRes);
};

module.exports = Exchange;
