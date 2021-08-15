const Sequelize = require('sequelize');

module.exports = class Room extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      title: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      uuid:{
        type: Sequelize.STRING(60),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.STRING(30),
        allowNull: false,
        default:"",
      },
      participants_num: {
        type: Sequelize.INTEGER(20),
        allowNull: false,
        defaultValue:0,
      },
      img: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: "photo.png",
      },
      max: { 
        type: Sequelize.INTEGER,
        allowNull: false,
        default:20,  // 임의로 설정
      },
      password: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      option: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue:false,

      }
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