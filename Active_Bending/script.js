const totalPages = 44;   // change to your page count
const imagePath = "assets/images/pages/page_";

const container = document.getElementById("pages_container");

let pages = [];
let currentPage = 0;

/* CREATE PAGES */

for(let i=1;i<=totalPages;i+=2){

const front = `${imagePath}${i}.webp`;
const back = `${imagePath}${i+1}.webp`;

const page = document.createElement("div");
page.className = "page";
page.style.zIndex = totalPages - i;

page.innerHTML = `
<div class="front_page">
<img class="front_content" src="${front}">
</div>

<div class="back_page">
<img class="back_content" src="${back}">
</div>
`;

container.appendChild(page);
pages.push(page);

}

/* NAVIGATION */

function nextPage(){

if(currentPage >= pages.length) return;

pages[currentPage].classList.add("flipped");
currentPage++;

}

function prevPage(){

if(currentPage <= 0) return;

currentPage--;
pages[currentPage].classList.remove("flipped");

}

/* CLICK LEFT / RIGHT */

document.getElementById("flip_book").addEventListener("click",(e)=>{

const rect = e.currentTarget.getBoundingClientRect();
const x = e.clientX - rect.left;

if(x > rect.width/2){
nextPage();
}else{
prevPage();
}

});

/* KEYBOARD */

document.addEventListener("keydown",(e)=>{

if(e.key==="ArrowRight") nextPage();
if(e.key==="ArrowLeft") prevPage();

});

/* TOUCH SWIPE */

let startX=0;

document.addEventListener("touchstart",(e)=>{
startX=e.touches[0].clientX;
});

document.addEventListener("touchend",(e)=>{

let diff=e.changedTouches[0].clientX-startX;

if(diff<-50) nextPage();
if(diff>50) prevPage();

});