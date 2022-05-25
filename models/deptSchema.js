const mongoose = require("mongoose")
const deptSchema = mongoose.Schema({
    deptName: String,//部门名称
    userId: String,
    userName: String,
    userEmail: String,
    parentId: [mongoose.Types.ObjectId],
    updateTime: {
        type: Date,
        default: Date.now()
    },
    createTime: {
        type: Date,
        default: Date.now()
    }
})
module.exports = mongoose.model("depts", deptSchema, "depts")