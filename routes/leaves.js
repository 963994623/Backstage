const router = require("koa-router")();
const utils = require("../utils/utils");
const jwt = require('jsonwebtoken');
const counter = require("../models/counterSchema");
const md5 = require("md5");



/**
 * 引入模型  配置二级路由
 */
const Leave = require("../models/leaveSchema");
const Dept = require("../models/deptSchema");
router.prefix("/leave");


//获取当前角色对应的休假申请列表 或 当前角色对应需要审核的列表
router.get("/list", async ctx => {
    const { applyState, type } = ctx.request.query;
    const { page, skipIndex } = utils.pager(ctx.request.query);
    let authorization = ctx.request.headers.authorization;
    let { data } = utils.decoded(authorization);
    try {
        let params = {};
        if (type == 'approve') {
            //查询当前需要审批的申请列表
            if (applyState == 1 || applyState == 2) {
                // params.curAuditUserName = data.userName;
                params["auditFlows.userId"] = data.userId;
                params.$or = [{ applyState: 1 }, { applyState: 2 }]
            } else if (applyState > 2) {
                params = { "auditFlows.userId": data.userId, applyState }
            } else {
                params = { "auditFlows.userId": data.userId }
            }
        } else {
            //查询当前用户的休假申请列表
            params = {
                "applyUser.userId": data.userId
            };
            if (applyState) params.applyState = applyState;
        }

        console.log(params);
        const query = Leave.find(params);
        const list = await query.skip(skipIndex).limit(page.pageSize);
        const total = await Leave.countDocuments(params);


        ctx.body = utils.success({
            page: {
                ...page,
                total,
            },
            list
        })


    } catch (error) {
        ctx.body = utils.fail("失败")
    }
})

//休假申请的申请 作废
router.post("/operate", async ctx => {
    const { _id, action, ...params } = ctx.request.body;
    let authorization = ctx.request.headers.authorization;
    let { data } = utils.decoded(authorization);

    if (action == "create") {
        //生成单号
        let orderNo = "XJ"
        orderNo += utils.formateDate(new Date(), "yyyyMMdd");
        let count = await Leave.countDocuments();
        params.orderNo = orderNo + count;

        // 获取用户当前部门Id
        let id = await data.deptId.pop();

        //查找负责人信息
        let dept = await Dept.findById(id);
        //查找人事部门和财务部门的负责人信息
        let userList = await Dept.find({ "deptName": { $in: ["人事部门", "财务部门"] } })

        //当前负责人
        let curAuditUserName = dept.userName;

        //完整审批人
        let auditUsers = dept.userName;

        //审批流
        let auditFlows = [
            { userId: dept.userId, userName: dept.userName, userEmail: dept.userEmail },
        ]
        userList.map(item => {
            auditFlows.push({
                userId: item.userId,
                userName: item.userName,
                userEmail: item.userEmail
            })
            auditUsers += `,${item.userName}`
        })

        params.auditUsers = auditUsers;
        params.auditFlows = auditFlows;
        params.curAuditUserName = curAuditUserName;
        params.applyUser = {
            userId: data.userId,
            userName: data.userName,
            userEmail: data.userEmail
        }
        params.auditLogs = []

        await Leave.create(params)
        ctx.body = utils.success("", "创建成功")
    } else {
        const res = await Leave.findByIdAndUpdate(_id, { applyState: 5 })
        ctx.body = utils.success(res, "删除成功")
    }
})

//审批流
router.post('/approve', async ctx => {
    const { action, remark, _id } = ctx.request.body;
    let authorization = ctx.request.headers.authorization;
    let { data } = utils.decoded(authorization);
    try {
        let params = {}
        //1:待审批 2:审批中 3:审批拒绝 4:审批通过 5:作废
        let doc = await Leave.findById(_id);
        let auditLogs = doc.auditLogs || []
        if (action == 'refuse') {
            params.applyState = 3
        } else {
            // 审核通过
            if (doc.auditFlows.length == doc.auditLogs.length) {
                ctx.body = utils.success("当前申请单已处理 请勿重复提交")
                return
            } else if (doc.auditFlows.length == doc.auditLogs.length + 1) {
                params.applyState = 4
            } else if (doc.auditFlows.length > doc.auditLogs.length) {
                params.applyState = 2
                params.curAuditUserName = doc.auditFlows[doc.auditLogs.length + 1].userName
            }

        }
        auditLogs.push({
            userId: data.userId,
            userName: data.userName,
            createTime: new Date(),
            reamrk: remark,
            action: action === 'refuse' ? '拒绝' : '通过'
        })
        params.auditLogs = auditLogs
        let res = await Leave.findByIdAndUpdate(_id, params)
        ctx.body = utils.success(res, "处理成功")
    } catch (error) {
        ctx.body - utils.fail(`查询异常 ${error}`,)
    }

})

router.get("/count", async ctx => {
    let authorization = ctx.request.headers.authorization;
    let { data } = utils.decoded(authorization);
    try {
        let params = {};
        params.curAuditUserName = data.userName;
        params.$or = [{ applyState: 1 }, { applyState: 2 }];
        let total = await Leave.countDocuments(params);
        ctx.body = utils.success(total, "成功")
    } catch (error) {
        ctx.body = utils.fail("查询失败")
    }
})



module.exports = router;
