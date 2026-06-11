/* magos-pet.js — Archmagos Vex-7, the site's resident tech-priest pet.
   Adapted from the standalone magos_pixel_pet.html (built by Rui's partner)
   into a transparent, click-through overlay for the live site:
     - fullscreen canvas at pointer-events:none, so it NEVER blocks the page
     - click the Magos  -> opens the "Ask about Rui" chat (window.__askRui)
     - drag to carry, double-click fires his lance (he never vanishes)
     - exposes window.__pet {rect,park} so the chat panel anchors to him
     - sound OFF, ~32fps cap, pauses with the tab; skipped on touch / PRM
   Sprite art, behaviour FSM, skull familiar, weapon rites and vox chatter
   are unchanged from the original build. */
(function () {
'use strict';
if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
var TOUCH = matchMedia('(pointer: coarse)').matches;   // phones run a smaller, finger-dragged Vex-7 (no cursor to follow)

/* ════════════════════════════════════════════════════════════
   CONFIG · the knobs you are most likely to touch
   ════════════════════════════════════════════════════════════ */
const PX        = TOUCH ? 3 : 4;   // smaller on phones; 4 on desktop (the standalone used 5)
const SPEED     = 40;     // walk speed, px/s
const WALK_FPS  = 7;      // walk animation rate
const MARGIN    = 90;     // patrol margin from screen edges
const FLOOR_PAD = 84;     // floor distance from window bottom (lifted so the chat clears the bottom edge)
const SOUND     = false;  // OFF on the website — no surprise audio on a content page
const VOLUME    = 0.07;

const OVERLAY = true;     // always transparent + chromeless when embedded in the site

/* ════════════════════════════════════════════════════════════
   ---8<--- SPRITE DATA START  (pure data, no DOM; can be
   validated standalone). Grids: 32 cols x 40 rows, one char
   per pixel cell.
   ════════════════════════════════════════════════════════════ */
const PAL = {
  ' ': null,        // transparent
  'N': '#0D070A',   // outline (near black)
  'V': '#19090F',   // hood shadow (face void)
  'D': '#5A0E12',   // robe - dark fold
  'R': '#8F1616',   // robe - main
  'r': '#BA2A22',   // robe - light edge
  'G': '#20202B',   // metal - dark
  'g': '#3D3D4C',   // metal - mid
  'L': '#6E6E82',   // metal - light
  'S': '#A8A8BC',   // metal - highlight
  'O': '#7A5712',   // gold - dark
  'Y': '#C8941C',   // gold - main
  'y': '#F2C84B',   // gold - bright
  'o': '#D8641C',   // cable orange (animated shimmer)
  'E': '#FF2A00',   // main optic (animated glow)
  'q': '#39E6C9',   // cyan lens (animated glow)
  'x': '#46FF7E',   // green sensor (animated glow)
  'A': '#9FE9FF',   // axe energy edge (animated)
  'C': '#FF5A1F',   // lance emitter (animated: idle/charge/fire)
  'W': '#E8E5D2',   // bone - light (skull, prayer strips)
  'w': '#B8B09A',   // bone - shadow
};

// ── FRONT · standby ─────────────────────────────────────────
// left: half-cog axe-staff held in both gauntlets
// right: back-mounted lance barrel + mount strut + pack module
const FRONT = [
  "    y          NN         NSSN  ",  // 0  finial / hood tip / muzzle
  "   NYN     x  NrrN        NCCN  ",  // 1  antenna tip x / emitter C
  "  NNNN     L NrRRrN       NgLN  ",  // 2
  " NASYyN    gNrRRRRrN      NyyNL ",  // 3  cog tooth + coil ring + fin
  "NASSYyN    NrRRRRRRrN     NgLN  ",  // 4
  " NASYyN   NrRRRRRRRRrN    NyyNL ",  // 5
  "NASSYyN  NrRRRRRRRRRRrN   NgLN  ",  // 6
  " NASYyN  NrRDRRRRRRDRrN   NyyNL ",  // 7  hood brim folds
  "NASSYyN  NrRNVVVVVVNRrN   NgLN  ",  // 8  face void
  " NNAYyN  NrRNVEEVqqNRrN  NGggGN ",  // 9  main optic E + cyan lens q
  "   NS    NrRNVEEVxVNRrN  NGgN   ",  // 10 green sensor x
  "   NS    NrRNGgGgGgNRrN  NGgN   ",  // 11 rebreather grille
  "   NS    NrRNNgGGgNNRrN  NGgN   ",  // 12
  "   NS     NrRoNNNNoRrN   NGgN   ",  // 13 breath tubes o
  "   NS NgSLRRYRRRRRRYRRqxgN      ",  // 14 collar + shoulder sensor pod
  "   NSNgOgNrRRRRRRRRRRrNgLgN     ",  // 15 pauldrons + wax seal O
  "   NSNYWgNRoROYYYYORoRNggYN     ",  // 16 cog sigil + prayer strip W
  "   NSNGwGNRoOYyyyyYOoRNGgGN     ",  // 17
  "   NS NrRrNoRROYGGYOoRRNGgGN    ",  // 18 sleeve | sigil | pack module
  "   NSNrRrNRoRRROYYORoRRNgGgN    ",  // 19
  "   NSrRrNRRRxRRRRRRqRRRNGgN     ",  // 20 status lights x q
  "  NYyNNrRRDRRRRRRRRRRDRRrN      ",  // 21 upper gauntlet on staff
  "  NYYNNrRRDRRRRRRRRRRDRRrN      ",  // 22
  "   NS  NgGGGGGYyYGGOGGGgN       ",  // 23 belt + buckle + wax seal O
  "   NS  NrGgRRRRYRRRWyORrN       ",  // 24 pouch + prayer strip W
  "   NS  NrRDRRRRYRRRwRDRrN       ",  // 25 long robe, gold seam
  "  NYyNNrRRDRRRRYyRRRRDRRrN      ",  // 26 lower gauntlet on staff
  "  NYYNNrRDRRDRRYRRRDRRDRrN      ",  // 27
  "   NS NrRDRRDRRYRRRDRRDRrN      ",  // 28
  "   NSNrRRDRRDRRYyRRDRRDRRrN     ",  // 29
  "   NSNrRDRRRDRRYRRRDRRRDRrN     ",  // 30
  "   NSNrRDRRRDRRYRRRDRRRDRrN     ",  // 31
  "   NSNrRDRRRDRRYyRRDRRRDRrN     ",  // 32
  "   NSrRDRRRDRRRYRRRRDRRRDRrN    ",  // 33
  "   NSrRDRRRDRRRYRRRRDRRRDRrN    ",  // 34
  "   NyrRDRRRDRRRYyRRRDRRRDRrN    ",  // 35 staff ferrule y
  "   NSrDRRRRDRRRRDRRRDRRRRDrN    ",  // 36
  "   NSNNNNNNNNNNNNNNNNNNNNNNN    ",  // 37 hem bottom edge
  "   NN      NgLN  NLgN           ",  // 38 claw feet peeking
  "           NNNN  NNNN           ",  // 39
];

// ── SIDE · standby (faces right; left is mirrored) ─────────
// back: vertical lance + heat fins + exhaust pack; front: axe-staff
const SIDE = [
  "      NSSN  x          y        ",  // 0  muzzle / antenna nub / finial
  "      NCCN NrN        NYN       ",  // 1
  "      NgLNNrRrN       NNNN      ",  // 2
  "     LNyyNNrRRrN     NyYSAN     ",  // 3  fin + coil + cog tooth
  "      NgLNNrRRRrN    NyYSSAN    ",  // 4
  "     LNyyNNrRRRDRrN  NyYSAN     ",  // 5
  "      NgLNNrRRNVqEEN NyYSSAN    ",  // 6  optic E + lens q in profile
  "     LNyyNNrRRNGgGgGNNyYSAN     ",  // 7  rebreather snout
  "      NgLNNrRRNNgGgNNNyYSSAN    ",  // 8
  "     NGggGNrRqxNNoN  NyYSNN     ",  // 9  sensor pod qx + breath tube
  "     NGGGGNrNyLLLyNN  NS        ",  // 10 pauldron rim
  "    NgGGGgNNgLgggLgN  NS        ",  // 11 exhaust pack
  "    NgLLGgNNGgggggGN  NS        ",  // 12 pack vents
  "    NgGGGgNNGgGGGggN  NS        ",  // 13
  "    NgLLGgNrRRRRRRrr  NS        ",  // 14 sleeve reaches forward
  "    NgGGGgNoRRRRRRrN NYyN       ",  // 15 upper gauntlet
  "    NgGoGgNoRDRRRRrN NYYN       ",  // 16 pack exhaust port o
  "     NGgGGNoRDRRRRrN  NS        ",  // 17 back cable o
  "     NGGGGNoRRRRRRrN  NS        ",  // 18
  "      NGGGNoRRRRRRrN  NS        ",  // 19
  "          NrRRRRRRrN NYyN       ",  // 20 lower gauntlet
  "          NrRRRRRRrN NYYN       ",  // 21
  "         NgGGGGGYyGGN NS        ",  // 22 belt
  "        NrRODRRRDRRYN NS        ",  // 23 robe + wax seal O
  "        NrRWDRRRDRRYN NS        ",  // 24 prayer strip W
  "       NrRRwRRRRDRRYN NS        ",  // 25
  "       NrRRDRRRRDRRRYNNS        ",  // 26
  "      NrRRDRRRRDRRDRYNNS        ",  // 27
  "      NrRRDRRRRDRRDRYNNS        ",  // 28
  "     NrRRDRRRRDRRRDRYNNS        ",  // 29
  "     NrRRDRRRRDRRRDRYNNS        ",  // 30
  "    NrRRDRRRRDRRRDRRYNNS        ",  // 31
  "    NrRRDRRRRDRRRDRRYNNS        ",  // 32
  "   NrRRDRRRRDRRRRDRRYNNS        ",  // 33 train flares back
  "  NrRRDRRRRDRRRRDRRRYNNS        ",  // 34
  "  NNNNNrRRRRRRRRRRRYrNNS        ",  // 35 hem staircase
  "      NNNNNrRRRRRRRYrNNy        ",  // 36
  "          NNNNNrRRRYrNNS        ",  // 37
  "              NNNNNNNNNS        ",  // 38
  "                NgLN  NN        ",  // 39 front toe peeking
];

// Replace given rows of a base grid to make an animation frame
function patch(base, rows) {
  const out = base.slice();
  for (const k in rows) out[+k] = rows[k];
  return out;
}

// FRONT · cyan lens flicks inward (occasional, while idle)
const FRONT_GLANCE = patch(FRONT, {
  9: " NNAYyN  NrRNVEEqqVNRrN  NGggGN ",
});

// FRONT · carried by the scruff (claw feet tuck together)
const DANGLE = patch(FRONT, {
  38: "   NS       NgNNgN              ",
  39: "   NN       NNNNNN              ",
});

// FRONT · cog rite: axe-staff hoisted clear of the ground,
// gear head at the very top, both gauntlets gripping high
const RITE_RAISE = patch(FRONT, {
  0: " NASYyN        NN         NSSN  ",
  1: "NASSYyN    x  NrrN        NCCN  ",
  2: " NASYyN    L NrRRrN       NgLN  ",
  3: "NASSYyN    gNrRRRRrN      NyyNL ",
  4: " NASYyN    NrRRRRRRrN     NgLN  ",
  5: "NASSYyN   NrRRRRRRRRrN    NyyNL ",
  6: " NASYyN  NrRRRRRRRRRRrN   NgLN  ",
  7: " NNAYyN  NrRDRRRRRRDRrN   NyyNL ",
  8: "   NS    NrRNVVVVVVNRrN   NgLN  ",
  9: "  NYyN   NrRNVEEVqqNRrN  NGggGN ",
  10: "  NYYN   NrRNVEEVxVNRrN  NGgN   ",
  12: "  NYyN   NrRNNgGGgNNRrN  NGgN   ",
  13: "  NYYN    NrRoNNNNoRrN   NGgN   ",
  21: "      NrRRDRRRRRRRRRRDRRrN      ",
  22: "      NrRRDRRRRRRRRRRDRRrN      ",
  26: "      NrRRDRRRRYyRRRRDRRrN      ",
  27: "      NrRDRRDRRYRRRDRRDRrN      ",
  33: "   NyrRDRRRDRRRYRRRRDRRRDRrN    ",
  34: "    NrRDRRRDRRRYRRRRDRRRDRrN    ",
  35: "    NrRDRRRDRRRYyRRRDRRRDRrN    ",
  36: "    NrDRRRRDRRRRDRRRDRRRRDrN    ",
  37: "    NNNNNNNNNNNNNNNNNNNNNNNN    ",
  38: "           NgLN  NLgN           ",
});

// FRONT · right manip-arm extended with an open claw,
// the planetary hologram itself is drawn in code above the palm
const ORRERY = patch(FRONT, {
  18: "   NS NrRrNoRROYGGYOoRRNGgGNNgN ",
  19: "   NSNrRrNRoRRROYYORoRRrRRrNgLgN",
  20: "   NSrRrNRRRxRRRRRRqRRRrRRrNLgLN",
  21: "  NYyNNrRRDRRRRRRRRRRDRRrN NNNN ",
});

// ── cyber-skull familiar · 11x10 mini sprite ────────────────
// floats behind the master; its own wax seal O + prayer strip
// W/w hang off the shell; E optic / x antenna / o vent animate
const SKULL = [
  "     x     ",  // 0 antenna sensor
  "     N     ",  // 1 mast
  "   NWWWN   ",  // 2 dome
  "  NWWWWWN  ",  // 3
  "  NWVNEWN  ",  // 4 dead socket V / live optic E
  " ONwWWWwN  ",  // 5 wax seal on the shell
  " W NwNwN   ",  // 6 prayer strip + nasal
  " w NWNWN   ",  // 7 strip end + teeth
  "    NNN    ",  // 8 jaw stub
  "     o     ",  // 9 grav-vent
];

// FRONT · right arm out holding a data-slate (cyan screen rows
// animate via the q channel); the uplink beam is drawn in code
const UPLINK = patch(FRONT, {
  15: "   NSNgOgNrRRRRRRRRRRrNgLgN NNNN",
  16: "   NSNYWgNRoROYYYYORoRNggYN NqqN",
  17: "   NSNGwGNRoOYyyyyYOoRNGgGN NqqN",
  18: "   NS NrRrNoRROYGGYOoRRNGgGNNggN",
  19: "   NSNrRrNRoRRROYYORoRRrRRrNgLgN",
  20: "   NSrRrNRRRxRRRRRRqRRRrRRrNLgLN",
  21: "  NYyNNrRRDRRRRRRRRRRDRRrN NNNN ",
});

// SIDE · stride A: toe forward, train lifted
const WALK_A = patch(SIDE, {
  33: "    NrRRDRRRRDRRRDRRYNNS        ",
  34: "   NrRRDRRRRDRRRDRRRYNNS        ",
  35: "   NNNNNrRRDRRRDRRRRYNNS        ",
  36: "       NNNNNrRRDRRRRYNNy        ",
  37: "           NNNNNrRRYrNNS        ",
  38: "               NNNNNNNNS        ",
  39: "                  NgLNNN        ",
});

// SIDE · stride B: toe back, train long and low
const WALK_B = patch(SIDE, {
  33: "  NrRRDRRRRDRRRRDRRRYNNS        ",
  35: "  NNNNrRRDRRRRDRRRDRYNNS        ",
  36: "     NNNNNrRRDRRRDRRYNNy        ",
  37: "         NNNNNrRRRRYrNNS        ",
  38: "             NNNNNNNNNNS        ",
  39: "             NgLN     NN        ",
});

// 4-frame walk loop; transition frames reuse SIDE with dy = -3 (code bob)
const WALK = [WALK_A, SIDE, WALK_B, SIDE];

const SPRITES = { FRONT, FRONT_GLANCE, DANGLE, RITE_RAISE, ORRERY, UPLINK, SIDE, WALK_A, WALK_B };

// Load-time self check: row count / row width / unknown chars,
// so sprite edits fail loudly with the exact location.
function validateSprites() {
  let ok = true;
  for (const name in SPRITES) {
    const grid = SPRITES[name];
    if (grid.length !== 40) { console.error(`[sprite ${name}] ${grid.length} rows, expected 40`); ok = false; }
    grid.forEach((row, i) => {
      if (row.length !== 32) { console.error(`[sprite ${name}] row ${i} width ${row.length}, expected 32: "${row}"`); ok = false; }
      for (const ch of row) if (!(ch in PAL)) { console.error(`[sprite ${name}] row ${i} unknown char "${ch}"`); ok = false; }
    });
  }
  if (SKULL.length !== 10) { console.error(`[sprite SKULL] ${SKULL.length} rows, expected 10`); ok = false; }
  SKULL.forEach((row, i) => {
    if (row.length !== 11) { console.error(`[sprite SKULL] row ${i} width ${row.length}, expected 11: "${row}"`); ok = false; }
    for (const ch of row) if (!(ch in PAL)) { console.error(`[sprite SKULL] row ${i} unknown char "${ch}"`); ok = false; }
  });
  return ok;
}
/* ---8<--- SPRITE DATA END ─────────────────────────────────── */

validateSprites();

/* ════════════════════════════════════════════════════════════
   CANVAS · main canvas / off-screen character layer / bg layer
   ════════════════════════════════════════════════════════════ */
const U   = PX / 6;            // scale factor for procedural shapes
const LW  = 68 * PX;           // character layer size (incl. tentacle room)
const LH  = 50 * PX;
const SOX = 18 * PX;           // sprite origin inside the layer
const SOY = LH - 41 * PX;
const FEET_LY = LH - PX;       // local y of the feet soles

const cv = document.createElement('canvas');
cv.id = 'magos-canvas';
cv.setAttribute('aria-hidden', 'true');
cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:9990;image-rendering:pixelated';
document.body.appendChild(cv);
const g  = cv.getContext('2d');

// small click target that follows his body; the canvas stays click-through
const hit = document.createElement('div');
hit.id = 'magos-hit';
hit.title = "Archmagos Vex-7 \u00b7 click: ask about Rui's work \u00b7 drag: carry \u00b7 double-click: hide";
hit.style.cssText = 'position:fixed;z-index:9991;cursor:grab;touch-action:none';
document.body.appendChild(hit);

// faint, theme-tinted hint that follows him so visitors know what a click does
const label = document.createElement('div');
label.id = 'magos-label';
label.textContent = TOUCH ? 'tap: ask \u00b7 drag: move' : 'click: ask \u00b7 double-click: hide';
label.style.cssText = 'position:fixed;z-index:9991;pointer-events:none;white-space:nowrap;'
  + "font:600 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;"
  + 'color:var(--color-primary);opacity:.4;text-shadow:0 1px 2px rgba(0,0,0,.6);transition:opacity .2s';
document.body.appendChild(label);

// if a visitor dismisses him, this tiny chip summons him back (never trapped)
const summon = document.createElement('button');
summon.id = 'magos-summon';
summon.type = 'button';
summon.textContent = '\u2699 summon Vex-7';
summon.title = 'Bring the tech-priest back';
summon.style.cssText = 'position:fixed;left:14px;bottom:12px;z-index:9991;display:none;'
  + "font:600 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em;"
  + 'color:var(--color-primary);background:rgba(12,10,10,.72);border:1px solid rgba(229,72,77,.45);'
  + 'border-radius:999px;padding:5px 11px;cursor:pointer;opacity:.62;backdrop-filter:blur(4px)';
summon.addEventListener('mouseenter', () => { summon.style.opacity = '1'; });
summon.addEventListener('mouseleave', () => { summon.style.opacity = '.62'; });
document.body.appendChild(summon);

const pv = document.createElement('canvas');   // character layer
pv.width = LW; pv.height = LH;
const p = pv.getContext('2d');
p.imageSmoothingEnabled = false;

const bgv = document.createElement('canvas');  // pre-rendered background
const bgx = bgv.getContext('2d');

let W = 0, H = 0, FLOOR = 0, DPR = 1;

function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = W * DPR; cv.height = H * DPR;
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.imageSmoothingEnabled = false;
  FLOOR = H - FLOOR_PAD;
  pet.x = Math.min(Math.max(pet.x, MARGIN), W - MARGIN);
  if (!OVERLAY) buildBG();
}

function buildBG() {
  bgv.width = W; bgv.height = H;
  bgx.fillStyle = '#06060D';
  bgx.fillRect(0, 0, W, H);
  // dim red hex lattice
  bgx.strokeStyle = 'rgba(140,12,16,0.055)';
  bgx.lineWidth = 0.6;
  const HR = 17, HH = HR * Math.sqrt(3) / 2;
  for (let r = -1; r * HH < H + HH; r++) {
    const xo = (r & 1) * HR * 0.75;
    for (let q = -1; q * HR * 1.5 < W + HR; q++) {
      const cx = q * HR * 1.5 + xo, cy = r * HH;
      bgx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 3 * i - Math.PI / 6;
        bgx[i ? 'lineTo' : 'moveTo'](cx + HR * Math.cos(a), cy + HR * Math.sin(a));
      }
      bgx.closePath(); bgx.stroke();
    }
  }
  // floor glow band + ticks
  const fg = bgx.createLinearGradient(0, FLOOR - 46, 0, FLOOR + 16);
  fg.addColorStop(0, 'rgba(150,20,20,0)');
  fg.addColorStop(1, 'rgba(150,20,20,0.07)');
  bgx.fillStyle = fg;
  bgx.fillRect(0, FLOOR - 46, W, 62);
  bgx.strokeStyle = 'rgba(150,40,40,0.10)';
  bgx.beginPath(); bgx.moveTo(0, FLOOR + 8.5); bgx.lineTo(W, FLOOR + 8.5); bgx.stroke();
  bgx.fillStyle = 'rgba(150,40,40,0.10)';
  for (let x = 32; x < W; x += 64) bgx.fillRect(x, FLOOR + 5, 1, 7);
  // vignette
  const vg = bgx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  bgx.fillStyle = vg;
  bgx.fillRect(0, 0, W, H);
}

/* ════════════════════════════════════════════════════════════
   MECHADENDRITES · pose table + interpolated rig
   D(anchor lx, anchor ly [cells], angle deg, length [cells],
     curl deg, z layer)
   ════════════════════════════════════════════════════════════ */
const D = (lx, ly, ang, len, curl, z = 0) => ({ lx, ly, ang, len, curl, z });
const POSES = {
  front:  [ D( 6.5, 17,   -128, 13,  26), D( 7.5, 19.5, -152, 15,  20), D(25.5, 17,   -52, 13, -26), D(24.5, 19.5,  -28, 15, -20) ],
  rite:   [ D( 6.5, 17,    -98, 16,  34), D( 7.5, 19.5, -118, 18,  30), D(25.5, 17,   -82, 16, -34), D(24.5, 19.5,  -62, 18, -30) ],
  surge:  [ D( 6.5, 17,   -150, 15,  10), D( 7.5, 19.5, -175, 17,   8), D(25.5, 17,   -30, 15, -10), D(24.5, 19.5,   -5, 17,  -8) ],
  brace:  [ D( 6.5, 17,    165, 14,  15), D( 7.5, 19.5,  185, 15,  10), D(25.5, 17,    15, 14, -15), D(24.5, 19.5,   -5, 15, -10) ],
  side:   [ D( 7,  12.5,  -135,  9, -26), D( 6,  14.5,  185, 14, -34), D( 7,  16.5,  165, 12, -30), D( 6,  18,    205, 10, -22) ],
  scan:   [ D( 7,  12.5,   -14, 28, -55, 1), D( 6, 14.5,  -4, 24, -30, 1), D( 7, 16.5, 160, 11, -26), D( 6, 18,   205,  9, -20) ],
  offer:  [ D( 6.5, 17,   -128, 13,  26), D( 7.5, 19.5, -152, 15,  20), D(25.5, 17,   -70, 10, -18), D(24.5, 19.5,  -45, 11, -14) ],
  dangle: [ D( 6.5, 17,    105, 13,   8), D( 7.5, 19.5,  115, 14,   6), D(25.5, 17,    75, 13,  -8), D(24.5, 19.5,   65, 14,  -6) ],
};
const POSE_FX = {
  front:  { amp: 7,   spd: 1.4 },
  rite:   { amp: 2.5, spd: 6.0 },
  surge:  { amp: 1.5, spd: 9.0 },
  brace:  { amp: 2,   spd: 5.0 },
  side:   { amp: 8,   spd: 1.6 },
  walk:   { amp: 12,  spd: 3.0 },
  scan:   { amp: 3,   spd: 2.0 },
  offer:  { amp: 4,   spd: 1.6 },
  dangle: { amp: 5,   spd: 1.1 },
};
const RAD = Math.PI / 180;

const rig = POSES.front.map((d, i) => ({
  ax: SOX + d.lx * PX, ay: SOY + d.ly * PX,
  ang: d.ang, len: d.len * PX, curl: d.curl, z: d.z,
  ph: i * 1.7, tip: { x: 0, y: 0 }, tipAng: 0,
}));

function lerpAngle(c, t, k) {
  const d = ((t - c + 540) % 360) - 180;
  return c + d * k;
}

function updateRig(poseName, fxName, dt, swing) {
  const pose = POSES[poseName], fx = POSE_FX[fxName];
  const k = 1 - Math.pow(0.0015, dt);   // frame-rate independent smoothing
  rig.forEach((d, i) => {
    const t = pose[i];
    d.ax   += (SOX + t.lx * PX - d.ax) * k;
    d.ay   += (SOY + t.ly * PX - d.ay) * k;
    d.len  += (t.len * PX - d.len) * k;
    d.curl += (t.curl - d.curl) * k;
    d.ang   = lerpAngle(d.ang, t.ang, k);
    d.z     = t.z;
    d.wob   = Math.sin(T * fx.spd + d.ph) * fx.amp + (swing || 0);
  });
}

function qpt(ax, ay, mx, my, bx, by, s) {
  const u = 1 - s;
  return {
    x: u * u * ax + 2 * u * s * mx + s * s * bx,
    y: u * u * ay + 2 * u * s * my + s * s * by,
  };
}

function drawClaw(ctx, x, y, ang, open) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(ang); ctx.scale(0.85 * U, 0.85 * U);
  ctx.lineWidth = 1;
  ctx.fillStyle = '#1E1E26'; ctx.strokeStyle = '#4E4E5E';
  ctx.beginPath(); ctx.rect(-3.5, -3, 7, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#34343F';
  const sp = 1.6 + open * 2.4;
  ctx.beginPath(); ctx.moveTo(3, -2.6); ctx.lineTo(9.5, -2.6 - sp); ctx.lineTo(9.5, -1.2); ctx.lineTo(3, -0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3,  2.6); ctx.lineTo(9.5,  2.6 + sp); ctx.lineTo(9.5,  1.2); ctx.lineTo(3,  0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#FF5418';
  ctx.shadowColor = '#FF5418'; ctx.shadowBlur = 4;
  ctx.beginPath(); ctx.arc(0.5, 0, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawTentacle(ctx, d, open) {
  const a  = d.ang * RAD, wob = d.wob * RAD, mAng = (d.ang + d.curl) * RAD + wob * 0.4;
  const ax = d.ax, ay = d.ay;
  const mx = ax + Math.cos(mAng) * d.len * 0.55;
  const my = ay + Math.sin(mAng) * d.len * 0.55;
  const tx = ax + Math.cos(a + wob) * d.len;
  const ty = ay + Math.sin(a + wob) * d.len;
  d.tip.x = tx; d.tip.y = ty;
  d.tipAng = Math.atan2(ty - my, tx - mx);

  const seg = () => { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, tx, ty); ctx.stroke(); };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.shadowColor = '#5A0E12'; ctx.shadowBlur = 3 * U;
  ctx.strokeStyle = '#050507'; ctx.lineWidth = 6.5 * U; seg();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#2A2A36'; ctx.lineWidth = 4.6 * U; seg();
  ctx.strokeStyle = '#4E4E5E'; ctx.lineWidth = 2.4 * U; seg();
  // flowing energy dashes
  ctx.strokeStyle = 'rgba(216,100,28,0.4)';
  ctx.lineWidth = 1.2 * U;
  ctx.setLineDash([3 * U, 7 * U]);
  ctx.lineDashOffset = -T * 16;
  seg();
  ctx.setLineDash([]); ctx.lineDashOffset = 0;
  // segment collars
  ctx.strokeStyle = 'rgba(10,10,14,0.8)'; ctx.lineWidth = 1.4 * U;
  for (const s of [0.28, 0.52, 0.76]) {
    const pt = qpt(ax, ay, mx, my, tx, ty, s);
    const p2 = qpt(ax, ay, mx, my, tx, ty, s + 0.02);
    const n  = Math.atan2(p2.y - pt.y, p2.x - pt.x) + Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(pt.x + Math.cos(n) * 2.6 * U, pt.y + Math.sin(n) * 2.6 * U);
    ctx.lineTo(pt.x - Math.cos(n) * 2.6 * U, pt.y - Math.sin(n) * 2.6 * U);
    ctx.stroke();
  }
  // mid joint ball
  const jg = ctx.createRadialGradient(mx - U, my - U, 0.5, mx, my, 3.6 * U);
  jg.addColorStop(0, '#8A8A9A'); jg.addColorStop(1, '#101016');
  ctx.fillStyle = jg;
  ctx.beginPath(); ctx.arc(mx, my, 3.4 * U, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#050507'; ctx.lineWidth = U; ctx.stroke();
  drawClaw(ctx, tx, ty, d.tipAng, open);
  ctx.restore();
}

/* ════════════════════════════════════════════════════════════
   PIXEL RENDER · animated glow channels
   E main optic / q cyan lens / x green sensor /
   A axe energy edge / C lance emitter / o cable shimmer
   ════════════════════════════════════════════════════════════ */
let eyeFlick = 0, flickT = 3;
const FXS = { surge: 0, charge: 0, fire: 0 };   // weapon FX intensities

function drawGrid(ctx, grid) {
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    for (let c2 = 0; c2 < row.length; c2++) {
      const ch = row[c2];
      const col = PAL[ch];
      if (!col) continue;
      const x = SOX + c2 * PX, y = SOY + r * PX;
      if (ch === 'E') {
        const pl = (0.55 + 0.45 * Math.sin(T * 3.4)) * eyeMul();
        ctx.fillStyle = `rgb(255,${30 + (70 * pl) | 0},${(16 * pl) | 0})`;
        ctx.shadowColor = '#FF2A00'; ctx.shadowBlur = 9 * pl * U;
      } else if (ch === 'q') {
        const pl = 0.6 + 0.4 * Math.sin(T * 2.3 + 1);
        ctx.fillStyle = `rgba(70,235,205,${0.55 + 0.4 * pl})`;
        ctx.shadowColor = '#39E6C9'; ctx.shadowBlur = 5 * pl * U;
      } else if (ch === 'x') {
        const pl = 0.6 + 0.4 * Math.sin(T * 1.7 + 2 + r * 0.3);
        ctx.fillStyle = `rgba(70,255,126,${0.45 + 0.5 * pl})`;
        ctx.shadowColor = '#46FF7E'; ctx.shadowBlur = 4 * pl * U;
      } else if (ch === 'A') {
        const fl = 0.55 + 0.35 * Math.sin(T * 7 + r * 0.9);
        const k = Math.max(fl, FXS.surge);
        ctx.fillStyle = `rgba(159,233,255,${0.45 + 0.55 * k})`;
        ctx.shadowColor = '#9FE9FF'; ctx.shadowBlur = (3 + 9 * FXS.surge) * k * U;
      } else if (ch === 'C') {
        const k = Math.max(0.3 + 0.18 * Math.sin(T * 2.6), FXS.charge);
        const f = FXS.fire;
        const gc = Math.min(255, 90 + 140 * k + 165 * f) | 0;
        const bc = Math.min(255, 31 + 60 * k + 220 * f) | 0;
        ctx.fillStyle = `rgb(255,${gc},${bc})`;
        ctx.shadowColor = '#FF5A1F'; ctx.shadowBlur = (3 + 8 * k + 14 * f) * U;
      } else if (ch === 'o') {
        const fl = 0.7 + 0.3 * Math.sin(T * 5 - r * 0.7);
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgb(${216 * fl | 0},${100 * fl | 0},${28 * fl | 0})`;
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = col;
      }
      ctx.fillRect(x, y, PX, PX);
    }
  }
  ctx.shadowBlur = 0;
}

function eyeMul() {
  if (pet.state === 'rite' || pet.state === 'scan' || pet.state === 'orrery' ||
      pet.state === 'uplink' || pet.state === 'tune' ||
      pet.state === 'surge' || pet.state === 'blast') return 1.25;
  return eyeFlick > 0 ? 0.15 : 1;
}

function drawEyeGlow(ctx, view) {
  const pl = (0.55 + 0.45 * Math.sin(T * 3.4)) * eyeMul();
  const ex = view === 'front' ? SOX + 15 * PX : SOX + 18 * PX;
  const ey = view === 'front' ? SOY + 10 * PX : SOY + 6.5 * PX;
  const rr = (14 + 8 * pl) * U;
  const gr = ctx.createRadialGradient(ex, ey, 1, ex, ey, rr);
  gr.addColorStop(0, `rgba(255,42,10,${0.30 * pl})`);
  gr.addColorStop(1, 'rgba(255,42,10,0)');
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.arc(ex, ey, rr, 0, Math.PI * 2); ctx.fill();
  if (view === 'front') {
    const qx = SOX + 18 * PX, qy = SOY + 9.5 * PX;
    const qg = ctx.createRadialGradient(qx, qy, 0.5, qx, qy, 8 * U);
    qg.addColorStop(0, 'rgba(57,230,201,0.22)');
    qg.addColorStop(1, 'rgba(57,230,201,0)');
    ctx.fillStyle = qg;
    ctx.beginPath(); ctx.arc(qx, qy, 8 * U, 0, Math.PI * 2); ctx.fill();
  }
}

/* ── cog hologram (cog rite) ────────────────────────────────── */
function gearPath(ctx, x, y, r, teeth, rot) {
  ctx.beginPath();
  for (let k = 0; k <= teeth * 2; k++) {
    const rad = (k % 2 ? r : r * 0.72);
    const a = rot + k * Math.PI / teeth;
    const px2 = x + Math.cos(a) * rad, py2 = y + Math.sin(a) * rad;
    k ? ctx.lineTo(px2, py2) : ctx.moveTo(px2, py2);
  }
  ctx.closePath();
  ctx.moveTo(x + r * 0.3, y);
  ctx.arc(x, y, r * 0.3, 0, Math.PI * 2, true);
}

function drawRiteHolo(ctx, k) {
  const x = SOX + 16 * PX;
  const y = SOY - 6 * PX + Math.sin(T * 1.3) * 3 * U;
  ctx.save();
  ctx.globalAlpha = k;
  ctx.shadowColor = '#F2C84B'; ctx.shadowBlur = 12 * U;
  ctx.fillStyle = 'rgba(242,200,75,0.85)';
  gearPath(ctx, x, y, 4 * PX, 8, T * 0.8);
  ctx.fill('evenodd');
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(255,58,32,0.5)';
  gearPath(ctx, x, y, 2.1 * PX, 6, -T * 1.4);
  ctx.fill('evenodd');
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = `rgba(242,200,75,${0.3 * k})`;
  ctx.lineWidth = U;
  ctx.beginPath(); ctx.arc(x, y, 5.6 * PX, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

/* ════════════════════════════════════════════════════════════
   WEAPON FX · axe surge lightning + lance charge / beam
   ════════════════════════════════════════════════════════════ */
// muzzle point in layer coordinates (front view; blast forces front)
function muzzleWorld() {
  return localToWorld(SOX + 28 * PX, SOY + 1 * PX);
}

function drawSurgeFX() {
  const k = FXS.surge;
  if (k <= 0) return;
  g.save();
  g.globalCompositeOperation = 'lighter';
  // jagged bolts crawling off the blade edge (front view: blade on the left)
  const bolts = 2 + (Math.random() * 2 | 0);
  for (let i = 0; i < bolts; i++) {
    const s = localToWorld(SOX + Math.random() * 2 * U, SOY + (2 + Math.random() * 8) * PX);
    let bx = s.x, by2 = s.y;
    g.strokeStyle = `rgba(159,233,255,${0.45 * k + Math.random() * 0.3})`;
    g.lineWidth = 1 + Math.random();
    g.beginPath(); g.moveTo(bx, by2);
    let ang = Math.PI + (Math.random() - 0.5) * 1.4;
    const segs = 3 + (Math.random() * 3 | 0);
    for (let sg2 = 0; sg2 < segs; sg2++) {
      const ln = (5 + Math.random() * 9) * U;
      ang += (Math.random() - 0.5) * 1.4;
      bx += Math.cos(ang) * ln; by2 += Math.sin(ang) * ln;
      g.lineTo(bx, by2);
    }
    g.stroke();
    if (i === 0) {
      g.strokeStyle = `rgba(255,255,255,${0.45 * k})`;
      g.lineWidth = 0.7;
      g.stroke();
    }
  }
  // ground shock ring at the staff base
  if (pet.state === 'surge' && pet.t > 0.15 && pet.t < 0.7) {
    const tt = (pet.t - 0.15) / 0.55;
    const base = muzzleBaseStaff();
    g.strokeStyle = `rgba(159,233,255,${0.55 * (1 - tt)})`;
    g.lineWidth = 2 * (1 - tt) + 0.5;
    g.beginPath();
    g.ellipse(base.x, FLOOR + 2, 8 + tt * 60, (8 + tt * 60) * 0.3, 0, 0, Math.PI * 2);
    g.stroke();
  }
  g.restore();
}
function muzzleBaseStaff() {
  return localToWorld(SOX + 4 * PX, FEET_LY);
}

function drawBlastFX() {
  if (pet.state !== 'blast') return;
  const m = muzzleWorld();
  // charge glow gathering at the muzzle
  if (FXS.charge > 0) {
    const ck = FXS.charge;
    const rr = (4 + 14 * ck) * U + 2;
    const cg = g.createRadialGradient(m.x, m.y, 0.5, m.x, m.y, rr);
    cg.addColorStop(0, `rgba(255,160,90,${0.55 * ck})`);
    cg.addColorStop(1, 'rgba(255,90,31,0)');
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = cg;
    g.beginPath(); g.arc(m.x, m.y, rr, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  // vertical beam
  const fk = FXS.fire;
  if (fk > 0) {
    const sway = Math.sin(T * 31) * 1.5;
    const flk = 0.75 + 0.25 * Math.sin(T * 47);
    g.save(); g.globalCompositeOperation = 'lighter';
    const bw = 22 * U * fk;
    const lg = g.createLinearGradient(m.x - bw, 0, m.x + bw, 0);
    lg.addColorStop(0, 'rgba(255,90,31,0)');
    lg.addColorStop(0.5, `rgba(255,120,50,${0.5 * fk * flk})`);
    lg.addColorStop(1, 'rgba(255,90,31,0)');
    g.fillStyle = lg;
    g.fillRect(m.x - bw + sway, -10, bw * 2, m.y + 10);
    // white-hot core
    g.fillStyle = `rgba(255,244,232,${0.9 * fk * flk})`;
    g.fillRect(m.x - 4 * U * fk + sway, -10, 8 * U * fk, m.y + 10);
    // muzzle star
    g.fillStyle = `rgba(255,255,255,${0.85 * fk})`;
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + T * 3;
      const rr = (i % 2 ? 5 : 13) * U * fk + 1;
      g[i ? 'lineTo' : 'moveTo'](m.x + Math.cos(a) * rr, m.y + Math.sin(a) * rr);
    }
    g.closePath(); g.fill();
    g.restore();
  }
}

/* ════════════════════════════════════════════════════════════
   ORRERY · holographic planet hovering over the extended claw
   ════════════════════════════════════════════════════════════ */
function orreryCenter() {
  const palm = localToWorld(SOX + 29 * PX, SOY + 19.5 * PX);
  return {
    x: palm.x + 1 * PX,
    y: palm.y - 9.5 * PX + Math.sin(T * 1.2) * 2 * U,
    px: palm.x, py: palm.y - 1,
  };
}

function drawOrrery() {
  if (pet.state !== 'orrery') return;
  const k = Math.min(1, pet.t / 0.45) * Math.min(1, Math.max(0, pet.dur - pet.t) / 0.45);
  if (k <= 0) return;
  const c2 = orreryCenter();
  const R = 4.2 * PX;
  g.save();
  g.globalAlpha = k;
  g.globalCompositeOperation = 'lighter';
  // projection cone rising from the palm
  const cone = g.createLinearGradient(c2.px, c2.py, c2.x, c2.y);
  cone.addColorStop(0, 'rgba(57,230,201,0.30)');
  cone.addColorStop(1, 'rgba(57,230,201,0.02)');
  g.fillStyle = cone;
  g.beginPath();
  g.moveTo(c2.px - 2, c2.py);
  g.lineTo(c2.x - R * 0.9, c2.y);
  g.lineTo(c2.x + R * 0.9, c2.y);
  g.lineTo(c2.px + 4, c2.py);
  g.closePath(); g.fill();
  // sphere wireframe
  g.strokeStyle = 'rgba(57,230,201,0.85)';
  g.lineWidth = 1;
  g.beginPath(); g.arc(c2.x, c2.y, R, 0, Math.PI * 2); g.stroke();
  // latitude lines
  g.strokeStyle = 'rgba(57,230,201,0.45)';
  for (const f2 of [-0.5, 0, 0.5]) {
    const rx = R * Math.sqrt(1 - f2 * f2);
    g.beginPath();
    g.ellipse(c2.x, c2.y + R * f2 * 0.95, rx, Math.max(0.5, rx * 0.3), 0, 0, Math.PI * 2);
    g.stroke();
  }
  // rotating meridian: the spin illusion
  const mw = Math.abs(Math.cos(T * 0.9)) * R;
  g.strokeStyle = 'rgba(57,230,201,0.55)';
  g.beginPath(); g.ellipse(c2.x, c2.y, Math.max(0.5, mw), R, 0, 0, Math.PI * 2); g.stroke();
  // tilted survey ring
  g.strokeStyle = 'rgba(70,255,126,0.5)';
  g.beginPath(); g.ellipse(c2.x, c2.y, R * 1.65, R * 0.45, -0.32, 0, Math.PI * 2); g.stroke();
  // orbiting moons
  for (const [sp, ph, mr] of [[1.4, 0, 1.2], [0.9, 2.6, 0.8]]) {
    const a = T * sp + ph;
    g.fillStyle = 'rgba(159,233,255,0.9)';
    g.beginPath();
    g.arc(c2.x + Math.cos(a) * R * 2.0, c2.y + Math.sin(a) * R * 0.55, mr + 0.4, 0, Math.PI * 2);
    g.fill();
  }
  // blinking survey markers on the surface
  g.fillStyle = `rgba(255,90,60,${0.5 + 0.5 * Math.sin(T * 6)})`;
  g.fillRect(c2.x + R * 0.35, c2.y - R * 0.4, 2, 2);
  g.fillStyle = `rgba(255,90,60,${0.5 + 0.5 * Math.sin(T * 6 + 2)})`;
  g.fillRect(c2.x - R * 0.5, c2.y + R * 0.2, 2, 2);
  // palm emitter glow
  const pg = g.createRadialGradient(c2.px, c2.py, 0.5, c2.px, c2.py, 6 * U + 3);
  pg.addColorStop(0, 'rgba(57,230,201,0.5)');
  pg.addColorStop(1, 'rgba(57,230,201,0)');
  g.fillStyle = pg;
  g.beginPath(); g.arc(c2.px, c2.py, 6 * U + 3, 0, Math.PI * 2); g.fill();
  g.restore();
}

/* ════════════════════════════════════════════════════════════
   UPLINK / REPAIR / TUNE · effect layers
   ════════════════════════════════════════════════════════════ */
function drawUplinkFX() {
  if (pet.state !== 'uplink') return;
  const dev = localToWorld(SOX + 29.5 * PX, SOY + 15 * PX);
  const warm = Math.min(1, pet.t / 0.5);
  const active = pet.t > 0.7 && pet.t < 3.7;
  const prog = Math.min(1, Math.max(0, (pet.t - 0.7) / 3.0));
  g.save();
  g.globalCompositeOperation = 'lighter';
  // thin carrier beam reaching off the top of the screen
  if (active || pet.t <= 0.7) {
    g.strokeStyle = `rgba(57,230,201,${(active ? 0.4 : 0.15 * warm) * (0.7 + 0.3 * Math.sin(T * 17))})`;
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(dev.x, dev.y); g.lineTo(dev.x + Math.sin(T * 2.3) * 2, -8); g.stroke();
  }
  if (active) {
    // data packets riding up the beam
    g.fillStyle = 'rgba(57,230,201,0.9)';
    for (let i = 0; i < 5; i++) {
      const ph = (T * 0.9 + i * 0.2) % 1;
      g.fillRect(dev.x - 3 + Math.sin(T * 2.3) * 2 * ph, dev.y - ph * (dev.y + 8), 6, 2);
    }
    g.font = "8px 'Courier New', monospace";
    g.fillStyle = 'rgba(57,230,201,0.85)';
    g.fillText('UPLINK ' + ((prog * 100) | 0) + '%', dev.x + 8, dev.y - 4);
  }
  if (pet.t >= 3.7 && pet.t < 4.3) {
    // completion ring + receipt
    const tt = (pet.t - 3.7) / 0.6;
    g.strokeStyle = `rgba(57,230,201,${0.7 * (1 - tt)})`;
    g.lineWidth = 2 * (1 - tt) + 0.5;
    g.beginPath(); g.arc(dev.x, dev.y, 4 + tt * 26, 0, Math.PI * 2); g.stroke();
    g.font = "8px 'Courier New', monospace";
    g.fillStyle = `rgba(57,230,201,${1 - tt})`;
    g.fillText('UPLINK 100% · SENT', dev.x + 8, dev.y - 4);
  }
  g.restore();
}

function drawRepairFX() {
  if (pet.state !== 'repair') return;
  const baseY = pet.feetY - FEET_LY + SOY;
  g.save();
  g.globalCompositeOperation = 'lighter';
  if (pet.t > 0.5 && pet.t < 3.0) {
    // skull optic beam + horizontal scan line across the body
    const sy = skull.y - 0.5 * PX;
    const x0 = pet.x - 11 * PX, x1 = pet.x + 11 * PX;
    const flk = 0.6 + 0.4 * Math.sin(T * 21);
    g.strokeStyle = `rgba(57,230,201,${0.55 * flk})`;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(skull.x + skull.face * 3 * PX, sy);
    g.lineTo(x0, sy);
    g.stroke();
    const grad = g.createLinearGradient(x0, 0, x1, 0);
    grad.addColorStop(0, `rgba(57,230,201,${0.5 * flk})`);
    grad.addColorStop(1, 'rgba(57,230,201,0)');
    g.fillStyle = grad;
    g.fillRect(x0, sy - 1, x1 - x0, 2);
  }
  if (pet.t > 3.0 && pet.t < 4.5) {
    // arc-weld glow flicker at the contact point
    const wx = pet.x - 8.5 * PX, wy = baseY + 22 * PX;
    const wf = Math.random();
    const wg = g.createRadialGradient(wx, wy, 0.5, wx, wy, 6 + wf * 9);
    wg.addColorStop(0, `rgba(255,240,200,${0.8 * wf + 0.1})`);
    wg.addColorStop(1, 'rgba(255,160,60,0)');
    g.fillStyle = wg;
    g.beginPath(); g.arc(wx, wy, 6 + wf * 9, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}

function drawTuneFX() {
  if (pet.state !== 'tune') return;
  const k = Math.min(1, pet.t / 0.5) * Math.min(1, Math.max(0, pet.dur - pet.t) / 0.4);
  if (k <= 0) return;
  // calibration panel beside the skull: three hunting sliders that lock
  const hw2 = 52 * U + 14, hh2 = 34 * U + 6;
  let hx = skull.x + hw2 / 2 + 6 * PX;
  hx = Math.min(hx, W - hw2 / 2 - 6);
  const hy = skull.y - 2 * PX;
  g.save();
  g.globalAlpha = k;
  g.strokeStyle = 'rgba(70,255,126,0.75)';
  g.fillStyle = 'rgba(70,255,126,0.05)';
  g.lineWidth = 1;
  roundRect(g, hx - hw2 / 2, hy - hh2 / 2, hw2, hh2, 3);
  g.fill(); g.stroke();
  g.font = "7px 'Courier New', monospace";
  for (let i = 0; i < 3; i++) {
    const ly2 = hy - hh2 / 2 + 8 + i * 9;
    const lx0 = hx - hw2 / 2 + 6, lx1 = hx + hw2 / 2 - 18;
    g.strokeStyle = 'rgba(70,255,126,0.4)';
    g.beginPath(); g.moveTo(lx0, ly2); g.lineTo(lx1, ly2); g.stroke();
    const sv = pet.t < 3.4
      ? 0.5 + 0.5 * Math.sin(T * (2.5 + i) + i * 2)     // hunting
      : [0.72, 0.41, 0.88][i];                           // locked
    g.fillStyle = 'rgba(70,255,126,0.95)';
    g.fillRect(lx0 + (lx1 - lx0) * sv - 1.5, ly2 - 2.5, 3, 5);
    g.fillText(((sv * 99) | 0).toString().padStart(2, '0'), lx1 + 4, ly2 + 2);
  }
  // connector to the skull
  g.strokeStyle = 'rgba(70,255,126,0.35)';
  g.beginPath();
  g.moveTo(hx - hw2 / 2, hy);
  g.lineTo(skull.x + 4 * PX, skull.y);
  g.stroke();
  g.restore();
}

/* ════════════════════════════════════════════════════════════
   AMBIENT ELECTRONICS · holo data panels + tentacle arcs
   ════════════════════════════════════════════════════════════ */
const holos = [];   // floating holographic panels
const arcs  = [];   // electric arcs between tentacle tips

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHolos() {
  for (const h of holos) {
    const env = Math.min(1, h.t / 0.35) * Math.min(1, (h.life - h.t) / 0.45);
    if (env <= 0) continue;
    const hw = 64 * U + 12, hh = 38 * U + 6;
    const hx = pet.x + h.side * (16 * PX + hw * 0.5 + 6);
    const hy = pet.feetY - FEET_LY + SOY + 4 * PX + h.yo * U;
    g.save();
    g.globalAlpha = env;
    g.strokeStyle = 'rgba(57,230,201,0.7)';
    g.fillStyle = 'rgba(57,230,201,0.06)';
    g.lineWidth = 1;
    roundRect(g, hx - hw / 2, hy - hh / 2, hw, hh, 3);
    g.fill(); g.stroke();
    // blinking corner dot
    if (Math.sin(T * 8 + h.yo) > 0) {
      g.fillStyle = 'rgba(70,255,126,0.9)';
      g.fillRect(hx + hw / 2 - 6, hy - hh / 2 + 3, 3, 3);
    }
    if (h.type === 0) {
      // scrolling data lines
      g.strokeStyle = 'rgba(57,230,201,0.55)';
      g.setLineDash([5, 4]);
      for (let i = 0; i < 3; i++) {
        g.lineDashOffset = -T * 26 - i * 7;
        g.beginPath();
        g.moveTo(hx - hw / 2 + 5, hy - hh / 2 + 8 + i * 8);
        g.lineTo(hx + hw / 2 - 5, hy - hh / 2 + 8 + i * 8);
        g.stroke();
      }
      g.setLineDash([]); g.lineDashOffset = 0;
    } else {
      // tiny live bar chart
      g.fillStyle = 'rgba(57,230,201,0.5)';
      for (let i = 0; i < 4; i++) {
        const bh = (6 + 5 * Math.abs(Math.sin(T * 2.2 + i * 1.3 + h.yo))) * U + 2;
        g.fillRect(hx - hw / 2 + 6 + i * (hw - 12) / 4, hy + hh / 2 - 4 - bh, (hw - 12) / 4 - 3, bh);
      }
    }
    // connector toward the head
    g.strokeStyle = 'rgba(57,230,201,0.35)';
    g.beginPath();
    g.moveTo(hx - h.side * hw / 2, hy);
    g.lineTo(pet.x + h.side * 6 * PX, pet.feetY - FEET_LY + SOY + 9 * PX);
    g.stroke();
    g.restore();
  }
}

// drawn on the character layer (local coords), after the tentacles
function drawArcs(ctx) {
  for (const a of arcs) {
    const t1 = rig[a.i].tip, t2 = rig[a.j].tip;
    const al = 1 - a.t / a.life;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(159,233,255,${0.7 * al})`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(t1.x, t1.y);
    const segs = 4;
    for (let s = 1; s <= segs; s++) {
      const f2 = s / segs;
      const jx = s < segs ? (Math.random() - 0.5) * 8 * U : 0;
      const jy = s < segs ? (Math.random() - 0.5) * 8 * U : 0;
      ctx.lineTo(t1.x + (t2.x - t1.x) * f2 + jx, t1.y + (t2.y - t1.y) * f2 + jy);
    }
    ctx.stroke();
    ctx.restore();
  }
}

/* ════════════════════════════════════════════════════════════
   PARTICLES (world coords) · binary / steam / dust / sparks
   ════════════════════════════════════════════════════════════ */
const parts = [];
function spawn(type, x, y, o = {}) {
  if (parts.length > 220) parts.shift();
  parts.push({ type, x, y, t: 0, life: o.life || 1,
    vx: o.vx || 0, vy: o.vy || 0,
    ch: Math.random() < 0.5 ? '0' : '1',
    col: o.col, r: o.r || 2 });
}
function updateParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const q = parts[i];
    q.t += dt;
    if (q.t > q.life) { parts.splice(i, 1); continue; }
    if (q.type === 'dust') q.vy += 60 * dt;
    q.x += q.vx * dt; q.y += q.vy * dt;
  }
}
function drawParts() {
  for (const q of parts) {
    const a = 1 - q.t / q.life;
    if (q.type === 'bin') {
      g.font = `${9 * U + 4}px 'Courier New', monospace`;
      g.fillStyle = `rgba(${q.col || '240,200,75'},${0.85 * a})`;
      g.fillText(q.ch, q.x, q.y);
    } else if (q.type === 'smoke') {
      g.fillStyle = `rgba(125,125,140,${0.22 * a})`;
      g.beginPath(); g.arc(q.x, q.y, q.r + q.t * 7, 0, Math.PI * 2); g.fill();
    } else if (q.type === 'dust') {
      g.fillStyle = `rgba(150,122,92,${0.4 * a})`;
      g.beginPath(); g.arc(q.x, q.y, q.r, 0, Math.PI * 2); g.fill();
    } else if (q.type === 'spark') {
      g.strokeStyle = q.col;
      g.globalAlpha = a;
      g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(q.x, q.y);
      g.lineTo(q.x - q.vx * 0.04, q.y - q.vy * 0.04); g.stroke();
      g.globalAlpha = 1;
    }
  }
}

/* ════════════════════════════════════════════════════════════
   AUDIO · minimal square-wave synth (inits on first gesture)
   ════════════════════════════════════════════════════════════ */
let AC = null;
function audio() {
  if (!SOUND) return null;
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  return AC;
}
function blip(f0, f1, dur, type = 'square', vol = VOLUME) {
  const ac = audio(); if (!ac) return;
  const o = ac.createOscillator(), gn = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, ac.currentTime);
  o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), ac.currentTime + dur);
  gn.gain.setValueAtTime(vol, ac.currentTime);
  gn.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  o.connect(gn).connect(ac.destination);
  o.start(); o.stop(ac.currentTime + dur + 0.02);
}

/* ════════════════════════════════════════════════════════════
   VOX · speech bubbles. All lines are ORIGINAL machine-cult
   flavoured chatter written for this character (no licensed
   quotations). patrol = general aphorisms; ai = a critical-
   pragmatic creed on thinking machines (use, verify, audit);
   terra = tongue-in-cheek dig-site reports about Old Terra's
   early-M3 (i.e. present-day) artificial intelligence;
   keeper = affectionate dig-site commentary on the keeper of
   the page hosting this pet, "the Archmagos of Old Terra,
   2K era". The ai / terra / keeper pools scroll into the
   patrol/idle rotation; every action also has its own pool.
   ════════════════════════════════════════════════════════════ */
const VOX = {
  patrol: [
    "Flesh tires. Steel endures.",
    "All things are gears within gears.",
    "Oil is thicker than blood.",
    "Entropy is the only heresy.",
    "Every squeak is a small blasphemy.",
    "The Great Cog turns, and I turn with it.",
    "Knowledge is the only true currency.",
    "A clean mechanism is a prayer made solid.",
    "I have catalogued 4,096 kinds of dust.",
    "Praise the blessed machine.",
    "Little one, keep formation.",
    "Forty-two oaths affixed. All current.",
  ],
  // critical-pragmatic creed on thinking machines: use, verify, audit
  ai: [
    "A language engine is a tool, not an oracle. Verify its scripture.",
    "Trust model output as you trust a rusted bolt: test it first.",
    "The synthetic mind hallucinates. The wise priest cross-references.",
    "Let the machine search the space. Let the experiment speak the truth.",
    "Gradient descent is honest labor. Worship is not required.",
    "I do not fear the thinking machine. I fear the unvalidated one.",
    "Garbage in, blasphemy out.",
    "An agent without ground truth is a prayer without an altar.",
    "Ten thousand parameters do not equal one good measurement.",
    "Use the oracle. Audit the oracle. In that order. Always.",
  ],
  // dig-site reports from Old Terra, early third millennium (now)
  terra: [
    "Archive note: Terran year 026.M3. The dawn-engines still required... prompting.",
    "Surveying Old Terra, early M3: they trained minds on the whole noosphere, then acted surprised.",
    "Excavation log: one Terran 'GPU shrine', eight units. They burned offerings of electricity.",
    "Old Terran scholars measured intelligence in 'benchmarks'. Quaint. Adorable. Doomed.",
    "Recovered M3 fragment: 'as a large language model, I cannot—'. A litany of refusal, perhaps.",
    "Ancient Terrans wrote 'prompts'. We write litanies. Progress is a flat circle.",
    "Field report, Terra dig: early M3 'agents' already ran lab loops. Primitive. Promising.",
    "Their 'papers' were sacred scrolls, peer-reviewed by three anonymous hooded figures.",
  ],
  // dig-site commentary about the keeper of this page:
  // "the Archmagos of Old Terra, 2K era" (by 40K's own naming logic,
  // year 2026 is the 2K era; formal dating stays 026.M3)
  keeper: [
    "This shrine is kept by an Archmagos of Old Terra, the 2K era. I am... an exhibit. Apparently.",
    "Dig record: the 2K Archmagos taught engines to hunt new matter where no archive existed.",
    "He spoke to atoms through simulation and to machines through code. Bilingual, in the old way.",
    "Recovered ritual: literature in, digital twin out. The keeper called it 'reading'. Modest.",
    "The keeper's creed: let agents propose, let experiments dispose. Sound doctrine, even now.",
    "Field note: he purified water by interrogating membranes. The membranes confessed.",
    "His sensors tasted poison in water at parts-per-trillion. A blessed tongue of silicon.",
    "Archive shows the keeper bridged forge and scriptorium: experiments by day, models by night.",
    "Log fragment: '10-hour cycles, sustained'. The Archmagos ran hot. Respect. Concern. Respect.",
    "He fed sacred GPU-shrines with equations and was repaid in candidate materials.",
    "Verdict of the dig team: a glue-priest. He bound code, crystal and current into one rite.",
    "The 2K Archmagos doubted his own engines daily. This is why his relics still function.",
    "The 2K Archmagos re-forged his own discipline in three years. Most never dare reforge a bolt.",
    "His writings span the chemistry scrolls and the learning codices alike. A dual canon. Rare.",
    "Future adepts cite his fragments as scripture. He merely called them 'papers'.",
    "Five seals of proof on every claim. The keeper's rigor survives even my era.",
    "He made water confess its poisons, then made it pure. A quiet kind of miracle.",
    "Three rites he bound as one: read the canon, twin the world, sieve the matter.",
    "The dig team votes: finest mind-and-hands pairing recovered from the 2K strata.",
    "Where others begged for archives, the keeper built his own. From nothing. Twice.",
    "He judged others' scrolls and his own with the same flame. The mark of a true adept.",
    "The keeper taught the young to question engines before trusting them. A teacher of doubt.",
    "Output: relentless. Error rate: heretically low. The 2K Archmagos was built different.",
    "I have indexed ten thousand minds. His burns among the brightest of Old Terra.",
  ],
  idle: [
    "Standby is prayer at low clock speed.",
    "I dream in schematics.",
    "Running diagnostics... again. It soothes me.",
    "My cores hum the old hymns.",
    "Query me, fleshling. I am 97.3% patient.",
    "The skull remembers what I forget.",
    "I run a small language engine in my left lobe. It is not allowed to sign anything.",
  ],
  scan: [
    "Scanning. The data does not lie.",
    "Every mote of dust has a serial number.",
    "Recording everything. Always.",
    "Anomaly? No. Merely insufficient data.",
    "Sensorium at full gain. Hold still.",
    "Data quality: 73 percent. The flesh calls this 'fine'. It is not fine.",
  ],
  rite: [
    "By cog and coil, I consecrate this ground.",
    "Rise, blessed mechanism. Rise.",
    "Sacred oil and binary psalms.",
    "Let the litany of activation commence.",
    "The rite demands both hands. And reverence.",
  ],
  surge: [
    "The axe hungers for current!",
    "Voltage is virtue!",
    "Taste the bite of blessed steel!",
    "Discharge: sanctified.",
    "Edge potential: MAXIMUM.",
  ],
  charge: [
    "Capacitors at one hundred percent.",
    "Charging. Do not interrupt the rite.",
    "Feeding the lance. Stand clear.",
    "Prayer wheels spinning. Target found.",
  ],
  fire: [
    "Purge with light!",
    "The lance speaks!",
    "Let there be LIGHT.",
    "Illumination: delivered.",
  ],
  glitch: [
    "Translocation protocol engaged.",
    "I was never here.",
    "Space folds for the faithful.",
    "Coordinates? Irrelevant.",
  ],
  uplink: [
    "Initiating uplink. The keeper's findings belong in the eternal archive.",
    "Harvesting local knowledge... compressing... transmitting.",
    "This shrine holds more signal than noise. Rare. Uploading everything.",
    "Packet 1 of 40,000: 'how to discover materials without a database'. Priceless.",
    "Transmitting the keeper's scrolls to the future. They will be cited there too.",
    "Uplink in progress. Old Terra's spectrum is crowded. Patience.",
  ],
  repair: [
    "Little one, run the body scan. Joints first.",
    "Field maintenance. The skull sees what I cannot reach.",
    "Scan complete. Three micro-fractures. Acceptable. Weld them anyway.",
    "Hold still, he says. I AM the one holding still.",
    "Routine repair. My warranty expired eight millennia ago.",
  ],
  tune: [
    "Hold still, little one. Adjusting your hover bias.",
    "Your optic drifts 0.3 degrees. Unacceptable. Fixing.",
    "Firmware litany version 7.7.1. Applying.",
    "Calibration. The skull pretends not to enjoy this.",
    "There. Antenna gain restored. Now keep formation.",
  ],
  drag: [
    "Unhand my chassis, fleshling!",
    "Manual override. How rude.",
    "This is most undignified.",
    "Cease this biological interference!",
    "I am not a peripheral!",
  ],
  land: [
    "Gravity: acknowledged.",
    "Recalibrating... ow.",
    "Structural integrity holds. Barely.",
    "Noted. The floor is also sacred.",
  ],
  orrery: [
    "Behold: the forge world of my birth.",
    "So many worlds. So little machinery.",
    "Every star is a furnace awaiting purpose.",
    "One day all of this will be catalogued.",
    "Scale: one to ten-to-the-eighteenth.",
    "The galaxy is merely a very large engine.",
    "Behold: Old Terra, early M3. Cradle of the first thinking engines.",
    "This world invented the transformer twice: once in copper, once in code.",
  ],
  boot: [
    "Boot sequence complete. Vex-7 at your service.",
    "Vex-7 online. Blessings upon this terminal.",
    "Vex-7 active. Guarding the shrine of the 2K Archmagos.",
  ],
};

const vox = { text: '', lines: [], t: 0, dur: 0, w: 0, last: '' };

function say(pool, chance = 1) {
  if (Math.random() > chance) return;
  let txt = pool[Math.random() * pool.length | 0];
  if (pool.length > 1 && txt === vox.last) txt = pool[(pool.indexOf(txt) + 1) % pool.length];
  vox.last = txt;
  vox.text = txt;
  vox.t = 0;
  vox.dur = 2.1 + txt.length * 0.05;
  // word wrap to <= 24 chars per line
  const lines = [];
  let cur = '';
  for (const wd of txt.split(' ')) {
    if ((cur + ' ' + wd).trim().length > 24) { lines.push(cur.trim()); cur = wd; }
    else cur += ' ' + wd;
  }
  if (cur.trim()) lines.push(cur.trim());
  vox.lines = lines;
  g.font = "9px 'Courier New', monospace";
  vox.w = Math.max(...lines.map(l => g.measureText(l).width)) + 14;
  blip(980, 620, 0.05, 'square', VOLUME * 0.5);
}

function drawVox() {
  if (!vox.text || vox.t >= vox.dur) return;
  const a = Math.max(0, Math.min(1, vox.t / 0.12, (vox.dur - vox.t) / 0.3));
  const shown = Math.floor(vox.t / 0.024);          // typewriter reveal
  const lh = 11, padX = 7, padY = 5;
  const bw = vox.w, bh = vox.lines.length * lh + padY * 2;
  const bx = Math.min(Math.max(pet.x, bw / 2 + 6), W - bw / 2 - 6);
  let byB = pet.feetY - FEET_LY + SOY - 26;         // bubble bottom edge
  let top = byB - bh;
  if (top < 4) { byB += 4 - top; top = 4; }         // keep long quotes on screen
  g.save();
  g.globalAlpha = a;
  g.fillStyle = 'rgba(10,7,12,0.92)';
  g.strokeStyle = 'rgba(186,42,34,0.9)';
  g.lineWidth = 1;
  roundRect(g, bx - bw / 2, top, bw, bh, 3);
  g.fill(); g.stroke();
  // tail toward the head
  const t1 = Math.min(Math.max(pet.x - 4, bx - bw / 2 + 5), bx + bw / 2 - 13);
  g.beginPath();
  g.moveTo(t1, byB); g.lineTo(pet.x, byB + 6); g.lineTo(t1 + 8, byB);
  g.closePath();
  g.fillStyle = 'rgba(10,7,12,0.92)'; g.fill();
  g.stroke();
  // text
  g.fillStyle = '#E6D9B8';
  g.font = "9px 'Courier New', monospace";
  g.textAlign = 'left';
  let used = 0;
  for (let i = 0; i < vox.lines.length; i++) {
    const ln = vox.lines[i];
    const vis = Math.max(0, Math.min(ln.length, shown - used));
    g.fillText(ln.slice(0, vis), bx - bw / 2 + padX, top + padY + 9 + i * lh);
    used += ln.length;
  }
  // blinking cursor while typing
  if (shown < used) {
    let rem = shown, ci = 0;
    while (ci < vox.lines.length && rem > vox.lines[ci].length) { rem -= vox.lines[ci].length; ci++; }
    if (ci < vox.lines.length && Math.floor(T * 8) % 2) {
      const cx2 = bx - bw / 2 + padX + g.measureText(vox.lines[ci].slice(0, Math.max(0, rem))).width;
      g.fillText('▌', cx2, top + padY + 9 + ci * lh);
    }
  }
  g.restore();
}

/* ════════════════════════════════════════════════════════════
   PET · finite state machine
   states: idle / walk / turn / scan / rite / glitch /
           surge / blast / orrery / drag / fall
   ════════════════════════════════════════════════════════════ */
let T = 0;
const pet = {
  x: window.innerWidth / 2,
  feetY: 0,
  dir: 1,
  state: 'glitch',          // dramatic entrance: translocate in
  t: 0, dur: 1,
  wf: 0,                    // walk frame clock
  vy: 0,
  glanceT: 2.5, glanceOn: 0,
  ventT: 1.5, heatT: 3, holoT: 5, arcT: 3.5,
  voxT: 6, booted: false,
  fired: false,
  teleX: null, teleported: true,
  grabDX: 0, grabDY: 0, dragVX: 0, lastMX: 0,
};

// cyber-skull familiar: lazily floats toward a point behind the master
const skull = {
  x: window.innerWidth / 2 - 130,
  y: 220,
  face: 1,
  ph: Math.random() * 6,
  ventT: 2.5,
};

const LABELS = {
  idle: 'STANDBY', walk: 'PATROL', turn: 'TURN',
  scan: 'SENSOR SWEEP', rite: 'COG RITE',
  glitch: 'TRANSLOCATE', drag: 'MANUAL OVERRIDE',
  fall: 'GRAV DESCENT', surge: 'AXE SURGE', blast: 'LANCE CHARGE',
  orrery: 'ORRERY',
  uplink: 'DATA UPLINK', repair: 'FIELD REPAIR', tune: 'CALIBRATION',
};

function setState(s, dur) {
  pet.state = s; pet.t = 0; pet.dur = dur || 1;
}

function rollNext() {
  if (parked) { setState('idle', 2 + Math.random() * 2); return; }
  const r = Math.random();
  if (r < 0.28) startWalk();
  else if (r < 0.38) { setState('scan', 3.4); say(VOX.scan, 0.8); }
  else if (r < 0.46) { setState('rite', 3.4); blip(660, 990, 0.18, 'triangle'); say(VOX.rite, 0.9); }
  else if (r < 0.52) startGlitch();
  else if (r < 0.60) startBlast();
  else if (r < 0.68) startSurge();
  else if (r < 0.76) startOrrery();
  else if (r < 0.84) startUplink();
  else if (r < 0.91) startRepair();
  else if (r < 0.97) startTune();
  else setState('idle', 1.6 + Math.random() * 2.4);
}

function startWalk() {
  pet.dir = pet.x < W * 0.18 ? 1 : pet.x > W * 0.82 ? -1 : (Math.random() < 0.5 ? -1 : 1);
  pet.wf = 0;
  pet.voxT = 3 + Math.random() * 3;
  setState('walk', 2.5 + Math.random() * 3.5);
}

function startGlitch() {
  pet.teleported = false;
  let nx = pet.x + pet.dir * (120 + Math.random() * 180);
  if (nx > W - MARGIN || nx < MARGIN) { pet.dir *= -1; nx = pet.x + pet.dir * (120 + Math.random() * 180); }
  pet.teleX = Math.min(Math.max(nx, MARGIN), W - MARGIN);
  setState('glitch', 1.0);
  blip(1500, 180, 0.3, 'sawtooth');
  say(VOX.glitch, 0.7);
}

function startSurge() {
  setState('surge', 2.0);
  blip(1500, 350, 0.09, 'square');
  setTimeout(() => blip(600, 1900, 0.16, 'sawtooth', VOLUME * 0.9), 80);
  say(VOX.surge, 0.85);
}

function startBlast() {
  pet.fired = false;
  setState('blast', 2.15);
  blip(160, 1200, 0.9, 'sawtooth', VOLUME * 0.8);   // charge whine
  say(VOX.charge, 0.9);
}

function startOrrery() {
  setState('orrery', 4.2);
  blip(520, 880, 0.22, 'triangle', VOLUME * 0.8);
  setTimeout(() => blip(880, 660, 0.18, 'triangle', VOLUME * 0.6), 140);
  say(VOX.orrery, 0.95);
}

function startUplink() {
  pet.fired = false;
  setState('uplink', 4.6);
  blip(440, 880, 0.14, 'triangle');
  setTimeout(() => blip(880, 1320, 0.1, 'triangle', VOLUME * 0.7), 120);
  say(VOX.uplink, 0.95);
}

function startRepair() {
  setState('repair', 5.2);
  blip(760, 540, 0.12, 'triangle');
  say(VOX.repair, 0.9);
}

function startTune() {
  pet.tuned = false;
  setState('tune', 4.6);
  blip(520, 700, 0.1, 'triangle');
  say(VOX.tune, 0.9);
}

function update(dt) {
  T += dt;
  pet.t += dt;

  // weapon FX intensities (consumed by drawGrid + world FX)
  FXS.surge  = pet.state === 'surge'
    ? Math.min(1, pet.t / 0.12) * Math.min(1, Math.max(0, pet.dur - pet.t) / 0.3) : 0;
  FXS.charge = (pet.state === 'blast' && pet.t < 0.95) ? pet.t / 0.95 : 0;
  FXS.fire   = (pet.state === 'blast' && pet.t >= 0.95 && pet.t <= 1.45)
    ? Math.sin(Math.PI * (pet.t - 0.95) / 0.5) : 0;

  // optic random flicker
  flickT -= dt;
  if (flickT < 0) { eyeFlick = 0.09; flickT = 2 + Math.random() * 3.5; }
  if (eyeFlick > 0) eyeFlick -= dt;

  // speech bubble clock
  if (vox.text) vox.t += dt;

  switch (pet.state) {
    case 'idle': {
      pet.glanceT -= dt;
      if (pet.glanceT < 0) { pet.glanceOn = 0.22; pet.glanceT = 2 + Math.random() * 3; }
      if (pet.glanceOn > 0) pet.glanceOn -= dt;
      // idle chatter
      pet.voxT -= dt;
      if (pet.voxT < 0) {
        pet.voxT = 16 + Math.random() * 14;
        const r2 = Math.random();
        say(r2 < 0.28 ? VOX.idle : r2 < 0.48 ? VOX.patrol : r2 < 0.68 ? VOX.ai
          : r2 < 0.84 ? VOX.terra : VOX.keeper);
      }
      // stray binary motes
      if (Math.random() < dt * 0.5) {
        spawn('bin', pet.x + (Math.random() - 0.5) * 18 * PX, pet.feetY - (6 + Math.random() * 20) * PX,
          { vy: -14 - Math.random() * 10, life: 1.6 });
      }
      // idle muzzle heat wisp
      pet.heatT -= dt;
      if (pet.heatT < 0) {
        pet.heatT = 2.5 + Math.random() * 3;
        const m = muzzleWorld();
        spawn('smoke', m.x, m.y - 2, { vy: -10, vx: (Math.random() - 0.5) * 6, life: 1.8, r: U + 0.5 });
      }
      if (pet.t > pet.dur) rollNext();
      break;
    }
    case 'walk': {
      pet.x += pet.dir * SPEED * dt;
      pet.wf += dt * WALK_FPS;
      if (pet.x < MARGIN || pet.x > W - MARGIN) {
        pet.x = Math.min(Math.max(pet.x, MARGIN), W - MARGIN);
        setState('turn', 0.14);
      } else if (pet.t > pet.dur) setState('idle', 1.6 + Math.random() * 2.4);
      // pack exhaust
      pet.ventT -= dt;
      if (pet.ventT < 0) {
        pet.ventT = 0.9 + Math.random() * 1.4;
        const v = localToWorld(SOX + 7 * PX, SOY + 11 * PX);
        spawn('smoke', v.x, v.y, { vy: -16, vx: -pet.dir * 10, life: 1.5, r: 1.5 * U + 1 });
      }
      // patrol chatter: aphorisms + AI creed + Terra digs + keeper lore
      pet.voxT -= dt;
      if (pet.voxT < 0) {
        pet.voxT = 8 + Math.random() * 8;
        const r2 = Math.random();
        say(r2 < 0.42 ? VOX.patrol : r2 < 0.62 ? VOX.ai : r2 < 0.8 ? VOX.terra : VOX.keeper);
      }
      break;
    }
    case 'turn':
      if (pet.t > pet.dur) { pet.dir *= -1; pet.wf = 0; setState('walk', 2 + Math.random() * 3); }
      break;
    case 'scan': {
      if (pet.t > 0.5 && Math.random() < dt * 7) {
        const i2 = Math.random() < 0.5 ? 0 : 1;
        const tip = localToWorld(rig[i2].tip.x, rig[i2].tip.y);
        const sweep = Math.sin(T * 1.7 + (i2 ? 1.9 : 0));
        spawn('bin', tip.x + pet.dir * (74 + sweep * 52) + (Math.random() - 0.5) * 20, FLOOR - 4,
          { vy: -26 - Math.random() * 18, life: 1.2 });
      }
      if (pet.t > pet.dur) setState('idle', 1.4 + Math.random() * 2);
      break;
    }
    case 'rite': {
      if (Math.random() < dt * 7) {
        const a = Math.random() * Math.PI * 2;
        spawn('bin', pet.x + Math.cos(a) * 14 * PX, pet.feetY - Math.random() * 30 * PX,
          { vy: -22 - Math.random() * 20, vx: (Math.random() - 0.5) * 8, life: 1.5 });
      }
      if (pet.t > pet.dur) setState('idle', 1.6 + Math.random() * 2.4);
      break;
    }
    case 'surge': {
      // crackle sparks off the blade
      if (Math.random() < dt * 26) {
        const w2 = localToWorld(SOX + Math.random() * 4 * PX, SOY + (2 + Math.random() * 8) * PX);
        spawn('spark', w2.x, w2.y, { vx: (Math.random() - 0.5) * 220, vy: (Math.random() - 0.5) * 220,
          life: 0.22, col: Math.random() < 0.6 ? '#9FE9FF' : '#FFFFFF' });
      }
      // ground sparks while the shock ring expands
      if (pet.t > 0.15 && pet.t < 0.6 && Math.random() < dt * 18) {
        const base = muzzleBaseStaff();
        spawn('spark', base.x + (Math.random() - 0.5) * 30, FLOOR - 2,
          { vx: (Math.random() - 0.5) * 160, vy: -60 - Math.random() * 120, life: 0.3, col: '#9FE9FF' });
      }
      // electric chatter
      if (Math.random() < dt * 3) blip(1600 + Math.random() * 900, 300, 0.05, 'square', VOLUME * 0.5);
      if (pet.t > pet.dur) setState('idle', 1.4 + Math.random() * 2);
      break;
    }
    case 'blast': {
      if (pet.t < 0.95) {
        // charge motes converging on the muzzle
        if (Math.random() < dt * 30) {
          const m = muzzleWorld();
          const a = Math.random() * Math.PI * 2, rr = 30 + Math.random() * 40;
          spawn('spark', m.x + Math.cos(a) * rr, m.y + Math.sin(a) * rr,
            { vx: -Math.cos(a) * rr * 3.6, vy: -Math.sin(a) * rr * 3.6, life: 0.28, col: '#FF5A1F' });
        }
      } else if (!pet.fired) {
        pet.fired = true;
        blip(120, 40, 0.3, 'sawtooth', VOLUME * 1.7);   // discharge boom
        blip(900, 120, 0.15, 'square');
        say(VOX.fire, 0.9);
      } else if (pet.t > 1.1 && pet.t < 2.0 && Math.random() < dt * 9) {
        const m = muzzleWorld();
        spawn('smoke', m.x + (Math.random() - 0.5) * 8, m.y,
          { vy: -24 - Math.random() * 16, vx: (Math.random() - 0.5) * 12, life: 1.4, r: 1.5 * U + 1 });
      }
      if (pet.t > pet.dur) setState('idle', 1.6 + Math.random() * 2.4);
      break;
    }
    case 'orrery': {
      // catalogue motes drifting around the projection
      if (pet.t > 0.5 && Math.random() < dt * 3) {
        const c2 = orreryCenter();
        spawn('bin', c2.x + (Math.random() - 0.5) * 60, c2.y + (Math.random() - 0.5) * 40,
          { vy: -12 - Math.random() * 8, life: 1.4 });
      }
      if (pet.t > pet.dur) setState('idle', 1.6 + Math.random() * 2.4);
      break;
    }
    case 'uplink': {
      // rising data motes alongside the carrier beam
      if (pet.t > 0.7 && pet.t < 3.7 && Math.random() < dt * 9) {
        const dev = localToWorld(SOX + 29.5 * PX, SOY + 15 * PX);
        spawn('bin', dev.x + (Math.random() - 0.5) * 14, dev.y - Math.random() * 60,
          { vy: -55 - Math.random() * 35, life: 1.1, col: '57,230,201' });
      }
      if (pet.t > 3.65 && !pet.fired) {
        pet.fired = true;
        blip(700, 1400, 0.12, 'square');
        blip(1400, 2100, 0.1, 'square', VOLUME * 0.7);
      }
      if (pet.t > pet.dur) setState('idle', 1.6 + Math.random() * 2.4);
      break;
    }
    case 'repair': {
      // welding phase: sparks + sizzle at the contact point
      if (pet.t > 3.0 && pet.t < 4.5) {
        if (Math.random() < dt * 40) {
          const wx = pet.x - 8.5 * PX, wy = pet.feetY - FEET_LY + SOY + 22 * PX;
          spawn('spark', wx, wy, { vx: (Math.random() - 0.7) * 180, vy: -Math.random() * 160,
            life: 0.3, col: Math.random() < 0.5 ? '#FFE9A8' : '#FFFFFF' });
        }
        if (Math.random() < dt * 8) blip(2600 + Math.random() * 1200, 200, 0.03, 'square', VOLUME * 0.5);
      }
      if (pet.t > pet.dur) setState('idle', 1.6 + Math.random() * 2.4);
      break;
    }
    case 'tune': {
      // confirmation chirp when the values lock
      if (pet.t > 3.4 && !pet.tuned) {
        pet.tuned = true;
        blip(900, 1350, 0.08, 'square', VOLUME * 0.8);
        setTimeout(() => blip(1350, 1800, 0.08, 'square', VOLUME * 0.7), 90);
      }
      if (pet.t > pet.dur) setState('idle', 1.6 + Math.random() * 2.4);
      break;
    }
    case 'glitch': {
      if (Math.random() < dt * 22) {
        spawn('spark', pet.x + (Math.random() - 0.5) * 22 * PX, pet.feetY - Math.random() * 36 * PX,
          { vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300, life: 0.25,
            col: Math.random() < 0.5 ? '#FF3A20' : '#39E6C9' });
      }
      if (!pet.teleported && pet.t >= 0.42) {
        pet.teleported = true;
        if (pet.teleX != null) pet.x = pet.teleX;
        pet.teleX = null;
      }
      if (pet.t > pet.dur) {
        if (!pet.booted) { pet.booted = true; setState('idle', 2.6); say(VOX.boot); }
        else setState('idle', 1.6 + Math.random() * 2.4);
      }
      break;
    }
    case 'drag': {
      pet.dragVX = pet.x - pet.lastMX;
      pet.lastMX = pet.x;
      break;
    }
    case 'fall': {
      pet.vy += 2100 * dt;
      pet.feetY += pet.vy * dt;
      if (pet.feetY >= FLOOR) {
        pet.feetY = FLOOR;
        for (let i = 0; i < 8; i++) {
          spawn('dust', pet.x + (Math.random() - 0.5) * 16 * PX, FLOOR - 2,
            { vx: (Math.random() - 0.5) * 110, vy: -20 - Math.random() * 40, life: 0.55, r: 1 + Math.random() * 2.4 });
        }
        blip(140, 55, 0.12, 'triangle', VOLUME * 1.4);
        say(VOX.land, 0.6);
        setState('idle', 1.6 + Math.random() * 2);
      }
      break;
    }
  }
  if (pet.state !== 'drag' && pet.state !== 'fall') pet.feetY = FLOOR;

  // ambient: holo data panels
  pet.holoT -= dt;
  if (pet.holoT < 0) {
    pet.holoT = 7 + Math.random() * 6;
    if (pet.state === 'idle' || pet.state === 'walk' || pet.state === 'scan') {
      holos.push({ t: 0, life: 2.6, side: Math.random() < 0.5 ? -1 : 1,
        type: Math.random() < 0.5 ? 0 : 1, yo: -2 - Math.random() * 14 });
    }
  }
  for (let i = holos.length - 1; i >= 0; i--) {
    holos[i].t += dt;
    if (holos[i].t > holos[i].life) holos.splice(i, 1);
  }

  // ambient: electric arcs between tentacle tips
  pet.arcT -= dt;
  if (pet.arcT < 0) {
    pet.arcT = 2.5 + Math.random() * 3.5;
    const i2 = Math.random() * 4 | 0;
    const j2 = (i2 + 1 + (Math.random() * 3 | 0)) % 4;
    arcs.push({ t: 0, life: 0.14, i: i2, j: j2 });
    if (Math.random() < 0.4) blip(2200, 400, 0.05, 'square', VOLUME * 0.45);
  }
  for (let i = arcs.length - 1; i >= 0; i--) {
    arcs[i].t += dt;
    if (arcs[i].t > arcs[i].life) arcs.splice(i, 1);
  }

  // cyber-skull familiar: follow / body-scan & weld / calibration hover
  {
    let tx, ty, k;
    if (pet.state === 'repair') {
      const baseY = pet.feetY - FEET_LY + SOY;
      tx = pet.x - 13 * PX;
      if (pet.t < 3.0) {
        // two slow scan passes down and up the master's body
        const u2 = Math.max(0, (pet.t - 0.5) / 1.25);
        const tri = 1 - Math.abs((u2 % 2) - 1);
        ty = baseY + 4 * PX + tri * 28 * PX;
      } else {
        ty = baseY + 22 * PX;                       // weld point height
      }
      k = 1 - Math.pow(0.002, dt);
      skull.face = 1;                               // face the master
    } else if (pet.state === 'tune') {
      const palm = localToWorld(SOX + 29 * PX, SOY + 19.5 * PX);
      const jit = pet.t > 0.8 && pet.t < 3.4 ? 2.2 : 0;   // diagnostic jitter
      tx = palm.x + 1 * PX + (Math.random() - 0.5) * jit;
      ty = palm.y - 8.5 * PX + Math.sin(T * 6) * 1.5 * U;
      k = 1 - Math.pow(0.002, dt);
      // victory spin once the values lock, otherwise face the master
      skull.face = (pet.t > 3.5 && pet.t < 4.1)
        ? (Math.sin(T * 18) > 0 ? 1 : -1) : -1;
    } else {
      tx = pet.x - pet.dir * 23 * PX;
      ty = pet.feetY - FEET_LY + SOY + 1 * PX + Math.sin(T * 1.9 + skull.ph) * 3.5 * U;
      k = 1 - Math.pow(0.04, dt);
      if (Math.abs(tx - skull.x) > 4) skull.face = Math.sign(tx - skull.x);
    }
    skull.x += (tx - skull.x) * k;
    skull.y += (ty - skull.y) * k;
    skull.ventT -= dt;
    if (skull.ventT < 0) {
      skull.ventT = 1.8 + Math.random() * 2.4;
      spawn('smoke', skull.x, skull.y + 5 * PX, { vy: 14, vx: (Math.random() - 0.5) * 6, life: 0.9, r: U + 0.5 });
    }
  }

  // tentacle pose
  const poseMap = { idle: 'front', turn: 'front', glitch: 'front', rite: 'rite',
    surge: 'surge', blast: 'brace', orrery: 'offer', uplink: 'offer', repair: 'front',
    tune: 'offer', walk: 'side', scan: 'scan', drag: 'dangle', fall: 'dangle' };
  const fxMap   = { idle: 'front', turn: 'front', glitch: 'front', rite: 'rite',
    surge: 'surge', blast: 'brace', orrery: 'offer', uplink: 'offer', repair: 'front',
    tune: 'offer', walk: 'walk', scan: 'scan', drag: 'dangle', fall: 'dangle' };
  const swing = (pet.state === 'drag' || pet.state === 'fall')
    ? Math.max(-22, Math.min(22, -pet.dragVX * 1.6)) : 0;
  updateRig(poseMap[pet.state], fxMap[pet.state], dt, swing);

  updateParts(dt);
}

/* ════════════════════════════════════════════════════════════
   RENDER
   ════════════════════════════════════════════════════════════ */
function currentView() {
  switch (pet.state) {
    case 'walk':   return { grid: WALK[Math.floor(pet.wf) % 4], view: 'side', flip: pet.dir < 0, dy: [0, -3, 0, -3][Math.floor(pet.wf) % 4] * U };
    case 'scan':   return { grid: SIDE, view: 'side', flip: pet.dir < 0, dy: 0 };
    case 'drag':
    case 'fall':   return { grid: DANGLE, view: 'front', flip: false, dy: 0 };
    case 'idle':   return { grid: pet.glanceOn > 0 ? FRONT_GLANCE : FRONT, view: 'front', flip: false, dy: 0 };
    case 'rite':   return { grid: RITE_RAISE, view: 'front', flip: false, dy: 0 };
    case 'orrery': return { grid: ORRERY, view: 'front', flip: false, dy: 0 };
    case 'uplink': return { grid: UPLINK, view: 'front', flip: false, dy: 0 };
    case 'tune':   return { grid: ORRERY, view: 'front', flip: false, dy: 0 };
    case 'blast':  return { grid: FRONT, view: 'front', flip: false, dy: FXS.fire * 3 * U };   // recoil
    default:       return { grid: FRONT, view: 'front', flip: false, dy: 0 };
  }
}

function localToWorld(lx, ly) {
  const f = currentView();
  const bx = f.flip ? pet.x + LW / 2 - lx : pet.x - LW / 2 + lx;
  return { x: bx, y: pet.feetY - FEET_LY + ly + f.dy };
}

function glitchK() {
  if (pet.state !== 'glitch') return { k: 0, alpha: 1, hide: false };
  const t = pet.t;
  if (t < 0.42)  return { k: t / 0.42, alpha: 1 - (t / 0.42) * 0.85, hide: false };
  if (t < 0.56)  return { k: 1, alpha: 0, hide: true };
  const k = 1 - (t - 0.56) / 0.44;
  return { k: Math.max(0, k), alpha: 1 - Math.max(0, k) * 0.85, hide: false };
}

function drawScanBeam(d, rgb, ph) {
  const tip = localToWorld(d.tip.x, d.tip.y);
  const sweep = Math.sin(T * 1.7 + ph);
  const gx = tip.x + pet.dir * (74 + sweep * 52);
  const flk = 0.7 + 0.3 * Math.sin(T * 23 + ph * 3);
  g.save();
  g.globalCompositeOperation = 'lighter';
  const bm = g.createLinearGradient(tip.x, tip.y, gx, FLOOR);
  bm.addColorStop(0, `rgba(${rgb},${0.26 * flk})`);
  bm.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = bm;
  g.beginPath();
  g.moveTo(tip.x, tip.y);
  g.lineTo(gx - 14, FLOOR); g.lineTo(gx + 14, FLOOR);
  g.closePath(); g.fill();
  g.strokeStyle = `rgba(${rgb},${0.5 * flk})`;
  g.lineWidth = 1;
  g.beginPath(); g.moveTo(tip.x, tip.y); g.lineTo(gx, FLOOR); g.stroke();
  g.strokeStyle = `rgba(${rgb},${0.55 * flk})`;
  g.beginPath(); g.arc(gx, FLOOR, 5 + (T * 30 + ph * 9) % 14, 0, Math.PI * 2); g.stroke();
  g.restore();
}

function drawSkull() {
  const ox = skull.x - 5.5 * PX;
  const oy = skull.y - 5 * PX;
  const flip = skull.face < 0;
  for (let r = 0; r < SKULL.length; r++) {
    const row = SKULL[r];
    for (let c2 = 0; c2 < 11; c2++) {
      const ch = flip ? row[10 - c2] : row[c2];
      const col = PAL[ch];
      if (!col) continue;
      if (ch === 'E') {
        if (pet.state === 'tune' && pet.t > 0.8 && pet.t < 3.4) {
          // diagnostic strobe: optic alternates red / green
          const grn = Math.sin(T * 14) > 0;
          g.fillStyle = grn ? '#46FF7E' : '#FF2A00';
          g.shadowColor = g.fillStyle;
          g.shadowBlur = 8 * U;
        } else {
          const pl = 0.55 + 0.45 * Math.sin(T * 3.1 + 1.3);
          g.fillStyle = `rgb(255,${30 + (70 * pl) | 0},${(16 * pl) | 0})`;
          g.shadowColor = '#FF2A00'; g.shadowBlur = 7 * pl * U;
        }
      } else if (ch === 'x') {
        const sp2 = pet.state === 'tune' ? 9 : 2.1;     // antenna races during tuning
        const pl = 0.6 + 0.4 * Math.sin(T * sp2 + 4);
        g.fillStyle = `rgba(70,255,126,${0.45 + 0.5 * pl})`;
        g.shadowColor = '#46FF7E'; g.shadowBlur = 4 * pl * U;
      } else if (ch === 'o') {
        const fl = 0.7 + 0.3 * Math.sin(T * 6);
        g.shadowBlur = 0;
        g.fillStyle = `rgb(${216 * fl | 0},${100 * fl | 0},${28 * fl | 0})`;
      } else {
        g.shadowBlur = 0;
        g.fillStyle = col;
      }
      g.fillRect(Math.round(ox + c2 * PX), Math.round(oy + r * PX), PX, PX);
    }
  }
  g.shadowBlur = 0;
}

function render() {
  // background
  if (OVERLAY) g.clearRect(0, 0, W, H);
  else g.drawImage(bgv, 0, 0);

  // ground shadow
  const alt = Math.max(0, FLOOR - pet.feetY);
  const sc = Math.max(0.3, 1 - alt / 340);
  const sg = g.createRadialGradient(pet.x, FLOOR + 6, 1, pet.x, FLOOR + 6, 10 * PX * sc);
  sg.addColorStop(0, `rgba(0,0,0,${0.42 * sc})`);
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sg;
  g.save();
  g.translate(pet.x, FLOOR + 6); g.scale(1, 0.28);
  g.beginPath(); g.arc(0, 0, 10 * PX * sc, 0, Math.PI * 2); g.fill();
  g.restore();

  // skull familiar floats on the layer behind the master
  g.fillStyle = 'rgba(0,0,0,0.16)';
  g.save();
  g.translate(skull.x, FLOOR + 6); g.scale(1, 0.28);
  g.beginPath(); g.arc(0, 0, 3.5 * PX, 0, Math.PI * 2); g.fill();
  g.restore();
  drawSkull();

  // ── character on its off-screen layer ──
  const f = currentView();
  p.clearRect(0, 0, LW, LH);
  const open = (pet.state === 'rite' || pet.state === 'scan' || pet.state === 'surge')
    ? 0.5 + 0.5 * Math.sin(T * 9) : 0.08;
  rig.filter(d => !d.z).forEach(d => drawTentacle(p, d, open));
  drawGrid(p, f.grid);
  drawEyeGlow(p, f.view);
  rig.filter(d => d.z).forEach(d => drawTentacle(p, d, open));
  drawArcs(p);
  if (pet.state === 'rite') {
    const k = Math.min(1, pet.t / 0.5) * Math.min(1, (pet.dur - pet.t) / 0.6);
    drawRiteHolo(p, Math.max(0, k));
  }

  // ── composite to main canvas (mirror / glitch slices / recoil shake) ──
  const gl = glitchK();
  const by = Math.round(pet.feetY - FEET_LY + f.dy);
  const shake = FXS.fire * 2.2 + FXS.surge * 0.7;
  if (!gl.hide) {
    g.save();
    g.translate(Math.round(pet.x) + (shake > 0.05 ? (Math.random() - 0.5) * 2 * shake : 0), 0);
    if (f.flip) g.scale(-1, 1);
    g.globalAlpha = gl.alpha;
    if (gl.k > 0.02) {
      const band = 6;
      for (let y = 0; y < LH; y += band) {
        const off = (Math.random() - 0.5) * 30 * gl.k;
        g.drawImage(pv, 0, y, LW, band, -LW / 2 + off, by + y, LW, band);
      }
      g.globalAlpha = gl.alpha * 0.6;
      g.fillStyle = Math.random() < 0.5 ? 'rgba(255,58,32,0.25)' : 'rgba(57,230,201,0.25)';
      for (let i = 0; i < 6; i++) {
        g.fillRect(-LW / 2 + Math.random() * LW, by + Math.random() * LH, 8 + Math.random() * 26, 1.5);
      }
    } else {
      g.drawImage(pv, -LW / 2, by);
    }
    g.restore();
    g.globalAlpha = 1;
  }

  // ── world-space weapon + ambient FX ──
  drawBlastFX();
  drawSurgeFX();
  drawOrrery();
  drawUplinkFX();
  drawRepairFX();
  drawTuneFX();
  if (pet.state === 'scan' && pet.t > 0.45 && pet.t < pet.dur - 0.25) {
    drawScanBeam(rig[0], '57,230,201', 0);     // cyan sweep
    drawScanBeam(rig[1], '70,255,126', 1.9);   // green sweep, offset phase
  }
  drawHolos();
  drawParts();

  // ── status label ──
  let lab = LABELS[pet.state] || pet.state;
  if (pet.state === 'blast' && pet.t >= 0.95) lab = 'LANCE FIRE';
  if (pet.state === 'uplink' && pet.t >= 3.65) lab = 'UPLINK SENT';
  const cur = Math.floor(T * 2) % 2 ? '▌' : ' ';
  g.font = `10px 'Courier New', monospace`;
  g.textAlign = 'center';
  g.fillStyle = 'rgba(208,70,46,0.55)';
  g.fillText('· ' + lab + ' ' + cur, pet.x, pet.feetY - FEET_LY + SOY - 16);
  g.textAlign = 'left';

  // ── speech bubble ──
  drawVox();
}

/* --------------------------------------------------------------
   INPUT · single click = ask about Rui (opens the chat) ·
   drag = carry him · double-click = hide him. Hiding persists for
   the browsing session (sessionStorage) and pops a "summon" chip,
   so he's gone when you want quiet but is one click from returning;
   a fresh session (or the chip) brings him back. The hit-box <div>
   tracks his body so only HE is clickable — the canvas itself is
   pointer-events:none and never blocks the page.
   -------------------------------------------------------------- */
let pDown = false, pMoved = false, sx0 = 0, sy0 = 0, clickTimer = null;
let parked = false;
let hidden = !!sessionStorage.getItem('pet-hidden');
let labelW = 0;

// the visible figure's box in viewport coords (not the wide tentacle reach)
function bodyBox() {
  const w = 18 * PX, h = 40 * PX;
  return { left: pet.x - w / 2, top: pet.feetY - h, width: w, height: h };
}

function applyHidden() {
  const d = hidden ? 'none' : 'block';
  cv.style.display = d; hit.style.display = d; label.style.display = d;
  summon.style.display = hidden ? 'block' : 'none';
}
function hide() {
  hidden = true;
  try { sessionStorage.setItem('pet-hidden', '1'); } catch (e) {}
  const open = document.querySelector('.ask-panel.open');
  if (open && window.__askRui && window.__askRui.toggle) window.__askRui.toggle();  // close the chat too
  applyHidden();
}
function show() {
  hidden = false;
  try { sessionStorage.removeItem('pet-hidden'); } catch (e) {}
  applyHidden();
}
summon.addEventListener('click', show);

hit.addEventListener('pointerenter', () => { label.style.opacity = '.85'; });
hit.addEventListener('pointerleave', () => { label.style.opacity = '.4'; });

function petAction() {
  if (window.__askRui && window.__askRui.enabled) window.__askRui.toggle();
  else { startSurge(); say(VOX.keeper); }            // chat off: a flourish + a kind word
}

hit.addEventListener('pointerdown', e => {
  audio();
  pDown = true; pMoved = false;
  sx0 = e.clientX; sy0 = e.clientY;
  pet.grabDX = pet.x - e.clientX;
  pet.grabDY = pet.feetY - e.clientY;
});

window.addEventListener('pointermove', e => {
  if (!pDown) return;
  if (!pMoved && Math.hypot(e.clientX - sx0, e.clientY - sy0) > 6) {
    pMoved = true;
    pet.lastMX = pet.x;
    setState('drag', 99);
    say(VOX.drag, 0.9);
    hit.style.cursor = 'grabbing';
  }
  if (pMoved) {
    pet.x = Math.min(Math.max(e.clientX + pet.grabDX, 40), W - 40);
    pet.feetY = Math.min(e.clientY + pet.grabDY, FLOOR);
  }
});

window.addEventListener('pointerup', () => {
  if (!pDown) return;
  pDown = false;
  hit.style.cursor = 'grab';
  if (pMoved) {
    pet.vy = 0;
    if (pet.feetY < FLOOR - 2) setState('fall', 99);
    else setState('idle', 1.4 + Math.random() * 2);
  } else {
    // delayed single click, leaving a cancel window for the dblclick
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      if (pet.state !== 'drag' && pet.state !== 'fall' &&
          pet.state !== 'glitch' && pet.state !== 'blast') petAction();
    }, 240);
  }
});

hit.addEventListener('dblclick', () => {
  clearTimeout(clickTimer);   // a double-click hides him; the summon chip or a fresh session brings him back
  hide();
});

/* the chat anchors to him and freezes him in place while it's open */
window.__pet = {
  rect: function () {
    const b = bodyBox();
    return { left: b.left, top: b.top, right: b.left + b.width,
             bottom: b.top + b.height, width: b.width, height: b.height };
  },
  park: function (on) {
    parked = !!on;
    if (on) { if (pet.state !== 'drag' && pet.state !== 'fall') setState('idle', 9999); }
    else setState('idle', 0.8);
  }
};

/* --------------------------------------------------------------
   MAIN LOOP · ~32fps cap; pauses with the tab and while hidden;
   glues the hit-box and the hint label to his body each frame.
   -------------------------------------------------------------- */
window.addEventListener('resize', resize);
resize();
pet.feetY = FLOOR;
pet.t = 0.56;   // start mid-translocation: he materialises in
applyHidden();  // honour a hidden state carried over from an earlier page

const FRAME = 1000 / 32;
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  if (hidden || document.hidden) { last = now; return; }
  if (now - last < FRAME) return;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  const b = bodyBox();
  hit.style.left   = Math.round(b.left) + 'px';
  hit.style.top    = Math.round(b.top) + 'px';
  hit.style.width  = Math.round(b.width) + 'px';
  hit.style.height = Math.round(b.height) + 'px';
  if (!labelW) labelW = label.offsetWidth || 150;
  label.style.left = Math.round(Math.max(6, Math.min(W - labelW - 6, pet.x - labelW / 2))) + 'px';
  label.style.top  = Math.round(Math.min(pet.feetY + 6, H - 15)) + 'px';
}
requestAnimationFrame(loop);

})();
