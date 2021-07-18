const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      nick: {
        type: Sequelize.STRING(15),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
      },
      level: {
        type: Sequelize.FLOAT,
        allowNull:false,
        defaultValue: 0,
      },
      level_show: {
        type: Sequelize.INTEGER,
        allowNull:false,
        defaultValue: 0,
      },
      total_time: {
        type: Sequelize.FLOAT,
        allowNull:false,
        defaultValue: 0,
      },
      provider:{
        type:Sequelize.STRING(10),
        allowNull:false,
        defaultValue:'local',
      },
      snsID:{
        type:Sequelize.STRING(30),
        allowNull:true,
      },
      video:{
        type:Sequelize.INTEGER,
        allowNull:false,
        defaultValue:0,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'User',
      tableName: 'users',
      paranoid: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.User.hasMany(db.Post);
    db.User.belongsTo(db.Room);

    db.User.belongsToMany(db.Post,{through:'Like',as:'Liked'});
    db.User.hasMany(db.Chat);

    //db.User.findAll({ include: [{ model: db.Post, as: 'Liked' }] })
  }
};