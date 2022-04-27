const Koa = require("koa");
const app = new Koa();
const views = require("koa-views");
const json = require("koa-json");
const onerror = require("koa-onerror");
const bodyparser = require("koa-bodyparser");
const logger = require("koa-logger");
const log4js = require("./utils/log4j.js");
const users = require("./routes/users");
const menus = require("./routes/menus");
const router = require("koa-router")();
const jwt = require("jsonwebtoken")
const koajwt = require('koa-jwt');
const utils = require("./utils/utils");

// error handler
onerror(app);

//链接数据库
require("./config/db");

// middlewares
app.use(
  bodyparser({
    enableTypes: ["json", "form", "text"],
  })
);
app.use(json());
app.use(logger());

//控制静态文件
app.use(require("koa-static")(__dirname + "/public"));
//控制pug页面
app.use(
  views(__dirname + "/views", {
    extension: "pug",
  })
);

// logger
app.use(async (ctx, next) => {
  log4js.info("params:" + JSON.stringify(ctx.request.body || ctx.request.query));
  await next().catch((err) => {
    if (err.status == '401') {
      ctx.status = 200;
      ctx.body = utils.fail('token验证失败', utils.Code.AUTH_ERROR);
    } else {
      throw err
    }
  })
});

//koa-jwt
app.use(koajwt({ secret: 'duxi' }).unless({
  path: [/^\/api\/users\/login/]
}))

// routes
router.prefix("/api");

// router.get('/leave/count', (ctx) => {
//   const token = ctx.request.header.authorization.split(' ')[1];
//   const payload = jwt.verify(token, 'duxi')
//   ctx.body = payload
// })
router.use(users.routes(), users.allowedMethods());
router.use(menus.routes(), menus.allowedMethods());
app.use(router.routes(), router.allowedMethods());


// error-handling
app.on("error", (err, ctx) => {
  console.error("server error", err, ctx);
  log4js.error(`${err.stack}`);
});

module.exports = app;
