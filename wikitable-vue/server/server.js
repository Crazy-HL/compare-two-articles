// server.js

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const port = 8081;

app.use(express.static('./public'))
// 设置代理中间件，代理到目标网站
const proxy = createProxyMiddleware({
  target: 'https://zh.wikipedia.org', // 目标网站的 URL
  changeOrigin: true,  // 修改源
  pathRewrite: {
    '^/proxy': '',  // 移除 `/proxy` 前缀
  },
});

// 使用代理将所有访问 `/proxy` 的请求转发到目标 URL
app.use('/proxy', proxy);

// 启动服务器
app.listen(port, () => {
  console.log(`代理服务器运行中，访问：http://localhost:${port}`);
});
