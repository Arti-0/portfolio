/**
 * Flat 2D liquid over a text-as-SVG texture — hand-rolled WebGL2, no Three.
 * The title is rasterized to a texture and drawn as-is; the fragment shader
 * only displaces UVs (cursor ripples + a subtle ambient sway), so the render
 * is pixel-identical to the flat title until the liquid moves it.
 */

const MAX_RIPPLES = 10;

const VERT = `#version 300 es
const vec2 pos[4] = vec2[](vec2(-1,-1), vec2(1,-1), vec2(-1,1), vec2(1,1));
out vec2 vUv;
void main() {
  vec2 p = pos[gl_VertexID];
  vUv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5);
  gl_Position = vec4(p, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform float uTime;
uniform float uAspect;
uniform vec4 uRipples[${MAX_RIPPLES}]; /* xy: uv center, z: birth time, w: strength */
in vec2 vUv;
out vec4 outColor;

void main() {
  vec2 uv = vUv;

  /* ambient sway — barely alive when the cursor is away */
  uv += 0.0022 * vec2(sin(vUv.y * 9.0 + uTime * 0.7), cos(vUv.x * 8.0 - uTime * 0.6));

  /* cursor ripples — accumulated separately so their magnitude can drive color */
  vec2 flow = vec2(0.0);
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = uRipples[i];
    if (r.w <= 0.0) continue;
    float age = uTime - r.z;
    if (age > 3.0) continue;
    vec2 d = (vUv - r.xy) * vec2(uAspect, 1.0);
    float dist = length(d) + 1e-4;
    float influence = exp(-dist * dist * 20.0) * exp(-age * 1.6);
    vec2 dir = d / dist;
    vec2 perp = vec2(-dir.y, dir.x);
    flow += (perp * 0.7 + dir * 0.4) * influence * r.w / vec2(uAspect, 1.0);
  }
  uv += flow;

  float m = min(length(flow) * 22.0, 1.0);

  /* chromatic split along the flow, then an iridescent shimmer scaled by
     the disturbance — at rest m is 0 and the text stays pure white */
  vec2 ca = flow * 0.4;
  float rC = texture(uTex, clamp(uv + ca, 0.0, 1.0)).r;
  vec4 c = texture(uTex, clamp(uv, 0.0, 1.0));
  float bC = texture(uTex, clamp(uv - ca, 0.0, 1.0)).b;
  vec3 col = vec3(rC, c.g, bC);
  vec3 iri = 0.5 + 0.5 * cos(6.2832 * (m * 1.5 + uTime * 0.12 + vec3(0.0, 0.33, 0.67)));
  col = mix(col, iri, m * 0.6 * c.a);

  outColor = vec4(col * c.a, c.a);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

export function mountLiquidText(canvas, svgUrl) {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const uTime = gl.getUniformLocation(prog, "uTime");
  const uAspect = gl.getUniformLocation(prog, "uAspect");
  const uRipples = gl.getUniformLocation(prog, "uRipples");
  gl.uniform1i(gl.getUniformLocation(prog, "uTex"), 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const img = new Image();
  let imgReady = false;
  img.onload = () => {
    imgReady = true;
    uploadTexture();
  };
  img.src = svgUrl;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function uploadTexture() {
    if (!imgReady || canvas.width === 0) return;
    const off = document.createElement("canvas");
    off.width = canvas.width;
    off.height = canvas.height;
    const ctx = off.getContext("2d");
    ctx.drawImage(img, 0, 0, off.width, off.height);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, off);
  }

  function resize() {
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      uploadTexture();
    }
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  /* cursor ripples — strength follows pointer speed */
  const ripples = new Float32Array(MAX_RIPPLES * 4);
  let rippleIdx = 0;
  let lastX = 0, lastY = 0, lastT = 0;
  const start = performance.now();
  const now = () => (performance.now() - start) / 1000;

  canvas.addEventListener(
    "pointermove",
    (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const t = now();
      const dt = Math.max(t - lastT, 1e-3);
      const speed = Math.hypot(x - lastX, y - lastY) / dt;
      lastX = x; lastY = y; lastT = t;
      const strength = Math.min(0.006 + speed * 0.022, 0.09);
      const i = (rippleIdx++ % MAX_RIPPLES) * 4;
      ripples[i] = x;
      ripples[i + 1] = y;
      ripples[i + 2] = t;
      ripples[i + 3] = strength;
    },
    { passive: true }
  );

  gl.clearColor(0, 0, 0, 0);
  let raf = 0;
  const frame = () => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uTime, now());
    gl.uniform1f(uAspect, canvas.width / Math.max(canvas.height, 1));
    gl.uniform4fv(uRipples, ripples);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    destroy: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    },
  };
}
