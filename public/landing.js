const socket = io();
let roomid;

function addBtnEvent(e) { // 방 입장 클릭 시
    if (e.target.dataset.password == 'true') {
      const password = prompt('비밀번호를 입력하세요'); // 비번 입력할때마다 자기 브라우저의 쿠키 갱신 (=> 삭제할필요없음)
      var willCookie="";
      willCookie+="pw="+password
      document.cookie=willCookie;
    } else {
      location.href = '/library/' + e.target.dataset.id;
    }
    roomid = e.target.dataset.id;
}
  
document.querySelectorAll('.room-enter-btn').forEach(function (btn) {
    btn.addEventListener('click', addBtnEvent);
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
    img.style.width="190px";
    img.style.height="140px";
    imgdiv.appendChild(img);
    divContainer.appendChild(imgdiv);
  }
  const roomP = document.createElement('div');
  roomP.textContent = data.participants_num+"/"+data.max;
  roomP.className="roomParticipant"
  divContainer.appendChild(roomP);
  const button = document.createElement('button');
  button.textContent = '입장';
  button.className='room-enter-btn'
  button.dataset.password = data.password ? 'true' : 'false';
  button.dataset.id = data.uuid;
  button.addEventListener('click', addBtnEvent);
  divContainer.appendChild(button);
  div.appendChild(divContainer);

  slideCount+=1;
  slides.style.width = (slidewidth+slideMargin) * (slideCount) - slideMargin + 'px';

  slides.appendChild(div);
  // var roomC=document.querySelectorAll('.room-box');
  // var slideCount=roomC.length+1;
  
});

socket.on('mainCount', function (data) {//참가자 수 바로 보이게
  console.log("나ㅏ간다");
  document.querySelectorAll('.room-box-container').forEach(function (div) {
    if (div.children[1].textContent == data.title) {
      div.children[4].textContent=`${data.userCount}/${data.max}`;
    }
  });
});

socket.on('removeRoom', function (data) { // 방 제거 이벤트 시 id가 일치하는 방 제거
  console.log('왜 안들어오녀구ss');
  document.querySelectorAll('.room-box').forEach(function (div) {
    console.log('왜 안들어오녀구');
  if (div.dataset.id == data) {
    div.parentNode.removeChild(div);
    // 룸슬라이드 크기줄이고 카운트도 하나 줄이기
   
    slideCount-=1;
    slides.style.width = (slidewidth+slideMargin) * (slideCount) - slideMargin + 'px';
    }
});
});
