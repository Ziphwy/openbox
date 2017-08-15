const program = require('commander');
const server = require('../lib/index');

program
  .version('0.0.1')
  .description('a tool for debug')
  .option('-p, --port <port>', 'select a port', '3000');

program.parse(process.argv);

server.listen(program.port);
