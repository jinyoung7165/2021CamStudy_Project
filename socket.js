const SocketIO = require('socket.io');
const axios = require('axios');

module.exports = (server, app, sessionMiddleware) => {
  const io = SocketIO(server, { path: '/socket.io' });
  app.set('io', io);  
  const room = io.of('/library') 

  room.on('connection', socket => {                                
    socket.on('join-room', (roomUrl, userId) => {
      socket.join(roomUrl)                                        // socket.join('room') : room에 접속 
      socket.to(roomUrl).broadcast.emit('user-connected', userId) //roomId로 join, 그리고 roomId로 user-Connected emit
  
      socket.on('disconnect', () => {
        socket.to(roomUrl).broadcast.emit('user-disconnected', userId)
      })
    })
  })
  
  //server.listen(8001)
}