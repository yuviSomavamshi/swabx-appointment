/**
 * All Route functions will be defined here
 *
 */

var express = require("express");
var ScheudleConfig = require("../models/index.js").schedule_config;
var { Op } = require("../models/index.js").Sequelize;
var log4js = require("log4js");
var logger = log4js.getLogger("default"); // application level logger
var validators = require("../validators/index.js");
var moment = require("moment");
var common = require("../common/index.js");
var router = express.Router();
var Schedule = require("../models/index.js").schedules;

// Routes
router.post("/", validators.validateScheduleConfig, CreateScheduleConfig);
router.get("/", GetScheduleConfig);

getScheduleConfig = (payload) => {
  return {
    slot_time: payload.slot_time,
    slot_daytime_start: payload.slot_daytime_start,
    slot_daytime_end: payload.slot_daytime_end,
    max_slots: payload.max_slots,
    customerid: payload.customerid,
    locationid: payload.locationid,
    slot_break_start: payload.slot_break_start,
    slot_break_end: payload.slot_break_end
  };
};

// Creates schedule configuration
async function CreateScheduleConfig(req, res) {
  logger.info("Creating configuration for scheudler");
  var payload = req.body;
  logger.debug("payload received [" + JSON.stringify(req.body) + "]");
  try {
    // slot start date end date validation
    startDate = moment(payload.startDate, common.DATE_FORMAT);
    endDate = moment(payload.endDate, common.DATE_FORMAT);
    if (startDate.isAfter(endDate)) {
      res.status(400).send({ _msg: "Configuration start date is after end date", _status: 400, data: {} });
      return;
    }
    // for every day config slotstartime should be before slotend time
    var isErrorExits = false;
    for (let index = 0; index < payload.days.length; index++) {
      const day = payload.days[index];
      starttime = moment(day.slotStart, "HH:mm:ss");
      endtime = moment(day.slotEnd, "HH:mm:ss");
      if (starttime.isAfter(endtime)) {
        isErrorExits = isErrorExits || true;
        break;
      }
    }
    if (isErrorExits) {
      res.status(400).send({ _msg: "Bad configuration, day start time is after day end time", _status: 400, data: {} });
      return;
    }

    // if any existing schedule in between never allow to edit
    existing_schedules = await Schedule.findAll({
      where: {
        customerid: payload.customerid,
        locationid: payload.locationid
      }
    });

    if (existing_schedules.length !== 0) {
      res.status(400).send({ _msg: `Schedule config cant be changed,because there are already existing schedules`, _status: 400, data: {} });
      return;
    }

    // we have to find the schedule for a customer + location + date range
    destroy_data = await ScheudleConfig.destroy({
      where: {
        customerid: payload.customerid,
        locationid: payload.locationid
      }
    });
    data = await ScheudleConfig.bulkCreate(common.getAllDayConfig(payload));
    res.send({ _msg: "Schedule configuration created successfully", _status: 200, data });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ _msg: "Unable to create schedule configuration", _status: 500 });
  }
}

// Fetches schedule configuration
async function GetScheduleConfig(req, res) {
  var { customerid, locationid } = req.query;
  logger.info(`Fetching configuration for scheudler for ${customerid} and ${locationid}`);
  try {
    var data = await ScheudleConfig.findAll({ where: { customerid: customerid, locationid: locationid } });
    res.send({ _msg: "Fetched schedule config successfully", _status: 200, data });
  } catch (error) {
    res.status(500).send({ _msg: "Unable to fetch schedule configuration", _status: 500 });
  }
}

module.exports = router;
