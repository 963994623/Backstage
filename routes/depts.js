const router = require("koa-router")();
const utils = require("../utils/utils");
const Dept = require("../models/deptSchema")
router.prefix("/dept");

//部门树形列表
router.get("/list", async ctx => {
    let { deptName } = ctx.request.query;
    let params = {};
    if (deptName) params.deptName = deptName;
    let rootList = await Dept.find(params)
    if (deptName) {
        ctx.body = utils.success(rootList, "查询成功")
    } else {
        let tressList = getTreeDept(rootList, null, [])
        ctx.body = utils.success(tressList, "查询成功")
    }
})

function getTreeDept(rootList, id, list) {
    for (let i = 0; i < rootList.length; i++) {
        let item = rootList[i];
        if (String(item.parentId.slice().pop()) == String(id)) {
            list.push(item._doc)
        }
    }
    list.map(item => {
        item.children = [];
        getTreeDept(rootList, item._id, item.children)
        if (item.children.length == 0) {
            delete item.children
        }
    })
    return list
}

//部门操作 创建 编辑 删除
router.post("/operate", async ctx => {
    const { action, _id, ...params } = ctx.request.body;
    // console.log(params + "+++++++++");
    let res, info;
    try {
        if (action == "create") {
            res = await Dept.create(params)
            info = "创建成功"
        } else if (action == 'edit') {
            params.updateTime = new Date()
            res = await Dept.findByIdAndUpdate(_id, params)
            info = "编辑成功"
        } else if (action == 'delete') {
            res = await Dept.findByIdAndDelete(_id)
            await Dept.deleteMany({ parentId: { $all: [_id] } })
            info = "删除成功"
        }
        ctx.body = utils.success({}, info)
    } catch (error) {
        ctx.body = utils.fail(error)
    }
})
module.exports = router;