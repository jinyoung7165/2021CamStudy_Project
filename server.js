const express=require('express');
const cookieparser=require('cookie-parser');
const morgan=require('morgan');
const path=require('path');
const session=require('express-session');
const nunjucks=require('nunjucks');
const dotenv=require('dotenv');
const passport=require('passport');
const bodyParser = require('body-parser');
const http=require('http');
const moment = require('moment');
const socketio = require('socket.io');
const axios=require('axios');

dotenv.config();
const pageRouter=require('./routes/page');
const authRouter=require('./routes/auth');
const postRouter=require('./routes/post');
const userRouter=require('./routes/user');
const {sequelize}=require('./models');  
const passportConfig=require('./passport');

const app = express();
passportConfig(); //패스포트 설정
app.use(express.json());
app.set('port',process.env.PORT||8001);
app.set('view engine','html');
nunjucks.configure('views',{
    express:app,
    watch:true,
});
sequelize.sync({force:false})
    .then(()=>{
        console.log('데이터베이스 연결 성공');
    })
    .catch((err)=>{
        console.error(err);
    });

app.use(morgan('dev'));
app.use('/public',express.static(path.join(__dirname, 'public')));
app.use('/img',express.static(path.join(__dirname,'uploads'))); //upload한 이미지를 제공할 라우터/img를 uploads폴더와 연결
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cookieparser(process.env.COOKIE_SECRET));
const sessionMiddleware=session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie:{
      httpOnly:true,
      secure: false,
    },
  });
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());  //req.session에 passport정보 저장

const server=app.listen(app.get('port'),()=>{
    console.log(app.get('port'),'번 포트에서 대기 중');
});

app.use('/',pageRouter);
app.use('/auth',authRouter);
app.use('/post',postRouter);
app.use('/user',userRouter);

app.use((req,res,next)=>{
    const error=new Error(`${req.method} ${req.url} 라우터가 없습니다`);
    error.status=404;
    next(error);
});

app.use((err,req,res,next)=>{
    res.locals.message=err.message;
    res.locals.error=process.env.NODE_ENV!=='production'?err:{};
    res.status(err.status||500);
    res.render('error');
});

const io = socketio(server);
app.set('io', io); 

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(cookieparser(process.env.COOKIE_SECRET)));
io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize())); //꼭 써야함
io.use(wrap(passport.session())); //꼭 써야함
 
let rooms = {};       //roomid별 socket.id저장
let socketroom = {};  //각 사람별 어떤 룸에 있는지(roomid)
let socketnick = {};
let videoSocket = {};
let roomBoard = {};
let startTime;

io.on('connect', (socket) => {
    socket.on("join", (roomid, usernick) => {
        socket.join(roomid);
        startTime = new Date();
        socketroom[socket.id] = roomid;   // roomid
        socketnick[socket.id] = usernick; // usernick
        videoSocket[socket.id] = 'on';    // 비디오 상태
        let req=socket.request;
        if (rooms[roomid] && rooms[roomid].length > 0) { //존재하는 방
            rooms[roomid].push(socket.id);
            socket.to(roomid).emit('chat', `${usernick}님이 채팅방에 입장하셨습니다.`, 'System', moment().format( "h:mm a"));
           io.to(socket.id).emit('join', rooms[roomid].filter(pid => pid != socket.id), socketnick, videoSocket);
        }
        else { //내가 새로 만든 방이다
            rooms[roomid] = [socket.id];
            io.to(socket.id).emit('join', null, null, null);
        }
        io.to(roomid).emit('userCount', rooms[roomid].length);
        socket.to(roomid).emit('enterRoom',usernick,req.user.level_show,req.user.level);
    });
    //여기 socket.io 공부 very 중요✅
    socket.on('action', msg => { //socket.id:비디오 켜고 끈 사람, msg:행동
        if (msg == 'videoon')
            videoSocket[socket.id] = 'on';
        else if (msg == 'videooff')
            videoSocket[socket.id] = 'off';

        socket.to(socketroom[socket.id]).emit('action', msg, socket.id);
    })

    socket.on('video-offer', (offer, sid) => {
        socket.to(sid).emit('video-offer', offer, socket.id, socketnick[socket.id], videoSocket[socket.id]);
    })

    socket.on('video-answer', (answer, sid) => {
        socket.to(sid).emit('video-answer', answer, socket.id);
    })

    socket.on('newIcecandidate', (candidate, sid) => { //브라우저 호환성
        socket.to(sid).emit('newIcecandidate', candidate, socket.id);
    })

    socket.on('chat', (chatting, usernick, roomid) => {
        socket.to(roomid).emit('chat', chatting, usernick, moment().format("h:mm a"));
    })

    socket.on('getCanvas', () => {
        if (roomBoard[socketroom[socket.id]]) //roomBoard[roomid]라는 뜻
            socket.emit('getCanvas', roomBoard[socketroom[socket.id]]);
    });
    
    socket.on('draw', (newx, newy, prevx, prevy, color, size) => {
        socket.to(socketroom[socket.id]).emit('draw', newx, newy, prevx, prevy, color, size);
    })

    socket.on('clearBoard', () => {
        socket.to(socketroom[socket.id]).emit('clearBoard');
    });
    
    socket.on('storeCanvas', url => {
        roomBoard[socketroom[socket.id]] = url;
    })

    socket.on('disconnect', () => {
        if (!socketroom[socket.id]) return;
        socket.to(socketroom[socket.id]).emit('chat', `${socketnick[socket.id]} 님이 채팅방을 나가셨습니다.`, `System`, moment().format("h:mm a"));
        socket.to(socketroom[socket.id]).emit('removePeer', socket.id);
        var index = rooms[socketroom[socket.id]].indexOf(socket.id);
        rooms[socketroom[socket.id]].splice(index, 1);
        io.to(socketroom[socket.id]).emit('userCount', rooms[socketroom[socket.id]].length);
        let roomid=socketroom[socket.id];
        delete socketroom[socket.id];
        let req=socket.request;
        socket.leave(roomid);
        let userCount=rooms[roomid] ? rooms[roomid].length:0;
        axios.post('http://localhost:8001/library/user/',{user:req.user.id,roomId:roomid,userCount,startTime});
        socket.to(roomid).emit('exitRoom',req.user.nick);    
    });
})


