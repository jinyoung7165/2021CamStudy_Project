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
let streamControl,promise;

myPeer.on('open', (id) => {//내 peer열었다. id는 내 고유 peerId (이건 생성됨)
  console.log('open '+id);
  promise = navigator.mediaDevices.getUserMedia({//library접속하면 카메라 허락받음
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
  promise.then(function(stream) {//브라우저에 나의 stream 추가
    streamControl = stream;
    addVideoStream(myVideo, streamControl); // 내 비디오 붙여넣음  
    //myVideo 
  })
});

myPeer.on('disconnected',function(){
  console.log("reconnect!!!!");
  myPeer.reconnect();
})  

myPeer.on('call', (call) =>{//상대에게서 요청이 오면
  let caller=call;
  console.log("call: "+caller);
  call.answer(streamControl);//상대에게 나의 stream을 보냄
  const video = document.createElement('video');
  // call.on('stream', (userVideoStream) => {//상대에게서 받은stream을 내 화면에 추가
  //   addVideoStream(video, userVideoStream);
  // });
}) 

/*socket.on('user-connected', (peerId) => {//socket.js에서 user-connected를 보내면 다른사람 연결
  let newpeer=new Peer(peerId);
  console.log('user-connected '+peerId);
  newpeer.on('call', (call) => {
    navigator.mediaDevices.getUserMedia({video: true, audio: true}, (stream) => {
      call.answer(stream); // Answer the call with an A/V stream.
      const video = document.createElement('video');
      call.on('stream', (remoteStream) => {
        
        addVideoStream(video, remoteStream);
        setTimeout(connectToNewUser,3000,peerId,remoteStream);
    });
  }, (err) => {
    console.error('Failed to get local stream', err);
  });
});
})
*/
//socket 절대 바꾸지 마라📌
socket.on('user-connected', (peerId) => {//socket.js에서 user-connected를 보내면 다른사람 연결
  console.log('user-connected '+peerId);
  setTimeout(connectToNewUser,3000,peerId,streamControl); //anonymous
})


socket.on('user-disconnected', (peerId) => {//누가 나가면
  if (peers[peerId]) peers[peerId].close();
})//나간 사람의 stream제거,비디오제거

function connectToNewUser(peerId, streamControl) { // userId인 사람의 stream을 받아서 연결
  console.log("============== "+ streamControl.id);
  // for (i in streamControl){
  //   console.log(i);
  // }
  let call = myPeer.call(peerId, streamControl);  //안됨;;
  //console.log("call:" + call.peer);
  let video = document.createElement('video');   // video 생성

  // 안대. 남의 stream 못받음.
  /*call.on('stream', (userVideoStream) => {         // 뉴비의 stream받아서 화면에 추가
    console.log('streamControl: '+streamControl);
    addVideoStream(video, userVideoStream);        // 내 화면에 생성한 비디오를 추가 이때 video는 남의거()
  });*/
  /*call.on('close', () => {//연결 불가 통보받으면 뉴비를 화면에서 삭제
    video.remove();
  });*/
  peers[userId] = call;
}

function addVideoStream(video, streamControl) {  
  console.log(streamControl);
  console.log("-----------------");
  console.log(promise);  
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