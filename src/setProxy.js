// setproxy 
const { createProxyMiddleware } = require('http-proxy-middleware');
const target = process.env.REACT_APP_BACKEND || "";

module.exports = function (app) {
  app.use(
    '/categories',
    createProxyMiddleware({ target, changeOrigin: true })
  );
};