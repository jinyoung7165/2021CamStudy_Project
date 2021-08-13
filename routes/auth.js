const express=require('express');
const passport=require('passport');
const {isLoggedIn,isNotLoggedIn}=require('./middlewares');
const User=require('../models/user');
const bcrypt=require('bcryptjs');
const router=express.Router();

//회원가입 라우터 -> 같은 이메일로 가입한 사람이 있는지 조회후 수행
router.post('/join',isNotLoggedIn,async(req,res,next)=>{ 
    const {email,nick,password}=req.body;
    try{
        const exUser=await User.findOne({where:{email}});
        if (exUser){
            return res.redirect('/join?error=email'); 
        }
        const hash=await bcrypt.hash(password,12); 
        await User.create({ 
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

//로그인 라우터
router.post('/login',isNotLoggedIn,(req,res,next)=>{
    passport.authenticate('local',(authError,user,info)=>{//로컬로그인
        if(authError){ //실패
            console.error(authError);
            return next(authError);
        }
        if(!user){     //실패
            return res.redirect(`/?loginError=${info.message}`);
        }
        return req.login(user,(loginError)=>{
            if(loginError){
                console.error(loginError);
                return next(loginError);
            }
            return res.redirect('/');
        });
    })(req,res,next); //미들웨어인데 라우터 미들웨어 안에 들어있을 때(사용자 정의 기능 추가), 내부에서 호출 
});

// 로그아웃 라우터 -> req.user객체, req.session객체 내용 제거
router.get('/logout',isLoggedIn,(req,res)=>{
    req.logout(); 
    req.session.destroy(); 
    res.redirect('/'); 
});

router.get('/kakao',passport.authenticate('kakao')); //GET /auth/kakao 로 접근하면 카카오로그인. 카카오로그인 창으로 리다이렉트
router.get('/kakao/callback',passport.authenticate('kakao',{ //로그인 후 성공 여부를 GET /auth/kakao/callback으로 받음. 카카오로그인 전략 다시 수행
    failureRedirect:'/', 
}),(req,res)=>{
    res.redirect('/join'); 
});

//assport.authenticate('google', {scope: 'https://www.googleapis.com/auth/plus.login'});
router.get('/google',passport.authenticate('google', { scope: ["email", "profile"] })); //GET /auth/kakao 로 접근하면 카카오로그인. 카카오로그인 창으로 리다이렉트
router.get('/google/callback',passport.authenticate('google',{ //로그인 후 성공 여부를 GET /auth/kakao/callback으로 받음.카카오로그인 전략 다시 수행
    failureRedirect:`/?loginError=sookmyung 이메일로 시도하세요.`, //로그인 실패 시 이동할 페이지
}),(req,res)=>{
    res.redirect('/join'); //로그인 성공 시 이동할 페이지
});

module.exports=router;