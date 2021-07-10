const config_data = require("./config.json");
const fallback = config_data[process.env.NODE_ENV] || config_data.development;
module.exports = function () {
  let host = process.env.MYSQL_HOST || fallback.host;
  let port = process.env.MYSQL_PORT || fallback.port;
  let dialect = process.env.MYSQL_DIALECT || fallback.dialect;
  let username = process.env.MYSQL_USER || fallback.username;
  let password = process.env.MYSQL_PASSWORD || fallback.password;
  let database = process.env.MYSQL_DATABASE || fallback.database;
  let dialectOptions = { autoJsonMap: false };
  return {
    username,
    password,
    database,
    host,
    port,
    dialect,
    dialectOptions
  };
};
