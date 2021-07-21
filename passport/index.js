const passport=require('passport');
const local=require('./localStrategy');
const kakao=require('./kakaoStrategy');
const User=require('../models/user');
const Room=require('../models/room');

module.exports=()=>{
    passport.serializeUser((user,done)=>{ //로그인 시 실행. req.session객체에 사용자정보객체를 세션에 id를 통해 저장
        done(null,user.id);
    });

    passport.deserializeUser((id,done)=>{ //매 요청 시 실행. id를 받아 사용자정보객체를 불러옴(req.user)
        User.findOne({
            where:{id},
            include:[{
                model:Room,
                attributes:['id'],
            }],
        })
        .then(user=>done(null,user))
        .catch(err=>done(err));
    });

    local();
    kakao();
}