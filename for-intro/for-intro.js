/*!
 * FOR_ intro — 2026 동서대학교 제품인터랙션디자인전공 졸업작품 전시
 * <script src="for-intro/for-intro.js"></script> 한 줄로 적용.
 * 영상 파일 없이 화면 크기에 맞춰 실시간으로 그려지는 루프 애니메이션 → 다운로드 대기 없이 바로 재생.
 * 화면 탭·클릭 또는 Enter·Space·Esc → 인트로가 위로 걷히며 메인 진입.
 * 옵션: data-once="session" · data-hint="off" · 주소 끝 ?nointro
 * 이벤트: document.addEventListener('for-intro:done', ...)
 */
(function () {
  'use strict';
  if (window.__forIntroLoaded) return;
  window.__forIntroLoaded = true;
  var script = document.currentScript, ds = (script && script.dataset) || {};
  var ONCE = ds.once === 'session', HINT = ds.hint !== 'off';
  var BG = '#F7F3EE', INK = '#C62D1E', html = document.documentElement;
  function done() { window.__forIntroDone = true; document.dispatchEvent(new CustomEvent('for-intro:done')); }
  function skip() { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', done); else setTimeout(done); }
  if (/[?&]nointro\b/.test(location.search)) return skip();
  try { if (ONCE && sessionStorage.getItem('for-intro-seen')) return skip(); } catch (e) {}
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css = [
    "@font-face{font-family:'PretendardS';font-weight:600;font-display:swap;src:url('https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/static/woff2/Pretendard-SemiBold.woff2') format('woff2')}",
    'html.for-intro-pending{background:' + BG + '}',
    'html.for-intro-pending body{visibility:hidden}',
    'html.for-intro-lock,html.for-intro-lock body{overflow:hidden!important;height:100%}',
    '.for-intro{position:fixed;inset:0;z-index:2147483000;background:' + BG + ';cursor:pointer;outline:none;overflow:hidden;',
    '  touch-action:none;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;',
    '  transition:transform .9s cubic-bezier(.76,0,.24,1)}',
    '.for-intro.is-leaving{transform:translateY(-100%)}',
    '.for-intro__canvas{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none}',
    '.for-intro__ui{opacity:0;animation:for-intro-in .6s ease 1.4s forwards}',
    '.for-intro__hint{position:absolute;left:50%;bottom:calc(22px + env(safe-area-inset-bottom));transform:translateX(-50%);',
    '  font:600 12px/1 Pretendard,"Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif;letter-spacing:.18em;color:' + INK + ';white-space:nowrap;pointer-events:none}',
    '@media (orientation:landscape){.for-intro__hint{left:auto;right:calc(28px + env(safe-area-inset-right));top:calc(28px + env(safe-area-inset-top));bottom:auto;transform:none}}',
    '@keyframes for-intro-in{to{opacity:1}}',
    '@media (prefers-reduced-motion:reduce){.for-intro{transition:opacity .4s ease}.for-intro.is-leaving{transform:none;opacity:0}.for-intro__ui{animation:none;opacity:1}}'
  ].join('\n');
  var style = document.createElement('style');
  style.id = 'for-intro-style'; style.textContent = css;
  (document.head || html).appendChild(style);
  html.classList.add('for-intro-pending', 'for-intro-lock');
  var failsafe = setTimeout(function () { html.classList.remove('for-intro-pending'); }, 4000);

  /* ---------- FOR_ bumper (canvas, deterministic render(t)) ---------- */
  function createBumper(cvs, W, H) {
    const Q = new URLSearchParams('');
    cvs.width = W; cvs.height = H;

/* FOR_ bumper v11 (seamless loop) — frosted gift box with a flat red ball inside.
   Underscore lands → box rises and softly tosses the ball straight up, it drops back in → the lid flips over (original motion) → ribbon wraps, bow ties
   → the box bursts toward camera → folds back into the underscore → FOR_.  render(t) is deterministic. */




const ctx = cvs.getContext('2d');
const inner = document.createElement('canvas'); inner.width = W; inner.height = H;   // what is seen through the frost
const ictx = inner.getContext('2d');
const PORTRAIT = H >= W;
const U = Math.min(W, H) / 1080;

const C = {
  bg: '#F7F3EE', line: 'rgba(198,45,30,0.22)', frame: '#C62D1E', floor: '#A82415',
  pill: '#F7F3EE',                                         // solid lid / underscore / letters
  frost: [255, 255, 255], frostTop: [255, 255, 255], frostSide: [222, 214, 206],
  aFront: 0.52, aTop: 0.66, aBack: 0.62,                   // frost opacity (front walls, top, back wall)
  rib: '#EC3D2C', ribTop: '#F45C45', ribSide: '#B3271A', ribDeep: '#A52114',
  ball: '#EF4A33',                                        // flat 2D ball
  ink: '#C62D1E', shadow: '90,28,18',
};

const L = {
  fw: (PORTRAIT ? 700 : 780) * U, fh: (PORTRAIT ? 900 : 700) * U,
  cx: W / 2, cy: H * (PORTRAIT ? 0.45 : 0.47),
  finalScale: PORTRAIT ? 1.20 : 1.06, peakScale: PORTRAIT ? 2.15 : 1.75, landScale: PORTRAIT ? 1.09 : 1.04,
};
L.floorA = L.cy + (PORTRAIT ? 0.30 : 0.33) * L.fh;
L.floorL = L.cy + 0.13 * L.fh;
const G = { bw: 300 * U, bh: 220 * U, lw: 332 * U, lh: 66 * U, rw: 48 * U,
            bowLen: 92 * U, bowR: 27 * U, bowElev: 50 * Math.PI / 180, knotR: 25 * U, ballR: 88 * U };

/* ---------- timeline: locked to beats.json ----------
   116.6 BPM, 4/4, 16 beats = 4 bars = 494 frames. GR(n) = the breakout downbeat + n sixteenths.
   Every key moment sits on a beat, an 8th or a 16th (32nds only for the quick R→O→F / bow staggers). */
const BEATS = { bpm: 116.599, beat: 0.514583, downbeat: 1.8572 };
const S16 = BEATS.beat / 4, GR = n => BEATS.downbeat + n * S16;
const T = {
  land1: GR(-10),          // 1.2.3  pill lands, box rises
  ballLand: GR(-8),        // 1.3.1  ball drops back into the box
  snap: GR(-6),            // 1.3.3  lid snaps shut
  knot0: GR(-4),           // 1.4.1  knot pops
  tie0: GR(-3.5) - 0.02,   // 1.4.1+ bow loops unfurl (first loop visible 0.02 s later)
  b0: GR(0),               // 2.1.1  box springs out in 3D
  peak: GR(8),             // 2.3.1  box at full size
  r1: GR(16),              // 3.1.1  box collapses into the underscore
  land2: GR(20),           // 3.2.1  underscore lands beside FOR
  out0: GR(44),            // 4.4.1  letters duck
};
T.hand = T.snap + 0.07; T.rib0 = T.snap + 0.10; T.rib1 = T.rib0 + 0.22;
T.tie1 = T.tie0 + 0.26; T.sq0 = T.b0 - 0.16;                 // crouch before the pop
T.peakEnd = T.peak + 0.15;
T.let0 = GR(21) - T.land2 - 0.12; T.letS = S16 / 2;         // R/O/F pass full height on 3.2.2 · +1/32 · 3.2.3
T.sub0 = GR(22.5) - T.land2; T.subS = S16 / 2;              // exhibition lines, 32nds apart
T.outC = GR(45) - T.out0;                                   // underscore crouches, launches on 4.4.2
T.end = 494 / 60;                                           // = 16 beats → seamless loop on a 60 fps frame boundary
const DUR = T.end;

/* ---------- math ---------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const logLerp = (a, b, t) => a * Math.pow(b / a, t);
const D2R = Math.PI / 180;
const E = {
  inOutCubic: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  outCubic: x => 1 - Math.pow(1 - x, 3), inQuad: x => x * x, outQuad: x => 1 - (1 - x) * (1 - x),
  outSine: x => Math.sin(x * Math.PI / 2), inOutSine: x => -(Math.cos(Math.PI * x) - 1) / 2,
  outBack: (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  inBack: (x, s = 1.70158) => (s + 1) * x * x * x - s * x * x,
};
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mixA = (A, B, t) => A.map((v, i) => lerp(v, B[i], t));
const rgb = (c, a = 1) => `rgba(${c.map(Math.round).join(',')},${a})`;
const LV = (() => { const v = [-0.45, 0.75, 0.50], n = Math.hypot(...v); return v.map(x => x / n); })();
const D_FRONT = LV[2], D_DARK = -0.35, D_LIGHT = 0.85;
function shadeK(n) {                      // -1 … 0 (front) … +1 (lit top)
  const d = n[0] * LV[0] + n[1] * LV[1] + n[2] * LV[2];
  return d < D_FRONT ? -clamp((D_FRONT - d) / (D_FRONT - D_DARK)) : clamp((d - D_FRONT) / (D_LIGHT - D_FRONT));
}
const shadeC = (k, base, light, dark) => k < 0 ? mixA(base, dark, -k) : mixA(base, light, k);
function convexHull(pts) {
  pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of pts.slice().reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

/* ---------- camera / frame ---------- */
function frameScale(t) {
  const tz = T.land1 + 0.15;
  if (t < tz) return lerp(0.68, 1.0, E.inOutCubic(seg(t, 0, tz)));
  if (t < T.b0) return lerp(1.0, 1.11, E.inQuad(seg(t, tz, T.b0)));
  if (t < T.peak) return logLerp(1.11, 0.30, E.outSine(seg(t, T.b0, T.peak)));
  if (t < T.peakEnd) return logLerp(0.30, 0.285, seg(t, T.peak, T.peakEnd));
  if (t < T.r1 + 0.25) return logLerp(0.285, 1.10, E.inOutCubic(seg(t, T.peakEnd, T.r1 + 0.25)));
  if (t < T.land2) return lerp(1.10, L.landScale, E.inOutSine(seg(t, T.r1 + 0.25, T.land2)));   // stage stays wide enough for the squash
  const fin = t2 => lerp(L.landScale, L.finalScale, E.outCubic(seg(t2, T.land2, T.land2 + 1.5))) + 0.03 * seg(t2, T.land2, T.out0);
  if (t < T.out0) return fin(t);
  return lerp(fin(T.out0), frameScale(0), E.inOutCubic(seg(t, T.out0, T.end)));       // pull back to the opening frame
}
function frameDY(t) {
  if (t < T.b0 || t > T.r1 + 0.25) return 0;
  if (t < T.peakEnd) return 0.12 * L.fh * E.outSine(seg(t, T.b0, T.peak));
  return 0.12 * L.fh * (1 - E.inOutCubic(seg(t, T.peakEnd, T.r1 + 0.25)));
}
function floorY(t) {
  if (t < T.b0) return L.floorA;
  if (t < T.peak) return lerp(L.floorA, L.cy + 0.9 * L.fh, E.inOutSine(seg(t, T.b0, T.peak)));
  if (t < T.r1 + 0.2) return L.cy + 0.9 * L.fh;
  if (t < T.land2) return lerp(L.cy + 0.62 * L.fh, L.floorL, E.outCubic(seg(t, T.r1 + 0.2, T.land2)));
  if (t < T.out0) return L.floorL;
  return lerp(L.floorL, L.floorA, E.inOutCubic(seg(t, T.out0, T.end)));
}

/* ---------- primitives ---------- */
const PILL_R = 0;      // the underscore is a sharp-cornered bar (matches the box lid and the logotype's flat terminals)
function capsule(x, y, len, th, angDeg, r, color, sx = 1, sy = 1, bottomAnchor = false) {
  const a = ((angDeg % 180) + 270) % 180 - 90;      // (-90, 90]: keeps the bottom anchor on the bottom
  ctx.save(); ctx.translate(x, y); ctx.rotate(a * D2R);
  const w = len * sx, h = th * sy, rr = Math.max(0, Math.min(r, h / 2, w / 2));
  ctx.fillStyle = color; ctx.beginPath();
  if (bottomAnchor) ctx.roundRect(-w / 2, th / 2 - h, w, h, rr); else ctx.roundRect(-w / 2, -h / 2, w, h, rr);
  ctx.fill(); ctx.restore();
}
function drawBall(c, x, y, r, sx = 1, sy = 1, ang = 0) {      // flat disc with squash & stretch
  if (r < 0.5) return;
  c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = C.ball;
  c.beginPath(); c.ellipse(0, 0, r * sx, r * sy, 0, 0, Math.PI * 2); c.fill(); c.restore();
}

/* the ball: rides up inside the rising box, hops straight up out of it the moment the box springs up,
   drops back in and settles with two small bounces. Always upright: only a short squash on each landing.
   Heights are centre heights above the floor (px). */
const bodyRiseAt = t => G.bh * (1 - E.outBack(seg(t, T.land1, T.land1 + 0.20), 1.4));
// tossed up softly by the box: leaves with the box's speed, eases out to the top, then falls back in
const bodyVelAt = t => { const x = seg(t, T.land1, T.land1 + 0.20), s = 1.4; return x <= 0 || x >= 1 ? 0 : G.bh * (3 * (s + 1) * (x - 1) * (x - 1) + 2 * s * (x - 1)) / 0.20; };
const BP = (() => {
  const kb = (T.ballLand - T.land1) / 0.27;                     // hop timing scaled so the ball lands on T.ballLand; apex kept low enough that the square lid corner clears it
  const tp = T.land1 + 0.03 * kb, ta = T.land1 + 0.15 * kb, apex = 140 * U, fall = 0.12 * kb;
  const p0 = G.ballR - bodyRiseAt(tp), m0 = bodyVelAt(tp) * (ta - tp);           // Hermite rise, matched to the box
  const g = 2 * (apex - G.ballR) / (fall * fall), tl = ta + fall;
  const e = 0.40, v2 = e * g * fall, d2 = 2 * v2 / g, v3 = e * v2, d3 = 2 * v3 / g;
  return { tp, ta, apex, p0, m0, g, tl, v2, d2, v3, d3 };
})();
function ballPos(t) {
  const R = G.ballR, B = BP;
  if (t < B.tp) return { x: 0, h: R - bodyRiseAt(t) };
  if (t < B.ta) {
    const s = (t - B.tp) / (B.ta - B.tp), s2 = s * s, s3 = s2 * s;
    return { x: 0, h: (2 * s3 - 3 * s2 + 1) * B.p0 + (s3 - 2 * s2 + s) * B.m0 + (-2 * s3 + 3 * s2) * B.apex };
  }
  if (t < B.tl) { const k = t - B.ta; return { x: 0, h: B.apex - 0.5 * B.g * k * k }; }
  let k = t - B.tl;
  if (k < B.d2) return { x: 0, h: R + B.v2 * k - 0.5 * B.g * k * k };
  k -= B.d2;
  if (k < B.d3) return { x: 0, h: R + B.v3 * k - 0.5 * B.g * k * k };
  return { x: 0, h: R };
}
function ballState(t) {
  const p = ballPos(t), R = G.ballR;
  const hits = [[BP.tl, 0.20], [BP.tl + BP.d2, 0.10]];
  let q = 0; for (const [tc, st] of hits) q = Math.max(q, st * Math.exp(-Math.pow((t - tc) / 0.028, 2)));
  return { x: 0, h: p.h - R * q, r: R, sx: 1 + 0.8 * q, sy: 1 - q, ang: 0 };   // squash anchored at the bottom
}


/* ---------- blur that works everywhere ----------
   ctx.filter blur is not supported by Safari or any iPhone browser, so there the frosted box showed no blur.
   Where it's missing, the same soft blur is made by halving the image a few times and scaling it back up. */
const CAN_FILTER = !Q.has('nofilter') && (() => { try {
  const c = document.createElement('canvas'); c.width = c.height = 9; const x = c.getContext('2d');
  x.filter = 'blur(2px)'; x.fillStyle = '#000'; x.fillRect(4, 4, 1, 1); return x.getImageData(1, 4, 1, 1).data[3] > 0;
} catch (e) { return false; } })();
const BLUR_K = +(Q.get('blurk') || 1.5);                                     // downscale per unit of blur radius (matched to ctx.filter)
const bufs = [document.createElement('canvas'), document.createElement('canvas')].map(c => { c.width = W; c.height = H; return c; });
const bctx = bufs.map(c => { const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; return x; });
function drawBlurred(dst, src, x, y, w, h, sigma) {
  if (CAN_FILTER) { dst.filter = `blur(${sigma.toFixed(1)}px)`; dst.drawImage(src, x, y, w, h, x, y, w, h); dst.filter = 'none'; return; }
  const D = Math.max(1, sigma * BLUR_K), sizes = [[w, h]];
  let d = 1;
  while (d < D) { const n = Math.min(2, D / d); d *= n; sizes.push([Math.max(1, Math.round(w / d)), Math.max(1, Math.round(h / d))]); }
  let from = src, fx = x, fy = y, k = 0;
  for (let i = 1; i < sizes.length; i++) {               // down
    const [sw, sh] = sizes[i - 1], [tw, th] = sizes[i];
    bctx[k].clearRect(0, 0, tw, th); bctx[k].drawImage(from, fx, fy, sw, sh, 0, 0, tw, th);
    from = bufs[k]; fx = 0; fy = 0; k = 1 - k;
  }
  for (let i = sizes.length - 1; i > 1; i--) {            // up (last step goes straight onto the destination)
    const [sw, sh] = sizes[i], [tw, th] = sizes[i - 1];
    bctx[k].clearRect(0, 0, tw, th); bctx[k].drawImage(from, 0, 0, sw, sh, 0, 0, tw, th);
    from = bufs[k]; k = 1 - k;
  }
  const [lw, lh] = sizes.length > 1 ? sizes[1] : [w, h];
  dst.imageSmoothingEnabled = true; dst.imageSmoothingQuality = 'high';
  if (sizes.length > 1) dst.drawImage(from, 0, 0, lw, lh, x, y, w, h); else dst.drawImage(src, x, y, w, h, x, y, w, h);
}

/* ---------- frosted gift box ----------
   orthographic, yaw → pitch, then screen roll; origin = bottom centre of the body, y up.
   Through the frost you see (blurred): whatever is behind the box, the back wall and the ball. Ribbon is outside only. */
function drawGift(p) {
  const bh = G.bh * p.bodyK, lh = G.lh, pivotY = (G.bh * (p.pivotK ?? p.bodyK) + lh) / 2;
  const cp = Math.cos(p.pitch), sp = Math.sin(p.pitch), cyw = Math.cos(p.yaw), syw = Math.sin(p.yaw);
  const cr = Math.cos(p.roll), sr = Math.sin(p.roll);
  const rot = (x, y, z) => { const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw; return [x1, y * cp - z1 * sp, y * sp + z1 * cp]; };
  const qx = p.qx || 1, qy = p.qy || 1, bot = pivotY * p.sc;         // squash & stretch, anchored at the box bottom
  const proj = (x, y, z) => { const [X, Y, Z] = rot(x, y - pivotY, z); const sx = X * p.sc * qx, sy = bot + (-Y * p.sc - bot) * qy;
    return [p.ax + sx * cr - sy * sr, p.ay + sx * sr + sy * cr + (p.offY || 0), Z]; };
  const path = (c, pts) => { c.beginPath(); pts.forEach((q, i) => { const [X, Y] = proj(...q); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath(); };
  const rw = G.rw * (p.ribK ?? 1) / 2, Htot = bh + (p.showLid ? lh : 0);
  const yCut = Htot * (1 - (p.ribFill ?? 1));                 // ribbon wraps from the top down

  const cuboids = [];
  if (bh > 0.5) cuboids.push({ hx: G.bw / 2, y0: 0, y1: bh, lid: false });
  if (p.showLid) cuboids.push({ hx: G.lw / 2, y0: bh, y1: bh + lh, lid: true });
  const faceList = cb => {
    const { hx, y0, y1 } = cb, hz = hx, Y0 = Math.max(y0, yCut);
    const vStrip = (fx, fz, axis) => Y0 < y1 ? [axis === 'x'
      ? [[-rw, Y0, fz], [rw, Y0, fz], [rw, y1, fz], [-rw, y1, fz]]
      : [[fx, Y0, -rw], [fx, Y0, rw], [fx, y1, rw], [fx, y1, -rw]]] : [];
    const f = [
      { n: [0, 0, 1], q: [[-hx, y0, hz], [hx, y0, hz], [hx, y1, hz], [-hx, y1, hz]], r: vStrip(0, hz, 'x') },
      { n: [0, 0, -1], q: [[hx, y0, -hz], [-hx, y0, -hz], [-hx, y1, -hz], [hx, y1, -hz]], r: vStrip(0, -hz, 'x') },
      { n: [1, 0, 0], q: [[hx, y0, hz], [hx, y0, -hz], [hx, y1, -hz], [hx, y1, hz]], r: vStrip(hx, 0, 'z') },
      { n: [-1, 0, 0], q: [[-hx, y0, -hz], [-hx, y0, hz], [-hx, y1, hz], [-hx, y1, -hz]], r: vStrip(-hx, 0, 'z') },
    ];
    if (cb.lid) f.push({ n: [0, 1, 0], top: true, q: [[-hx, y1, hz], [hx, y1, hz], [hx, y1, -hz], [-hx, y1, -hz]],     // only the lid has a top
        r: (p.ribFill ?? 1) > 0.02 ? [[[-rw, y1, hz], [rw, y1, hz], [rw, y1, -hz], [-rw, y1, -hz]], [[-hx, y1, rw], [hx, y1, rw], [hx, y1, -rw], [-hx, y1, -rw]]] : [] });
    return f.map(o => ({ ...o, nr: rot(...o.n) }));
  };

  // silhouette
  const corners = [];
  for (const cb of cuboids) for (const x of [-cb.hx, cb.hx]) for (const y of [cb.y0, cb.y1]) for (const z of [-cb.hx, cb.hx]) corners.push(proj(x, y, z));
  if (!corners.length) return;
  const hull = convexHull(corners.map(c => [c[0], c[1]]));
  // per-part hulls: the back wall behind a still-solid lid stays untinted, so nothing pops at the handoff
  const partHull = cb => { const cs = []; for (const x of [-cb.hx, cb.hx]) for (const y of [cb.y0, cb.y1]) for (const z of [-cb.hx, cb.hx]) cs.push(proj(x, y, z));
    return convexHull(cs.map(c => [c[0], c[1]])); };
  const hulls = cuboids.map(cb => ({ cb, h: partHull(cb) }));
  const addPoly = (c, h) => { h.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); };
  const hullPath = c => { c.beginPath(); for (const o of hulls) addPoly(c, o.h); };
  const blur = (p.blur ?? 16) * U * Math.max(0.6, p.sc);
  let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
  for (const [x, y] of hull) { bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y); }
  const m = blur * 3 + 4;
  bx0 = Math.max(0, Math.floor(bx0 - m)); by0 = Math.max(0, Math.floor(by0 - m));
  bx1 = Math.min(W, Math.ceil(bx1 + m)); by1 = Math.min(H, Math.ceil(by1 + m));
  const bw = bx1 - bx0, bhh = by1 - by0;
  if (bw <= 0 || bhh <= 0) return;

  // 0) soft cast shadow when the box lifts toward the camera (seen through the frost too)
  const sh = p.shadow || 0;
  if (sh > 0.01) {
    const OFF = 30000;
    ctx.save(); ctx.shadowColor = `rgba(${C.shadow},${0.22 * sh})`; ctx.shadowBlur = 80 * U * p.sc * 0.5;
    ctx.shadowOffsetX = OFF; ctx.shadowOffsetY = 95 * U * sh * p.sc * 0.5; ctx.fillStyle = '#000';
    ctx.beginPath(); hull.forEach((q, i) => i ? ctx.lineTo(q[0] - OFF, q[1]) : ctx.moveTo(q[0] - OFF, q[1])); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // 1) what lies behind the front walls → inner canvas
  ictx.clearRect(bx0, by0, bw, bhh);
  ictx.drawImage(cvs, bx0, by0, bw, bhh, bx0, by0, bw, bhh);
  ictx.save(); hullPath(ictx); ictx.clip();
  const ls = p.lidSolid || 0;
  if (ls > 0) for (const o of hulls) {                                         // back wall
    ictx.beginPath(); addPoly(ictx, o.h); ictx.fillStyle = rgb(C.frost, C.aBack * (o.cb.lid ? 1 - ls : 1)); ictx.fill();
  } else { hullPath(ictx); ictx.fillStyle = rgb(C.frost, C.aBack); ictx.fill(); }
  const ball = p.ball;
  if (ball) { const b = proj(ball.x || 0, ball.h, 0); drawBall(ictx, b[0], b[1], ball.r * p.sc, ball.sx, ball.sy, ball.ang); }
  ictx.restore();
  // 2) the part of the ball still above the rim stays sharp
  if (ball && p.ballSharp) { const b = proj(ball.x || 0, ball.h, 0); drawBall(ctx, b[0], b[1], ball.r * p.sc, ball.sx, ball.sy, ball.ang); }
  // 3) frosted view
  ctx.save(); hullPath(ctx); ctx.clip();
  drawBlurred(ctx, inner, bx0, by0, bw, bhh, blur);
  ctx.restore();
  // 4) frosted walls, ribbon, edges
  const edge = Math.max(1, 2.2 * U * Math.sqrt(p.sc));
  for (const cb of cuboids) {
    const solid = cb.lid ? (p.lidSolid || 0) : 0;
    for (const f of faceList(cb)) {
      if (f.nr[2] <= 1e-4) continue;
      const k = shadeK(f.nr);
      const col = shadeC(k, C.frost, C.frostTop, C.frostSide);
      const a = f.top ? C.aTop : C.aFront;
      path(ctx, f.q);
      if (solid > 0) { ctx.fillStyle = rgb(shadeC(k, hex(C.pill), [255, 255, 255], C.frostSide), solid); ctx.fill(); }
      ctx.fillStyle = rgb(col, a * (1 - solid)); ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${0.75 * (1 - solid)})`; ctx.lineWidth = edge; ctx.lineJoin = 'round'; ctx.stroke();
      if (rw > 0.3) for (const r of f.r) { path(ctx, r); ctx.fillStyle = rgb(shadeC(k, hex(C.rib), hex(C.ribTop), hex(C.ribSide))); ctx.fill(); }
    }
  }
  // 5) bow: one solid colour, no inner marks. It pops up upright on the knot beat, then the two loops swing open.
  const bk = p.bowK || 0, tie = p.bowTie ?? 1;
  if (bk > 0.01) {
    const rr = G.bowR * Math.min(1, bk * 1.4);                        // current half-width; the base always sits on the lid
    const ky = Htot + rr * 0.9, elev = lerp(88 * D2R, G.bowElev, tie);
    const loops = [-1, 1].map(s => ({ a: proj(0, ky, 0),
      b: proj(s * Math.cos(elev) * G.bowLen * bk, ky + Math.sin(elev) * G.bowLen * bk, 0) })).sort((A, B) => A.b[2] - B.b[2]);
    ctx.lineCap = 'round';
    if (bk > 0.01) for (const l of loops) {
      ctx.strokeStyle = C.rib; ctx.lineWidth = 2 * G.bowR * p.sc * Math.sqrt(qx * qy) * Math.min(1, bk * 1.4);
      ctx.beginPath(); ctx.moveTo(l.a[0], l.a[1]); ctx.lineTo(l.b[0], l.b[1]); ctx.stroke();
    }
  }
}

/* ---------- logo ---------- */
let LOGO = null;
const FOR_GLYPHS = {   // outlines of the new FOR logotype (attached SVG, white-on-black row), SVG units, y down, baseline 6213.03
  F: { d: 'M3341.77 5039.97L3293.77 5218.66H2815.86C2790.85 5218.66 2770.57 5240.49 2770.57 5265.57L2770.7 5600.26C2770.7 5607.52 2780.43 5605.66 2784.68 5602.87L2824.1 5576.96C2849.32 5564.61 2880.9 5564.61 2912.2 5564.61L3195.99 5563.13L3150.81 5742.02H2801.25C2786.19 5742.02 2770.57 5753.27 2770.57 5774.75L2769.15 6213.03H2545V5807.48C2545 5785.28 2551.46 5750.13 2583.26 5731.81L2611.83 5711.22C2616.85 5708.27 2620.44 5701.34 2613.81 5697.18L2585.8 5679.84C2558.95 5666.39 2545 5632.75 2545 5579.46V5218.66C2545 5186.98 2552.26 5157.86 2585.82 5138.52L2702.44 5053.6C2714.6 5044.75 2729.26 5039.98 2744.31 5039.98L3341.77 5039.97Z', rule: 'nonzero' },
  O: { d: 'M3696.39 5040.84C3920.08 5040.84 4102.33 5221.85 4102.33 5445.14V5808.73C4102.33 6032.02 3920.08 6213.03 3696.39 6213.03C3472.69 6213.03 3290.45 6032.02 3290.45 5808.73V5445.14C3290.45 5221.85 3472.69 5040.84 3696.39 5040.84ZM3696.39 5224.25C3579.22 5224.25 3514.44 5329.31 3514.44 5445.14V5808.73C3514.44 5924.56 3579.22 6030.31 3696.39 6030.31C3813.55 6030.31 3878.21 5924.56 3878.22 5808.73V5445.14C3878.22 5329.31 3813.55 5224.25 3696.39 5224.25Z', rule: 'evenodd' },
  R: { d: 'M4503.69 5040.84C4661.28 5040.84 4776.73 5071.48 4850.03 5132.77C4923.33 5194.07 4959.98 5275.98 4959.98 5378.53C4959.98 5471.64 4926.99 5544.72 4861.02 5597.76C4822.85 5628.34 4773.63 5650.71 4713.38 5664.9C4714.97 5665.49 4716.54 5666.1 4718.09 5666.71C4759.62 5682.04 4792 5707.97 4815.21 5744.51C4838.42 5779.87 4858.58 5830.55 4875.68 5896.56C4896.49 5976.86 4946 6112.45 5068.74 6164.02C5068.74 6189.8 5068.74 6182.95 5068.74 6213.03H4799.57C4710.72 6139.99 4689.75 6047.61 4652.12 5930.15C4641.12 5881.82 4627.08 5844.1 4609.97 5817C4592.87 5789.89 4570.88 5771.03 4544 5760.42C4519.15 5749 4486.84 5743.11 4447.09 5742.76L4443.21 5742.74H4402.51V6213.03H4177.1V5040.84H4503.69ZM4402.51 5557.76H4483.53C4572.71 5557.76 4635.63 5543.25 4672.28 5514.21C4710.15 5485.18 4729.08 5443.3 4729.08 5388.58C4729.08 5333.87 4710.15 5291.99 4672.28 5262.96C4635.63 5233.92 4572.71 5219.4 4483.53 5219.4H4402.51V5557.76Z', rule: 'evenodd' },
};
// metrics from the same SVG: cap height 1173.06, underline 52.28 thick, 64.18 after the R, sitting on the baseline
const FOR_BASE = 6213.03, FOR_TOP = 5039.97, FOR_X0 = 2545.0, FOR_X1 = 5068.74, FOR_UL = 52.28, FOR_GAP = 64.18;
const UNDERSCORE_LEN = 0.80;                                         // underscore length × cap height (the SVG's line is 3.41 — kept short on purpose)
function layoutLogo() {
  const capT = PORTRAIT ? 229 : 217;                                 // cap height in px @1080 — same overall FOR_ width as before
  const k = capT / (FOR_BASE - FOR_TOP) * U;                         // logo scale (SVG unit → px)
  const capH = (FOR_BASE - FOR_TOP) * k, wFOR = (FOR_X1 - FOR_X0) * k;
  const Tu = FOR_UL * k, Lu = UNDERSCORE_LEN * capH, gap = FOR_GAP * k;   // thin underline on the baseline, like the logotype
  const left = L.cx - (wFOR + gap + Lu) / 2;
  const glyphs = ['F', 'O', 'R'].map(c => ({ path: new Path2D(FOR_GLYPHS[c].d), rule: FOR_GLYPHS[c].rule }));
  LOGO = { k, ox: left - FOR_X0 * k, glyphs, ux: left + wFOR + gap + Lu / 2, Lu, Tu, capH };
}
function drawGlyph(i, baseY) {
  const g = LOGO.glyphs[i];
  ctx.save(); ctx.translate(LOGO.ox, baseY - FOR_BASE * LOGO.k); ctx.scale(LOGO.k, LOGO.k);
  ctx.fill(g.path, g.rule); ctx.restore();
}

/* ---------- scene ---------- */
const base = () => L.floorA - 1 * U;                           // screen y of the floor
function pillPhaseA(t) {             // t may be slightly negative: the same path, just before the opening frame
  const u = Math.min(1, t / T.land1);
  const xs = L.cx + L.fw * frameScale(0) / 2 + 70 * U, sc = lerp(0.78, 1.0, E.outQuad(u));
  const y0 = L.floorA - (PORTRAIT ? 330 : 220) * U, y1 = base() - G.lh / 2;
  return { x: lerp(xs, L.cx, u), y: lerp(y0, y1, u) - 4 * (PORTRAIT ? 170 : 110) * U * u * (1 - u), len: G.lw * sc, th: G.lh * sc, ang: lerp(30, 180, u) };
}
const bodyRise = bodyRiseAt;
// the lid (original motion): launched straight up by the rising box, turns 180° forward and covers it
const LIDP = { A: (PORTRAIT ? 280 : 250) * U };
function lidState(t) {
  const u = seg(t, T.land1, T.snap);
  return { x: 0, h: lerp(G.lh / 2, G.bh + G.lh / 2, u) + 4 * LIDP.A * u * (1 - u), ang: 180 + 180 * u };
}
const ribFill = t => E.inOutCubic(seg(t, T.rib0, T.rib1));
const knotK = t => E.outBack(seg(t, T.knot0, T.knot0 + 0.16), 2.0);
const bowK = t => E.outBack(seg(t, T.knot0, T.tie1), 1.6);       // grows from the knot beat (no separate knot shape)
const bowTie = t => E.outBack(seg(t, T.tie0, T.tie1), 1.4);

function giftParams(t) {
  const A0 = { x: L.cx, y: base() - (G.bh + G.lh) / 2 };
  const A1 = { x: L.cx, y: L.cy - (PORTRAIT ? 0.02 : 0.0) * L.fh };
  const A2 = { x: L.cx, y: L.cy - 0.06 * L.fh };
  let sc, ax, ay, pitch;
  if (t < T.peak) { const e = E.outSine(seg(t, T.b0, T.peak)); sc = lerp(1, L.peakScale, e); ax = lerp(A0.x, A1.x, e); ay = lerp(A0.y, A1.y, e); pitch = 34 * E.inOutSine(seg(t, T.b0, T.peak)); }
  else if (t < T.peakEnd) { sc = lerp(L.peakScale, L.peakScale * 1.025, seg(t, T.peak, T.peakEnd)); ax = A1.x; ay = A1.y; pitch = 34; }
  else { const e = E.inOutCubic(seg(t, T.peakEnd, T.r1)); sc = logLerp(L.peakScale * 1.025, 0.42, e); ax = lerp(A1.x, A2.x, e); ay = lerp(A1.y, A2.y, e); pitch = 34 * (1 - e); }
  // the finished 2D box crouches, then springs up off the floor — that hop carries it into the 3D pop-out
  let qx = 1, qy = 1;
  if (t >= T.sq0 && t < T.b0) { const e = E.inOutCubic(seg(t, T.sq0, T.b0)); qy = 1 - 0.14 * e; qx = 1 + 0.07 * e; }
  else if (t >= T.b0) {
    const k = t - T.b0, d = Math.exp(-k / 0.12) * Math.cos(2 * Math.PI * k / 0.32);
    qy = 1 - (d > 0 ? 0.14 : 0.30) * d; qx = 1 + (d > 0 ? 0.07 : 0.15) * d;
    ay -= 70 * U * Math.sin(Math.PI * clamp(k / 0.40)) * (1 - clamp(k / 0.40) * 0.3);
  }
  const v = seg(t, T.b0, T.r1), uR = seg(t, T.peakEnd, T.r1);
  const bodyK = 1 - E.inOutCubic(seg(uR, 0.45, 1.0));
  const shrink = clamp(1 - E.inBack(seg(uR, 0.30, 0.80), 2.0), 0, 2);
  const bk = Math.min(1, bodyK * 1.3);
  return { ax, ay, sc, qx, qy, pitch: pitch * D2R, yaw: -90 * E.inOutSine(v) * D2R, roll: 13 * Math.sin(2 * Math.PI * v) * (1 - 0.3 * v) * D2R,
    bodyK, showLid: true, ribFill: ribFill(t), ribK: 1 - E.inOutCubic(seg(uR, 0.55, 0.95)),
    knotK: knotK(t) * shrink, bowK: bowK(t) * shrink, bowTie: bowTie(t),
    lidSolid: Math.max(1 - E.inOutCubic(seg(t, T.hand, T.hand + 0.30)), E.inOutCubic(seg(uR, 0.55, 1.0))),
    ball: (() => { const b = ballState(t); return { ...b, h: b.h * bk, r: G.ballR * bk }; })(),
    shadow: clamp((sc - 1) / (L.peakScale - 1)), A2 };
}

function drawObjects(t, fy) {
  if (t < T.land1) { const p = pillPhaseA(t); capsule(p.x, p.y, p.len, p.th, p.ang, PILL_R, C.pill); return; }
  if (t < T.hand) {
    const off = bodyRise(t), ay = base() - (G.bh + G.lh) / 2;
    const ball = ballState(t);
    // body (frosted) rising out of the floor; the ball is sharp above the rim, frosted below it
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, fy - 1 * U); ctx.clip();
    drawGift({ ax: L.cx, ay, sc: 1, pitch: 0, yaw: 0, roll: 0, bodyK: 1, pivotK: 1, offY: off, showLid: false, ribFill: 0,
      ball: { ...ball, h: ball.h + off }, ballSharp: true });
    ctx.restore();
    if (t < T.snap) {
      const l = lidState(t), a = l.ang * D2R, half = Math.abs(Math.sin(a)) * G.lw / 2 + Math.abs(Math.cos(a)) * G.lh / 2;
      const wide = Math.abs(Math.cos(a)) * G.lw / 2 + Math.abs(Math.sin(a)) * G.lh / 2;
      let h = l.h;
      if (Math.abs(l.x) < G.bw / 2 + wide) h = Math.max(h, G.bh - off + half);   // never inside the rising body
      capsule(L.cx + l.x, base() - h, G.lw, G.lh, l.ang, PILL_R, C.pill);
    } else {           // closing: capsule → lid, quick squash
      const m = seg(t, T.snap, T.hand), r = PILL_R, sy = 1 - 0.16 * Math.sin(Math.PI * m);
      const hh = G.lh * sy, top = base() - G.bh - hh;
      ctx.beginPath(); ctx.roundRect(L.cx - G.lw / 2, top, G.lw, hh, r); ctx.fillStyle = C.pill; ctx.fill();
    }
    return;
  }
  if (t < T.b0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, fy - 1 * U); ctx.clip(); drawGift(giftParams(t)); ctx.restore(); return; }
  if (t <= T.r1) { drawGift(giftParams(t)); return; }
  const A2 = giftParams(T.r1).A2, uy = L.floorL - 1 * U - LOGO.Tu / 2;
  if (t < T.land2) {   // tossed: small hop, constant sideways drift, full turn that starts at speed and lands flat
    const D = T.land2 - T.r1, k = t - T.r1, u = k / D, dy = uy - A2.y, a = 90 * U;
    const sg = (Math.sqrt(2 * a) + Math.sqrt(2 * a + 2 * dy)) / D, g = sg * sg, v0 = Math.sqrt(2 * g * a);
    const e = E.outCubic(u), len = lerp(G.lw * 0.42, LOGO.Lu, e), th = lerp(G.lh * 0.42, LOGO.Tu, e);
    const ang = 360 * (0.4 * u + 0.6 * E.outQuad(u));
    capsule(lerp(A2.x, LOGO.ux, u), A2.y - v0 * k + 0.5 * g * k * k, len, th, ang, PILL_R, C.pill);
    return;
  }
  // landing: squash, two bounces, a little wobble from the leftover spin
  const k = t - T.land2, B1 = 0.20, H1 = 46 * U, B2 = 0.11, H2 = 12 * U;
  let hop = 0;
  if (k < B1) { const q = k / B1; hop = 4 * H1 * q * (1 - q); }
  else if (k < B1 + B2) { const q = (k - B1) / B2; hop = 4 * H2 * q * (1 - q); }
  const pulse = (kc, st) => k < kc ? 0 : st * Math.exp(-Math.pow((k - kc) / 0.024, 2));
  const sq = Math.max(pulse(0, 0.36), pulse(B1, 0.18), pulse(B1 + B2, 0.07));
  const st = k > 0.02 && k < 0.09 ? 0.08 * Math.sin(Math.PI * (k - 0.02) / 0.07) : 0;
  let usx = 1 + 0.6 * sq - 0.5 * st, usy = 1 - sq + st, wob = 9 * Math.sin(2 * Math.PI * k / 0.24) * Math.exp(-k / 0.16);
  let ux = LOGO.ux, uyy = uy - hop;
  // loop-out: letters duck back into the floor (R first), the underscore crouches, tumbles out to the left,
  // and the opening underscore is already sliding in from the right
  const o = t - T.out0;
  if (o > 0) {
    if (o < T.outC) { const c = E.inOutSine(o / T.outC); usy = 1 - 0.22 * c; usx = 1 + 0.15 * c; }
    else {
      const u = (o - T.outC) / 0.50, xEnd = L.cx - L.fw * frameScale(0) / 2 - 180 * U;
      usy = 1 + 0.12 * Math.max(0, 1 - (o - T.outC) / 0.08); usx = 1 / Math.sqrt(usy);
      ux = lerp(LOGO.ux, xEnd, u); uyy = uy - 4 * 170 * U * u * (1 - u); wob = 360 * u;
    }
  }
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, fy - 1 * U); ctx.clip();
  ctx.fillStyle = C.pill;
  for (let i = 0; i < 3; i++) {
    const st = T.land2 + T.let0 + (2 - i) * T.letS, v = seg(t, st, st + 0.36);
    if (v <= 0) continue;
    const sOut = T.out0 + (2 - i) * 0.035, w = seg(t, sOut, sOut + 0.22);
    if (w >= 1) continue;
    const up = LOGO.capH * 1.12 * (1 - E.outBack(v, 2.0)), down = LOGO.capH * 1.12 * E.inBack(w, 1.8);
    drawGlyph(i, fy - 1 * U + up + down);
  }
  ctx.restore();
  if (o < T.outC + 0.50) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, fy - 1 * U); ctx.clip();
    capsule(ux, uyy, LOGO.Lu, LOGO.Tu, wob, PILL_R, C.pill, usx, usy, o <= T.outC);
    ctx.restore();
  }
  if (t > T.end - 0.30) { const p = pillPhaseA(t - T.end); capsule(p.x, p.y, p.len, p.th, p.ang, PILL_R, C.pill); }
}
function drawSubtitle(t) {
  const lines = PORTRAIT ? ['2026 동서대학교 제품인터랙션디자인전공', '졸업작품 전시', '2026. 11. 05 — 11. 11']
                         : ['2026 동서대학교 제품인터랙션디자인전공 졸업작품 전시', '2026. 11. 05 — 11. 11'];
  const size = (PORTRAIT ? 40 : 30) * U, lh = size * 1.42;
  const top = L.cy + L.fh * L.finalScale * 1.02 / 2 + (PORTRAIT ? 78 : 46) * U;
  ctx.font = `600 ${size}px PretendardS, Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`; ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  try { ctx.letterSpacing = `${-0.01 * size}px`; } catch (e) {}
  lines.forEach((s, i) => {
    const st = T.land2 + T.sub0 + i * T.subS, so = T.out0 + i * 0.04;
    const v = Math.min(E.outCubic(seg(t, st, st + 0.55)), 1 - E.inOutCubic(seg(t, so, so + 0.30)));
    if (v <= 0) return;
    const b = top + i * lh + size;
    ctx.save(); ctx.beginPath(); ctx.rect(0, b - size * 1.15, W, size * 1.45); ctx.clip();
    ctx.fillText(s, L.cx, b + (1 - v) * size * 1.3); ctx.restore();
  });
  try { ctx.letterSpacing = '0px'; } catch (e) {}
  ctx.textAlign = 'start';
}

function render(t) {
  t = clamp(t, 0, T.end);
  const s = frameScale(t), fw = L.fw * s, fh = L.fh * s, fx = L.cx - fw / 2, fyT = L.cy + frameDY(t) - fh / 2;
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = C.line; ctx.lineWidth = 2 * U; ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(fx, fyT); ctx.moveTo(W, 0); ctx.lineTo(fx + fw, fyT);
  ctx.moveTo(0, H); ctx.lineTo(fx, fyT + fh); ctx.moveTo(W, H); ctx.lineTo(fx + fw, fyT + fh); ctx.stroke();
  ctx.fillStyle = C.frame; ctx.fillRect(fx, fyT, fw, fh);
  const fl = floorY(t);
  if (fl > fyT && fl < fyT + fh) { ctx.fillStyle = C.floor; ctx.fillRect(fx, fl - 1 * U, fw, 2 * U); }
  ctx.save();
  if (t < T.b0 || t > T.r1) { ctx.beginPath(); ctx.rect(fx, fyT, fw, fh); ctx.clip(); }
  drawObjects(t, fl);
  ctx.restore();
  drawSubtitle(t);
}


    layoutLogo();
    return { render: render, DUR: DUR, still: T.out0 - 0.2 };
  }

  function mount() {
    try {
      clearTimeout(failsafe);
      var root = document.createElement('div');
      root.id = 'for-intro'; root.className = 'for-intro';
      root.setAttribute('role', 'button'); root.setAttribute('tabindex', '0');
      root.setAttribute('aria-label', 'FOR_ 2026 동서대학교 제품인터랙션디자인전공 졸업작품 전시 인트로. 눌러서 입장하기');
      root.innerHTML = '<canvas class="for-intro__canvas" aria-hidden="true"></canvas>' +
        (HINT ? '<span class="for-intro__hint for-intro__ui" aria-hidden="true">OPEN</span>' : '');
      document.body.appendChild(root);
      html.classList.remove('for-intro-pending');
      var cvs = root.querySelector('canvas'), bump = null, left = false, raf = 0, t0 = performance.now();
      function build() {
        var w = Math.max(1, root.clientWidth || innerWidth), h = Math.max(1, root.clientHeight || innerHeight);
        var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        var cap = Math.sqrt(1600000 / (w * h * dpr * dpr)); if (cap < 1) dpr *= cap;   // keep mobile GPUs smooth
        bump = createBumper(cvs, Math.round(w * dpr), Math.round(h * dpr));
        if (reduce) bump.render(bump.still);
      }
      build();
      if (!reduce) {
        var loop = function (now) { if (left && !raf) return; bump.render(((now - t0) / 1000) % bump.DUR); raf = requestAnimationFrame(loop); };
        bump.render(0); raf = requestAnimationFrame(loop);
      }
      var rt;
      function onResize() { clearTimeout(rt); rt = setTimeout(build, 120); }
      window.addEventListener('resize', onResize);
      function enter() {
        if (left) return; left = true;
        try { if (ONCE) sessionStorage.setItem('for-intro-seen', '1'); } catch (e) {}
        root.classList.add('is-leaving');
        html.classList.remove('for-intro-lock');
        var finished = false;
        function finish() {
          if (finished) return; finished = true;
          cancelAnimationFrame(raf); raf = 0;
          window.removeEventListener('resize', onResize);
          root.remove(); style.remove(); done();
        }
        root.addEventListener('transitionend', function (e) { if (e.target === root) finish(); });
        setTimeout(finish, 1300);
      }
      root.addEventListener('click', enter);
      root.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
      root.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || ((e.key === 'Enter' || e.key === ' ') && e.target === root)) { e.preventDefault(); enter(); }
      });
      root.focus({ preventScroll: true });
      window.FORIntro = { enter: enter };
    } catch (err) {
      html.classList.remove('for-intro-pending', 'for-intro-lock');
      if (window.console) console.warn('[for-intro]', err);
    }
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
