const express=require('express');
const path=require('path');
const multer = require('multer');
const {User,Post,Room}=require('../models');
const {isLoggedIn}=require('./middlewares');

const router=express.Router();

const upload2 = multer();
router.post('/',isLoggedIn,upload2.none(),async(req,res,next)=>{ //POST /post 라우터.게시글 업로드 처리.이미지데이터가 안 왔으므로 none()사용.(주소가 온 것)
    try{
        const post=await Post.create({
            msg:req.body.content,
            UserId:req.user.id,
        });  
        console.log(">>>>>>"+post.msg+"<<<<<<<");      
        res.redirect('/');
    }catch(error){
        console.error(error);
        next(error);
    }
});

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