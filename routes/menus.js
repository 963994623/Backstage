const router = require("koa-router")();
const utils = require("../utils/utils");
const Menu = require("../models/menuSchema");
const log4js = require("../utils/log4j");
const jwt = require("jsonwebtoken");


router.prefix("/menu");




//获取菜单列表
router.get("/list", async (ctx) => {
    const { menuName, menuState } = ctx.request.query;
    const params = {};
    if (menuName) params.menuName = menuName;
    if (menuState) params.menuState = menuState;
    const result = await Menu.find(params);

    const permissionList = utils.getTreeMenu(result, undefined, [])
    ctx.body = utils.success(permissionList, "查看成功");

})

// 进行抽离 到utils
// // 树形递归
// function getTreeMenu(res, id, list) {
//     for (let i = 0; i < res.length; i++) {
//         let item = res[i];

//         if (String(item.parentId.slice().pop()) == String(id)) {

//             list.push(item._doc)
//         }
//     }
//     list.map(item => {
//         item.children = [];
//         getTreeMenu(res, item._id, item.children)
//         if (item.children.length == 0) {
//             delete item.children;
//         } else if (item.children.length > 0 && item.children[0].menuType == 2) {
//             item.action = item.children;
//         }
//     })
//     return list
// }

//增删改menu
router.post("/operate", async (ctx) => {
    const { _id, action, ...params } = ctx.request.body;
    let res;
    let info;
    try {
        if (action == "add") {
            res = await Menu.create(params)
            info = "创建成功"
        } else if (action == "edit") {
            params.updateTime = new Date();
            res = await Menu.findByIdAndUpdate(_id, params)
            info = "编辑成功"
        } else {
            res = await Menu.findByIdAndRemove(_id);
            await Menu.deleteMany({ parentId: { $all: [_id] } });
            info = "删除成功"
        }
        ctx.body = utils.success("", info)
    } catch (error) {
        ctx.body = utils.fail("创建/编辑/删除  失败")
    }
})


module.exports = router;