const socket = io();
const myvideo = document.querySelector("#vd1");
const roomid = params.split('/')[params.split('/').length - 1].replace(/\?.+/, '');
let usernick=document.querySelector('.mynick').textContent;
const chatRoom = document.querySelector('.chat-cont');
const sendButton = document.querySelector('.chat-send');
const chatField = document.querySelector('.chat-input');
const videoContainer = document.querySelector('#vcont');
const overlayContainer = document.querySelector('#overlay');
const videoButt = document.querySelector('.novideo');
const copycodeButt = document.querySelector('.copycode');
const cutCall = document.querySelector('.cutcall');
const myId = document.querySelector('#my-id').value;
const filterButt=document.querySelector('.filter');
const closeButt=document.querySelector('.chat-close-butt');
const boardButt=document.querySelector('.board-icon');
const attendiesButt=document.querySelector('.attendies');
const attendiesCloseButt=document.querySelector('.attendies-close-butt');
const videobox=document.querySelector('.video-box');

let videoAllowed = 1;
let videoInfo = {};
let videoTrackReceived = {};
let filterornot=0;

let myvideooff = document.querySelector("#myvideooff");
myvideooff.style.visibility = 'hidden';

const configuration = { iceServers: [{ 
    urls:[
        "stun:stun.l.google.com:19302",
        "stun:stun.l.google.com:19302",
        "stun:stun.l.google.com:19302",
        "stun:stun.stunprotocol.org"
        ] }] }
const mediaConstraints = { video: true, audio: false};

let connections = {};
let cName = {};
let videoTrackSent = {};

let mystream, myscreenshare;

document.querySelector('.roomcode').textContent = `${roomid}`
socket.emit("join", roomid, usernick);

function CopyClassText() {
    const textArea = document.createElement('textarea'); 
    document.body.appendChild(textArea); 
    textArea.value = `${roomid}`;
    textArea.select(); document.execCommand('copy');
    document.body.removeChild(textArea);

    document.querySelector(".tooltiptext").textContent = "복사됨"
    setTimeout(()=>{
        document.querySelector(".tooltiptext").textContent = "방 코드 복사";
    }, 1000);
}

let participant_num;
socket.on('userCount', count => {
    if (count > 1) {
        videoContainer.className = 'video-cont';
    }
    else {
        videoContainer.className = 'video-cont-single';
    }
    participant_num = count ;
})

function startCall() {
    navigator.mediaDevices.getUserMedia(mediaConstraints)
        .then(localStream => {
            myvideo.srcObject = localStream;
            myvideo.muted = true;

            localStream.getTracks().forEach(track => {
                for (let key in connections) {
                    connections[key].addTrack(track, localStream);
                    if (track.kind === 'video')
                        videoTrackSent[key] = track;
                }
            })
        })
        .catch(handleGetUserMediaError);
}

function handleVideoOffer(offer, sid, cname, vidinf) {
    cName[sid] = cname;
    videoInfo[sid] = vidinf;
    connections[sid] = new RTCPeerConnection(configuration);

    connections[sid].onicecandidate = function (event) {
        if (event.candidate) {
            socket.emit('newIcecandidate', event.candidate, sid);
        }
    };

    connections[sid].ontrack = function (event) {
        if (!document.getElementById(sid)) {
            let vidCont = document.createElement('div');
            let newvideo = document.createElement('video');
            let name = document.createElement('div');
            let videoOff = document.createElement('div');
            
            videoOff.classList.add('video-off');
            name.classList.add('nametag');
            name.innerHTML = `${cName[sid]}`;
            vidCont.id = sid;
            videoOff.id = `vidoff${sid}`;
            videoOff.innerHTML = 'Video Off'
            vidCont.classList.add('video-box');
            newvideo.classList.add('video-frame');
            newvideo.autoplay = true;
            newvideo.playsinline = true;
            newvideo.id = `video${sid}`;
            newvideo.srcObject = event.streams[0];

            if (videoInfo[sid] == 'on')
                videoOff.style.visibility = 'hidden';
            else
                videoOff.style.visibility = 'visible';

            vidCont.appendChild(newvideo);
            vidCont.appendChild(name);
            vidCont.appendChild(videoOff);

            videoContainer.appendChild(vidCont);
             videoResize();
        }
    };

    connections[sid].onremovetrack = function (event) {
        if (document.getElementById(sid)) {
            document.getElementById(sid).remove();
        }
    };

    connections[sid].onnegotiationneeded = function () {
        connections[sid].createOffer()
            .then(function (offer) {
                return connections[sid].setLocalDescription(offer);
            })
            .then(function () {
                socket.emit('video-offer', connections[sid].localDescription, sid);
            })
            .catch(reportError);
    };

    let desc = new RTCSessionDescription(offer);

    connections[sid].setRemoteDescription(desc)
        .then(() => { return navigator.mediaDevices.getUserMedia(mediaConstraints) })
        .then((localStream) => {
            localStream.getTracks().forEach(track => {
                connections[sid].addTrack(track, localStream);
                if (track.kind === 'video') {
                    videoTrackSent[sid] = track;
                    if (!videoAllowed)
                        videoTrackSent[sid].enabled = false
                }
            })
        })
        .then(() => {
            return connections[sid].createAnswer();
        })
        .then(answer => {
            return connections[sid].setLocalDescription(answer);
        })
        .then(() => {
            socket.emit('video-answer', connections[sid].localDescription, sid);
        })
        .catch(handleGetUserMediaError);

}

function handleNewIceCandidate(candidate, sid) {
    var newcandidate = new RTCIceCandidate(candidate);
    connections[sid].addIceCandidate(newcandidate)
        .catch(reportError);
}

function handleVideoAnswer(answer, sid) {
    const ans = new RTCSessionDescription(answer);
    connections[sid].setRemoteDescription(ans);
    videoResize();
}

// 방 코드 복사 관련
copycodeButt.addEventListener('click',()=>{
    CopyClassText();
})
// 참가자 모달 관련
attendiesButt.addEventListener('click',()=>{
    if (attendiesVisible){
        attendiesVisible=false;
        modal.style.display = "none";
        utilAttendiesButt.style.backgroundColor = "#d8d8d8";  
        utilAttendiesButt.style.color = "#393e46";
    } else {
        modal.style.display = "block";
        attendiesVisible=true;
        utilAttendiesButt.style.backgroundColor = "#393e46";  
        utilAttendiesButt.style.color = "white";
    }
})
attendiesCloseButt.addEventListener('click',()=>{
    attendiesVisible=false;
    modal.style.display = "none";
    utilAttendiesButt.style.backgroundColor = "#d8d8d8";  
    utilAttendiesButt.style.color = "#393e46";
})
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
} 

socket.on('video-offer', handleVideoOffer);
socket.on('newIcecandidate', handleNewIceCandidate);
socket.on('video-answer', handleVideoAnswer);

socket.on('join', async (conc, cnames,videoinfo) => {
    socket.emit('getCanvas');
    if (cnames)
        cName = cnames;

    if (videoinfo)
        videoInfo = videoinfo;

    if (conc) {
        await conc.forEach(sid => {
            connections[sid] = new RTCPeerConnection(configuration);

            connections[sid].onicecandidate = function (event) {
                if (event.candidate) {
                    socket.emit('newIcecandidate', event.candidate, sid);
                }
            };

            connections[sid].ontrack = function (event) {
                if (!document.getElementById(sid)) {
                    let vidCont = document.createElement('div');
                    let newvideo = document.createElement('video');
                    let name = document.createElement('div');
                    let videoOff = document.createElement('div');

                    videoOff.classList.add('video-off');
                    name.classList.add('nametag');
                    name.innerHTML = `${cName[sid]}`;
                    vidCont.id = sid;
                    videoOff.id = `vidoff${sid}`;
                    videoOff.innerHTML = 'Video Off'
                    vidCont.classList.add('video-box');
                    newvideo.classList.add('video-frame');
                    newvideo.autoplay = true;
                    newvideo.playsinline = true;
                    newvideo.id = `video${sid}`;
                    newvideo.srcObject = event.streams[0];

                    if (videoInfo[sid] == 'on')
                        videoOff.style.visibility = 'hidden';
                    else
                        videoOff.style.visibility = 'visible';

                    vidCont.appendChild(newvideo);
                    vidCont.appendChild(name);
                    vidCont.appendChild(videoOff);
                    videoContainer.appendChild(vidCont);
                }
            };
            connections[sid].onremovetrack = function (event) {
                if (document.getElementById(sid)) {
                    document.getElementById(sid).remove();
                }
            }

            connections[sid].onnegotiationneeded = function () {
                connections[sid].createOffer()
                    .then(function (offer) {
                        return connections[sid].setLocalDescription(offer);
                    })
                    .then(function () {
                        socket.emit('video-offer', connections[sid].localDescription, sid);
                    })
                    .catch(reportError);
            };

        });
        startCall();

    }
    else {
        navigator.mediaDevices.getUserMedia(mediaConstraints)
            .then(localStream => {
                myvideo.srcObject = localStream;
                myvideo.muted = true;
                mystream = localStream;
            })
            .catch(handleGetUserMediaError);
    }
})

function videoResize(){
    var vidNum=participant_num;
    var videos=document.querySelector('.video-cont');

    if (vidNum>0 && vidNum<5){
        videos.style.gridTemplateColumns = "repeat(auto-fit, minmax(48%, auto))";
    } else if (vidNum>4 && vidNum<10){
        videos.style.gridTemplateColumns = "repeat(auto-fit, minmax(31%, auto))";
    } else if (vidNum>9 && vidNum<13){
        videos.style.gridTemplateColumns = "repeat(auto-fit, minmax(23%, auto))";
    } else {
        videos.style.gridTemplateColumns = "repeat(auto-fit, minmax(18%, auto))";
    }
}

socket.on('enterRoom',(usernick,level_show,level)=>{
    //참가자 들어옴
    document.querySelector('#attendies').textContent=`참가자들 (${participant_num})`;
    let div1 = document.createElement('div');
    div1.dataset.nick=usernick;
    div1.classList.add('user');
    div1.id="attendies-user";
    let img = document.createElement('img');
    let nick = document.createElement('span');
    img.style.marginLeft="20px";
    nick.style.paddingLeft="5px";
    if (window.innerWidth<900){
        nick.style.fontSize="9pt";
    } else {
        nick.style.fontSize="12pt";
    }
    nick.style.fontWeight="bold";

    if(level>0 && level<10){
        img.setAttribute('src','/img/level1_noonsong.png');
    }
    else if(level>=10 && level<30){
        img.setAttribute('src','/img/level2_noonsong.png');
    }
    else if (level>=30 && level < 9999){
        img.setAttribute('src','/img/level3_noonsong.png');
    }
    else if (level >= 9999){
        img.setAttribute('src','/img/master_noonsong.png');
    }
    else{
        img.setAttribute('src','/img/level1_noonsong.png');
    }

    if(level_show==0){
        nick.innerHTML+=`
        <strong>
            <span>Lv. ${level} </span><span>&nbsp;&nbsp;${usernick}</span>
        </strong>
        `;
    }
    else{
        nick.innerHTML+=`
        <strong>
            <span>Lv. ? </span><span>&nbsp;&nbsp;${usernick}</span>
        </strong>
        `;
    }

    div1.appendChild(img);
    div1.appendChild(nick);
    document.querySelector('.attendies-list').appendChild(div1); 
});

socket.on('exitRoom',(usernick)=>{
    //참가자 나감
    document.querySelector('#attendies').textContent=`참가자들 (${participant_num})`;
    let leftuser=document.querySelector(`span[data-nick='${usernick}']`);//html렌더링할 때 가져온 애
    if(leftuser){leftuser.remove();}
    let leftuser2=document.querySelector(`div[data-nick='${usernick}']`);//새로 추가한 애
    if(leftuser2){leftuser2.remove();}
    videoResize(); 
});


socket.on('removePeer', sid => {
    if (document.getElementById(sid)) {
        document.getElementById(sid).remove();
    }
    delete connections[sid];
})

sendButton.addEventListener('click', () => {
    const chatting = chatField.value;
    chatting.replaceAll(/\r/g,""); 
    
    const space1=''; const space2=' ';
    if (/*chatting!=space1 && chatting!=space2 &&*/ chatting!='\n'){
        chatField.value = "";
        const mytime=moment().format("h:mm a");
        chatRoom.scrollTop = chatRoom.scrollHeight;
        chatRoom.innerHTML += 
            `<div class="chat">
                <div class="chat-mine">
                    <div class="time time-mine">${mytime}</div>
                    <div class="sender">
                        <span class="chat-mynick">${usernick}</span>
                    </div>
                    <span class="content">
                        ${chatting}
                    </span>
                </div>
            </div>`
    
            setTimeout(function() {
                socket.emit('chat', chatting, usernick, roomid);
             }, 500);
    } else {
        chatField.value = '';
        var chatAlert = document.getElementById('chat-empty-alert');
        chatAlert.style.display="block";
        setTimeout(()=>{
            chatAlert.style.display="none";
        },1000);
    }
})

chatField.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        sendButton.click();
    }
});

const chatAlert = document.getElementById('chat-empty-alert');
chatAlert

socket.on('chat', (chatting, sendername, time) => {
    chatRoom.scrollTop = chatRoom.scrollHeight;
    if (sendername=='System'){
        chatRoom.innerHTML += 
        `<div class="chat">
            <div class="chat-system">
                <div class="sender">
                    <span class="system">${sendername}</span>
                </div>
                <span class="content" id="system-content">
                    ${chatting}
                </span>
                <br>
            </div>
        </div>`
    }
    else if (sendername != myId){
        chatRoom.innerHTML += 
       `<div class="chat">
            <div class="chat-other">
                <div class="time time-other">${time}</div>
                <div class="sender">
                    <span class="othernick">${sendername}</span>
                </div>
                <span class="content">
                    ${chatting}
                </span>
            </div>
        </div>`
    }
});

videoButt.addEventListener('click', () => {
    if (videoAllowed) {
        for (let key in videoTrackSent) {
            videoTrackSent[key].enabled = false;
        }
        videoButt.innerHTML = `<i class="fas fa-video-slash"></i>`;
        videoAllowed = 0;
        videoButt.style.backgroundColor = "#b12c2c";

        if (mystream) {
            mystream.getTracks().forEach(track => {
                if (track.kind === 'video') {
                    track.enabled = false;
                }
            })
        }
        myvideooff.style.visibility = 'visible';
        socket.emit('action', 'videooff');
    }
    else {
        for (let key in videoTrackSent) {
            videoTrackSent[key].enabled = true;
        }
        videoButt.innerHTML = `<i class="fas fa-video"></i>`;
        videoAllowed = 1;
        videoButt.style.backgroundColor = "#0067A3";
        if (mystream) {
            mystream.getTracks().forEach(track => {
                if (track.kind === 'video')
                    track.enabled = true;
            })
        }

        myvideooff.style.visibility = 'hidden';
        socket.emit('action', 'videoon');
    }
})

socket.on('action', (msg, sid) => {//남이 무엇을 했다~~는 걸 받음
    if (msg == 'videooff') {
        document.querySelector(`#vidoff${sid}`).style.visibility = 'visible';
        videoInfo[sid] = 'off';
    }
    else if (msg == 'videoon') {
        document.querySelector(`#vidoff${sid}`).style.visibility = 'hidden';
        videoInfo[sid] = 'on';
    }
    else if(msg=='filteron'){
        document.querySelector(`#video${sid}`).style.filter = 'blur(20px)';     
    }
    else if(msg=='filteroff'){
        document.querySelector(`#video${sid}`).style.filter = 'blur(0px)';    
    }
})

filterButt.addEventListener('click', () => {
    if (filterornot==0) {//1일 때 blur할 것이다
        filterButt.innerHTML = `<i class="fas fa-filter"></i>`;
        filterButt.style.backgroundColor = "#393e46";  
        filterButt.style.color = "white";
        myvideo.style.filter="blur(20px)";
        myvideo.setAttribute('filter','blur(20px)');
        socket.emit('action', 'filteron');//내가 했다고 동네방네 알려야함
        filterornot=1;
    }
    else {//필터 끌 거다
        filterButt.innerHTML = `<i class="fas fa-filter"></i>`;
        filterButt.style.backgroundColor = "#d8d8d8"; 
        filterButt.style.color = "#393e46";
        myvideo.style.filter="blur(0px)";
        myvideo.setAttribute('filter','blur(0px)');
        socket.emit('action', 'filteroff');
        filterornot=0;   
    }
})

boardButt.addEventListener('click',()=>{
    boardButt.style.backgroundColor = "#393e46";  
    boardButt.style.color = "white";
})

const openChat = document.getElementById('open-chat');
const containerRight = document.getElementById('cont-right');
const containerLeft = document.getElementById('cont-left');
const utils = document.getElementById('utils');
closeButt.addEventListener('click',()=>{
    containerRight.style.display = "none";
    containerLeft.style.width="100vw";
    openChat.style.display="flex";
    
    if (window.innerWidth >= 1500){
        utils.style.marginLeft="36%";
    } else if (window.innerWidth >= 1400 && window.innerWidth < 1500){
        utils.style.marginLeft="33%";
    } else if (window.innerWidth >= 1300 && window.innerWidth < 1400){
        utils.style.marginLeft="30%";
    } else if (window.innerWidth >=1200 && window.innerWidth < 1300){
        utils.style.marginLeft="27%";
    } else if (window.innerWidth > 900 && window.innerWidth < 1200){
        utils.style.marginLeft="0%";
    } else if (window.innerWidth >= 600 && window.innerWidth <= 900){
        utils.style.marginLeft="0%";
    } else if (window.innerWidth < 600){
        utils.style.marginLeft="0%";
    }
})

openChat.addEventListener('click',()=>{
    containerRight.style.display="block";
    containerLeft.style.width="75vw";
    openChat.style.display="none";

    if (window.innerWidth >= 1200){
        utils.style.marginLeft="25%";
    } else if (window.innerWidth >= 900 && window.innerWidth < 1200){
        utils.style.marginLeft="27%";
    } else if (window.innerWidth >= 600 && window.innerWidth < 900){
        utils.style.marginLeft="20%";
    } else if (window.innerWidth < 600){
        utils.style.marginLeft="4%";
    }
})

socket.on('filter-on', (sid) => { 
    let videos=document.getElementsByClassName('video-frame');
    let target;
    videos.forEach((video)=>{
        if(video.id==`video${sid}`){
            target=video;
        }
    })
    //필터 적용한 사람의 video찾아서 blur
        target.style.filter="blur(20px)";
        target.setAttribute('filter','blur(20px)');
    
})
socket.on('filter-off', (sid) => { 
    let videos=document.getElementsByClassName('video-frame');
    let target;
    videos.forEach((video)=>{
        if(video.id==`video${sid}`){
            target=video;
        }
    })
    target.style.filter="blur(0px)";
    target.setAttribute('filter','blur(0px)');
})
cutCall.addEventListener('click', () => {
    location.href = '/';
});
