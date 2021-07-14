const SocketIO = require('socket.io');
const axios = require('axios');

module.exports = (server, app, sessionMiddleware) => {
  const io = SocketIO(server, { path: '/socket.io' });
  app.set('io', io);  
  const room = io.of('/Url') 

  room.on('connection', socket => {                                // io.to('room').emit : room에 접속한 유저에게 emit
    socket.on('join-room', (roomId, userId) => {
      socket.join(roomId)                                        // socket.join('room') : room에 접속 
      socket.to(roomId).broadcast.emit('user-connected', userId) //roomId로 join, 그리고 roomId로 user-Connected emit
  
      socket.on('disconnect', () => {
        socket.to(roomId).broadcast.emit('user-disconnected', userId)
      })
    })
  })
  
  server.listen(3000)
}