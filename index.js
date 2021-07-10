/**
 * Application Starts Here
 *
 */

var express = require("express"); //  express
var app = express(); // application variable.
var config = require("./config.js")(); // read the enviroment
var db = require("./server/models");
const log4js = require("log4js");
const Promise = require("bluebird"); // promises
const bodyParser = require("body-parser"); // bodyParser for express
var routes = require("./server/routes/index.js");
var cluster = require("cluster");
var pooler = require("./server/poolers/trackMissedSchedules.js");
// Logger setup
log4js.configure({
  appenders: {
    console: { type: "console" },
    file: { type: "file", filename: config.logfile }
  },
  categories: {
    http: { appenders: ["console"], level: config.loglevel },
    default: { appenders: ["console"], level: config.loglevel }
  }
});

var http_logger = log4js.getLogger("http");
// setup log level for http
app.use(
  log4js.connectLogger(http_logger, {
    level: "auto",
    statusRules: [
      { from: 200, to: 299, level: "debug" },
      { codes: [303, 304], level: "info" }
    ]
  })
);

var logger = log4js.getLogger("default"); // application level logger
// app.use(express.json());
app.use(bodyParser.json());
//Setup routes
routes(app);

// function to setup and start application
async function setupServer() {
  try {
    await dbInit();
    startPooler();
    await startServer();
  } catch (error) {
    throw error;
  }
}

// start setup

setupServer()
  .then(function (data) {
    logger.info("Server Started successfully");
  })
  .catch(function (err) {
    logger.error("server setup failer with error [" + err.message + "]");
  });

async function dbInit() {
  try {
    db.sequelize.sync({ logging: false });
  } catch (error) {
    throw error;
  }
}

// function to start poolers
function startPooler() {
  setTimeout(() => {
    try {
      pooler();
      startPooler();
    } catch (error) {}
  }, config.poolerTimeout);
}

function startServer() {
  return new Promise(function (resolve, reject) {
    if (cluster.isMaster) {
      var numWorkers = require("os").cpus().length;

      logger.debug("Master cluster setting up " + numWorkers + " workers...");
      logger.debug(`Master ${process.pid} is running`);

      for (var i = 0; i < numWorkers; i++) {
        cluster.fork();
      }

      cluster.on("exit", function (worker, code, signal) {
        logger.debug("Worker " + worker.process.pid + " died with code: " + code + ", and signal: " + signal);
        logger.debug("Starting a new worker");
        cluster.fork();
      });
    } else {
      app.listen(config.port, function (err) {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }
        logger.info("server is listenting at ", config.port);
        logger.debug(`Worker ${process.pid} started`);
        resolve(`server is listening at ${config.port}`);
      });
    }
  });
}
