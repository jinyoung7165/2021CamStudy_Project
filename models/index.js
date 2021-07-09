const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const User = require('./user');
const Post = require('./post');
const Room = require('./room');

const db = {};
const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);

db.sequelize = sequelize;
db.User = User;
db.Post = Post;
db.Room = Room;

User.init(sequelize);
Post.init(sequelize);
Room.init(sequelize);

User.associate(db);
Post.associate(db);
Room.associate(db);

module.exports = db;