const express=require('express');
const passport=require('passport');
const {isLoggedIn,isNotLoggedIn}=require('./middlewares');
const User=require('../models/user');
const bcrypt=require('bcryptjs');
const router=express.Router();

// 로그아웃 라우터 -> req.user객체, req.session객체 내용 제거
router.get('/logout',isLoggedIn,(req,res)=>{
    req.logout(); 
    req.session.destroy(); 
    res.redirect('/'); 
});

//assport.authenticate('google', {scope: 'https://www.googleapis.com/auth/plus.login'});
router.get('/google',passport.authenticate('google', { scope: ["email", "profile"]})); //GET /auth/kakao 로 접근하면 카카오로그인. 카카오로그인 창으로 리다이렉트
router.get('/google/callback',passport.authenticate('google',{ //로그인 후 성공 여부를 GET /auth/kakao/callback으로 받음.카카오로그인 전략 다시 수행
    failureRedirect:`/?loginError=sookmyung 이메일로 시도하세요.`, //로그인 실패 시 이동할 페이지
}),(req,res)=>{
    res.redirect('/'); //로그인 성공 시 이동할 페이지
});

module.exports=router;
