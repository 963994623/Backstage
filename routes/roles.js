const router = require("koa-router")();
const utils = require("../utils/utils");
const jwt = require('jsonwebtoken');
const counter = require("../models/counterSchema");
const md5 = require("md5");



/**
 * 引入模型
 */
const Role = require("../models/roleSchema");
router.prefix("/roles");
//查询所有的角色列表
router.get("/allList", async (ctx) => {
    try {
        const list = await Role.find({}, "_id roleName")
        ctx.body = utils.success(list)
    } catch (e) {
        ctx.body = utils.fail("查询失败" + e)
    }
})
//查询角色列表 and 分页
router.get("/list", async (ctx) => {
    const { roleName } = ctx.request.query;
    const { page, skipIndex } = utils.pager(ctx.request.query);
    try {
        let params = {};
        if (roleName) params.roleName = roleName
        const query = await Role.find(params).skip(skipIndex).limit(page.pageSize);
        const total = await Role.countDocuments(params);
        ctx.body = utils.success({ list: query, page: { ...page, total } })
    } catch (error) {
        ctx.body = utils.fail("查询失败")
    }
})
//角色操作：创建、编辑和删除
router.post("/operate", async ctx => {
    const { roleName, remark, action, _id } = ctx.request.body;
    let res, info;
    try {
        if (action == 'create') {
            res = await Role.create({ roleName, remark });
            info = "创建成功"
        } else if (action == 'edit') {
            let params = { roleName, remark };
            params.updateTime = new Date();
            res = await Role.findOneAndUpdate({ _id }, params);
            info = "编辑成功"
        } else if (action == 'delete') {
            res = await Role.findByIdAndRemove(_id);
            info = "删除成功"
        }
        ctx.body = utils.success(res || {})
    } catch (error) {
        ctx.body = utils.fail("操作失败")
    }
})
//角色权限修改
router.post("/update/permission", async ctx => {
    const { _id, permissionList } = ctx.request.body;
    try {
        const res = await Role.findByIdAndUpdate(_id, { permissionList, updateTime: new Date() })
        ctx.body = utils.success(res, "权限设置成功")
    } catch (error) {
        ctx.body = utils.fail("权限设置失败")
    }
})

module.exports = router;
