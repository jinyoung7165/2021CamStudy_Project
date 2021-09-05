const socket = io();
let roomid;

function addBtnEvent(e) { // 방 입장 클릭 시
  console.log(e.target.dataset.id);
  if (e.target.dataset.password == 'true') {
    const password = prompt('비밀번호를 입력하세요');
    location.href = '/library/' + e.target.dataset.id + '?password=' + password;
  } else {
    location.href = '/library/' + e.target.dataset.id;
  }
  roomid = e.target.dataset.id;
}
function addDeleteEvent(e) { // 방 입장 클릭 시
  roomid = e.target.dataset.id;
  if (confirm('정말로 삭제하시겠습니까?')==true){
    axios.delete(`/library/${roomid}`)
  } else {
    return res.render('/');
  }
}  

document.querySelectorAll('.room-enter').forEach(function (btn) {
    btn.addEventListener('click', addBtnEvent);
});
document.querySelectorAll('.room-delete').forEach(function (btn) {
  btn.addEventListener('click', addDeleteEvent);
});

socket.on('newRoom', function (data) { // 새 방 이벤트 시 새 방 생성
  const div = document.createElement('div');
  div.className='room-box';
  div.dataset.id = data.uuid;

  const divContainer = document.createElement('div');
  divContainer.className='room-box-container';  
  
  const lock = document.createElement('span');
  lock.className="roomLock";
  lock.innerHTML = data.password ? "<i class='lock fas fa-lock fa-lg'></i>" : "<i class='lock fas fa-lock-open fa-lg'></i>";
  divContainer.appendChild(lock);
  const roomT = document.createElement('span');
  roomT.textContent = data.title;
  roomT.className="roomTitle";
  divContainer.appendChild(roomT);
  const roomD= document.createElement('div');
  roomD.textContent = data.description;
  roomD.className="roomDescription";
  divContainer.appendChild(roomD);
  if (data.img){
    const imgdiv = document.createElement('div');
    imgdiv.id='room-thumbnail';
    const img=document.createElement('img');
    img.setAttribute('src',`/img/${data.img}`);
    imgdiv.appendChild(img);
    divContainer.appendChild(imgdiv);
  }
  const roomP = document.createElement('div');
  roomP.textContent = data.participants_num+"/"+data.max;
  roomP.className="roomParticipant"
  divContainer.appendChild(roomP);
  // const button = document.createElement('button');
  // button.textContent = '입장';
  // button.className='room-enter-btn'
  // button.dataset.password = data.password ? 'true' : 'false';
  // button.dataset.id = data.uuid;
  // button.addEventListener('click', addBtnEvent);
  // divContainer.appendChild(button);
  div.appendChild(divContainer);
  slideCount+=1;
  slides.style.width = (slidewidth+slideMargin) * (slideCount) - slideMargin + 'px';
  slides.appendChild(div);
});

socket.on('mainCount', function (data) {//참가자 수 바로 보이게
  document.querySelectorAll('.room-box-container').forEach(function (div) {
    if (div.children[1].textContent == data.title) {
      div.children[4].textContent=`${data.userCount}/${data.max}`;
    }
  });
});

socket.on('removeRoom', function (data) { // 방 제거 이벤트 시 id가 일치하는 방 제거
  document.querySelectorAll('.room-box').forEach(function (div) {
  if (div.dataset.id == data) {
      div.parentNode.removeChild(div);
      // 룸슬라이드 크기줄이고 카운트도 하나 줄이기
      slideCount-=1;
      slides.style.width = (slidewidth+slideMargin) * (slideCount) - slideMargin + 'px';
    }
  });
});
