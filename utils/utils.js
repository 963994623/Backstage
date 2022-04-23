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

module.exports = {
  pager,
  success,
  fail,
  Code,
};
