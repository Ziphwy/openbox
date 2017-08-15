
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

