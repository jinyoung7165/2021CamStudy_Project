const SocketIO = require('socket.io');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const cookie = require('cookie');
const sequelize = require('sequelize');
const passport = require("passport");

module.exports = (server, app, sessionMiddleware) => {
  const io = SocketIO(server, { path: '/socket.io'});
  app.set('io', io);  
  const room = io.of('/room'); 
  const library = io.of('/library');
  const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
  io.use(wrap(cookieParser(process.env.COOKIE_SECRET)));
  io.use(wrap(sessionMiddleware));
  io.use(wrap(passport.initialize())); //꼭 써야함
  io.use(wrap(passport.session())); //꼭 써야함
 
  room.on('connection', (socket) => {
    console.log('room 네임스페이스에 접속');
    socket.on('disconnect', () => {
      console.log('room 네임스페이스 접속 해제');
    });
  });
  
  library.on('connection',(socket) => {
    console.log('library 네임스페이스에 접속');

    const startTime = new Date();
    const req = socket.request;
    const { headers: { referer } } = socket.request; 
    const roomId = referer
      .split('/')[referer.split('/').length - 1]
      .replace(/\?.+/, '');
    socket.join(roomId);
    let currentRoom = library.adapter.rooms[roomId];
    let userCount = currentRoom ? currentRoom.length : 0;
    let userId=req.user.id;
    library.to(roomId).emit('join', { 
      chat: `${req.user.nick}님이 입장하셨습니다.`,
      userCount,
      nick:req.user.nick,
      level:req.user.level,
      level_show:req.user.level_show,
      roomId,
      userId
    })//chatting용
    
    socket.on('disconnect', () => {//GET이걸 요청할 때 그 페이지를 주겠다. 
      //POST라우터 새로만들어 방금 나간 룸이랑 나간사람 => SOCKET.EMIT 얘 나갔다=>HTML에 보내서 DIV에서 삭제하는 거
      console.log('library 네임스페이스 접속 해제'); 
      socket.leave(roomId);
      let currentRoom = library.adapter.rooms[roomId];
      let userCount = currentRoom ? currentRoom.length : 0;
      axios.post('http://localhost:8001/library/user/',{user:req.user.id,roomId,userCount,startTime});
      if (userCount!=0){
        library.to(roomId).emit('exit', {
          chat: `${req.user.nick}님이 퇴장하셨습니다.`,
          user:req.user.id,
          nick:req.user.nick,
          level:req.user.level,
          userCount,
          roomId
        });
      } 
      library.to(roomId).emit('user-disconnected');
    }); 
  });
}