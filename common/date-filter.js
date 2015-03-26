var
  dateFormat = require('date-format'),

  dateFilter = module.exports = function (date) {
    this.date = date || this.now();
  };

dateFilter.prototype.now = function () {
  return dateFormat("yyyyMMddhhmmssSSS");
};

dateFilter.prototype.format = function (format) {
  var filter = {
    Y: 'getYear',
    m: 'getMonth',
    d: 'getDay',
    H: 'getHour',
    i: 'getMinute',
    s: 'getSecond',
    SS: 'getMilliSecond'
  };

  for ( var flag in filter )
    format = format.replace(flag, this[filter[flag]]());

  return format;
};

dateFilter.prototype.print = function (type) {
  type = type || 'normal';

  var printFormat = {
    normal: 'Y-m-d H:i:s',
    short: 'Y-m-d',
    detail: 'Y-m-d H:i:s SS'
  };

  return this.format(printFormat[type]);
};

dateFilter.prototype.getYear = function () {
  return parseInt(this.date.substr(0, 4));
};

dateFilter.prototype.getMonth = function () {
  return parseInt(this.date.substr(5, 6));
};

dateFilter.prototype.getDay = function () {
  return parseInt(this.date.substr(7, 8));
};

dateFilter.prototype.getHour = function () {
  return parseInt(this.date.substr(9, 10));
};

dateFilter.prototype.getMinute = function () {
  return parseInt(this.date.substr(11, 12));
};

dateFilter.prototype.getSecond = function () {
  return parseInt(this.date.substr(13, 15));
};

dateFilter.prototype.getMilliSecond = function () {
  return parseInt(this.date.substr(16, 18));
};