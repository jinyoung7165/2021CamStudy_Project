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
const { ExpressPeerServer } = require("peer");

dotenv.config();
const pageRouter=require('./routes/page');
const authRouter=require('./routes/auth');
const postRouter=require('./routes/post');
const userRouter=require('./routes/user');
const {sequelize}=require('./models');  //index.js생략 가능
const passportConfig=require('./passport');
const socket=require('socket.io');
const webSocket = require('./socket.js');

const app=express();
passportConfig(); //패스포트 설정
app.use(express.json())
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
app.use('/public',express.static(path.join(__dirname,'public')));
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


app.use('/',pageRouter);
app.use('/auth',authRouter); //경로 앞에 auth가 붙음
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
const server=app.listen(app.get('port'),()=>{
    console.log(app.get('port'),'번 포트에서 대기 중');
});


const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: "/",
    port: 8001, 
});
app.use("/library", peerServer);
webSocket(server, app, sessionMiddleware);