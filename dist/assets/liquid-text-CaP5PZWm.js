const b=`#version 300 es
const vec2 pos[4] = vec2[](vec2(-1,-1), vec2(1,-1), vec2(-1,1), vec2(1,1));
out vec2 vUv;
void main() {
  vec2 p = pos[gl_VertexID];
  vUv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5);
  gl_Position = vec4(p, 0.0, 1.0);
}`,F=`#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform float uTime;
uniform float uAspect;
uniform vec4 uRipples[10]; /* xy: uv center, z: birth time, w: strength */
in vec2 vUv;
out vec4 outColor;

void main() {
  vec2 uv = vUv;

  /* ambient sway — barely alive when the cursor is away */
  uv += 0.0022 * vec2(sin(vUv.y * 9.0 + uTime * 0.7), cos(vUv.x * 8.0 - uTime * 0.6));

  /* cursor ripples — accumulated separately so their magnitude can drive color */
  vec2 flow = vec2(0.0);
  for (int i = 0; i < 10; i++) {
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
}`;function U(t,s,e){const n=t.createShader(s);return t.shaderSource(n,e),t.compileShader(n),t.getShaderParameter(n,t.COMPILE_STATUS)?n:null}function G(t,s){const e=t.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1});if(!e)return null;const n=U(e,e.VERTEX_SHADER,b),p=U(e,e.FRAGMENT_SHADER,F);if(!n||!p)return null;const r=e.createProgram();if(e.attachShader(r,n),e.attachShader(r,p),e.linkProgram(r),!e.getProgramParameter(r,e.LINK_STATUS))return null;e.useProgram(r);const L=e.getUniformLocation(r,"uTime"),I=e.getUniformLocation(r,"uAspect"),M=e.getUniformLocation(r,"uRipples");e.uniform1i(e.getUniformLocation(r,"uTex"),0);const T=e.createTexture();e.bindTexture(e.TEXTURE_2D,T),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);const u=new Image;let f=!1;u.onload=()=>{f=!0,E()},u.src=s;const v=Math.min(window.devicePixelRatio||1,2);function E(){if(!f||t.width===0)return;const i=document.createElement("canvas");i.width=t.width,i.height=t.height,i.getContext("2d").drawImage(u,0,0,i.width,i.height),e.bindTexture(e.TEXTURE_2D,T),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,i)}function R(){const i=Math.max(1,Math.round(t.clientWidth*v)),o=Math.max(1,Math.round(t.clientHeight*v));(t.width!==i||t.height!==o)&&(t.width=i,t.height=o,e.viewport(0,0,i,o),E())}const x=new ResizeObserver(R);x.observe(t),R();const c=new Float32Array(40);let S=0,g=0,_=0,A=0;const X=performance.now(),w=()=>(performance.now()-X)/1e3;t.addEventListener("pointermove",i=>{const o=t.getBoundingClientRect(),m=(i.clientX-o.left)/o.width,h=(i.clientY-o.top)/o.height,d=w(),y=Math.max(d-A,.001),C=Math.hypot(m-g,h-_)/y;g=m,_=h,A=d;const D=Math.min(.006+C*.022,.09),a=S++%10*4;c[a]=m,c[a+1]=h,c[a+2]=d,c[a+3]=D},{passive:!0}),e.clearColor(0,0,0,0);let l=0;const P=()=>{e.clear(e.COLOR_BUFFER_BIT),e.uniform1f(L,w()),e.uniform1f(I,t.width/Math.max(t.height,1)),e.uniform4fv(M,c),e.drawArrays(e.TRIANGLE_STRIP,0,4),l=requestAnimationFrame(P)};return l=requestAnimationFrame(P),{destroy:()=>{cancelAnimationFrame(l),x.disconnect()}}}export{G as mountLiquidText};
