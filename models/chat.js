const Sequelize = require('sequelize');

module.exports = class Chat extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      chating: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      newchating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      }
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Chat',
      tableName: 'chats',
      paranoid: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.Chat.belongsTo(db.User);
    db.Chat.belongsTo(db.Room);
  }
};