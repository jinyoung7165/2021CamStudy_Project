const library = io('/library');
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(undefined, {
  host :'/',
  port: '8001',
  secure : false,
  path:'/',
  /*config: {
    iceServers: [
      { url: "stun:stun.l.google.com:19302" },
      { url: "stun:stun1.l.google.com:19302" },
      { url: "stun:stun2.l.google.com:19302" },
    ],
  }*/
});

const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};

let userId,roomId;
let url= String(document.getElementById('url'));
roomId=url.split('/')[url.split('/').length - 1].replace(/\?.+/, ''); //HTML 뭐시기인지 확인해야함

myPeer.on('open', (id) => {//내 peer열었다. id는 내 고유 peerId (이건 생성됨)
  library.emit("join-room", id); 
});
myPeer.on('disconnected',function(){
  /*myPeer.id=lastPeerId;
  myPeer._lastServerId=lastPeerId;*/
  alert("으아아아아아아");
  console.log("bddbkddkdkd");
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
      library.on('user-connected', (peerId) => {//다른 누군가 들어오면
        connectToNewUser(peerId, streamControl); //뉴비와 연결
      });
      library.on('user-disconnected', (peerId) => {//누가 나가면
        if (peers[peerId]) peers[peerId].close();
        else peers[peerId].close();
      });//나간 사람의 stream제거,비디오제거
  })
  .catch(function (error) {
    alert(`peerid: ${peerId}  roomId: ${roomId}`);
    console.log("Something went wrong!");
  });
}     

function connectToNewUser(userId, streamControl) {
  const call = myPeer.call(userId, streamControl);//뉴비에게 통화요청
  const video = document.createElement('video');
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
  var random = Math.floor(Math.random() * 100000);
  video.className = "videoElement";
  video.id = random;
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