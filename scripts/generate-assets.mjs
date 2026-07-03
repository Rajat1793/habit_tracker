#!/usr/bin/env node
/**
 * Generate app icon / adaptive icon / splash / favicon PNGs from pure code.
 *
 * We can't ship a real design tool, but pngjs is already installed as a
 * transitive dep, so we build the images pixel-by-pixel from an SDF-ish
 * flame silhouette. Runs offline with zero extra dependencies.
 *
 * Palette (mirrors src/theme/colors.ts):
 *   ink    = #0F1115  (splash / icon background)
 *   coral  = #E94B35  (flame body)
 *   peach  = #FFEBCC  (highlight)
 *   cream  = #F7F6F2  (adaptive icon fallback tint)
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
const INK = [0x0f, 0x11, 0x15, 0xff];
const CORAL = [0xe9, 0x4b, 0x35, 0xff];
const CORAL_DEEP = [0xc2, 0x38, 0x25, 0xff];
const PEACH = [0xff, 0xeb, 0xcc, 0xff];
const CREAM = [0xf7, 0xf6, 0xf2, 0xff];
const TRANSPARENT = [0, 0, 0, 0];

// ─── shape helpers ──────────────────────────────────────────────────────────

/**
 * "Insideness" for the flame silhouette in normalized coords.
 *   (u, v) both in roughly [-1, 1], v points UP (image y is flipped in caller).
 * Returns > 0 inside, ≤ 0 outside. Value approximates a signed distance in
 * normalized units so the caller can anti-alias by scaling by pixels/unit.
 *
 * Silhouette: single smooth "half-width" profile that bulges at the base
 * and tapers to a point at the top — the classic flame teardrop. One
 * function → no visible seams / lumps between primitives.
 */
const V_BOTTOM = -0.70;
const V_TOP = 0.90;
const T_PEAK = 0.30; // widest point sits low in the flame → fat-bottom stance
const W_MAX = 0.44;  // half-width at the peak (normalized units)

function halfWidth(v) {
  if (v <= V_BOTTOM || v >= V_TOP) return 0;
  const t = (v - V_BOTTOM) / (V_TOP - V_BOTTOM); // 0 bottom → 1 top

  if (t <= T_PEAK) {
    // Bottom arc: upper half of an ellipse centered at t = T_PEAK, height
    // T_PEAK. sqrt(1 - k²) gives a smooth rounded dome that reaches W_MAX
    // exactly at t = T_PEAK with zero slope (matches the taper above).
    const k = (t - T_PEAK) / T_PEAK; // -1 → 0
    return W_MAX * Math.sqrt(Math.max(0, 1 - k * k));
  }
  // Top taper: (1 - s^1.3)^0.7 has zero slope at the peak (smooth shoulder)
  // and infinite slope at s = 1 (sharp flame tip). One unified curve → no
  // visible seams between the base and the taper.
  const s = (t - T_PEAK) / (1 - T_PEAK); // 0 → 1
  return W_MAX * Math.pow(Math.max(0, 1 - Math.pow(s, 1.3)), 0.7);
}

function flameField(u, v) {
  const w = halfWidth(v);
  if (w <= 0) return -1;
  // Signed distance to the vertical band |u| ≤ w. Positive inside.
  return w - Math.abs(u);
}

/**
 * Inner "core" glow — a small warm oval that sits near the base of the
 * flame. Reads as candle-glow depth, not a competing shape.
 */
function highlightField(u, v) {
  const cx = 0.0;
  const cy = V_BOTTOM + (V_TOP - V_BOTTOM) * (T_PEAK - 0.05); // just below peak
  const rx = 0.14;
  const ry = 0.24;
  const d = 1 - ((u - cx) * (u - cx)) / (rx * rx) - ((v - cy) * (v - cy)) / (ry * ry);
  return d * Math.min(rx, ry); // approximate distance
}

// ─── blitting ───────────────────────────────────────────────────────────────

/**
 * @param {number} size  square canvas side in px
 * @param {number[]} bg  RGBA background; use [0,0,0,0] for transparent
 * @param {object} opts
 *   opts.scale      — flame radius as fraction of half-canvas (default 0.72)
 *   opts.center     — [cx, cy] normalized ∈ [0,1] (default [0.5, 0.55])
 *   opts.coral      — main coral RGBA
 *   opts.highlight  — inner highlight RGBA
 *   opts.padCorners — if true, mask output to a rounded-square (for icon)
 */
function renderFlame(size, bg, opts = {}) {
  const png = new PNG({ width: size, height: size, filterType: -1 });
  const scale = opts.scale ?? 0.72;
  const center = opts.center ?? [0.5, 0.55];
  const coral = opts.coral ?? CORAL;
  const coralDeep = opts.coralDeep ?? CORAL_DEEP;
  const highlight = opts.highlight ?? PEACH;

  const cx = size * center[0];
  const cy = size * center[1];
  const R = (size / 2) * scale;

  // Corner-rounding for icon: iOS auto-masks; Android may not. Keep a
  // subtle radius so an unrendered raw icon still looks intentional.
  const corner = opts.padCorners ? size * 0.22 : 0;

  const buf = png.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Start from the background.
      let r = bg[0], g = bg[1], b = bg[2], a = bg[3];

      // Optional rounded-square mask (works for opaque bg).
      if (corner > 0) {
        const dx = Math.max(corner - x, 0, x - (size - corner - 1));
        const dy = Math.max(corner - y, 0, y - (size - corner - 1));
        if (dx > 0 && dy > 0) {
          const d = Math.hypot(dx, dy);
          if (d > corner) {
            // Fully outside the rounded corner — force transparent.
            buf[idx] = 0; buf[idx + 1] = 0; buf[idx + 2] = 0; buf[idx + 3] = 0;
            continue;
          }
        }
      }

      // Convert pixel to normalized flame coords (v flipped so +v is up).
      const u = (x - cx) / R;
      const v = (cy - y) / R;

      // Anti-aliasing: field value already in normalized units, so multiply
      // by pixels-per-unit to get a soft signed distance in pixels.
      const perUnit = R;
      const flameSoft = flameField(u, v) * perUnit;
      if (flameSoft > -1.2) {
        // Solid coral silhouette. No outline lip — flat brand mark reads
        // cleaner than a chunky border at small sizes (favicon).
        const edgeAlpha = clamp01(0.5 + flameSoft / 2.4);
        [r, g, b, a] = compose(
          [r, g, b, a],
          [coral[0], coral[1], coral[2], Math.round(edgeAlpha * 255)],
        );

        // Very soft interior highlight — a small warm oval near the base
        // that reads as a candle-glow. Capped at 14% opacity so it stays
        // as depth cue, never a competing shape.
        const hlSoft = highlightField(u, v) * perUnit;
        if (hlSoft > -1.2) {
          const hlA = clamp01(0.5 + hlSoft / 2.4) * 0.14;
          [r, g, b, a] = compose(
            [r, g, b, a],
            [highlight[0], highlight[1], highlight[2], Math.round(hlA * 255)],
          );
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

// ─── asset variants ─────────────────────────────────────────────────────────

function writePng(name, bytes) {
  const p = join(OUT_DIR, name);
  writeFileSync(p, bytes);
  console.log(`  ✓ ${name}  (${bytes.length.toLocaleString()} B)`);
}

console.log('Generating assets → assets/');

// iOS + fallback icon: full-bleed ink, coral flame.
writePng(
  'icon.png',
  renderFlame(1024, INK, { scale: 0.68, center: [0.5, 0.56], padCorners: false }),
);

// Android adaptive-icon foreground: transparent bg, flame at ~50% of canvas
// so it fits inside the platform's inner 66% safe zone.
writePng(
  'adaptive-icon.png',
  renderFlame(1024, TRANSPARENT, { scale: 0.50, center: [0.5, 0.55] }),
);

// Splash: dark ink background, flame at ~28% of canvas centered.
writePng(
  'splash.png',
  renderFlame(2048, INK, { scale: 0.28, center: [0.5, 0.50] }),
);

// Favicon (web): 48px, chunky flame on ink.
writePng(
  'favicon.png',
  renderFlame(48, INK, { scale: 0.78, center: [0.5, 0.56] }),
);

// Big square social/preview asset (nice-to-have; safe to ignore).
writePng(
  'icon-social.png',
  renderFlame(1200, INK, { scale: 0.42, center: [0.5, 0.52] }),
);

console.log('Done.');
