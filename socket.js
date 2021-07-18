const SocketIO = require('socket.io');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const cookie = require('cookie');
const sequelize = require('sequelize');
const {Room,User,Chat}=require('./models/');
const passport = require("passport");

module.exports = (server, app, sessionMiddleware) => {
  const io = SocketIO(server, { path: '/socket.io' });
  app.set('io', io);  
  const room = io.of('/room'); 
  const library = io.of('/library');
  const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
  io.use(wrap(cookieParser(process.env.COOKIE_SECRET)));
  io.use(wrap(sessionMiddleware));
  //library.use(wrap(cookieParser(process.env.COOKIE_SECRET)));
  //library.use(wrap(sessionMiddleware));
  io.use(wrap(passport.initialize()));
  io.use(wrap(passport.session()));
 
  
/*io.use((socket, next) => {
    cookieParser(process.env.COOKIE_SECRET)(socket.request, socket.request.res, next);
    sessionMiddleware(socket.request, socket.request.res, next);
    next();
  });*/


  room.on('connection', async(socket) => {
    console.log(">>>>>>>>>>+++++++++++++\n");
    console.log(socket.request.sessionID); 
    console.log('room 네임스페이스에 접속');
    socket.on('disconnect', () => {
      console.log('room 네임스페이스 접속 해제');
    });
  });

  library.on('connection',async(socket) => {
    console.log('library 네임스페이스에 접속');

    const startTime = new Date();
    const req = socket.request;

    console.log(">>>>>>>>>>+++++++++++++\n");
    console.log(req.sessionID); 
    console.log('\n');

    const { headers: { referer } } = socket.request; 
    const roomId = referer
      .split('/')[referer.split('/').length - 1]
      .replace(/\?.+/, '');
    socket.join(roomId);
    
    const user=await User.findOne({
      where:{id:req.session.passport.user},
    });
    const room=await Room.findOne({
      where:{id:roomId},
    });
    socket.to(roomId).emit('join', {
      user: 'system',
      chat: `${user.nick}님이 입장하셨습니다`,
      newuser:user,
      room,
    });

    socket.on('disconnect', async() => {
      console.log('library 네임스페이스 접속 해제');
      let user=await User.findOne({//나간 사람
        where:{id:req.session.passport.user},
        include:[{
          model:Room,
          where:{
            id:roomId,
          },
          attributes:['id'],
        }]
      });
      const endTime = new Date();
      const access_time = ((endTime.getTime() - startTime.getTime())/1000).toFixed(0); //1000
      console.log(">>>"+access_time);
      let resulthour=parseInt(user.total_time,10)+parseInt(access_time,10);
      console.log("---"+resulthour);
      let resultlevel=((resulthour/3600)*0.5).toFixed(0);
      if ((resulthour/3600*0.5)-resultlevel>=0.5){
        resultlevel+=0.5;
      }
      await User.update({
        total_time: resulthour
      },{
        where: {id:req.session.passport.user},
      });
      await User.update({
        level: resultlevel,
      },{
        where: {id:req.session.passport.user},
      });
      user=await User.findOne({//나간사람 
        where:{id:req.session.passport.user},
      })
      let room=await Room.findOne({
        where:{id:roomId}, 
        include:[{
          model:Chat,
          where:{
            roomId,
          },
        },{
          model:User,
        }]
      });
      await room.removeUser(user);
      socket.leave(roomId); 
      let users=await User.findAll({//접속한 사람들
        include:[{
          model:Room,
          where:{
            id:roomId,
          },
        }]
    });
      await Room.update({
        participants_num: users.length
     }, {
       where:{id:roomId},  
     });
      room=await Room.findOne({
      where:{id:roomId}
      });
      if (room.participants_num == 0) { // 유저가 0명이면 방 삭제
        if(room.option==0){
         axios.delete(`http://localhost:8001/library/${roomId}`)
          .then(() => {
            console.log('방 제거 요청 성공');
          })
          .catch((error) => {
            console.error(error);
          });
        }
      }
      io.emit('exit',{
        user: 'system',
        chat: `${user.nick}님이 퇴장하셨습니다.`,
        leftuser:user,
        room
      });
      socket.to(roomId).emit('exit', {
        user: 'system',
        chat: `${user.nick}님이 퇴장하셨습니다.`,
        leftuser:user,
        room
      });
      /*else {
          await socket.to(roomId).emit('exit', {
            user: 'system',
            chat: `${user.nick}님이 퇴장하셨습니다.`,
            leftuser:user,
            room
          });
      }*/
    });
  });
}