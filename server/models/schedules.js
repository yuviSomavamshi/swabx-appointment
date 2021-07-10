"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class schedules extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  schedules.init(
    {
      slot_at: DataTypes.TIME,
      slot_date: DataTypes.DATEONLY,
      customerid: DataTypes.UUID,
      patientid: DataTypes.UUID,
      locationid: DataTypes.UUID,
      status: DataTypes.STRING(10),
      s_id: DataTypes.STRING(300)
    },
    {
      sequelize,
      modelName: "schedules"
    }
  );
  return schedules;
};
