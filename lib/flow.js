function Flow() {
  this._queue = [];
}

Flow.prototype.use = function push(handler) {
  this._queue.push(handler);
};

Flow.prototype.remove = function push(rmHandler) {
  this._queue = this._queue.filter(handler => handler.name !== rmHandler.name);
};

Flow.prototype.run = function run(baton) {
  let i = 0;
  const next = () => {
    const handler = this._queue[i++];
    if (typeof handler === 'function') {
      handler.call(baton, baton, next);
    }
  };

  next(0);
};

module.exports.Flow = Flow;
