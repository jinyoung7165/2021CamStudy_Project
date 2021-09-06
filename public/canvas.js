const whiteboardButt = document.querySelector('.board-icon')
const whiteboardCont = document.querySelector('.whiteboard-cont');
const canvas = document.querySelector("#whiteboard");
const ctx = canvas.getContext('2d');
const colorContainer = document.querySelector('.colors-cont');

let boardVisible = false;
let boardClick = false;

whiteboardCont.style.visibility = 'hidden';

let isDrawing = 0;
let x = 0;
let y = 0;
let color = "black";
let drawsize = 3;
let colorRemote = "black";
let drawsizeRemote = 3;



function fitToContainer(canvas) {
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

fitToContainer(canvas);

//getCanvas call is under join room call
socket.on('getCanvas', url => {
    let img = new Image();
    img.onload = start;
    img.src = url;

    function start() {
        ctx.drawImage(img, 0, 0);
    }
})

function setColor(newcolor) {
    color = newcolor;
    drawsize = 3;
}

function setEraser() {
    color = "white";
    drawsize = 15;
}

//might remove this
function reportWindowSize() {
    fitToContainer(canvas);
}

window.onresize = reportWindowSize;

function clearBoard() {
    if (window.confirm('화이트보드를 정말 지우시겠습니까?')) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        socket.emit('store canvas', canvas.toDataURL());
        socket.emit('clearBoard');
    }
    else return;
}

socket.on('clearBoard', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

function draw(newx, newy, oldx, oldy) {
    ctx.strokeStyle = color;
    ctx.lineWidth = drawsize;
    ctx.beginPath();
    ctx.moveTo(oldx, oldy);
    ctx.lineTo(newx, newy);
    ctx.stroke();
    ctx.closePath();

    socket.emit('store canvas', canvas.toDataURL());
}

function drawRemote(newx, newy, oldx, oldy) {
    ctx.strokeStyle = colorRemote;
    ctx.lineWidth = drawsizeRemote;
    ctx.beginPath();
    ctx.moveTo(oldx, oldy);
    ctx.lineTo(newx, newy);
    ctx.stroke();
    ctx.closePath();

}

canvas.addEventListener('mousedown', e => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = 1;
})

canvas.addEventListener('mousemove', e => {
    if (isDrawing) {
        draw(e.offsetX, e.offsetY, x, y);
        socket.emit('draw', e.offsetX, e.offsetY, x, y, color, drawsize);
        x = e.offsetX;
        y = e.offsetY;
    }
})

window.addEventListener('mouseup', e => {
    if (isDrawing) {
        isDrawing = 0;
    }
})

socket.on('draw', (newX, newY, prevX, prevY, color, size) => {
    colorRemote = color;
    drawsizeRemote = size;
    drawRemote(newX, newY, prevX, prevY);
})

const video = document.getElementById('vcont');
whiteboardButt.addEventListener('click', () => {
    boardClick = true;
    if (boardVisible) { //보드가 보이는 상태면
        video.style.filter = 'blur(0px)';
        whiteboardButt.style.backgroundColor = "#d8d8d8";  
        whiteboardButt.style.color = "#393e46";
        whiteboardCont.style.visibility = 'hidden';
        boardVisible = false;
    }
    else {
        video.style.filter = 'blur(20px)';
        whiteboardCont.style.visibility = 'visible';
        boardVisible = true;
    }

    if (boardClick && window.innerHeight < 570){
        colorContainer.style.width="70px";
        colorContainer.style.gridTemplateColumns="35px 35px";
    } else {
        colorContainer.style.width="32px";
        colorContainer.style.gridTemplateColumns="35px";
    }
});

window.addEventListener('resize',()=>{
    if (boardClick && window.innerHeight < 570){
        colorContainer.style.width="70px";
        colorContainer.style.gridTemplateColumns="35px 35px";
    } else {
        colorContainer.style.width="32px";
        colorContainer.style.gridTemplateColumns="35px";
    }
});