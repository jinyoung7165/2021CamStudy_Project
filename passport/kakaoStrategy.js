const passport=require('passport');
const KakaoStrategy=require('passport-kakao').Strategy;
const User=require('../models/user');

module.exports=()=>{
    passport.use(new KakaoStrategy({
        clientID:process.env.KAKAO_ID, //카카오에서 발급해주는 아이디
        callbackURL:'/auth/kakao/callback',//카카오로부터 인증 결과를 받을 라우터 주소
    },async(acessToken,refreshToken,profile,done)=>{ //카카오는 인증 후 callbackURL로 accesstoken,refreshtoken,profile(사용자정보)을 보냄
        console.log('kakao profile',profile);
        try{
            const exUser=await User.findOne({
                where:{snsID:profile.id,provider:'kakao'},
            });
            if(exUser){//이미 회원가입한 유저
                done(null,exUser);
            }else{
                const newUser=await User.create({ //카카오에서 보내준 profile에서 원하는 정보만 가져와 회원가입
                    email:profile._json &&profile._json.kakao_account_email,
                    nick:profile.displayName,
                    snsID:profile.id,
                    provider:'kakao',
                });
                done(null,newUser);
            }
        }catch(error){
            console.error(error);
            done(error);
        }
    }));
};