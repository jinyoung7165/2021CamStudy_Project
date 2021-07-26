const library = io('/room'); //library로 하면 두번뜸ㅠㅠㅠㅠ client 측이라 io.of 못씀 io('/') io('/library')
const videoGrid = document.getElementById("video-grid");
let userId,roomId;
let url= String(document.getElementById('url').textContent);
roomId=url.split('/')[url.split('/').length - 1].replace(/\?.+/, ''); //HTML 뭐시기인지 확인해야함
userId=document.getElementById('userId').dataset.userid;
const myPeer = new Peer(userId);

const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};
//let pastusers=[];
//let userIds=document.querySelectorAll(".pastId");
// 자기 전에 들어간 사람은 저장이 안되고, 후에 들어온 사람만 connections에 저장됨
/*userIds.forEach(function(pastUser) {
  myPeer.connect(pastUser.dataset.pastid);
});*/
//{1:ㅁ 2:ㅠ}
myPeer.on('open', (id) => {//내 peer열었다. id는 내 고유 peerId (이건 생성됨)
  console.log('open '+id);
  
  
  //let conn = myPeer.connect(id);
  //socket.emit('user-connected',id);
  //socketio.emit("join-room", callID, nameData, id); 
});
myPeer.on('disconnected',function(){
  /*myPeer.id=lastPeerId;
  myPeer._lastServerId=lastPeerId;*/
  console.log("reconnect!!!!");
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
      addVideoStream(myVideo, streamControl); // 내 비디오 붙여넣음
      myPeer.on('call', (call) =>{//상대에게서 요청이 오면
        call.answer(streamControl);//상대에게 나의 stream을 보냄
        /*const video = document.createElement('video');
        call.on('stream', (userVideoStream) => {//상대에게서 받은stream을 내 화면에 추가
          addVideoStream(video, userVideoStream);
        });*/
      });
      socket.on('user-connected', (userId) => {//다른 누군가 들어오면
        //myPeer.connect(userId);
        console.log('user-connected '+userId);
        setTimeout(connectToNewUser,3000,userId,streamControl);
        //connectToNewUser(userId, streamControl); //뉴비와 연결
      });
      socket.on('user-disconnected', (userId) => {//누가 나가면
        if (peers[userId]) peers[userId].close();
      });//나간 사람의 stream제거,비디오제거
  })
  .catch(function (error) {
    console.log("Something went wrong!");
  });
}     

function connectToNewUser(userId, streamControl) {
  const call = myPeer.call(userId, streamControl);//뉴비에게 통화요청
  //됨 call.peer 
  const video = document.createElement('video');
  // 여기부터 안대용~~~~!
  call.on('stream', (userVideoStream) => {//뉴비의 stream받아서 화면에 추가
    console.log('streamControl: '+streamControl);
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