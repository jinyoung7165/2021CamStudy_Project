const SocketIO = require('socket.io');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const cookie = require('cookie');
const { connect } = require('./routes/page');
const sequelize = require('sequelize');
const {Room,User,Chat}=require('./models/');

module.exports = (server, app, sessionMiddleware) => {
  const io = SocketIO(server, { path: '/socket.io' });
  app.set('io', io);  
  const room = io.of('/room'); 
  const library = io.of('/library'); 
  
  const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
  room.use(wrap(cookieParser(process.env.COOKIE_SECRET)));
  room.use(wrap(sessionMiddleware));


  room.on('connection', (socket) => {
    console.log('room 네임스페이스에 접속');
    socket.on('disconnect', () => {
      console.log('room 네임스페이스 접속 해제');
    });
  });

  library.on('connection', (socket) => {
    console.log('library 네임스페이스에 접속');
    
    const req = socket.request;
    const { headers: { referer } } = req; 
    const roomId = referer
      .split('/')[referer.split('/').length - 1]
      .replace(/\?.+/, '');
    socket.join(roomId);
    socket.to(roomId).emit('join', {
      user: 'system',
      chat: '님이 입장',
    });

    socket.on('disconnect', async() => {
      console.log('library 네임스페이스 접속 해제');
      await Room.update({
        participants_num: sequelize.literal(`participants_num - 1`), // 쿼리 문자열 추가해주는 기능
      }, {
        where:{id:roomId},  
      }); 
      const user=await User.findOne({
        include:[{
          model:Room,
          where:{
            id:roomId,
          },
          attributes:['id'],
        }]
      });
      const room=await Room.findOne({
        where:{id:roomId}, 
        include:[{
          model:Chat,
          where:{
            roomId,
          },
          attributes:['id'],
        },{
          model:User,
          where:{
            roomId,
          },
        }]
      });
      await room.removeUser(user);
      socket.leave(roomId);
      if (room.participants_num == 0) { // 유저가 0명이면 방 삭제
         axios.delete(`http://localhost:8001/library/${roomId}`)
          .then(() => {
            console.log('방 제거 요청 성공');
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        socket.to(roomId).emit('exit', {
          user: 'system',
          chat: `님이 퇴장하셨습니다.`,
        });
      }
    });
  });
  //server.listen(8001)
}