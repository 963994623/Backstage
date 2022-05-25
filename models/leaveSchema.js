const mongoose = require("mongoose");
const leaveSchema = mongoose.Schema({
    orderNo: String,//订单号
    applyType: Number,//申请类型
    startTime: {//开始时间
        type: Date,
        default: Date.now()
    },
    endTime: {//结束时间
        type: Date,
        default: Date.now()
    },
    applyUser: {    //申请人信息
        userId: String,
        userName: String,
        userEmail: String,
    },
    leaveTime: String,   //休假时间
    reasons: String, //休假原因
    auditUsers: String,  //完整审批人
    curAuditUserName: String, //当前审批人
    auditFlows: [ //审批流
        {
            userId: String,
            userName: String,
            userEmail: String
        }
    ],
    auditLogs: [
        {
            userId: String,
            userName: String,
            createTime: Date,
            remark: String,
            action: String
        }
    ],
    applyState: {
        type: Number,
        default: 1
    },
    createTime: {
        type: Date,
        default: Date.now()
    }

})

module.exports = mongoose.model("leaves", leaveSchema, "leaves")