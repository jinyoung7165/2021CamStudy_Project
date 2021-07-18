const express=require('express');
const {isLoggedIn,isNotLoggedIn}=require('./middlewares');
const {User,Post,Room,Chat}=require('../models');
const router=express.Router();
const sequelize = require('sequelize');

router.use((req,res,next)=>{
    res.locals.user=req.user; //passport.deserializeUser를 통해 req.user에 user정보 저장한 것을 담음
    next();
});

router.get('/profile',isLoggedIn,async(req,res)=>{ //로그인되어 있을 때만 접근 가능(next()를 호출해 res.render 미들웨어로 넘어간다)
    const posts=await Post.findAll({//게시글 조회
        include:[{
            model:User,
            where:{id:req.user.id},
            attributes:['id','nick','level'],//아이디와 닉네임을 join해서 제공
        }],
        order:[['createdAt','DESC']],//게시글의 순서는 최신순으로 정렬
    });
    res.render('profile',{title:'내 정보- CamStudy',promises:posts});
});
router.get('/join',isNotLoggedIn,(req,res)=>{
    res.render('join',{title:'회원가입- CamStudy'});
});


router.get('/',async(req,res,next)=>{
    try{
        const rooms=await Room.findAll({//모든 룸 가져옴
            include:[{
                model:User,
                attributes:['id','nick'],//아이디와 닉네임을 join해서 제공
            }],
            order:[['createdAt','ASC']],//게시글의 순서는 오래된 순으로 정렬
        });
        const posts=await Post.findAll({//게시글 조회
            include:[{
                model:User,
                attributes:['id','nick'],//아이디와 닉네임을 join해서 제공
            },{
                model:User,
                attributes:['id'],//좋아요를 누른 사용자 정보 가져옴
                as:'Liker',
            }],
            order:[['createdAt','DESC']],//게시글의 순서는 최신순으로 정렬
        });
        res.render('main',{
            title:'CamStudy',
            twits:posts,//게시글 조회 결과를 넣음
            rooms:rooms,
        });
    }catch(err){
        console.error(err);
        next(err);
    }
});

router.get('/room', (req, res) => {
  res.render('room', { title: 'GIF 채팅방 생성' });
});
  
/* 채팅방을 만드는 라우터 */
router.post('/room', async (req, res, next) => {
  try {
    const newRoom = await Room.create({
      title: req.body.title,
      max: req.body.max,
      description: req.body.description,
      password: req.body.password,
      option:req.body.room_option,
    });
    const io = req.app.get('io'); //io 객체 가져오기
    io.of('/room').emit('newRoom', newRoom); // room 네임 스페이스에 연결한 모든 클라이언트에 데이터를 보내는 메서드
    await newRoom.addUser(req.user.id);
    if(req.body.password){
      res.redirect(`/library/${newRoom.id}?password=${req.body.password}`);
    }
    else{res.redirect(`/library/${newRoom.id}`);}
  } catch (error) {
    console.error(error);
    next(error);
  }
});
  
// 방 들어가면 library.html 렌더링 방주소랑 사용자아이디 전달 (nick으로 할까 id로 할까?)
router.get('/library/:id', async(req, res) => {
    const room=await Room.findOne({where:{id:req.params.id}});
    await room.addUser(req.user.id);
    const io = req.app.get('io');
    if (!room) {
      return res.redirect('/?RoomError=존재하지 않는 방입니다.');
    }
    else if (req.query.password&&room.password && room.password !== req.query.password) {
      return res.redirect('/?PwError=비밀번호가 틀렸습니다.');
    }
    else if (room.participants_num+1 > room.max) {
      return res.redirect('/?RoomError=허용 인원을 초과하였습니다.');
    }
    await Room.update({ // 방인원수 update
      participants_num: sequelize.literal(`participants_num + 1`), // 쿼리 문자열 추가해주는 기능
    }, {
      where:{id:req.params.id},  
    }); 

    nums = (await Chat.findAndCountAll({
      include:[{
        model:Room,
        where:{
          id:req.params.id,
        },
      }]
    })).count
   
    if (nums <10) {nums=10}

    const chats = await Chat.findAll({  
      limit:10,
      offset:nums-10,
      include:[{
      model:Room,
      where:{
        id:req.params.id,
      },
    },{
      model:User,
    }
  ]
  });
  const users=await User.findAll({
      include:[{
        model:Room,
        where:{
          id:req.params.id,
        },
      }]
  });
  return res.render('library', { roomId: req.params.id,users,room,chats})
  });


router.delete('/library/:id', async (req, res, next) => {
  try {
    const room = await Room.findOne({
      include:[{
        model:Chat,
        where:{
          roomId:req.params.id,
        },
        attributes:['id'],
      },{
        model:User,
        where:{
          roomId:req.params.id,
        },
      }]
    });

    await Chat.destroy({ where:{RoomId:req.params.id} });
      await Room.destroy({ where: {id: req.params.id} });
      res.send('ok');
      setTimeout(() => {
        req.app.get('io').of('/room').emit('removeRoom', req.params.id);
      }, 2000);
    
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/library/:id/chat', async(req,res,next) => {
    try{
      const chat = await Chat.create({
        chating: req.body.chat,
        UserId: req.user.id,
        RoomId:req.params.id,
      });
      const chatt=await Chat.findOne({ //user nick 같이 보내려면 include필요
        include:[{model:User}],
        where:{chating:req.body.chat},
      })
      req.app.get('io').of('/library').to(req.params.id).emit('chat',chatt);
      res.send('ok');
    } catch(error){
      console.log(error);
      next(error);
    }
  });

module.exports=router;