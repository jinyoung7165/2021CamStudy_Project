const User=require('../models/user');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const { default: axios } = require('axios');
const nodemailer = require('nodemailer');
let flag = false;
module.exports=()=>{
    passport.use(new GoogleStrategy({
        clientID:process.env.GOOGLE_ID, 
        clientSecret:process.env.GOOGLE_SECRET,
        callbackURL:'/auth/google/callback',
    },async(acessToken,refreshToken,profile,done)=>{ 
        try{
            const exUser=await User.findOne({
                where:{
                    snsID:profile.id,
                    provider:'google'
                },
            });
            let email = profile.email;
            let splitMail = email.split('@');
            let splitdot = splitMail[1].split('.');
            if (splitdot[0] == 'sookmyung' && exUser){//이미 회원가입한 유저
                done(null,exUser);
            } else if (splitdot[0] == 'sookmyung' && !exUser){
                const newUser=await User.create({ 
                    email:profile.email,
                    nick:profile.family_name+profile.given_name,
                    snsID:profile.id,
                    provider:'google',
                });
                done(null, newUser);
            } else {
                done(null,null);
            }
        }catch(error){
            console.error(error);
            done(error);
        }
    }));
};