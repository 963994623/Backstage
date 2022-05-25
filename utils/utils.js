const jwt = require("jsonwebtoken");
const log4js = require("./log4j");

//状态码
const Code = {
  SUCCESS: 200,
  PARAM_ERROR: 10001,
  USER_ACCOUNT_ERROR: 20001,
  USER_LOGIN_ERROR: 30001,
  BUSINESS_ERROR: 40001,
  AUTH_ERROR: 50001,
};

/**
 * 分页结构封装
 * @param {number} pageNum
 * @param {number} pageSize
 */
function pager({ pageNum = 1, pageSize = 10 }) {
  pageNum *= 1;
  pageSize *= 1;
  const skipIndex = (pageNum - 1) * pageSize;
  return {
    page: {
      pageNum,
      pageSize,
    },
    skipIndex,
  };
}

function success(data = "", msg = "", code = Code.SUCCESS) {
  log4js.debug(data);
  return {
    data,
    msg,
    code,
  };
}
function fail(msg = "", code = Code.BUSINESS_ERROR, data = "") {
  log4js.debug(msg);
  return {
    code,
    data,
    msg,
  };
}

function decoded(authorization) {
  if (authorization) {
    let token = authorization.split(" ")[1];
    return jwt.verify(token, "duxi")
  }
  return "";

}
// 树形递归
function getTreeMenu(res, id, list) {
  for (let i = 0; i < res.length; i++) {
    let item = res[i];

    if (String(item.parentId.slice().pop()) == String(id)) {

      list.push(item._doc)
    }
  }
  list.map(item => {
    item.children = [];
    getTreeMenu(res, item._id, item.children)
    if (item.children.length == 0) {
      delete item.children;
    } else if (item.children.length > 0 && item.children[0].menuType == 2) {
      item.action = item.children;
    }
  })
  return list
}
function formateDate(date, rule) {
  let fmt = rule || "yyyy-MM-dd hh:mm:ss";
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, date.getFullYear())
  }
  const o = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds()
  }
  for (let k in o) {
    if (new RegExp(`(${k})`).test(fmt)) {
      const val = o[k] + ''
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? val : ("00" + val).substr(val.length))
    }
  }
  return fmt;
}
module.exports = {
  pager,
  success,
  fail,
  Code,
  decoded,
  getTreeMenu,
  formateDate
};
