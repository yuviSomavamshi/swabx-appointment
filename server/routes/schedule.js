/**
 * Contains the API for all the schedules
 */

var express = require("express");
var sequelize = require("../models/index.js").sequelize;
var { Op } = require("../models/index.js").Sequelize;
var ScheduleConfig = require("../models/index.js").schedule_config;
var Schedule = require("../models/index.js").schedules;
var log4js = require("log4js");
var logger = log4js.getLogger("default"); // application level logger
var validators = require("../validators/index.js");
var moment = require("moment");
var common = require("../common");
var router = express.Router();
const DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
const DATE_FORMAT = "YYYY-MM-DD";
const ALLOWED_STATUS = ["Upcoming", "Missed", "Cancelled", "Finished"]; // dont change the status order, Never.
var system_config = require("../../config")();
// Routes

router.get("/availableslots", fetchAllAvailableSlots);
router.get("/patient/:patientid", getAllSchedulesForPatient);
router.get("/patient/:patientid/upcoming", upcomingAppointment);
router.get("/:id", getSlotById);
router.post("/", validators.validateSchedule, createSchedule);
router.get("/", getAllSchedules);

router.post("/update_status", updateStatusForSlot);
router.post("/:id/cancel", cancelSlot);

function getSchedule(payload) {
  return {
    ...payload,
    slot_date: moment(payload.slot_date, DATE_FORMAT).format(DATE_FORMAT),
    status: "Upcoming"
  };
}

async function fetchAllAvailableSlots(req, res) {
  logger.info("Fetching all the available slots for the day");
  let { customerid, locationid, date } = req.query;
  logger.debug("Query Params" + JSON.stringify(req.query) + "]");
  try {
    // Fetch the schedule config.
    let configs = await ScheduleConfig.findAll({ where: { customerid, locationid, slot_date: date } });
    var config = configs[0]; // always the one for schedule config remember !!
    if (config == undefined) {
      res.status(400).send({ _msg: "No configuration found for the location or customer", _status: 400 });
      return;
    }
    var slots = common.getAllTimeSlots(config);
    var slots_booked = await Schedule.findAll({
      attributes: ["slot_at", [sequelize.fn("COUNT", "Schedule.id"), "slotsbooked"]],
      group: ["slot_at"],
      where: { customerid, locationid, slot_date: moment(date, DATE_FORMAT), status: { [Op.ne]: ALLOWED_STATUS[2] } },
      raw: true
    });
    let avaiableslots = common.getAvailableSlots(slots, slots_booked, config);
    if (moment().format(DATE_FORMAT) == date) {
      var currentDate = moment().utc().add({ hour: 8 });
      let filter = [];
      avaiableslots.forEach((slot) => {
        let arr = slot.slot_start.split(":");
        let time = currentDate.clone();
        time.hour(arr[0]);
        time.minute(arr[1]);
        time.second(arr[2]);
        if (time.isAfter(currentDate)) {
          filter.push(slot);
        }
      });
      avaiableslots = filter;
    }
    res.send({ _msg: "Fetched all available slots", _status: 200, data: avaiableslots });
  } catch (error) {
    logger.error(error.message);
    res.status(500).send({ _msg: "Unable to fetch available slots", _status: 500 });
  }
}

async function getAllSchedules(req, res) {
  logger.info("Fetching all the schedules for the day");
  var todate = moment().format(DATE_FORMAT);
  let { customerid, locationid } = req.query;
  logger.debug("Query Params" + JSON.stringify(req.query) + "]");
  try {
    var booked_slots = await Schedule.findAll({
      where: {
        slot_date: todate,
        customerid,
        locationid
      }
    });
    res.send({ _msg: "Fetch all schedules for the day", _status: 200, data: booked_slots });
  } catch (error) {
    logger.error(error.message);
    res.status(500).send({ _msg: "Unable to fetch all schedules for the day", _status: 500 });
  }
}

async function createSchedule(req, res) {
  logger.info("Got a request to create scheudle");
  var payload = req.body;
  logger.debug("payload received [" + JSON.stringify(req.body) + "]");
  try {
    let slot_request_time = moment(payload.slot_date + " " + payload.slot_at, DATETIME_FORMAT),
      current_time = moment();
    if (slot_request_time.isBefore(current_time)) {
      res.status(400).send({ _msg: "Slot can not be booked in past dates", _status: 400 });
      return;
    }
    //
    slot_date = moment(payload.slot_date, common.DATE_FORMAT);
    maxAllowedBookingDate = moment().add(system_config.maxAllowedBookingDate, "days"); // from today to next number of days
    if (slot_date.isAfter(maxAllowedBookingDate)) {
      res.status(400).send({ _msg: "Slot date cannot be after " + system_config.maxAllowedBookingDate + " days", _status: 400 });
      return;
    }
    // get config for that locations
    let config = await ScheduleConfig.findOne({
      where: { customerid: payload.customerid, locationid: payload.locationid, slot_date: payload.slot_date }
    });
    if (config == null || config == undefined) {
      res.status(400).send({ _msg: "No slots available for the selected date", _status: 400 });
      return;
    }
    var validSlots = common.getAllTimeSlots(config);
    // check if it is a valid slot
    if (validSlots.indexOf(payload.slot_at) == -1) {
      res.status(400).send({ _msg: "Not a valid slot time", _status: 400 });
      return;
    }
    // **** Need to add one more validation, if the slot_at is more than current time, it should throw error ***//

    if (!current_time.isBefore(slot_request_time)) {
      res.status(400).send({ _msg: "Slot already finished for the day", _status: 400, data: {} });
      return;
    }

    // if is patient has slot any slot for today in any location
    var booked_slots_patient = await Schedule.findAll({
      where: {
        slot_date: moment(payload.slot_date, DATE_FORMAT).format(DATE_FORMAT),
        patientid: payload.patientid,
        status: {
          [Op.notIn]: [ALLOWED_STATUS[1], ALLOWED_STATUS[2]]
        }
      }
    });
    if (booked_slots_patient.length !== 0) {
      res.status(400).send({ _msg: "You have already booked an appointment on this date:" + payload.slot_date, _status: 400 });
      return;
    }

    //  slot date should not be less that the patient previous booking date + configured days days
    var previousSlots = await Schedule.findAll({
      limit: 1,
      where: {
        patientid: payload.patientid,
        status: {
          [Op.notIn]: [ALLOWED_STATUS[1], ALLOWED_STATUS[2]]
        }
      },
      order: [["createdAt", "DESC"]]
    });
    var previousSlot = previousSlots[0] || {};
    if (previousSlot.slot_date !== undefined) {
      var curr_slot_date = moment(payload.slot_date, DATE_FORMAT);
      allowedToBookAfter = moment(previousSlot.slot_date, common.DATE_FORMAT).add(config.time_interval || 0, "days");
      if (curr_slot_date.isSameOrBefore(allowedToBookAfter)) {
        res.status(400).send({
          _msg: "You are allowed to book an appointment only after " + allowedToBookAfter.format(common.DATE_FORMAT),
          _status: 400,
          data: {}
        });
        return;
      }
    }

    // if valid slot check if it is available
    var booked_slots = await Schedule.findAll({
      where: {
        slot_date: moment(payload.slot_date, DATE_FORMAT).format(DATE_FORMAT),
        customerid: payload.customerid,
        locationid: payload.locationid,
        slot_at: payload.slot_at
      }
    });

    if (booked_slots.length >= config.max_slots) {
      res.status(400).send({ _msg: "All slots are booked for selected slot time", _status: 400 });
      return;
    }

    // now create insert the schedule.
    var data = await Schedule.create(getSchedule(payload));
    res.send({ _msg: "schedule created sucessfully", _status: 200, data });
  } catch (error) {
    logger.error(error.message);
    res.status(500).send({ _msg: "Unable to create schedule", _status: 500 });
  }
}

async function updateStatusForSlot(req, res) {
  logger.info("got a request to update status");
  try {
    var id = req.body.id;
    logger.debug("payload received [" + JSON.stringify(req.body) + "]");
    var status = req.body.status;
    if (ALLOWED_STATUS.indexOf(status) == -1) {
      res.status(400).send({ _msg: "Trying to update Incorrect Status", _status: 404 });
      return;
    }

    let data = await Schedule.update(
      {
        status,
        updatedAt: new Date()
      },
      { where: { s_id: id, slot_date: moment().format(DATE_FORMAT), status: "Upcoming" } }
    );
    if (data && data[0] == 1) {
      res.status(200).send({ _msg: "Status Updated Successfully", _status: 200, data });
    } else {
      res.status(404).send({ _msg: "Appointment was not scheduled", _status: 404 });
    }
  } catch (error) {
    logger.error(error.message);
    res.status(500).send({ _msg: "Unable to update status", _status: 500 });
  }
}

// cancel slot will delete the slot record from table
async function cancelSlot(req, res) {
  logger.info("got a request to cancel the slot");
  try {
    var id = req.params.id;
    logger.debug("id [" + id + "]");
    data = await Schedule.findByPk(id);
    if (data === null) {
      res.status(404).send({ _msg: "No schedule found with id", _status: 404 });
      return;
    }
    data = await Schedule.update({ status: "Cancelled" }, { where: { id: id, patientid: req.body.patientid } });
    res.status(200).send({ _msg: "Appointment Cancelled successfully", _status: 200, data });
  } catch (error) {
    logger.error(error.message);
    res.status(500).send({ _msg: "Unable to cancel appointment", _status: 500 });
  }
}

async function getSlotById(req, res) {
  try {
    var id = req.params.id;
    data = await Schedule.findByPk(id);
    res.send({ _msg: "schedule fetched sucessfully", _status: 200, data });
  } catch (error) {
    logger.error(error.message);
    res.status(500).send({ _msg: "Unable to fetch schedule", _status: 500 });
  }
}

async function getAllSchedulesForPatient(req, res) {
  logger.info("Got a request for fetching ");
  try {
    let booked_slots = await Schedule.findAll({ order: [["slot_date", "ASC"]], where: { patientid: req.params.patientid } });
    res.send({ _msg: "Fetched appointments sucessfully", _status: 200, data: booked_slots });
  } catch (error) {
    logger.error(error.message);
    res.status(500).send({ _msg: "Unable to fetch all appointments", _status: 500 });
  }
}

async function upcomingAppointment(req, res) {
  logger.info("got a request for upcomming appointment");
  try {
    let booked_slots = await Schedule.findOne({ where: { patientid: req.params.patientid, status: "Upcoming" } });
    res.send({ _msg: "Fetched appointments sucessfully", _status: 200, data: booked_slots });
  } catch (error) {
    logger.error(error.message);
    res.status(500).send({ _msg: "Unable to fetch upcoming appointments", _status: 500 });
  }
}

module.exports = router;
