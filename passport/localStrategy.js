const passport=require('passport');
const LocalStrategy=require('passport-local').Strategy;
const bcrypt=require('bcryptjs');
const User=require('../models/user');

module.exports=()=>{
    passport.use(new LocalStrategy({//로그인 전략
        usernameField:'email', //로그인 라우터의 req.body.email, req.body.password
        passwordField:'password',
    },async(email,password,done)=>{ //done은 passport.authenticate의 콜백함수
        try{
            const exUser=await User.findOne({where:{email}});
            if(exUser){
                const result=await bcrypt.compare(password,exUser.password);
                if(result){
                    done(null,exUser);
                }else{
                    done(null,false,{message:'비밀번호가 일치하지 않습니다.'});
                }
            }else{
                done(null,false,{message:'가입되지 않은 회원입니다.'});
            }
        }catch(error){
            console.error(error);
            done(error);
        }
    }));
};