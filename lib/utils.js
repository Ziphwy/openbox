const path = require('path');
const util = require('util');
const net = require('net');
const fs = require('fs');
const Stream = require('stream');

/**
 * help ayncFunction return a promise
 * 
 * @param {Function} asyncFunc 
 * @returns {Function}
 */
function promisify(asyncFunc) {
  return function funcPromise(...args) {
    return new Promise((resolve, reject) => {
      args.push((err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
      if (asyncFunc) asyncFunc.apply(global, args);
    });
  };
}
module.exports.promisify = promisify;


/**
 * mkdir recursively
 * 
 * @param {String} dir 
 * @param {Number} [mode='0o777'] 
 * @returns 
 */
function mkdir(dir, mode = 0o777) {
  return promisify(fs.mkdir)(dir, mode).catch((err) => {
    if (err.code === 'ENOENT') {
      return mkdir(path.dirname(dir), mode).then(() => mkdir(dir, mode));
    }
    return Promise.resolve();
  });
}
module.exports.mkdir = mkdir;


/**
 * transform a stream to buffer
 * 
 * @async
 * @param {Stream} stream 
 * @returns {Promise}
 */
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const data = [];
    stream
      .on('data', (chunk) => {
        data.push(chunk);
      })
      .on('end', () => {
        resolve(Buffer.concat(data));
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}
module.exports.streamToBuffer = streamToBuffer;


/**
 * transform a buffer to stream
 * 
 * @async
 * @param {Buffer} buffer 
 * @returns {Stream}
 */
function bufferToStream(buffer) {
  const stream = new Stream.Readable({
    read(size) {
      const start = this.offset;
      const end = this.offset + size;
      if (end < buffer.length) {
        this.push(buffer.slice(start, end));
        this.offset = end;
      } else {
        this.push(buffer.slice(start, buffer.length));
        this.push(null);
      }
    },
  });
  stream.offset = 0;
  return stream;
}
module.exports.bufferToStream = bufferToStream;


/**
 * helper that get wildcard for ssl savely.
 * return ip | xxx.com | *.xxx.com
 * 
 * 
 * @param {String} hostname 
 * @returns {String}
 */
function getWildcard(hostname) {
  if (net.isIP(hostname)) {
    return hostname;
  }
  const hostArr = hostname.split('.');
  const len = hostArr.length;
  if (len < 3) {
    return hostname;
  }
  return `*.${hostArr[len - 2]}.${hostArr[len - 1]}`;
}
module.exports.getWildcard = getWildcard;
