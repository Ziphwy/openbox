const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

module.exports.defaultErrorHandle = defaultErrorHandle;
/**
 * @param {Error} err 
 */
function defaultErrorHandle(err) {
  console.log(err.message);
}

module.exports.catchStreamError = catchStreamError;
/**
 * @param {Stream[]} streams
 * @returns 
 */
function catchStreamError(streams) {
  streams.forEach((item) => {
    item.on('error', defaultErrorHandle);
  });
}

module.exports.promisify = promisify;
/**
 * help ayncFunction return a promise
 * 
 * @param {Function} asyncFunc 
 * @returns {Function}
 */
function promisify(asyncFunc) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      args.push((err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
      asyncFunc && asyncFunc.apply(global, args);
    });
  };
}

const mkdirPromise = promisify(fs.mkdir);

module.exports.mkdir = mkdir;
/**
 * mkdir recursively
 * 
 * @param {String} dir 
 * @param {Number} [mode='0o777'] 
 * @returns 
 */
function mkdir(dir, mode = 0o777) {
  return mkdirPromise(dir, mode).catch((err) => {
    if (err.code === 'ENOENT') {
      return mkdir(path.dirname(dir), mode).then(() => mkdir(dir, mode));
    }
    return Promise.resolve();
  });
}
