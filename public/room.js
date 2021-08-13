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
const screenShareButt = document.querySelector('.screenshare');
const myId = document.querySelector('#my-id').value;
const filterButt=document.querySelector('.filter');
const closeButt=document.querySelector('.chat-close-butt');
const boardButt=document.querySelector('.board-icon');

let videoAllowed = 1;
let videoInfo = {};
let videoTrackReceived = {};
let filterornot=0;

let myvideooff = document.querySelector("#myvideooff");
myvideooff.style.visibility = 'hidden';

const configuration = { iceServers: [{ 
    urls:[
        "stun.l.google.com:19302",
        "stun1.l.google.com:19302",
        "stun2.l.google.com:19302",
        "stun3.l.google.com:19302",
<<<<<<< HEAD
        ] 
    }] 
}
=======
        "stun4.l.google.com:19302",
        "stun01.sipphone.com",
        "stun.ekiga.net",
        "stun.fwdnet.net",
        "stun.ideasip.com",
        "stun.iptel.org",
        "stun.rixtelecom.se",
        "stun.schlund.de",
        "stunserver.org",
        "stun.softjoys.com",
        "stun.voiparound.com",
        "stun.voipbuster.com",
        "stun.voipstunt.com",
        "stun.voxgratia.org",
        "stun.xten.com",
        "stun:stun.stunprotocol.org"] }] }
>>>>>>> 9486ec34b2538f59bfefbd25768c9c415fcc53b9
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
    console.log(textArea.value);
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

// error.js로 옮김

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
            console.log('track event fired')
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
                console.log('added local stream to peer')
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
    console.log('new candidate recieved')
    var newcandidate = new RTCIceCandidate(candidate);
    connections[sid].addIceCandidate(newcandidate)
        .catch(reportError);
}

function handleVideoAnswer(answer, sid) {
    console.log('answered the offer')
    const ans = new RTCSessionDescription(answer);
    connections[sid].setRemoteDescription(ans);
}

// 방 코드 복사 관련
copycodeButt.addEventListener('click',()=>{
    CopyClassText();
})


// 화면공유 버튼 관련
screenShareButt.addEventListener('click', () => {
    screenShareButt.style.backgroundColor = "#393e46";  
    screenShareButt.style.color = "white";
    screenShareToggle();
});
let screenshareEnabled = false;
function screenShareToggle() {
    let screenMediaPromise;
    if (!screenshareEnabled) {
        if (navigator.getDisplayMedia) {
            screenMediaPromise = navigator.getDisplayMedia({ video: true });
        } else if (navigator.mediaDevices.getDisplayMedia) {
            screenMediaPromise = navigator.mediaDevices.getDisplayMedia({ video: true });
        } else {
            screenMediaPromise = navigator.mediaDevices.getUserMedia({
                video: { mediaSource: "screen" },
            });
        }
    } else {
        screenMediaPromise = navigator.mediaDevices.getUserMedia({ video: true });
        screenShareButt.style.backgroundColor = "#d8d8d8";  
        screenShareButt.style.color = "#393e46";
    }
    screenMediaPromise
        .then((myscreenshare) => {
            screenshareEnabled = !screenshareEnabled;
            for (let key in connections) {
                const sender = connections[key]
                    .getSenders()
                    .find((s) => (s.track ? s.track.kind === "video" : false));
                sender.replaceTrack(myscreenshare.getVideoTracks()[0]);
            }
            myscreenshare.getVideoTracks()[0].enabled = true;
            const newStream = new MediaStream([
                myscreenshare.getVideoTracks()[0], 
            ]);
            myvideo.srcObject = newStream;
            myvideo.muted = true;
            mystream = newStream;
            screenShareButt.innerHTML = (screenshareEnabled 
                ? `<i class="fas fa-desktop"></i><span class="tooltiptext">Stop Share Screen</span>`
                : `<i class="fas fa-desktop"></i><span class="tooltiptext">Share Screen</span>`
            );
            myscreenshare.getVideoTracks()[0].onended = function() {
                if (screenshareEnabled) screenShareToggle();
            };
        })
        .catch((e) => {
            alert("Unable to share screen:" + e.message);
            console.error(e);
        });
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
        console.log('added all sockets to connections');
        startCall();

    }
    else {
        console.log('waiting for someone to join');
        navigator.mediaDevices.getUserMedia(mediaConstraints)
            .then(localStream => {
                myvideo.srcObject = localStream;
                myvideo.muted = true;
                mystream = localStream;
            })
            .catch(handleGetUserMediaError);
    }
})

socket.on('enterRoom',(usernick,level_show,level)=>{
    //참가자 들어옴
    console.log(usernick);
    document.querySelector('#attendies').textContent=`참가자들 (${participant_num})`;
    let div1 = document.createElement('div');
    div1.classList.add('user');
    let nick = document.createElement('span');
    if(level_show==0){
        nick.textContent=`${usernick} level: ${level}`;
    }
    else{
        nick.textContent=`${usernick} level: ?`;
    }
    //div1.setAttribute('data-nick',usernick);
    //nick.setAttribute('data-nick',usernick);
    div1.appendChild(nick);
    document.querySelector('.attendies-list').appendChild(div1); 
});
socket.on('exitRoom',(usernick)=>{
    //참가자 나감
    console.log("exitRoom");
    document.querySelector('#attendies').textContent=`참가자들 (${participant_num})`;
    let leftuser=document.querySelector(`span[data-nick='${usernick}']`);//html렌더링할 때 가져온 애
    if(leftuser){leftuser.remove();}
    let leftuser2=document.querySelector(`div[data-nick='${usernick}']`);//새로 추가한 애
    if(leftuser2){leftuser2.remove();}
});


socket.on('removePeer', sid => {
    if (document.getElementById(sid)) {
        document.getElementById(sid).remove();
    }
    delete connections[sid];
})

sendButton.addEventListener('click', () => {
    const chatting = chatField.value;
    chatField.value = '';
    const mytime=moment().format("h:mm a");

    chatRoom.scrollTop = chatRoom.scrollHeight;
    if (chatting != ""){
        chatRoom.innerHTML += 
        `<div class="chat">
            <div class="chat-mine">
                <div class="time time-mine">${mytime}</div>
                <div class="sender">
                    <span class="mynick">${usernick}</span>
                </div>
                <span class="content">
                    ${chatting}
                </span>
            </div>
        </div>`

    setTimeout(function() {
        socket.emit('chat', chatting, usernick, roomid);
         }, 500);
    }
})

chatField.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        sendButton.click();
    }
});

socket.on('chat', (chatting, sendername, time) => {
    chatRoom.scrollTop = chatRoom.scrollHeight;
    if (sendername=='System'){
        chatRoom.innerHTML += 
        `<div class="chat">
            <div class="chat-system">
                <div class="sender">
                    <span class="usernick">${sendername}</span>
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
        console.log(sid + 'turned video off');
        document.querySelector(`#vidoff${sid}`).style.visibility = 'visible';
        videoInfo[sid] = 'off';
    }
    else if (msg == 'videoon') {
        console.log(sid + 'turned video on');
        document.querySelector(`#vidoff${sid}`).style.visibility = 'hidden';
        videoInfo[sid] = 'on';
    }
    else if(msg=='filteron'){
        console.log(sid + 'filter on');
        document.querySelector(`#video${sid}`).style.filter = 'blur(20px)';     
    }
    else if(msg=='filteroff'){
        console.log(sid + 'filter off');
        document.querySelector(`#video${sid}`).style.filter = 'blur(0px)';    
    }
})

filterButt.addEventListener('click', () => {
    if (filterornot==0) {//1일 때 blur할 것이다
        filterButt.innerHTML = `<i class="fas fa-filter"></i>`;
        filterButt.style.backgroundColor = "#393e46";  
        filterButt.style.color = "white";
        console.log("켰다!!!!!~~~``");
        console.log("mysocketid"+socket.id);
        myvideo.style.filter="blur(20px)";
        myvideo.setAttribute('filter','blur(20px)');
        socket.emit('action', 'filteron');//내가 했다고 동네방네 알려야함
        console.log("emit했다");
        filterornot=1;
    }
    else {//필터 끌 거다
        filterButt.innerHTML = `<i class="fas fa-filter"></i>`;
        filterButt.style.backgroundColor = "#d8d8d8"; 
        filterButt.style.color = "#393e46";
        myvideo.style.filter="blur(0px)";
        myvideo.setAttribute('filter','blur(0px)');
        console.log("껐당!!!!!~~~``");
        socket.emit('action', 'filteroff');
        filterornot=0;   
    }
})

boardButt.addEventListener('click',()=>{
    boardButt.style.backgroundColor = "#393e46";  
    boardButt.style.color = "white";
})

closeButt.addEventListener('click',()=>{
    console.log("click!!!!!!!!!!!!!!!");
    let containerRight = document.getElementById('cont-right');
    let containerLeft = document.getElementById('cont-left');
    containerRight.style.display = "none";
    containerLeft.style.width="100vw";
})

socket.on('filter-on', (sid) => { 
    console.log("여기예요~~~~");
    let videos=document.getElementsByClassName('video-frame');
    let target;
    videos.forEach((video)=>{
        if(video.id==`video${sid}`){
            console.log('찾았다 내사랑~~');
            target=video;
        }
    })
    //필터 적용한 사람의 video찾아서 blur
        console.log(sid + 'blur');
        target.style.filter="blur(20px)";
        target.setAttribute('filter','blur(20px)');
    
})
socket.on('filter-off', (sid) => { 
    console.log("여기예요~~~~");
    let videos=document.getElementsByClassName('video-frame');
    let target;
    videos.forEach((video)=>{
        if(video.id==`video${sid}`){
            console.log('찾았다 내사랑~~');
            target=video;
        }
    })
    console.log(sid + '선명');
    target.style.filter="blur(0px)";
    target.setAttribute('filter','blur(0px)');
})
/*
function blurCam(){
    if(filterornot==0){
        myvideo.style.filter="blur(10px)";
        myvideo.setAttribute('filter','blur(20px)');
        //myvideo.setAttribute('-webkit-filter','blur(20px)');
        filterornot=1;
    }
    else{
        myvideo.style.filter="blur(0px)";
        myvideo.setAttribute('filter','blur(0px)');
        //myvideo.setAttribute('-webkit-filter','blur(0px)');
        filterornot=0;
    }

}
*/
cutCall.addEventListener('click', () => {
    location.href = '/';
})
