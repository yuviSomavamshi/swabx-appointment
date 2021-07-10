/**
 * Config management
 */

require("dotenv").config();

module.exports = function () {
  var api_prefix = "/api/v1.0.0";
  var loglevel = process.env.loglevel || "debug";
  var logfile = process.env.logfile || "./logfile.log";
  var port = process.env.PORT || 8985;
  var poolerTimeout = process.env.POLLING_INTERVAL || 30000; // every 30 seconds
  var maxAllowedBookingDate = process.env.MAX_ALLOWED_BOOKING_DATE || 30; // 30 DAYS
  return {
    loglevel,
    logfile,
    api_prefix,
    port,
    poolerTimeout,
    maxAllowedBookingDate
  };
};
