const totalPages = 44; // Total number of pages
const imagePath = "Active_Bending/assets/images/pages/page_";

const container = document.getElementById("pages_container");
let pages = [];
let currentPage = 0;

/* ---------- CREATE PAGES ---------- */
for (let i = 1; i <= totalPages; i += 2) {
  const front = `${imagePath}${i}.webp`;
  const back = `${imagePath}${i + 1}.webp`;

  const page = document.createElement("div");
  page.className = "page";
  page.style.zIndex = totalPages - i;

  page.innerHTML = `
    <div class="front_page">
      <img class="front_content" src="${front}">
      <div class="click_zone left"></div>
      <div class="click_zone right"></div>
    </div>
    <div class="back_page">
      <img class="back_content" src="${back}">
    </div>
  `;

  container.appendChild(page);
  pages.push(page);
}

/* ---------- PAGE NAVIGATION ---------- */
function nextPage() {
  if (currentPage >= pages.length) return;
  pages[currentPage].classList.add("flipped");
  currentPage++;
}

function prevPage() {
  if (currentPage <= 0) return;
  currentPage--;
  pages[currentPage].classList.remove("flipped");
}

/* ---------- CLICK ZONES ---------- */
container.addEventListener("click", (e) => {
  if (e.target.classList.contains("click_zone")) {
    if (e.target.classList.contains("right")) nextPage();
    if (e.target.classList.contains("left")) prevPage();
  }
});

/* ---------- KEYBOARD ---------- */
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") nextPage();
  if (e.key === "ArrowLeft") prevPage();
});

/* ---------- TOUCH SWIPE ---------- */
let startX = 0;
document.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
});
document.addEventListener("touchend", (e) => {
  let diff = e.changedTouches[0].clientX - startX;
  if (diff < -50) nextPage();
  if (diff > 50) prevPage();
});