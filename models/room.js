const Sequelize = require('sequelize');

module.exports = class Room extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      room_url: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      chating: {
        type: Sequelize.STRING(40),
        allowNull: true,
      },
      description: {
        type: Sequelize.STRING(15),
        allowNull: false,
      },
      participants_num: {
        type: Sequelize.INTEGER(100),
        allowNull: true,
      },
      img: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Room',
      tableName: 'rooms',
      paranoid: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.Room.hasMany(db.User);
  }
};