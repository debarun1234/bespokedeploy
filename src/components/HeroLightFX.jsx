import { useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────
// HeroLightFX — volumetric projector-beam + atmospheric smoke for the hero
// section (dark mode only). A raw WebGL1 fragment shader (no three.js — kept
// light) renders a physically-inspired light cone with soft penumbra edges,
// fBm/curl-noise smoke that only "catches" inside the cone (Tyndall
// scattering), and a handful of drifting dust motes. A small CPU-side
// mirror of the same falloff math drives a synced DOM overlay that
// brightens the headline text where the beam crosses it.
//
// TUNING — all the knobs the spec asked for, in one place:
export const HERO_LIGHT_CONFIG = {
  beamSpread:     0.30,   // half-angle of the cone, radians (~17°) — smaller = tighter beam
  beamIntensity:  1.35,   // overall brightness multiplier — the ray is now beam × smoke, so this needs to carry more
  smokeSpeed:     0.78,   // noise animation speed
  smokeDensity:   0.9,    // how strongly the ray shows where smoke is present (ray = beam × smoke, so this is the main visibility knob now)
  particleCount:  5,      // 0–8 drifting dust motes inside the cone
  originPosition: 'bottom-left', // 'bottom-left' | 'bottom-center' | 'bottom-right'
  useCoolTemperature: false,     // false = warm tungsten, true = cool projector-blue
  colorWarm: [1.00, 0.80, 0.55],
  colorCool: [0.55, 0.78, 1.00],
  dprCap:     1.5,        // device-pixel-ratio cap (perf)
  renderScale: 0.9,       // canvas rendered slightly below CSS size then upscaled (perf; kept high so smoke noise detail isn't blurred away)
  // Was 0.5 — combined with the mobile dprCap of 1 below, that rendered the
  // whole effect at a genuinely tiny backing resolution (e.g. ~195 device px
  // wide on a 390px-wide phone). The fbm/value-noise underneath aliases hard
  // at low sample density, showing up as a visible blocky/checkerboard grid
  // instead of smooth smoke. Raised for a real fix rather than papering over
  // it with blur.
  mobileRenderScale: 0.72,
};

// ─── Shaders ────────────────────────────────────────────────────────────
const VERTEX_SRC = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// GLSL ES 1.00 (WebGL1) — value-noise fBm driving the smoke, a corner-anchored
// cone with smoothstep penumbra + inverse-square-style attenuation for the
// beam, and a small fixed-size loop of hashed dust motes gated by
// u_particleCount so the count is tunable without recompiling.
const FRAGMENT_SRC = `
precision highp float;
uniform vec2  u_resolution;   // device px
uniform float u_time;
uniform vec2  u_origin;       // device px, y-down (DOM space)
uniform vec2  u_target;       // device px, y-down
uniform float u_spread;       // half-angle, radians
uniform float u_intensity;
uniform float u_smokeSpeed;
uniform float u_smokeDensity;
uniform float u_particleCount;
uniform vec3  u_color;
uniform float u_reducedMotion;
uniform float u_uiScale;      // deviceWidth / reference width — keeps smoke/dust
                               // feature size proportional to the actual screen
                               // instead of a fixed pixel count

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float fbm(vec2 p) {
  float v = 0.0, amp = 0.5;
  for (int i = 0; i < 4; i++) {
    v += amp * noise(p);
    p *= 2.02;
    amp *= 0.5;
  }
  return v;
}
// Cheap curl-like warp: sample fbm at two offset points and use the
// difference as a drift vector — avoids a real fluid solve while still
// giving the smoke a swirling, non-linear flow.
vec2 curl(vec2 p, float t) {
  float n1 = fbm(p + vec2(0.0, 0.0) + t);
  float n2 = fbm(p + vec2(5.2, 1.3) - t);
  return (vec2(n1, n2) - 0.5) * 2.0;
}

void main() {
  // Flip to y-down so this matches DOM/CSS pixel space (gl_FragCoord is y-up).
  vec2 uv = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);

  vec2 toFrag = uv - u_origin;
  float dist = length(toFrag);
  vec2 dir = normalize(u_target - u_origin);
  float cosA = clamp(dot(normalize(toFrag + 1e-4), dir), -1.0, 1.0);
  float angle = acos(cosA);

  // Soft penumbra: smoothstep rather than a hard cutoff.
  float cone = 1.0 - smoothstep(u_spread * 0.55, u_spread, angle);
  float atten = 1.0 / (1.0 + 0.0000022 * dist * dist);

  // A small glow right at the source (the "lamp" itself is visible even in
  // clear air) — everything past this is real Tyndall scattering: the beam
  // itself has no color of its own along its length, it only becomes
  // visible where it hits smoke. No smoke = no visible ray.
  float originGlow = smoothstep(260.0, 0.0, dist) * 0.55;

  // prefers-reduced-motion slows the drift to a bare crawl rather than
  // freezing it outright — a fully static frame reads as broken/dead, and
  // WCAG's intent is "avoid large, fast motion," not "no motion at all."
  float t = u_time * u_smokeSpeed * (u_reducedMotion > 0.5 ? 0.35 : 1.0);
  vec2 noiseUV = uv * 0.0044;
  // Smaller-magnitude, higher-frequency warp than before — the previous
  // version warped at the SAME scale as the base noise, which produced
  // smooth, evenly-spaced rolling contours (i.e. it read as water waves).
  // Warping at a finer scale breaks that regularity into more chaotic,
  // turbulent shapes instead.
  noiseUV += curl(noiseUV * 4.2, t * 0.6) * 0.22;
  noiseUV += vec2(t * 0.05, -t * 0.11);
  float smokeRaw = fbm(noiseUV);
  // Fine turbulent detail layered on top, sampled independently at a much
  // higher frequency — this is what breaks up smooth wave-like contours
  // into the fine, chaotic wisp texture real smoke has.
  float detail = fbm(noiseUV * 3.0 + vec2(t * 0.22, -t * 0.17));
  // Light touch — enough to break up smooth contours into believable wisps,
  // not so much it prints a bold marble/wood-grain pattern across the sky.
  smokeRaw = mix(smokeRaw, smokeRaw * detail, 0.28);
  // Gentle-but-visible gamma — feathery wisps, not a flat block.
  float smokeN = pow(smokeRaw, 1.3);
  // Wide, soft threshold — a gentle fade into visibility rather than a
  // defined edge, so it reads as hazy air catching light, not a graphic
  // shape stamped on the background.
  smokeN = smoothstep(0.16, 0.85, smokeN) * 0.8;

  // Cheap edge detection: sample the same fbm a hair's-width away in two
  // directions and take the difference. Where smoke density changes fast
  // (the boundary of a wisp catching the light) this spikes — exactly the
  // "lit edge" look of light hitting the side of a smoke tendril.
  vec2 eps = vec2(0.0035, 0.0);
  float nx = fbm(noiseUV + eps.xy);
  float ny = fbm(noiseUV + eps.yx);
  float edge = length(vec2(nx - smokeRaw, ny - smokeRaw)) * 9.0;
  edge = clamp(edge, 0.0, 1.0);
  edge = pow(edge, 2.2); // subtler — a soft catch-light, not an outlined edge

  // Smoke only "catches" light close to the actual beam — pulled back in
  // from a wider cone that was letting smoke read as visible texture across
  // most of the frame instead of concentrated where the light is.
  float smokeCone = 1.0 - smoothstep(u_spread * 0.85, u_spread * 1.6, angle);
  float smokeMask = smokeN * smokeCone;
  // Edges only glow where there's actually smoke nearby to have an edge of.
  float edgeGlow = edge * smokeCone * smoothstep(0.0, 0.5, smokeN + 0.15) * 0.6;

  // Directional ray streaks: noise sampled in a coordinate frame aligned to
  // the beam (stretched long ALONG it, compressed ACROSS it), so gaps in the
  // smoke read as distinct light shafts rather than a uniform haze — this is
  // the "definition" of individual rays cutting through, not just one glow.
  float along  = dot(toFrag, dir);
  vec2 perp    = toFrag - dir * along;
  float across = dot(perp, perp) > 0.0 ? sign(perp.x * dir.y - perp.y * dir.x) * length(perp) : 0.0;
  vec2 streakUV = vec2(across * 0.012, along * 0.0018) + vec2(t * 0.15, -t * 0.35);
  // Stronger, higher-frequency turbulence than before — the previous warp
  // wasn't enough to break the heavy "along" compression (0.0018) from
  // reading as near-straight, evenly-spaced vertical bands/waves running
  // the length of the beam.
  streakUV += curl(streakUV * 5.5, t * 0.5) * 0.55;
  float streakN = fbm(streakUV * vec2(1.0, 0.35));
  float streaks = pow(streakN, 1.4); // softer contrast — hinted shafts, not hard bands

  // The ray itself: beam envelope (cone × falloff × intensity) MULTIPLIED by
  // how much smoke is actually there to scatter it (Tyndall — no smoke, no
  // visible ray) AND by the streak pattern, which is what gives individual
  // rays their defined edges instead of one soft wash.
  float ray = cone * atten * u_intensity * smokeMask * u_smokeDensity * (0.62 + 0.5 * streaks);
  // Rim light along smoke edges caught by the beam — gives wisps a defined,
  // lit boundary instead of a soft uniform blob.
  float rim = cone * atten * u_intensity * edgeGlow * u_smokeDensity * 1.4;

  // Dust motes — fixed-size loop, gated by u_particleCount so it's tunable
  // without a recompile (no dynamic loop bounds in WebGL1). Driven by curl
  // noise rather than a fract()-based lifecycle: the old version reset each
  // mote's position instantly once its "life" wrapped 1→0, reading as a
  // visible teleport/bounce. Curl noise wanders continuously — no wrap, so
  // nothing snaps.
  float motes = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float active = step(fi + 0.5, u_particleCount);
    vec2 seed = vec2(fi * 13.17, fi * 7.91);
    float speedJit = 0.4 + hash(seed) * 0.7;
    vec2 basePos = mix(u_origin, u_target, 0.15 + hash(seed + 2.0) * 0.75);
    vec2 drift = curl(seed * 0.05 + t * (0.12 * speedJit), t * 0.18) * 110.0;
    vec2 motePos = basePos + drift;
    float pulse = 0.55 + 0.45 * sin(t * (1.1 + speedJit) + hash(seed + 5.0) * 6.28318);
    float d = length(uv - motePos);
    float glow = smoothstep(5.0, 0.0, d) * pulse * active * cone;
    motes += glow;
  }

  // originGlow (the lamp itself, always visible) + ray (only where smoke is
  // there to scatter it) + motes (dust glints, need no smoke of their own).
  float total = clamp(originGlow * atten + ray + rim + motes * 0.75, 0.0, 1.0);
  gl_FragColor = vec4(u_color * total, total);
}
`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('[HeroLightFX] shader compile error:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// CPU-side mirror of the shader's beam falloff — used to drive the DOM
// spotlight overlay on the headline text in sync with the canvas.
function beamIntensityAt(px, py, origin, target, spread, intensity) {
  const dx = px - origin.x, dy = py - origin.y;
  const dist = Math.hypot(dx, dy) || 1e-4;
  const dirX = target.x - origin.x, dirY = target.y - origin.y;
  const dirLen = Math.hypot(dirX, dirY) || 1e-4;
  const ndx = dirX / dirLen, ndy = dirY / dirLen;
  const cosA = Math.min(1, Math.max(-1, (dx / dist) * ndx + (dy / dist) * ndy));
  const angle = Math.acos(cosA);
  const cone = 1 - smoothstep(spread * 0.55, spread, angle);
  const atten = 1 / (1 + 0.000002 * dist * dist);
  return cone * atten * intensity;
}

function originFor(position, w, h) {
  switch (position) {
    case 'bottom-center': return { x: w * 0.5, y: h * 1.05 };
    case 'bottom-right':  return { x: w * 1.02, y: h * 1.05 };
    case 'bottom-left':
    default:              return { x: -w * 0.06, y: h * 1.06 };
  }
}

/**
 * @param {{ targetRef: import('react').RefObject<HTMLElement>, shadowRef?: import('react').RefObject<HTMLElement>, enabled: boolean, config?: Partial<typeof HERO_LIGHT_CONFIG> }} props
 */
export default function HeroLightFX({ targetRef, shadowRef, enabled, config }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const rafRef = useRef(null);
  const glRef = useRef(null);
  const uniformsRef = useRef(null);
  const geomRef = useRef({ origin: { x: 0, y: 0 }, target: { x: 0, y: 0 }, w: 0, h: 0, dpr: 1 });

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const cfg = { ...HERO_LIGHT_CONFIG, ...(config || {}) };
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false })
      || canvas.getContext('experimental-webgl');
    if (!gl) return; // graceful degrade — no canvas, CSS-only ambient glow still renders behind it

    glRef.current = gl;
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SRC);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    if (!vs || !fs) return;
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('[HeroLightFX] program link error:', gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const u = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      origin: gl.getUniformLocation(program, 'u_origin'),
      target: gl.getUniformLocation(program, 'u_target'),
      spread: gl.getUniformLocation(program, 'u_spread'),
      intensity: gl.getUniformLocation(program, 'u_intensity'),
      smokeSpeed: gl.getUniformLocation(program, 'u_smokeSpeed'),
      smokeDensity: gl.getUniformLocation(program, 'u_smokeDensity'),
      particleCount: gl.getUniformLocation(program, 'u_particleCount'),
      color: gl.getUniformLocation(program, 'u_color'),
      reducedMotion: gl.getUniformLocation(program, 'u_reducedMotion'),
      uiScale: gl.getUniformLocation(program, 'u_uiScale'),
    };
    uniformsRef.current = u;

    gl.enable(gl.BLEND);
    // The shader outputs premultiplied color (rgb = color*alpha), matching
    // the premultipliedAlpha:true context above — so blend with ONE, not
    // SRC_ALPHA (which would double-multiply by alpha and wash out
    // contrast, flattening the beam+smoke into a smooth gradient).
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const scale = isMobile ? cfg.mobileRenderScale : cfg.renderScale;
    const dprCap = isMobile ? Math.min(cfg.dprCap, 1.5) : cfg.dprCap;

    function computeGeometry() {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      const w = Math.max(1, Math.round(rect.width * dpr * scale));
      const h = Math.max(1, Math.round(rect.height * dpr * scale));
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);

      const originCss = originFor(cfg.originPosition, rect.width, rect.height);
      let targetCss = { x: rect.width * 0.4, y: rect.height * 0.45 };
      if (targetRef?.current) {
        const tRect = targetRef.current.getBoundingClientRect();
        targetCss = { x: tRect.left - rect.left + tRect.width * 0.5, y: tRect.top - rect.top + tRect.height * 0.5 };
      }
      const px = dpr * scale;
      geomRef.current = {
        origin: { x: originCss.x * px, y: originCss.y * px },
        target: { x: targetCss.x * px, y: targetCss.y * px },
        // Also keep CSS-space (unscaled) copies for the DOM overlay math.
        originCss, targetCss,
        w, h, dpr,
      };
    }
    computeGeometry();

    const ro = new ResizeObserver(computeGeometry);
    ro.observe(container);
    window.addEventListener('orientationchange', computeGeometry);

    let visible = true;
    const io = 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => { visible = entries[0]?.isIntersecting !== false; }, { threshold: 0.01 })
      : null;
    io?.observe(container);

    const colorArr = cfg.useCoolTemperature ? cfg.colorCool : cfg.colorWarm;
    const start = performance.now();

    function frame(now) {
      rafRef.current = requestAnimationFrame(frame);
      if (document.hidden || !visible) return;

      const { origin, target, w, h } = geomRef.current;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.resolution, w, h);
      // Always advance real time — the shader itself slows the drift when
      // u_reducedMotion is set (see u_reducedMotion usage above), rather
      // than freezing at t=0, which read as a dead/static frame.
      gl.uniform1f(u.time, (now - start) / 1000);
      gl.uniform2f(u.origin, origin.x, origin.y);
      gl.uniform2f(u.target, target.x, target.y);
      gl.uniform1f(u.spread, cfg.beamSpread);
      gl.uniform1f(u.intensity, cfg.beamIntensity);
      gl.uniform1f(u.smokeSpeed, cfg.smokeSpeed);
      gl.uniform1f(u.smokeDensity, cfg.smokeDensity);
      gl.uniform1f(u.particleCount, isMobile ? Math.min(cfg.particleCount, 3) : cfg.particleCount);
      gl.uniform3f(u.color, colorArr[0], colorArr[1], colorArr[2]);
      gl.uniform1f(u.reducedMotion, reducedMotion ? 1 : 0);
      gl.uniform1f(u.uiScale, 1.0);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Sync the DOM text-spotlight overlay to the same beam math.
      const { originCss, targetCss } = geomRef.current;
      const intensityHere = beamIntensityAt(targetCss.x, targetCss.y, originCss, targetCss, cfg.beamSpread, cfg.beamIntensity);
      if (overlayRef.current) {
        const el = overlayRef.current;
        el.style.left = `${targetCss.x}px`;
        el.style.top = `${targetCss.y}px`;
        // OLED phone screens render bright halos against true black far more
        // aggressively than an LCD desktop monitor — the same alpha value
        // reads as a much bigger "glow" bloom. Cap it lower on mobile.
        const overlayCap = isMobile ? 0.5 : 0.85;
        const overlayMul = isMobile ? 0.55 : 0.9;
        el.style.opacity = String(Math.min(overlayCap, intensityHere * overlayMul));
      }

      // Cast a directional shadow off the lit headline — light travels from
      // origin toward the text, so the shadow falls further along that same
      // direction (the far side of the letters from the light source), like
      // a real object blocking a light source.
      if (shadowRef?.current) {
        const dirX = targetCss.x - originCss.x, dirY = targetCss.y - originCss.y;
        const dirLen = Math.hypot(dirX, dirY) || 1e-4;
        const ndx = dirX / dirLen, ndy = dirY / dirLen;
        const amount = Math.min(1, intensityHere * 1.1);
        // Cast shadow, real-world style: a sharp, dark core close to the
        // letter that fans out into a longer, softer penumbra further along
        // the ray direction — not one flat blurred blob.
        const offsetNear = 4 + amount * 8;
        const blurNear = 3 + amount * 5;
        const alphaNear = Math.min(0.85, amount * 0.9);
        const offsetFar = 14 + amount * 34;
        const blurFar = 20 + amount * 40;
        const alphaFar = Math.min(0.5, amount * 0.55);
        // Glare on the side of the letters FACING the light (opposite the
        // shadow direction) — a tight, bright rim right at the edge, like
        // the beam is actually grazing that side of each letter, so it
        // doesn't read as everything just sitting flatly in front of a glow.
        // Same OLED-bloom concern as the overlay above — dial the glare (and
        // the dark cast-shadow below) back on mobile so it doesn't read as
        // an overblown halo around every letter.
        const glareScale = isMobile ? 0.6 : 1;
        const glareOffset = 2.5 + amount * 4.5;
        const glareBlur = 0.5 + amount * 2;
        const glareAlpha = Math.min(1, amount * 1.3) * glareScale;
        shadowRef.current.style.filter =
          `drop-shadow(${(-ndx * glareOffset).toFixed(1)}px ${(-ndy * glareOffset).toFixed(1)}px ${glareBlur.toFixed(1)}px rgba(255,225,180,${glareAlpha.toFixed(2)})) ` +
          `drop-shadow(${(-ndx * glareOffset * 1.8).toFixed(1)}px ${(-ndy * glareOffset * 1.8).toFixed(1)}px ${(glareBlur * 3).toFixed(1)}px rgba(255,190,120,${(glareAlpha * 0.6).toFixed(2)})) ` +
          `drop-shadow(${(ndx * offsetNear).toFixed(1)}px ${(ndy * offsetNear).toFixed(1)}px ${blurNear.toFixed(1)}px rgba(0,0,0,${alphaNear.toFixed(2)})) ` +
          `drop-shadow(${(ndx * offsetFar).toFixed(1)}px ${(ndy * offsetFar).toFixed(1)}px ${blurFar.toFixed(1)}px rgba(0,0,0,${alphaFar.toFixed(2)}))`;
      }
    }
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      io?.disconnect();
      window.removeEventListener('orientationchange', computeGeometry);
      // Deliberately NOT calling WEBGL_lose_context here. React 18's
      // <React.StrictMode> (see main.jsx) mounts every effect, cleans it up,
      // then mounts it again — dev-only, to surface exactly this kind of
      // bug. Forcing the context lost here meant the second mount tried to
      // compile shaders against an already-dead context and failed (the
      // "[HeroLightFX] shader compile error: null" in the console). Letting
      // the browser reclaim the context naturally on unmount avoids it.
    };
  }, [enabled, targetRef, config]);

  if (!enabled) return null;
  return (
    <>
      <div className="hero-fx" aria-hidden="true">
        <canvas ref={canvasRef} className="hero-fx-canvas" />
      </div>
      <div ref={overlayRef} className="hero-fx-spotlight" aria-hidden="true" />
    </>
  );
}
