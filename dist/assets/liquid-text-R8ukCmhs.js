const F=`#version 300 es
const vec2 pos[4] = vec2[](vec2(-1,-1), vec2(1,-1), vec2(-1,1), vec2(1,1));
out vec2 vUv;
void main() {
  vec2 p = pos[gl_VertexID];
  vUv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5);
  gl_Position = vec4(p, 0.0, 1.0);
}`,G=`#version 300 es
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

  for (int i = 0; i < 10; i++) {
    vec4 r = uRipples[i];
    if (r.w <= 0.0) continue;
    float age = uTime - r.z;
    if (age > 2.5) continue;
    vec2 d = (vUv - r.xy) * vec2(uAspect, 1.0);
    float dist = length(d) + 1e-4;
    float influence = exp(-dist * dist * 34.0) * exp(-age * 2.1);
    vec2 dir = d / dist;
    vec2 perp = vec2(-dir.y, dir.x);
    uv += (perp * 0.7 + dir * 0.4) * influence * r.w / vec2(uAspect, 1.0);
  }

  vec4 c = texture(uTex, clamp(uv, 0.0, 1.0));
  outColor = vec4(c.rgb * c.a, c.a);
}`;function w(t,s,e){const n=t.createShader(s);return t.shaderSource(n,e),t.compileShader(n),t.getShaderParameter(n,t.COMPILE_STATUS)?n:null}function b(t,s){const e=t.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1});if(!e)return null;const n=w(e,e.VERTEX_SHADER,F),d=w(e,e.FRAGMENT_SHADER,G);if(!n||!d)return null;const r=e.createProgram();if(e.attachShader(r,n),e.attachShader(r,d),e.linkProgram(r),!e.getProgramParameter(r,e.LINK_STATUS))return null;e.useProgram(r);const L=e.getUniformLocation(r,"uTime"),I=e.getUniformLocation(r,"uAspect"),M=e.getUniformLocation(r,"uRipples");e.uniform1i(e.getUniformLocation(r,"uTex"),0);const p=e.createTexture();e.bindTexture(e.TEXTURE_2D,p),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);const u=new Image;let E=!1;u.onload=()=>{E=!0,v()},u.src=s;const f=Math.min(window.devicePixelRatio||1,2);function v(){if(!E||t.width===0)return;const i=document.createElement("canvas");i.width=t.width,i.height=t.height,i.getContext("2d").drawImage(u,0,0,i.width,i.height),e.bindTexture(e.TEXTURE_2D,p),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,i)}function R(){const i=Math.max(1,Math.round(t.clientWidth*f)),o=Math.max(1,Math.round(t.clientHeight*f));(t.width!==i||t.height!==o)&&(t.width=i,t.height=o,e.viewport(0,0,i,o),v())}const _=new ResizeObserver(R);_.observe(t),R();const c=new Float32Array(40);let S=0,g=0,x=0,A=0;const X=performance.now(),P=()=>(performance.now()-X)/1e3;t.addEventListener("pointermove",i=>{const o=t.getBoundingClientRect(),m=(i.clientX-o.left)/o.width,T=(i.clientY-o.top)/o.height,h=P(),D=Math.max(h-A,.001),y=Math.hypot(m-g,T-x)/D;g=m,x=T,A=h;const C=Math.min(.004+y*.012,.05),a=S++%10*4;c[a]=m,c[a+1]=T,c[a+2]=h,c[a+3]=C},{passive:!0}),e.clearColor(0,0,0,0);let l=0;const U=()=>{e.clear(e.COLOR_BUFFER_BIT),e.uniform1f(L,P()),e.uniform1f(I,t.width/Math.max(t.height,1)),e.uniform4fv(M,c),e.drawArrays(e.TRIANGLE_STRIP,0,4),l=requestAnimationFrame(U)};return l=requestAnimationFrame(U),{destroy:()=>{cancelAnimationFrame(l),_.disconnect()}}}export{b as mountLiquidText};
