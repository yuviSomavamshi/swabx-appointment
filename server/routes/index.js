/**
 * Routes Definition will go here
 */

var scheduleConfig = require("./schedule_config.js");
var schedule = require("./schedule.js");
var config = require("../../config.js")();
// Setup all routes here
module.exports = function (app) {
  app.use(`${config.api_prefix}/scheduleconfig`, scheduleConfig);
  app.use(`${config.api_prefix}/schedules`, schedule);
};
