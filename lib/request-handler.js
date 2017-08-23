const fs = require('fs');
const echo = require('./echo');
const Exchange = require('./exchange');

module.exports = requesthandler;
function requesthandler(sReq, sRes) {
  const exchange = Exchange(sRes);
  exchange.setRequest(sReq).then(() => {
    echo.log(exchange.url);
    // exchange.url = 'file:///Users/ziphwy/Gitstore/diyring/doc/history.html';

    if (/^file:/.test(exchange.url)) {
      const fileStream = fs.createReadStream(exchange.url.replace(/^file:\/\//, ''));
      exchange.setResponse(fileStream).then(() => {
        exchange.response.statusCode = 200;
        exchange.replyAndEnd();
      });
      return;
    }

    exchange.forward()
      .then(() => {
        exchange.replyAndEnd();
      })
      .catch((e) => {
        echo.error(e.stack);
      });
  })
    .catch((e) => {
      echo.error(e.stack);
    });
}
