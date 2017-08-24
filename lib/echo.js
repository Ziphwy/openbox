const chalk = require('chalk');

let isShow = true;

const echo = module.exports = {};

echo.log = function log(msg) {
  if (!isShow) return;
  if (typeof msg === 'object' && Object.prototype === Object.getPrototypeOf(msg)) {
    msg = JSON.stringify(msg);
  }
  process.stdout.write(chalk.green.bold('[openbox] ') + chalk.green(`INFO  ${msg}\n`));
};

echo.error = function error(msg) {
  if (typeof msg === 'object' && Object.prototype === Object.getPrototypeOf(msg)) {
    msg = JSON.stringify(msg);
  }
  process.stdout.write(chalk.red.bold('[openbox] ') + chalk.red(`ERROR ${msg}\n`));
};

echo.on = function on() {
  isShow = true;
};

echo.off = function off() {
  isShow = false;
};

