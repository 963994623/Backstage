const router = require("koa-router")();
const utils = require("../utils/utils");
const jwt = require('jsonwebtoken');


/**
 * 引入模型
 */
const User = require("../models/userSchema");
router.prefix("/users");
/**
 * 用户管理模块
 */
router.post("/login", async (ctx) => {
  try {
    const { userName, userPwd } = ctx.request.body;
    const res = await User.findOne({
      userName,
      userPwd,
    }, 'userId userName userEmail state role deptId roleList')
    const data = res._doc;  //将查询到的数据拿出来 进行下面的加密
    // let data = null;
    // if (res._doc) {
    //   data = res._doc;
    // }
    const token = jwt.sign({
      data: data
    }, 'duxi', { expiresIn: '1h' })

    if (res) {
      data.token = token;
      ctx.body = utils.success(data);
    } else {
      ctx.body = utils.fail("用户名或密码错误");
    }
  } catch (error) {
    ctx.body = utils.fail(error.msg);
    console.log(error);
  }
});
/**
 * 用户列表
 */
router.get('/list', async (ctx) => {
  const { userId, userName, state } = ctx.request.query;
  const { page, skipIndex } = utils.pager(ctx.request.query); //将传过来的条数和页码 进行处理 获取跳过几条
  let params = {};
  if (userId) params.userId = userId;    //查询参数不是必填 所以进行判断
  if (userName) params.userName = userName;
  if (state && state != '0') params.state = state;
  try {
    const query = User.find(params, { _id: 0, userPwd: 0 })
    const list = await query.skip(skipIndex).limit(page.pageSize);
    const total = await User.countDocuments(params);
    ctx.body = utils.success({
      page: {
        ...page,
        total
      },
      list
    })
  } catch (err) {
    ctx.body.utils.fail("查询异常")
  }
})

/**
 * 用户删除 批量删除
 */

module.exports = router;
