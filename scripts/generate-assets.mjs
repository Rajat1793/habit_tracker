#!/usr/bin/env node
/**
 * Generate app icon / adaptive icon / splash / favicon PNGs from pure code.
 *
 * pngjs is already installed as a transitive dep, so we build the images
 * pixel-by-pixel from an SDF mascot silhouette. Runs offline with zero extra
 * dependencies.
 *
 * Brand: a friendly rounded-triangle character ("the sprout") with a simple
 * smiley face — the app's logo. Leaf-green body on a warm cream field.
 *
 * Palette (mirrors src/theme/colors.ts):
 *   cream     = #F1F0E4  (icon / splash background, light)
 *   inkGreen  = #0E1A12  (dark splash background)
 *   moss      = #4FA857  (mascot body)
 *   mossLight = #69C071  (top sheen)
 *   face      = #14281A  (eyes + smile)
 *
 * Outputs land in assets/ at the repo root — referenced by app.json.
 *
 * Usage:  node scripts/generate-assets.mjs
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const OUT_DIR = join(REPO_ROOT, 'assets');
mkdirSync(OUT_DIR, { recursive: true });

// ─── palette ────────────────────────────────────────────────────────────────
const CREAM = [0xf1, 0xf0, 0xe4, 0xff];
const MOSS = [0x4f, 0xa8, 0x57, 0xff];
const MOSS_LIGHT = [0x69, 0xc0, 0x71, 0xff];
const FACE = [0x14, 0x28, 0x1a, 0xff];
const GREEN_BRIGHT = [0x5f, 0xbe, 0x68]; // landing accent (matches onboarding)
const TRANSPARENT = [0, 0, 0, 0];

// ─── shape helpers ──────────────────────────────────────────────────────────

/**
 * Signed distance to an equilateral triangle (Inigo Quilez), apex pointing
 * DOWN in the passed coords. Callers negate `v` so it points UP on screen.
 * Negative inside, positive outside; `r` sets the size.
 */
function sdEqTriangle(px, py, r) {
  const k = Math.sqrt(3);
  let x = Math.abs(px) - r;
  let y = py + r / k;
  if (x + k * y > 0) {
    const nx = (x - k * y) / 2;
    const ny = (-k * x - y) / 2;
    x = nx;
    y = ny;
  }
  x -= Math.min(Math.max(x, -2 * r), 0);
  return -Math.hypot(x, y) * Math.sign(y);
}

// Mascot geometry in normalized coords (u,v ∈ ~[-1,1], v points UP).
const TRI_R = 0.66; // triangle size
const TRI_ROUND = 0.17; // corner-rounding radius (bigger = softer, chunkier)

/** Rounded-triangle insideness in *normalized* units (>0 inside). */
function bodyField(u, v) {
  // Apex points UP; sit the shape slightly high so the wide base leaves
  // room for the face.
  const d = sdEqTriangle(u, v - 0.02, TRI_R);
  return TRI_ROUND - d; // >0 inside the rounded triangle
}

// Face features, positioned in the wide lower half of the triangle.
const EYE_X = 0.16;
const EYE_Y = 0.05; // eyes sit a touch higher
const EYE_RX = 0.05;
const EYE_RY = 0.07;
const SMILE_CY = -0.05; // circle center (arc curves below it → happy "U")
const SMILE_R = 0.19;
const SMILE_STROKE = 0.03;

/** Elliptical eye insideness in normalized units (>0 inside). */
function eyeField(u, v, ex) {
  const dist = Math.hypot((u - ex) / EYE_RX, (v - EYE_Y) / EYE_RY);
  return (1 - dist) * EYE_RX; // approx signed distance
}

/** Smile-stroke insideness in normalized units (>0 on the stroke). */
function smileField(u, v) {
  const dy = SMILE_CY - v; // positive below the center
  if (dy < 0.02) return -1; // only the lower arc → open-top "U"
  const dist = Math.hypot(u, v - SMILE_CY);
  return SMILE_STROKE - Math.abs(dist - SMILE_R);
}

// ─── blitting ───────────────────────────────────────────────────────────────

/**
 * @param {number} size  square canvas side in px
 * @param {number[]} bg  RGBA background; use [0,0,0,0] for transparent
 * @param {object} opts
 *   opts.scale   — mascot radius as fraction of half-canvas (default 0.72)
 *   opts.center  — [cx, cy] normalized ∈ [0,1] (default [0.5, 0.52])
 *   opts.body    — body RGBA (default moss)
 *   opts.face    — draw the smiley face (default true)
 */
function renderMascot(size, bg, opts = {}) {
  const png = new PNG({ width: size, height: size, filterType: -1 });
  const scale = opts.scale ?? 0.72;
  const center = opts.center ?? [0.5, 0.52];
  const body = opts.body ?? MOSS;
  const drawFace = opts.face ?? true;

  const cx = size * center[0];
  const cy = size * center[1];
  const R = (size / 2) * scale;
  const buf = png.data;

  // ~1.5px anti-aliasing softness, expressed in normalized units.
  const aa = 1.5 / R;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      let r = bg[0], g = bg[1], b = bg[2], a = bg[3];

      const u = (x - cx) / R;
      const v = (cy - y) / R; // v up

      const bodyIn = bodyField(u, v);
      if (bodyIn > -aa) {
        // Solid moss body.
        const bodyA = clamp01(0.5 + bodyIn / aa);
        [r, g, b, a] = compose(
          [r, g, b, a],
          [body[0], body[1], body[2], Math.round(bodyA * 255)],
        );

        // Soft top sheen — a lighter green wash in the upper third for depth.
        if (v > 0.05) {
          const sheen = clamp01((v - 0.05) / 0.6) * 0.16;
          [r, g, b, a] = compose(
            [r, g, b, a],
            [
              MOSS_LIGHT[0],
              MOSS_LIGHT[1],
              MOSS_LIGHT[2],
              Math.round(sheen * 255 * bodyA),
            ],
          );
        }

        if (drawFace) {
          // Eyes.
          const eL = eyeField(u, v, -EYE_X);
          const eR = eyeField(u, v, EYE_X);
          const eyeIn = Math.max(eL, eR);
          if (eyeIn > -aa) {
            const eyeA = clamp01(0.5 + eyeIn / aa);
            [r, g, b, a] = compose(
              [r, g, b, a],
              [FACE[0], FACE[1], FACE[2], Math.round(eyeA * 255)],
            );
          }
          // Smile.
          const sIn = smileField(u, v);
          if (sIn > -aa) {
            const sA = clamp01(0.5 + sIn / aa);
            [r, g, b, a] = compose(
              [r, g, b, a],
              [FACE[0], FACE[1], FACE[2], Math.round(sA * 255)],
            );
          }
        }
      }

      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = a;
    }
  }

  return PNG.sync.write(png);
}

function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** Straight "over" alpha composite of `src` on `dst`, both in [0,255]. */
function compose(dst, src) {
  const sa = src[3] / 255;
  const da = dst[3] / 255;
  const outA = sa + da * (1 - sa);
  if (outA <= 0) return [0, 0, 0, 0];
  const r = (src[0] * sa + dst[0] * da * (1 - sa)) / outA;
  const g = (src[1] * sa + dst[1] * da * (1 - sa)) / outA;
  const b = (src[2] * sa + dst[2] * da * (1 - sa)) / outA;
  return [Math.round(r), Math.round(g), Math.round(b), Math.round(outA * 255)];
}

// ─── landing hero: blob mascot + wavy squiggle ───────────────────────────────

/** Distance from point (px,py) to segment (ax,ay)-(bx,by). */
function sdSegment(px, py, ax, ay, bx, by) {
  const pax = px - ax;
  const pay = py - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const h = clamp01((pax * bax + pay * bay) / (bax * bax + bay * bay));
  return Math.hypot(pax - bax * h, pay - bay * h);
}

// Blob = a fat capsule ("head + trailing body") with a smiley on the head.
const BLOB_A = [-0.12, 0.08]; // head center — the face lives here
const BLOB_B = [0.82, -0.34]; // tail — runs off toward the bottom-right
const BLOB_R = 0.52;
const BEYE_X = 0.13;
const BEYE_RX = 0.055;
const BEYE_RY = 0.078;
const BSMILE_R = 0.17;
const BSMILE_STROKE = 0.03;

function renderBlob(size) {
  const png = new PNG({ width: size, height: size, filterType: -1 });
  const buf = png.data;
  const R = size / 2;
  const aa = 1.5 / R;
  const c = size / 2;
  const fx = BLOB_A[0];
  const fy = BLOB_A[1];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      let r = 0, g = 0, b = 0, a = 0;
      const u = (x - c) / R;
      const v = (c - y) / R;

      const bodyIn =
        BLOB_R - sdSegment(u, v, BLOB_A[0], BLOB_A[1], BLOB_B[0], BLOB_B[1]);
      if (bodyIn > -aa) {
        const bodyA = clamp01(0.5 + bodyIn / aa);
        [r, g, b, a] = compose(
          [r, g, b, a],
          [MOSS[0], MOSS[1], MOSS[2], Math.round(bodyA * 255)],
        );

        // Soft top sheen for depth.
        if (v > -0.1) {
          const sheen = clamp01((v + 0.1) / 0.7) * 0.14;
          [r, g, b, a] = compose(
            [r, g, b, a],
            [
              MOSS_LIGHT[0],
              MOSS_LIGHT[1],
              MOSS_LIGHT[2],
              Math.round(sheen * 255 * bodyA),
            ],
          );
        }

        // Eyes.
        const eyeY = fy + 0.03; // lift the eyes for a clear gap to the smile
        const eL =
          (1 - Math.hypot((u - (fx - BEYE_X)) / BEYE_RX, (v - eyeY) / BEYE_RY)) *
          BEYE_RX;
        const eR =
          (1 - Math.hypot((u - (fx + BEYE_X)) / BEYE_RX, (v - eyeY) / BEYE_RY)) *
          BEYE_RX;
        const eyeIn = Math.max(eL, eR);
        if (eyeIn > -aa) {
          const eyeA = clamp01(0.5 + eyeIn / aa);
          [r, g, b, a] = compose(
            [r, g, b, a],
            [FACE[0], FACE[1], FACE[2], Math.round(eyeA * 255)],
          );
        }

        // Smile — lower arc of a circle centered well below the eyes.
        const scy = fy - 0.1;
        if (scy - v > 0.02) {
          const sd =
            BSMILE_STROKE - Math.abs(Math.hypot(u - fx, v - scy) - BSMILE_R);
          if (sd > -aa) {
            const sA = clamp01(0.5 + sd / aa);
            [r, g, b, a] = compose(
              [r, g, b, a],
              [FACE[0], FACE[1], FACE[2], Math.round(sA * 255)],
            );
          }
        }
      }

      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = a;
    }
  }
  return PNG.sync.write(png);
}

/** Hand-drawn-ish green wavy underline on a transparent field. */
function renderSquiggle(w, h) {
  const png = new PNG({ width: w, height: h, filterType: -1 });
  const buf = png.data;
  const mid = h / 2;
  const amp = h * 0.26;
  const cycles = 2.75;
  const thick = Math.max(2.2, h * 0.11);
  const k = (cycles * 2 * Math.PI) / (w - 1);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const targetY = mid - amp * Math.sin(x * k);
      // Perpendicular distance keeps the stroke an even width on the slopes.
      const slope = -amp * Math.cos(x * k) * k;
      const perp = Math.abs(y - targetY) / Math.sqrt(1 + slope * slope);
      let alpha = clamp01((thick - perp) / 1.5 + 0.5);
      // Taper the ends like a pen lift.
      const edge = Math.min(x, w - 1 - x);
      const pad = thick + 2;
      if (edge < pad) alpha *= clamp01(edge / pad);
      if (alpha <= 0) {
        buf[idx + 3] = 0;
        continue;
      }
      buf[idx] = GREEN_BRIGHT[0];
      buf[idx + 1] = GREEN_BRIGHT[1];
      buf[idx + 2] = GREEN_BRIGHT[2];
      buf[idx + 3] = Math.round(alpha * 255);
    }
  }
  return PNG.sync.write(png);
}

/**
 * Google Play feature graphic (1024×500). Cream field with the blob mascot on
 * the right and a soft green corner accent — text-free so it renders crisply
 * (add a headline in any editor if you want one).
 */
function renderFeatureGraphic(w, h) {
  const png = new PNG({ width: w, height: h, filterType: -1 });
  const buf = png.data;
  const R = h * 0.44; // mascot half-size
  const mcx = w * 0.72; // mascot center, right of frame
  const mcy = h * 0.54;
  const aa = 1.5 / R;
  const fx = BLOB_A[0];
  const fy = BLOB_A[1];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      // Cream background with a faint diagonal green wash bottom-left.
      let r = CREAM[0], g = CREAM[1], b = CREAM[2], a = 255;
      const wash = clamp01((1 - x / w) * 0.9 + (y / h) * 0.5 - 0.5) * 0.1;
      if (wash > 0) {
        [r, g, b, a] = compose(
          [r, g, b, a],
          [MOSS[0], MOSS[1], MOSS[2], Math.round(wash * 255)],
        );
      }

      const u = (x - mcx) / R;
      const v = (mcy - y) / R;
      const bodyIn =
        BLOB_R - sdSegment(u, v, BLOB_A[0], BLOB_A[1], BLOB_B[0], BLOB_B[1]);
      if (bodyIn > -aa) {
        const bodyA = clamp01(0.5 + bodyIn / aa);
        [r, g, b, a] = compose(
          [r, g, b, a],
          [MOSS[0], MOSS[1], MOSS[2], Math.round(bodyA * 255)],
        );
        if (v > -0.1) {
          const sheen = clamp01((v + 0.1) / 0.7) * 0.14;
          [r, g, b, a] = compose(
            [r, g, b, a],
            [MOSS_LIGHT[0], MOSS_LIGHT[1], MOSS_LIGHT[2], Math.round(sheen * 255 * bodyA)],
          );
        }
        const eyeY = fy + 0.03;
        const eL = (1 - Math.hypot((u - (fx - BEYE_X)) / BEYE_RX, (v - eyeY) / BEYE_RY)) * BEYE_RX;
        const eR = (1 - Math.hypot((u - (fx + BEYE_X)) / BEYE_RX, (v - eyeY) / BEYE_RY)) * BEYE_RX;
        const eyeIn = Math.max(eL, eR);
        if (eyeIn > -aa) {
          const eyeA = clamp01(0.5 + eyeIn / aa);
          [r, g, b, a] = compose([r, g, b, a], [FACE[0], FACE[1], FACE[2], Math.round(eyeA * 255)]);
        }
        const scy = fy - 0.1;
        if (scy - v > 0.02) {
          const sd = BSMILE_STROKE - Math.abs(Math.hypot(u - fx, v - scy) - BSMILE_R);
          if (sd > -aa) {
            const sA = clamp01(0.5 + sd / aa);
            [r, g, b, a] = compose([r, g, b, a], [FACE[0], FACE[1], FACE[2], Math.round(sA * 255)]);
          }
        }
      }

      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = a;
    }
  }
  return PNG.sync.write(png);
}

// ─── asset variants ─────────────────────────────────────────────────────────

function writePng(name, bytes) {
  const p = join(OUT_DIR, name);
  writeFileSync(p, bytes);
  console.log(`  ✓ ${name}  (${bytes.length.toLocaleString()} B)`);
}

console.log('Generating assets → assets/');

// iOS + fallback icon: full-bleed cream, green mascot.
writePng(
  'icon.png',
  renderMascot(1024, CREAM, { scale: 0.74, center: [0.5, 0.52] }),
);

// Android adaptive-icon foreground: transparent bg, mascot at ~54% so it fits
// inside the platform's inner 66% safe zone.
writePng(
  'adaptive-icon.png',
  renderMascot(1024, TRANSPARENT, { scale: 0.54, center: [0.5, 0.52] }),
);

// Splash: cream background, mascot centered.
writePng(
  'splash.png',
  renderMascot(2048, CREAM, { scale: 0.3, center: [0.5, 0.5] }),
);

// Favicon (web): 48px chunky mascot on cream.
writePng(
  'favicon.png',
  renderMascot(48, CREAM, { scale: 0.86, center: [0.5, 0.52] }),
);

// Big square social/preview asset (nice-to-have; safe to ignore).
writePng(
  'icon-social.png',
  renderMascot(1200, CREAM, { scale: 0.46, center: [0.5, 0.5] }),
);

// Landing hero: blob character + wavy underline (transparent).
writePng('mascot-blob.png', renderBlob(1024));
writePng('squiggle.png', renderSquiggle(280, 64));

// Google Play feature graphic (1024×500) → docs/store/.
const STORE_DIR = join(REPO_ROOT, 'docs', 'store');
mkdirSync(STORE_DIR, { recursive: true });
const featureBytes = renderFeatureGraphic(1024, 500);
writeFileSync(join(STORE_DIR, 'feature-graphic.png'), featureBytes);
console.log(
  `  ✓ docs/store/feature-graphic.png  (${featureBytes.length.toLocaleString()} B)`,
);

// Google Play high-res store icon (512×512, opaque) → docs/store/.
const playIconBytes = renderMascot(512, CREAM, { scale: 0.74, center: [0.5, 0.52] });
writeFileSync(join(STORE_DIR, 'play-icon-512.png'), playIconBytes);
console.log(
  `  ✓ docs/store/play-icon-512.png  (${playIconBytes.length.toLocaleString()} B)`,
);

console.log('Done.');
