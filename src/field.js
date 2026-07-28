import * as THREE from "three";

/**
 * The Field — signature hero element.
 * An instanced terrain of ultramarine bars, displaced entirely on the GPU
 * (simplex noise + a gaussian wake that follows the pointer).
 */

const VERT = /* glsl */ `
  attribute vec2 aOffset;

  uniform float uTime;
  uniform vec2 uMouse;

  varying float vH;
  varying float vWake;
  varying vec3 vNormal;
  varying float vViewZ;

  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 p = aOffset;

    float slow = snoise(p * 0.045 - uTime * 0.05) * 0.5 + 0.5;
    float fast = snoise(p * 0.16 + uTime * 0.14) * 0.5 + 0.5;
    float h = 0.35 + slow * 2.1 + fast * slow * 1.4;

    float d2 = dot(p - uMouse, p - uMouse);
    float wake = exp(-d2 * 0.055);
    h += wake * 2.6;

    vec3 pos = position;
    pos.y = (pos.y + 0.5) * h;
    vec3 world = pos + vec3(aOffset.x, 0.0, aOffset.y);

    vH = h;
    vWake = wake;
    vNormal = normal;

    vec4 mv = modelViewMatrix * vec4(world, 1.0);
    vViewZ = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform vec3 uLow;
  uniform vec3 uHigh;
  uniform vec3 uFlare;
  uniform vec3 uFog;
  uniform float uFogNear;
  uniform float uFogFar;

  varying float vH;
  varying float vWake;
  varying vec3 vNormal;
  varying float vViewZ;

  void main() {
    float t = clamp((vH - 0.35) / 4.2, 0.0, 1.0);
    vec3 col = mix(uLow, uHigh, t * t * (3.0 - 2.0 * t));

    vec3 n = normalize(vNormal);
    float shade = 0.66 + 0.34 * max(dot(n, normalize(vec3(0.35, 1.0, 0.45))), 0.0);
    col *= shade;

    col = mix(col, uFlare, smoothstep(0.55, 1.0, vWake) * 0.4);

    float fog = smoothstep(uFogNear, uFogFar, vViewZ);
    col = mix(col, uFog, fog);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createField(canvas, { reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });

  const FOG = new THREE.Color("#070b33");
  renderer.setClearColor(FOG);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 90);
  camera.position.set(0, 10.5, 17);
  camera.lookAt(0, 1.0, -2);

  const isSmall = window.matchMedia("(max-width: 768px)").matches;
  const COLS = isSmall ? 70 : 130;
  const ROWS = isSmall ? 52 : 78;
  const STEP = 0.66;
  const BAR = 0.46;

  const box = new THREE.BoxGeometry(BAR, 1, BAR);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = box.index;
  geo.attributes.position = box.attributes.position;
  geo.attributes.normal = box.attributes.normal;

  const count = COLS * ROWS;
  const offsets = new Float32Array(count * 2);
  let i = 0;
  for (let cx = 0; cx < COLS; cx++) {
    for (let cz = 0; cz < ROWS; cz++) {
      offsets[i++] = (cx - COLS / 2) * STEP;
      offsets[i++] = (cz - ROWS / 2) * STEP - 6;
    }
  }
  geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 2));
  geo.instanceCount = count;

  const uniforms = {
    uTime: { value: 0 },
    // parked far off-field until the pointer actually moves
    uMouse: { value: new THREE.Vector2(999, 999) },
    uLow: { value: new THREE.Color("#0c1156") },
    uHigh: { value: new THREE.Color("#5871ff") },
    uFlare: { value: new THREE.Color("#ff8552") },
    uFog: { value: FOG },
    uFogNear: { value: 15 },
    uFogFar: { value: 42 },
  };

  const mesh = new THREE.Mesh(
    geo,
    new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms })
  );
  mesh.frustumCulled = false;
  scene.add(mesh);

  // --- pointer → world point on the ground plane (y = 0) ---
  const targetMouse = new THREE.Vector2(999, 999);
  const ndc = new THREE.Vector2();
  const rayPoint = new THREE.Vector3();

  function onPointerMove(e) {
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    rayPoint.set(ndc.x, ndc.y, 0.5).unproject(camera);
    const dir = rayPoint.sub(camera.position).normalize();
    if (dir.y < -0.001) {
      const t = -camera.position.y / dir.y;
      targetMouse.set(
        camera.position.x + dir.x * t,
        camera.position.z + dir.z * t
      );
    }
  }
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  // --- sizing ---
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.75 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // portrait: higher, wider view so the field reads as terrain, not a wall
    if (camera.aspect < 0.8) {
      camera.fov = 50;
      camera.position.set(0, 13, 21);
    } else {
      camera.fov = 38;
      camera.position.set(0, 10.5, 17);
    }
    camera.lookAt(0, 1.0, -2);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  // --- render loop, paused while the hero is off-screen ---
  const clock = new THREE.Clock();
  let elapsed = 0;
  let rafId = 0;
  let visible = true;

  function render() {
    elapsed += Math.min(clock.getDelta(), 0.05);
    uniforms.uTime.value = elapsed;
    uniforms.uMouse.value.lerp(targetMouse, 0.06);
    camera.position.x = Math.sin(elapsed * 0.06) * 0.9;
    camera.lookAt(0, 1.0, -2);
    renderer.render(scene, camera);
  }

  function loop() {
    render();
    rafId = requestAnimationFrame(loop);
  }

  if (reducedMotion) {
    // one composed still frame, no animation
    uniforms.uTime.value = 7.3;
    renderer.render(scene, camera);
  } else {
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !visible) {
        visible = true;
        clock.getDelta();
        loop();
      } else if (!entry.isIntersecting && visible) {
        visible = false;
        cancelAnimationFrame(rafId);
      }
    });
    io.observe(canvas);
    loop();
  }
}
