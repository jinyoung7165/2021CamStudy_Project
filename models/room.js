const Sequelize = require('sequelize');

module.exports = class Room extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      title: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.STRING(15),
        allowNull: false,
        default:"",
      },
      participants_num: {
        type: Sequelize.INTEGER(100),
        allowNull: false,
        defaultValue:0,
      },
      img: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      max: { 
        type: Sequelize.INTEGER,
        allowNull: false,
        default:10,  // 임의로 설정
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
    db.Room.hasOne(db.Chat);
  }
};