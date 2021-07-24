const library = io('/');
//const {library} = require('../socket.js');
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer(undefined, {
  port: '8001',
  path:'/',
});
const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};
let userId,roomId;

library.on('join',(data)=>{
  roomId=data.roomId
});
myPeer.on('open', (id) => {//나peer열었다. 나의 고유peerid
  library.to(roomId).emit('user-connected',id);
});
navigator.mediaDevices
  .getUserMedia({//library접속하면 카메라 허락받음
    video: true,
    audio: false,
  })
  .then((stream) => {//브라우저에 나의 stream 추가
    addVideoStream(myVideo, stream);

    myPeer.on('call', (call) => {//상대에게서 요청이 오면
      call.answer(stream);//상대에게 나의 stream을 보냄
      const video = document.createElement('video');
      call.on('stream', (userVideoStream) => {//상대에게서 받은stream을 내 화면에 추가
        addVideoStream(video, userVideoStream);
      });
    });
    library.on('user-connected', (userId) => {//다른 누군가 들어오면
      connectToNewUser(userId, stream); //뉴비와 연결
    });
});

library.on('user-disconnected', (userId) => {//누가 나가면
  if (peers[userId]) peers[userId].close();
});//나간 사람의 stream제거,비디오제거


function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);//뉴비에게 통화요청
  const video = document.createElement('video');
  call.on('stream', (userVideoStream) => {//뉴비의 stream받아서 화면에 추가
    addVideoStream(video, userVideoStream);
  });
  call.on('close', () => {//연결 불가 통보받으면 뉴비를 화면에서 삭제
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {//내 화면에 추가
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}