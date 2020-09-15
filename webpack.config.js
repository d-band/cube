const solve = require('./api/solve');

module.exports = (cfg) => {
  cfg.devServer = {
    before (app, server, compiler) {
      app.get('/api/solve', solve);
    }
  };
  return cfg;
};
