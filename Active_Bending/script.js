/* =====================================================================
   GITHUB CONFIG
   ===================================================================== */
const GITHUB_USER   = 'a3yk';
const GITHUB_REPO   = 'Flipbook';
const GITHUB_BRANCH = 'main';          // change to 'master' if needed
const GITHUB_FOLDER = 'Active_Bending';

const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${GITHUB_FOLDER}`;
const API_URL  = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${GITHUB_FOLDER}`;

/* =====================================================================
   RESPONSIVE WARNING
   ===================================================================== */
const responsiveWarning = document.getElementById('responsive-warning');
// Set to true once the layout is optimised for small screens.
const responsiveDesign = false;

if (!responsiveDesign && window.innerWidth <= 768) {
    responsiveWarning.classList.add('show');
}

/* =====================================================================
   DARK / LIGHT MODE
   ===================================================================== */
const toggleModeBtn = document.getElementById('toggle-mode-btn');
const body          = document.body;

function applyMode(mode) {
    body.classList.remove('light-mode', 'dark-mode');
    body.classList.add(mode);

    if (mode === 'dark-mode') {
        toggleModeBtn.textContent              = '☀️';
        toggleModeBtn.style.color              = 'rgb(245, 245, 245)';
        responsiveWarning.style.backgroundColor = 'rgb(2, 4, 8)';
    } else {
        toggleModeBtn.textContent              = '🌙';
        toggleModeBtn.style.color              = 'rgb(2, 4, 8)';
        responsiveWarning.style.backgroundColor = 'rgb(245, 245, 245)';
    }
}

applyMode(localStorage.getItem('mode') || 'light-mode');

toggleModeBtn.addEventListener('click', () => {
    const newMode = body.classList.contains('light-mode') ? 'dark-mode' : 'light-mode';
    applyMode(newMode);
    localStorage.setItem('mode', newMode);
});

/* =====================================================================
   FLIPBOOK BUILDER
   ===================================================================== */
async function buildFlipbook() {
    const loadingEl = document.getElementById('loading');
    const flipBook  = document.querySelector('#flip_book');
    const main      = document.querySelector('main');
    const backCover = flipBook.querySelector('.back_cover');

    try {
        /* ------------------------------------------------------------------
           1. Fetch file list from the GitHub Contents API
        ------------------------------------------------------------------ */
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`GitHub API responded with ${res.status}`);
        const files = await res.json();

        /* ------------------------------------------------------------------
           2. Filter for page_N.webp and sort numerically
        ------------------------------------------------------------------ */
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
        // Each physical page div shows 2 content images (front + back).
        // An odd final image gets a blank back face.
        const totalPages = Math.ceil(totalImages / 2);

        /* ------------------------------------------------------------------
           3. Inject page checkboxes as siblings of #flip_book
              They must come BEFORE the flip_book div so that the CSS
              sibling selector  #pageN_checkbox:checked ~ #flip_book  works.
        ------------------------------------------------------------------ */
        for (let i = 1; i <= totalPages; i++) {
            const cb    = document.createElement('input');
            cb.type     = 'checkbox';
            cb.id       = `page${i}_checkbox`;
            main.insertBefore(cb, flipBook);
        }

        /* ------------------------------------------------------------------
           4. Build page <div>s and append them inside #flip_book
        ------------------------------------------------------------------ */
        for (let i = 1; i <= totalPages; i++) {
            const frontIdx = (i - 1) * 2;       // 0-based index into pageImages
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

        /* ------------------------------------------------------------------
           5. Inject dynamic CSS rules that scale with totalPages

           Z-index strategy (mirrors the original hard-coded values):

           Unchecked stacking (pages sit behind the cover, first on top):
             page 1             → totalPages + 3   (highest, sits on top)
             page i (i ≥ 2)    → totalPages + 2 − i

           Checked stacking (flipped pages stack with last-flipped on top):
             page i (i < N)    → i + 2
             page N (last)     → totalPages + 4    (extra-high, sits over cover)
        ------------------------------------------------------------------ */
        const style = document.createElement('style');
        const css   = [];

        // Cover checkbox behaviour (translateX keeps the open book centred)
        css.push(`
            #cover_checkbox:checked ~ #flip_book {
                transform: translateX(144px);
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
            // z-index when the page is NOT yet flipped
            const uncheckedZ = i === 1
                ? totalPages + 3
                : totalPages + 2 - i;

            // z-index after the page is flipped
            const checkedZ = i === totalPages
                ? totalPages + 4
                : i + 2;

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

        /* ------------------------------------------------------------------
           6. Hide the loading indicator
        ------------------------------------------------------------------ */
        loadingEl.classList.add('hidden');

    } catch (err) {
        loadingEl.querySelector('.loading-spinner')?.remove();
        loadingEl.textContent = `⚠️  Could not load pages: ${err.message}`;
        console.error(err);
    }
}

buildFlipbook();