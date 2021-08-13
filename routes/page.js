const express=require('express');
const {isLoggedIn,isNotLoggedIn}=require('./middlewares');
const {User,Post,Room,Chat}=require('../models');
const router=express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

try {
    fs.readdirSync('uploads');
  } catch (error){
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
  }
  const upload = multer({
    storage: multer.diskStorage({
      destination(req,file,cb){
        cb(null, 'uploads/');
      },
      filename(req,file,cb){
        const ext = path.extname(file.originalname);
        cb(null,path.basename(file.originalname,ext) + new Date().valueOf() + ext);
      },
    }),
    limits: {fileSize:5*1024*1024}, // 파일 사이즈: 5MB
  });

router.use((req,res,next)=>{
    res.locals.user=req.user; //passport.deserializeUser를 통해 req.user에 user정보 저장한 것을 담음
    res.locals.level=req.user?req.user.level:0;
    res.locals.level_show=req.user?req.user.level_show:0;
    res.locals.nick=req.user?req.user.nick:'';
    res.locals.total_time=req.user?req.user.total_time:0;
    res.locals.email=req.user?req.user.email:'';
    next();
});

// 프로필 렌더링 라우터 -> 게시글 조회후 유저의 아이디, 닉네임, 레벨을 join해서 제공
router.get('/profile',isLoggedIn,async(req,res)=>{
    const posts=await Post.findAll({
        include:[{
            model:User,
            where:{id:req.user.id},
            attributes:['id','nick'],
        },{
            model:User,
            attributes:['id'],       //좋아요를 누른 사용자 정보 가져옴
            as:'Liker',
        }],
        order:[['createdAt','DESC']],
    });
    res.render('profile',{title:'내 정보- CamStudy',promises:posts});
});

router.get('/join',isNotLoggedIn,(req,res)=>{
    res.render('join',{title:'회원가입- CamStudy'});
});

router.get('/',async(req,res,next)=>{
    try{
        const rooms=await Room.findAll({ //모든 방 가져옴 -> 정렬은 오래된순
            include:[{
                model:User,
                attributes:['id','nick'],
            }],
            order:[['createdAt','ASC']],
        });
        const posts=await Post.findAll({ //모든 게시글 조회 -> 정렬은 최신순
            include:[{
                model:User,
            },{
                model:User,       //좋아요를 누른 사용자 정보 가져옴
                as:'Liker',
            }],
            order:[['createdAt','DESC']],
        });
        const rankers=await User.findAll({ // total_time 오름차순 정렬 후 10개 자르기
          where:{level_show:0},
          attributes:['nick', 'level', 'total_time','level_show'],
          order:[['total_time','DESC']],
          limit: 10
        });
        res.render('main',{
            title:'CamStudy',
            twits:posts,
            rooms:rooms,
            rankers:rankers,
        });
    }catch(err){
        console.error(err);
        next(err);
    }
});

router.get('/room', isLoggedIn, (req, res) => {
  res.render('newroom', { title: '채팅방 생성' });
});

function uuidv4() {
    return 'xxyxyxxyx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
  }

  //채팅방을 만드는 라우터 
router.post('/room',isLoggedIn, upload.single('img'), async (req, res, next) => {
    try {
      let makeuuid=uuidv4();
      const newRoom = await Room.create({
        title: req.body.title,
        uuid: makeuuid,
        max: req.body.max,
        description: req.body.description,
        password: req.body.password,
        //img: req.file.filename,
        img: req.params.img,
        option:req.body.room_option,
        participants_num:1,
      });
      const io = req.app.get('io'); //io 객체 가져오기
      io.emit('newRoom', newRoom); // 모든 클라이언트에 데이터를 보내는 메서드
      await newRoom.addUser(req.user.id);
      if(req.body.password){
        res.redirect(`/library/${makeuuid}?password=${req.body.password}`);
      }
      else{res.redirect(`/library/${makeuuid}`);}
    } catch (error) {
      console.error(error);
      next(error);
    }
  });

    /* 채팅방을 만드는 라우터 */
router.post('/room/loadImage',isLoggedIn, upload.single('img'), async (req, res, next) => {
  try {
    let makeuuid=uuidv4();
    const newRoom = await Room.create({
      title: req.body.title,
      uuid: makeuuid,
      max: req.body.max,
      description: req.body.description,
      password: req.body.password,
      img: req.file.filename,
      //img: req.params.img || req.file.filename,
      option:req.body.room_option,
      participants_num:1,
    });
    const io = req.app.get('io'); //io 객체 가져오기
    io.emit('newRoom', newRoom); // 모든 클라이언트에 데이터를 보내는 메서드
    await newRoom.addUser(req.user.id);
    if(req.body.password){
      res.redirect(`/library/${makeuuid}?password=${req.body.password}`);
    }
    else{res.redirect(`/library/${makeuuid}`);}
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 방 들어가면 library.html 렌더링 방주소랑 사용자 전달
router.get('/library/:id', async(req, res) => {
    const user=req.user.id;
    const uuid=req.params.id;
    const room=await Room.findOne({where:{uuid}});
    if (!room) {
      return res.redirect('/?RoomError=존재하지 않는 방입니다.');
    }
    else if (req.query.password&&room.password && room.password !== req.query.password) {
      return res.redirect('/?PwError=비밀번호가 틀렸습니다.');
    }
    else if (room.participants_num+1 > room.max) {
      return res.redirect('/?RoomError=허용 인원을 초과하였습니다.');
    }
    await room.addUser(user);
    const io = req.app.get('io');
    
    const users=await User.findAll({//현재 들어있는 사람들
      include:[{
        model:Room,
        where:{
          uuid
        },
      }]
  });
  await Room.update({ // 방인원수 update
      participants_num:users.length
    }, {
      where:{uuid},  
    }); 
    const resultroom=await Room.findOne(
      {where:{uuid}}
    );

  const userCount=users.length;
  const max=resultroom.max;
  setTimeout(() => {
    req.app.get('io').emit('mainCount',{uuid,userCount,max});  //메인 화면에서 참가자 수 바뀌게
  },100);
  return res.render('library', { roomId: req.params.id,users,room:resultroom})
});

// 방 퇴장 라우터 -> room, user 관계 업데이트
router.post('/library/user',async(req,res,next)=>{
  try{//user=>user.id,roomId,userCount,startTime
    const uuid=req.body.roomId;
    const userCount=req.body.userCount;
    const leftuser=await User.findOne({//나간 사람
      where:{id:req.body.user},  
      include:[{
          model:Room,
          where:{
            uuid
          },
        }]
    });

    await Room.update({
      participants_num: userCount,
    }, {
     where:{uuid},  
    });
    
    const resultroom=await Room.findOne({
      where:{uuid},
        include:[{
          model:User,
          attributes:['id'],
       }]
    }); 
    const endTime = new Date();
    let startTime = new Date(Date.parse(req.body.startTime));
    const access_time = ((endTime.getTime() - startTime.getTime())/1000).toFixed(0); //1000
    const resulthour=parseFloat(leftuser.total_time)+parseFloat(access_time);
    const resultlevel=parseInt((resulthour/3600),10);
    
    await User.update({
      total_time: resulthour
    },{
      where: {id:req.body.user},
    }); 
    
    await User.update({
      level: resultlevel
    },{
      where: {id:req.body.user},
    }); 
    resultroom.removeUser(leftuser);
    const roomId=resultroom.id;
    const max=resultroom.max;
    if (userCount==0){
      if (resultroom.option==0){
        await Chat.destroy({ where:{RoomId:roomId} });
        await Room.destroy({ where: {id: roomId} });
        setTimeout(() => {
          req.app.get('io').emit('removeRoom', uuid);
        }, 100);
      }
    }
    setTimeout(() => {
      req.app.get('io').emit('mainCount',{uuid,userCount,max});  //메인 화면에서 참가자 수 바뀌게
    },100);
  }
  catch (error) {
    console.error(error);
  }
});
module.exports=router;