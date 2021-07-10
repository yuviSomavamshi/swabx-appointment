"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("schedules", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      slot_at: {
        type: Sequelize.TIME
      },
      slot_date: {
        type: Sequelize.DATEONLY
      },
      customerid: {
        type: Sequelize.STRING
      },
      patientid: {
        type: Sequelize.STRING
      },
      locationid: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.STRING
      },
      s_id: {
        type: Sequelize.UUID
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
    await queryInterface.dropTable("schedules");
  }
};
