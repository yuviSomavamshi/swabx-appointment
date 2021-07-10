/**
 * Pooler to track and update missed schedules
 */

var Schedule = require("../models/index").schedules;
var { Op } = require("../models/index.js").Sequelize;
var moment = require("moment");
var common = require("../common");
var log4js = require("log4js");
var logger = log4js.getLogger("default");

async function getAllschedulesMissed() {
  try {
    var currentDate = moment().add({ hour: 7 });
    logger.trace(`executing pooler: ${currentDate}`);
    var data = await Schedule.update(
      {
        status: "Missed"
      },
      {
        where: {
          [Op.or]: [
            {
              slot_date: {
                [Op.lt]: currentDate.format(common.DATE_FORMAT)
              }
            },
            {
              slot_date: {
                [Op.lte]: currentDate.format(common.DATE_FORMAT)
              },
              slot_at: {
                [Op.lte]: currentDate.format("HH:mm:ss")
              }
            }
          ],
          status: "Upcoming"
        }
      }
    );
    return data;
  } catch (error) {
    logger.error("Failed to Updated missed status", error);
  }
}

module.exports = getAllschedulesMissed;
