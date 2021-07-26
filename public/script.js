const library = io('/library'); //library로 하면 두번뜸ㅠㅠㅠㅠ
const videoGrid = document.getElementById("video-grid");
let userId,roomId;
let url= String(document.getElementById('url').textContent);
roomId=url.split('/')[url.split('/').length - 1].replace(/\?.+/, '');
let userIds=[];
//const myPeer = new Peer({host:'peerjs-server.herokuapp.com', secure:true, port:443});
// const peerServer = ExpressPeerServer(server, {
//   debug: true,
//   port: '8001',
// });

userId=document.getElementById('userId').dataset.userid;
const myPeer=new Peer(userId);
/*const myPeer = new Peer(userId,{
  config: {
    iceServers: [
      { url: "stun:stun.l.google.com:19302" },
      { url: "stun:stun1.l.google.com:19302" },
      { url: "stun:stun2.l.google.com:19302" },
      {
        url: 'turn:numb.viagenie.ca',
        credential: 'muazkh',
        username: 'webrtc@live.com'
      },
      {
        url: 'turn:192.158.29.39:3478?transport=udp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
      },
    ],
  }
});*/
//window.peer=myPeer;
const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};

// userIds.push({roomId,myid});
// for(i in userIds){
//   if(i[0]==roomId){
//     let conn=myPeer.connect(i[1]);
//     conn.on('open',function(){
//       conn.send(myid);
//     })  
//   }
// }
let myid;
myPeer.on('open',(id) => {//내 peer열었다. id는 constructor에 전달받은 userId
    myid=myPeer.id;
    console.log('open'+myid);
    library.emit('mypeer',id);
  //userIds.push(myid);
});


library.on('join-room', function (data) {
  console.log("JOIN했다~!!!!!!");
  const userId=data.userId;
  if(!(userIds.includes(userId))){
    userIds.push(userId); 
    //console.log(idx+" :  "+userIds); 
    let conn=myPeer.connect(userId);
    // for (i in conn){
    //   console.log(i);
    // }
    //console.log(conn[0]);
    console.log("conn.peer "+conn.peer);
    // conn.on('open',function(){
    //   console.log("COONNNNNNN OPEN"+conn.id);
    //   conn.send(userId);
    // });
  }
});

myPeer.on('disconnected',function(){
  myPeer.id=userId;
  myPeer._lastServerId=userId;
  myPeer._open=true;
  console.log("disconnected~~");
  console.log(myPeer);
  myPeer.reconnect();
})  

let streamControl;
if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices
    .getUserMedia({//library접속하면 카메라 허락받음
      video: {
        frameRate: {
          min: 10,
          ideal: 25,
          max: 35,
        },
        width: {
          min: 480,
          ideal: 720,
          max: 1280,
        },
        aspectRatio: 1.33333,
      },
      audio: false,
    })
    .then(function(stream) {//브라우저에 나의 stream 추가
      streamControl = stream;
      addVideoStream(myVideo, streamControl);

      myPeer.on('call', (call) => {//상대에게서 요청이 오면
        call.answer(streamControl);//상대에게 나의 stream을 보냄
        const video = document.createElement('video');
        call.on('stream', (userVideoStream) => {//상대에게서 받은stream을 내 화면에 추가
          addVideoStream(video, userVideoStream);
        });
      });

      myPeer.on('connection', function(conn){//다른 누군가 들어오면
        //connectToNewUser(data, streamControl); 
        conn.on('data',function(data){
            console.log("CONN ON DATA"+data);//userId
            connectToNewUser(data, streamControl); //뉴비와 연결
        });
      });
      myPeer.on('user-disconnected', () => {//누가 나가면
        if (peers[userId]) peers[userId].close();
       // else peers[peerId].close();
      });//나간 사람의 stream제거,비디오제거
  })
  .catch(function (error) {
    console.log("Something went wrong!");
  });
}     

function connectToNewUser(userId, streamControl) {
  let call = myPeer.call(userId, streamControl);//뉴비에게 통화요청
  let video = document.createElement('video');
  call.on('stream', (userVideoStream) => {//뉴비의 stream받아서 화면에 추가
    addVideoStream(video, userVideoStream);
  });
  call.on('close', () => {//연결 불가 통보받으면 뉴비를 화면에서 삭제
    video.remove();
  });
  peers[userId] = call;
}

function addVideoStream(video, streamControl) {//내 화면에 추가
  video.srcObject = streamControl;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  // var random = Math.floor(Math.random() * 100000);
  // video.className = "videoElement";
  // video.id = random;
  videoGrid.append(video);
}

let isVideo = true;
function muteVideo() {
  if (streamControl != null && streamControl.getVideoTracks().length > 0) {
    isVideo = !isVideo;
    streamControl.getVideoTracks()[0].enabled = isVideo;
    if (isVideo === false) {
      document.getElementById("videoMute").style.backgroundColor =
        "rgb(255, 101, 101)";
    } else {
      document.getElementById("videoMute").style.backgroundColor = "white";
    }
  }
}

let isScreenShare = false;
async function startCapture() {
  isScreenShare = !isScreenShare;
  await navigator.mediaDevices
    .getDisplayMedia({
      cursor: true,
    })
    .then(function (stream) {
      streamControl = stream;
      const video = document.createElement("video");
      video.className = "sc_capture";
      addVideoStream(video, stream);
      stream.onended = () => {
        var shareVideo = document.getElementsByName("sc_capture");
        video.remove();
        console.info("Recording has ended");
        alert("This capture uable to see your friends!");
      };
    });
}
