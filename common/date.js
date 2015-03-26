var
  dateFormat = require('date-format'),
  date = module.exports = {};


date.prototype.getDate = function () {
  return dateFormat("yyyyMMddhhmmssSSS");
};