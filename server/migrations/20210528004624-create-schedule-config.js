"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("schedule_configs", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      customerid: {
        type: Sequelize.STRING
      },
      patientid: {
        type: Sequelize.STRING
      },
      time_interval: {
        type: Sequelize.INTEGER
      },
      slot_date: {
        type: Sequelize.DATEONLY
      },
      locationid: {
        type: Sequelize.STRING
      },
      breaks: {
        type: Sequelize.JSON
      },
      slot_time: {
        type: Sequelize.INTEGER
      },
      slot_daytime_start: {
        type: Sequelize.TIME
      },
      slot_daytime_end: {
        type: Sequelize.TIME
      },
      max_slots: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("schedule_configs");
  }
};
