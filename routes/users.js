const router = require("koa-router")();
const utils = require("../utils/utils");
const jwt = require('jsonwebtoken');
const counter = require("../models/counterSchema");
const md5 = require("md5");



/**
 * 引入模型
 */
const User = require("../models/userSchema");
const Menu = require("../models/menuSchema")
const Role = require("../models/roleSchema");
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

// 全量用户列表
router.get('/all/list', async (ctx) => {
  try {
    const list = await User.find({}, "userId userName userEmail")
    ctx.body = utils.success(list)
  } catch (error) {
    ctx.body = utils.fail(error)
  }
})

/**
 * 用户删除 批量删除
 */
router.post("/delete", async (ctx) => {
  const { userIds } = ctx.request.body;
  // User.updateMany({ $or: [{ userId: 10002 }, { userId: 10003 }] })
  const res = await User.updateMany({ userId: { $in: userIds } }, { state: 2 });
  if (res.modifiedCount) {
    ctx.body = utils.success(res, `共删除${res.modifiedCount}条`)
    return;
  }
  ctx.body = utils.fail('删除失败');
})

/**
 * 用户新增/编辑
 */
router.post('/operate', async (ctx) => {
  const { userId, userName, userEmail, job, state, roleList, mobile, deptId, action } = ctx.request.body;
  if (action == 'add') {
    if (!userName || !userEmail || !deptId) {
      ctx.body = utils.fail("参数错误", utils.Code.PARAM_ERROR)
      return;
    }
    const doc = await counter.findOneAndUpdate({ _id: 'userId' }, { $inc: { sequence_value: 1 } }, { new: true })
    const res = await User.findOne({ $or: [{ userName }, { userEmail }] }, "_id userName,userEmail")
    if (res) {
      ctx.body = utils.fail(`系统检测有重复的用户,信息如下=> ${userName} = ${userEmail}`)
    } else {
      try {
        const user = new User({
          userId: doc.sequence_value,
          userName,
          userEmail,
          userPwd: md5("123456"),
          role: 1,//默认普通用哪个户,
          roleList,
          job,
          state,
          deptId,
          mobile
        })
        user.save();
        ctx.body = utils.success({}, "用户创建成功")
      } catch (err) {
        ctx.body = utils.fail("用户创建失败")
      }
    }
  } else {
    if (!deptId) {
      ctx.body = utils.fail("部门不能为空", utils.Code.PARAM_ERROR)
      return;
    }
    try {
      const res = await User.findOneAndUpdate({ userId }, { mobile, job, state, roleList, deptId })
      ctx.body = utils.success({}, "更新成功")
    } catch (err) {
      ctx.body = utils.fail('更新失败', res)
    }
  }
})


//获取用户对应的权限菜单
router.get("/getPermissionList", async ctx => {
  let authorization = ctx.request.headers.authorization;
  let { data } = utils.decoded(authorization)
  let MenuList = await getMenuList(data.role, data.roleList)
  let actionList = getActionList(JSON.parse(JSON.stringify(MenuList)))
  ctx.body = utils.success({ MenuList, actionList })
})

async function getMenuList(userRole, roleKeys) {
  console.log(userRole);
  let rootList = [];
  if (userRole == 0) {
    rootList = await Menu.find({}) || [];
  } else {
    //根据用户拥有的角色数组 获取权限列表
    //先查找用户对应的角色有哪些
    let roleList = await Role.find({ _id: { $in: roleKeys } });
    let permissionList = []
    roleList.map((role) => {
      let { checkedKeys, halfCheckedKeys } = role.permissionList;
      permissionList = permissionList.concat([...checkedKeys, ...halfCheckedKeys])
    })
    permissionList = [...new Set(permissionList)]
    rootList = await Menu.find({ _id: { $in: permissionList } }) || [];
  }
  return utils.getTreeMenu(rootList, undefined, [])
}

//测试接口
router.get("/test", ctx => {
  ctx.body = utils.success("Chenggong ")
})

function getActionList(list) {
  const actionList = [];
  const deep = (arr) => {
    while (arr.length) {
      let item = arr.pop();
      if (item.action) {
        item.action.map(item => {
          actionList.push(item.menuCode)
        })
      }
      if (item.children && !item.action) {
        deep(item.children)
      }
    }
  }



  deep(list)
  return actionList
}
module.exports = router;
