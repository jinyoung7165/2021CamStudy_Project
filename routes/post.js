const express=require('express');
const multer=require('multer');
const {Post}=require('../models');
const {isLoggedIn}=require('./middlewares');
const router=express.Router();
const sanitizeHtml = require('sanitize-html');
const upload2 = multer();

// post 생성 라우터 -> 게시글 업로드 처리, 이미지데이터가 안 왔으므로 none()사용.(주소가 온 것)
router.post('/',isLoggedIn,upload2.none(),async(req,res,next)=>{ 
    try{
        let content=req.body.content;
        content=sanitizeHtml(content);
        const post=await Post.create({
            msg:content,
            UserId:req.user.id,
        });   
        res.redirect('/');
    }catch(error){
        console.error(error);
        next(error);
    }
});

// post 삭제 라우터
router.delete('/:id',isLoggedIn,async(req,res,next)=>{
    try{
        const post=await Post.findOne({where:{id:req.params.id}});
        await post.destroy({where:{UserId:req.user.id}});    
        res.send('success');
    }
    catch(error){
        console.error(error);
        next(error);
    }
});

// post 좋아요 라우터
router.post('/:id/like',isLoggedIn,async(req,res,next)=>{
    try{
        const post=await Post.findOne({where:{id:req.params.id}});
        await post.addLiker(req.user.id);
        res.send('Ok');
    }
    catch(error){
        console.error(error);
        next(error);
    }
});

// post 좋아요 취소
router.delete('/:id/like',isLoggedIn,async(req,res,next)=>{
    try{
        const post=await Post.findOne({where:{id:req.params.id},});
        await post.removeLiker(req.user.id);
        res.send('Ok');
    }
    catch(error){
        console.error(error);
        next(error);
    }
});

module.exports=router;