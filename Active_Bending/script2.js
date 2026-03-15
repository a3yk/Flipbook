/* =====================================================================
   GITHUB CONFIG
   ===================================================================== */
const GITHUB_USER   = 'a3yk';
const GITHUB_REPO   = 'Flipbook';
const GITHUB_BRANCH = 'main';
const GITHUB_FOLDER = 'Active_Bending/assets/images/pages';

const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${GITHUB_FOLDER}`;
const API_URL  = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${GITHUB_FOLDER}`;

/* =====================================================================
   DARK / LIGHT MODE
   ===================================================================== */
const toggleModeBtn = document.getElementById('toggle-mode-btn');
const body          = document.body;

function applyMode(mode) {
    body.classList.remove('light-mode', 'dark-mode');
    body.classList.add(mode);

    if (mode === 'dark-mode') {
        toggleModeBtn.textContent               = '☀️';
        toggleModeBtn.style.color               = 'rgb(245, 245, 245)';
    } else {
        toggleModeBtn.textContent               = '🌙';
        toggleModeBtn.style.color               = 'rgb(2, 4, 8)';
    }
}

applyMode(localStorage.getItem('mode') || 'light-mode');

toggleModeBtn.addEventListener('click', () => {
    const newMode = body.classList.contains('light-mode') ? 'dark-mode' : 'light-mode';
    applyMode(newMode);
    localStorage.setItem('mode', newMode);
});

/* =====================================================================
   RESPONSIVE SCALING
   The flipbook is designed at 298 × 420 px.
   When open, the cover flips left so the visual width becomes ~596 px.
   We compute a scale factor so the open book fits comfortably on screen.
   ===================================================================== */
function computeScale() {
    const BOOK_OPEN_W = 640;  // px — safe design width for open book + margin
    const BOOK_OPEN_H = 520;  // px — safe design height + margin

    const scaleX = window.innerWidth  / BOOK_OPEN_W;
    const scaleY = window.innerHeight / BOOK_OPEN_H;

    // Never scale above 1 (no upscaling on large screens)
    return Math.min(scaleX, scaleY, 1);
}

function applyScale() {
    const scale = computeScale();
    document.documentElement.style.setProperty('--book-scale', scale);
    return scale;
}

/* =====================================================================
   FLIPBOOK BUILDER
   ===================================================================== */
let totalPages = 0; // set after fetch, used by swipe handler

async function buildFlipbook() {
    const loadingEl = document.getElementById('loading');
    const flipBook  = document.querySelector('#flip_book');
    const main      = document.querySelector('main');
    const backCover = flipBook.querySelector('.back_cover');

    try {
        /* 1. Fetch file list from the GitHub Contents API */
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`GitHub API responded with ${res.status}`);
        const files = await res.json();

        /* 2. Filter page_N.webp and sort numerically */
        const pageImages = files
            .filter(f => /^page_\d+\.webp$/i.test(f.name))
            .sort((a, b) => {
                const n = s => parseInt(s.name.match(/\d+/)[0], 10);
                return n(a) - n(b);
            });

        if (pageImages.length === 0) {
            loadingEl.textContent = 'No page_N.webp images found in the repository folder.';
            return;
        }

        const totalImages = pageImages.length;
        totalPages = Math.ceil(totalImages / 2);

        /* 3. Inject page checkboxes before #flip_book */
        for (let i = 1; i <= totalPages; i++) {
            const cb = document.createElement('input');
            cb.type  = 'checkbox';
            cb.id    = `page${i}_checkbox`;
            main.insertBefore(cb, flipBook);
        }

        /* 4. Build page divs */
        for (let i = 1; i <= totalPages; i++) {
            const frontIdx = (i - 1) * 2;
            const backIdx  = frontIdx + 1;

            const frontSrc = pageImages[frontIdx]
                ? `${RAW_BASE}/${pageImages[frontIdx].name}`
                : null;
            const backSrc  = pageImages[backIdx]
                ? `${RAW_BASE}/${pageImages[backIdx].name}`
                : null;

            const pageDiv     = document.createElement('div');
            pageDiv.className = 'page';
            pageDiv.id        = `page${i}`;

            pageDiv.innerHTML = `
                <div class="front_page">
                    <label for="page${i}_checkbox"></label>
                    <img class="edge_shading"
                         src="./assets/images/front_page_edge_shading.webp"
                         alt="Front page edge shading">
                    ${frontSrc
                        ? `<img class="front_content" src="${frontSrc}" alt="Page ${frontIdx + 1}">`
                        : ''}
                </div>
                <div class="back_page">
                    <label for="page${i}_checkbox"></label>
                    <img class="edge_shading"
                         src="./assets/images/back_page_edge_shading.webp"
                         alt="Back page edge shading">
                    ${backSrc
                        ? `<img class="back_content" src="${backSrc}" alt="Page ${backIdx + 1}">`
                        : ''}
                </div>
            `;

            flipBook.insertBefore(pageDiv, backCover);
        }

        /* 5. Inject dynamic CSS
              translateX for the open-cover state is multiplied by --book-scale
              so the book stays centred at any screen size.              */
        const scale  = applyScale();
        const style  = document.createElement('style');
        const css    = [];

        css.push(`
            #cover_checkbox:checked ~ #flip_book {
                transform: translateX(calc(144px * var(--book-scale))) scale(var(--book-scale));
            }
            #cover_checkbox:checked ~ #flip_book .front_cover {
                transform: rotateY(-180deg);
                transition: transform 1.5s, z-index 0.5s 0.5s;
                z-index: 1;
            }
            #cover_checkbox:checked ~ #flip_book #cover {
                width: 80%;
                height: 80%;
                position: absolute;
            }
        `);

        for (let i = 1; i <= totalPages; i++) {
            const uncheckedZ = i === 1 ? totalPages + 3 : totalPages + 2 - i;
            const checkedZ   = i === totalPages ? totalPages + 4 : i + 2;

            css.push(`#page${i} { z-index: ${uncheckedZ}; }`);
            css.push(`
                #page${i}_checkbox:checked ~ #flip_book #page${i} {
                    transform: rotateY(-180deg);
                    z-index: ${checkedZ};
                }
            `);
        }

        style.textContent = css.join('\n');
        document.head.appendChild(style);

        /* 6. Hide loading indicator */
        loadingEl.classList.add('hidden');

        /* 7. Initialise swipe support (touch devices) */
        initSwipe();

        /* 8. Show swipe hint briefly on touch devices */
        showSwipeHint();

    } catch (err) {
        loadingEl.querySelector('.loading-spinner')?.remove();
        loadingEl.textContent = `⚠️  Could not load pages: ${err.message}`;
        console.error(err);
    }
}

/* =====================================================================
   SWIPE / PAGE TURN HELPERS
   ===================================================================== */

/** Returns an ordered array of all navigation checkboxes (cover + pages). */
function getAllCheckboxes() {
    const list = [document.getElementById('cover_checkbox')];
    for (let i = 1; i <= totalPages; i++) {
        list.push(document.getElementById(`page${i}_checkbox`));
    }
    return list.filter(Boolean);
}

/** Check the next unchecked checkbox (turn to next page). */
function goNext() {
    const next = getAllCheckboxes().find(cb => !cb.checked);
    if (next) next.checked = true;
}

/** Uncheck the last checked checkbox (go back one page). */
function goPrev() {
    const checked = getAllCheckboxes().filter(cb => cb.checked);
    if (checked.length > 0) checked[checked.length - 1].checked = false;
}

/* =====================================================================
   TOUCH / SWIPE DETECTION
   ===================================================================== */
function initSwipe() {
    let startX = 0;
    let startY = 0;
    const THRESHOLD = 50; // minimum px to count as a swipe

    document.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', e => {
        const dx = startX - e.changedTouches[0].clientX;
        const dy = startY - e.changedTouches[0].clientY;

        // Only trigger if the gesture is more horizontal than vertical
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > THRESHOLD) {
            if (dx > 0) {
                goNext(); // swipe left  → next page
            } else {
                goPrev(); // swipe right → previous page
            }
        }
    }, { passive: true });
}

/* =====================================================================
   SWIPE HINT
   ===================================================================== */
function showSwipeHint() {
    // Only relevant on touch devices
    if (!window.matchMedia('(hover: none)').matches) return;

    const hint = document.getElementById('swipe-hint');
    if (!hint) return;

    // Show for 2.5 s then fade out
    setTimeout(() => {
        hint.classList.add('visible');
        setTimeout(() => hint.classList.remove('visible'), 2500);
    }, 800);
}

/* =====================================================================
   RECOMPUTE SCALE ON RESIZE / ORIENTATION CHANGE
   ===================================================================== */
window.addEventListener('resize', applyScale);
window.addEventListener('orientationchange', applyScale);

/* =====================================================================
   INIT
   ===================================================================== */
applyScale();      // set scale immediately so nothing flashes at wrong size
buildFlipbook();
