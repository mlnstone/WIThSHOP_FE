const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/categories', // 프록시 적용할 경로
    createProxyMiddleware({
      target: 'http://localhost:8887', // 백엔드 주소
      changeOrigin: true,
    })
  );
};