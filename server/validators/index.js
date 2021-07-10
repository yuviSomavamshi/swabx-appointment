/**
 * AJV validators goes here
 */

var Ajv = require("ajv"); //import ajv
var ajv = new Ajv(); //
var create_schedule_config_schema = require("./schemas/schedule_config.json");
var create_schedule_schema = require("./schemas/schedule.json");
var compilers = {
  create_schedule_config: ajv.compile(create_schedule_config_schema),
  create_schedule: ajv.compile(create_schedule_schema)
};

/// Validators
function validate(key, req, res, next) {
  var compiler = compilers[key];
  var isValid = compiler(req.body);
  if (!isValid) {
    var res_data = { _status: 400, _msg: compiler.errors[0].message, data: compiler.errors };
    res.status(400).send(res_data);
    return;
  }
  next();
}

module.exports = {
  validateScheduleConfig: (req, res, next) => {
    validate("create_schedule_config", req, res, next);
  },
  validateSchedule: (req, res, next) => {
    validate("create_schedule", req, res, next);
  }
};
