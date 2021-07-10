/**
 * Common help functions goes here
 */

const { config } = require("dotenv");
var log4js = require("log4js");
var logger = log4js.getLogger("default");
var moment = require("moment");
const DATE_FORMAT = "YYYY-MM-DD";
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Staturday"];
module.exports = {
  getAllTimeSlots,
  getAvailableSlots,
  getAllDayConfig,
  DATE_FORMAT,
  WEEKDAYS
};

function getAllTimeSlots({ slot_daytime_start, slot_daytime_end, slot_time, breaks }) {
  var startTime = moment(slot_daytime_start, "HH:mm:ss");
  var endTime = moment(slot_daytime_end, "HH:mm:ss");

  var slots = [];
  // get array of start and stop times excluding breaks.
  breaks = JSON.parse(breaks); //
  breaks.sort((a, b) => new moment(a.startTime, "HH:mm:ss") - new moment(b.startTime, "HH:mm:ss"));
  // consider break times wont merge.
  var slotPeriods = [];
  breaks = [{ endTime: slot_daytime_start }, ...breaks, { startTime: slot_daytime_end }];

  for (i = 0; i < breaks.length - 1; i++) {
    var slotPeriod = {
      slotStart: breaks[i].endTime,
      slotEnd: breaks[i + 1].startTime
    };
    slotPeriods.push(slotPeriod);
  }
  var allSlots = [];
  slotPeriods.forEach((sp) => {
    var startTime = moment(sp.slotStart, "HH:mm:ss");
    var endTime = moment(sp.slotEnd, "HH:mm:ss");
    // start time should be less than end time && should have enough time for creating slot.
    while (startTime < endTime && endTime.diff(startTime, "minutes") >= parseInt(slot_time)) {
      allSlots.push(new moment(startTime).format("HH:mm:ss"));
      startTime.add(slot_time, "minutes");
    }
  });

  return allSlots;
}

// function to give
// slot start + slot end + count of slots available
function getAvailableSlots(slotsavailable, bookedslots, config) {
  // let earlySlots = [],
  //   lateSlots = [];
  var slots = slotsavailable.map((slot) => {
    let count = config.max_slots;
    let booked = bookedslots.find(function (bookedslot) {
      return bookedslot.slot_at == slot;
    });
    if (booked !== undefined) {
      count = count - booked.slotsbooked;
    }
    return {
      slot_start: moment(slot, "HH:mm:ss").format("HH:mm:ss"),
      slot_end: moment(slot, "HH:mm:ss").add(config.slot_time, "minutes").format("HH:mm:ss"),
      count
    };
  });

  return slots;
}

// get all days config
// iterate through days and gives the eery day
// sample config
function getAllDayConfig(config) {
  logger.trace(config.startDate, config.endDate);
  logger.trace(config.days);
  // insert day wise for every day.

  var dates = GetAllDays(config.startDate, config.endDate);
  var daywiseconfigs = [];
  dates.forEach((d) => {
    // get day config.
    var weekdayConfig = config.days.find((f) => {
      return f.day == WEEKDAYS[d.day()];
    });
    logger.trace(`weekdayConfig: ${weekdayConfig}`);
    if (weekdayConfig !== undefined) {
      var daywiseconfig = {
        customerid: config.customerid,
        locationid: config.locationid,
        slot_date: d.format(DATE_FORMAT),
        slot_daytime_start: weekdayConfig.slotStart,
        slot_daytime_end: weekdayConfig.slotEnd,
        max_slots: weekdayConfig.max_slots,
        slot_time: weekdayConfig.slotTime,
        breaks: JSON.stringify(weekdayConfig.breaks),
        time_interval: config.test_interval
      };
      logger.trace(`daywiseconfig: ${daywiseconfig}`);
      daywiseconfigs.push(daywiseconfig);
    }
  });
  logger.trace(daywiseconfigs);
  return daywiseconfigs;
}

function GetAllDays(startDate, endDate) {
  var currDate = moment(startDate).startOf("day");
  var lastDate = moment(endDate).startOf("day");
  var dates = [currDate.clone()];

  while (currDate.add(1, "days").diff(lastDate) < 0) {
    dates.push(currDate.clone());
  }
  dates.push(lastDate.clone());
  return dates; // including added current Date and lastDate
}
