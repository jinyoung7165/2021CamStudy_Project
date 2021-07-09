const express=require('express');

const {isLoggedIn}=require('./middlewares');
const User = require('../models/user');
const Post = require('../models/post');
const sequelize = require('sequelize');

const router=express.Router();



// 렌더링시 맞는 정보와 함께 프로필 렌더링 하는 라우터
router.post('/profile',isLoggedIn,async(req,res,next)=>{
    try {
        
        const user = await User.findOne({    
            where: { id: req.user.id} 
        });

        const posts = await Post.findAll({ 
            where: {UserId: req.user.id},
        });

        res.render('profile', {
          profile: user,
          promises: posts,
        });
        
      } catch (err) {
        console.error(err);
        next(err);
    }
});
/*
router.post('/profile',async(req,res,next)=>{
    try{
        await User.update({ nick: req.body.nick },{
            where: { id:req.user.id },
        });
        res.redirect('/profile');
    } catch (error){
        console.error(error);
        next(error);
    }
    
});
*/

// 수정하는 라우터
router.post('/fix', async (req, res, next)=>{  
    try{
      await User.update(
        { nick: req.body.nick,},
        { where:{ id: req.user.id },}); 
      await User.update(
          {level_show:req.body.chk,},
          {where: { id: req.user.id}});

      res.redirect('/profile'); 
    }catch(error){
      console.error(error);
      next(error);
    }
  }) 

module.exports=router;