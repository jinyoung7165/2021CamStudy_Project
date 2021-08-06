const socket = io();
let roomid;

function addBtnEvent(e) { // 방 입장 클릭 시
    if (e.target.dataset.password == 'true') {
      const password = prompt('비밀번호를 입력하세요');
      location.href = '/library/' + e.target.dataset.id + '?password=' + password;
    } else {
      location.href = '/library/' + e.target.dataset.id;
    }
    roomid = e.target.dataset.id;
}
  
document.querySelectorAll('.join-btn').forEach(function (btn) {
    btn.addEventListener('click', addBtnEvent);
});

socket.on('newRoom', function (data) { // 새 방 이벤트 시 새 방 생성
console.log("새방");
const div = document.createElement('div');
div.className='room-box';
if (data.img){
  const imgdiv = document.createElement('div');
  imgdiv.className='room-thumbnail';
  const img=document.createElement('img');
  img.setAttribute('src',`/img/${data.img}`);
  img.setAttribute('width','172px');
  imgdiv.appendChild(img);
  div.appendChild(imgdiv);
}
const div0 = document.createElement('div');
div0.textContent = data.title;
div.appendChild(div0);
const div1 = document.createElement('div');
div1.textContent = data.description;
div.appendChild(div1);
const div2 = document.createElement('div');
div2.textContent = data.participants_num+"/"+data.max;
div.appendChild(div2);
const a = document.createElement('a');
a.setAttribute('href',`/library/${data.uuid}`);
a.textContent=`http//localhost:8001/library/${data.uuid}`;
div.appendChild(a);
const div3 = document.createElement('div');
div3.textContent = data.password ? '비밀방' : '공개방';
div.appendChild(div3);
const button = document.createElement('button');
button.textContent = '입장';
button.className='join-btn'
button.dataset.password = data.password ? 'true' : 'false';
button.dataset.id = data.uuid;
button.addEventListener('click', addBtnEvent);
div.appendChild(button);
document.querySelector('.room').appendChild(div); // 화면에 추가
});
  
socket.on('removeRoom', function (data) { // 방 제거 이벤트 시 id가 일치하는 방 제거
document.querySelectorAll('.room-box').forEach(function (div) {
if (div.dataset.id == data.roomId) {
  div.parentNode.removeChild(div);
}
});
});