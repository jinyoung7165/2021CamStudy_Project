const express=require('express');
const passport=require('passport');
const {isLoggedIn,isNotLoggedIn}=require('./middlewares');
const User=require('../models/user');
const os = require('os');
const bcrypt=require('bcryptjs');
const router=express.Router();

router.post('/join',isNotLoggedIn,async(req,res,next)=>{ //회원가입 라우터
    const {email,nick,password}=req.body;
    try{
        const exUser=await User.findOne({where:{email}});//같은 이메일로 가입한 자가 있는지 조회
        if (exUser){
            return res.redirect('/join?error=email'); //회원가입 페이지로 다시 돌려보냄
        }
        const hash=await bcrypt.hash(password,12); //비밀번호 암호화
        await User.create({ //사용자 정보 생성
            email,
            nick,
            password:hash,
        });
        return res.redirect('/');
    }catch(error){
        console.error(error);
        return next(error);
    }
});

router.post('/login',isNotLoggedIn,(req,res,next)=>{//로그인 라우터
    passport.authenticate('local',(authError,user,info)=>{//로컬로그인
        if(authError){//실패
            console.error(authError);
            return next(authError);
        }
        if(!user){//실패
            return res.redirect(`/?loginError=${info.message}`);
        }
        return req.login(user,(loginError)=>{//passport.serializeUser를 호출. user객체가 serializeUser로 넘어감(req.session객체에 id로저장)
            if(loginError){
                console.error(loginError);
                return next(loginError);
            }
            return res.redirect('/');
        });
    })(req,res,next);//미들웨어인데 라우터 미들웨어 안에 들어있을 때(사용자 정의 기능 추가), 내부에서 호출
});

router.get('/logout',isLoggedIn,(req,res)=>{
    req.logout(); ///req.user객체 제거
    req.session.destroy(); //req.session객체 내용 제거
    res.redirect('/'); //메인페이지로 돌아감
});

router.get('/kakao',passport.authenticate('kakao')); //GET /auth/kakao 로 접근하면 카카오로그인. 카카오로그인 창으로 리다이렉트
router.get('/kakao/callback',passport.authenticate('kakao',{ //로그인 후 성공 여부를 GET /auth/kakao/callback으로 받음.카카오로그인 전략 다시 수행
    failureRedirect:'/', //로그인 실패 시 이동할  페이지
}),(req,res)=>{
    res.redirect('/join'); //로그인 성공 시 이동할 페이지
});

module.exports=router;