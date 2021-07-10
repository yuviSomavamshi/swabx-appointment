"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class schedule_config extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  schedule_config.init(
    {
      locationid: DataTypes.UUID,
      customerid: DataTypes.UUID,
      time_interval: DataTypes.INTEGER, // interval between two appointments for every user
      slot_time: DataTypes.INTEGER,
      slot_daytime_start: DataTypes.TIME,
      slot_daytime_end: DataTypes.TIME,
      max_slots: DataTypes.INTEGER,
      slot_date: DataTypes.DATEONLY,
      breaks: DataTypes.JSON
    },
    {
      sequelize,
      modelName: "schedule_config"
    }
  );
  return schedule_config;
};
