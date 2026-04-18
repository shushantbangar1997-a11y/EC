import React, { useState, useEffect, useRef } from 'react'

// ── Black & grey palette — 20 steps from near-black to bright grey ────────────
const PALETTE = [
  [0.01, 0.01, 0.01],
  [0.03, 0.03, 0.03],
  [0.05, 0.05, 0.05],
  [0.07, 0.07, 0.07],
  [0.10, 0.10, 0.10],
  [0.13, 0.13, 0.13],
  [0.16, 0.16, 0.16],
  [0.20, 0.20, 0.20],
  [0.24, 0.24, 0.24],
  [0.28, 0.28, 0.28],
  [0.33, 0.33, 0.33],
  [0.38, 0.38, 0.38],
  [0.44, 0.44, 0.44],
  [0.50, 0.50, 0.50],
  [0.56, 0.56, 0.56],
  [0.62, 0.62, 0.62],
  [0.68, 0.68, 0.68],
  [0.75, 0.75, 0.75],
  [0.83, 0.83, 0.83],
  [0.92, 0.92, 0.92],
]

// ── Animation tuning ──────────────────────────────────────────────────────────
const ZOOM        = 0.30
const WAVE_AMP    = 0.18
const WAVE_RND    = 0.10
const WAVE_FREQ   = 3.5
const TIME_SPEED  = 0.18
const SWIRL_BASE  = 1.1
const SWIRL_TIME  = 4.5
const NOISE_SWIRL = 0.18
const FBM_OCTAVES = 6

// ── Shaders ───────────────────────────────────────────────────────────────────
const VERT_SRC = `#version 300 es
precision mediump float;
in vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`

function buildFrag() {
  const colorsSrc = PALETTE
    .map(([r, g, b]) => `vec3(${r.toFixed(2)},${g.toFixed(2)},${b.toFixed(2)})`)
    .join(',\n  ')

  return `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uResolution;
uniform float uTime;

#define NUM_COLORS 20
vec3 pal[NUM_COLORS] = vec3[](
  ${colorsSrc}
);

vec3 permute3(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float noise2D(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1  = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy  -= i1;
  i = mod(i, 289.0);
  vec3 p = permute3(permute3(i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x  = 2.0 * fract(p * C.www) - 1.0;
  vec3 h  = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.792843 - 0.853734 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x   + h.x  * x0.y;
  g.yz = a0.yz * x12.xz  + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 st) {
  float value = 0.0, amplitude = 0.5, freq = 1.0;
  for (int i = 0; i < ${FBM_OCTAVES}; i++) {
    value     += amplitude * noise2D(st * freq);
    freq      *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = (gl_FragCoord.xy / uResolution.xy) * 2.0 - 1.0;
  uv.x *= uResolution.x / uResolution.y;
  uv   *= ${ZOOM.toFixed(2)};

  float t    = uTime * ${TIME_SPEED.toFixed(2)};
  float wAmp = ${WAVE_AMP.toFixed(2)} + ${WAVE_RND.toFixed(2)} * noise2D(vec2(t, 27.7));
  uv.x += wAmp * sin(uv.y * ${WAVE_FREQ.toFixed(1)} + t);
  uv.y += wAmp * sin(uv.x * ${WAVE_FREQ.toFixed(1)} - t);

  float r   = length(uv);
  float ang = atan(uv.y, uv.x);
  ang += ${SWIRL_BASE.toFixed(1)} * (1.0 - smoothstep(0.0, 1.0, r))
              * sin(uTime + r * ${SWIRL_TIME.toFixed(1)});
  uv = vec2(cos(ang), sin(ang)) * r;

  float n = fbm(uv);
  n += ${NOISE_SWIRL.toFixed(2)} * sin(t + n * 3.0);

  float val = clamp(0.5 * (n + 1.0), 0.0, 1.0) * float(NUM_COLORS - 1);
  int   lo  = int(floor(val));
  int   hi  = int(min(float(lo + 1), float(NUM_COLORS - 1)));
  float f   = fract(val);
  vec3 col  = mix(pal[lo], pal[hi], f);
  outColor  = vec4(col, 1.0);
}`
}

// ── GL helpers ────────────────────────────────────────────────────────────────
function compileProgram(gl, vsSrc, fsSrc) {
  const compile = (type, src) => {
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('[HeroBackground] shader error:', gl.getShaderInfoLog(s))
      gl.deleteShader(s)
      return null
    }
    return s
  }
  const vs = compile(gl.VERTEX_SHADER, vsSrc)
  const fs = compile(gl.FRAGMENT_SHADER, fsSrc)
  if (!vs || !fs) return null
  const prog = gl.createProgram()
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('[HeroBackground] link error:', gl.getProgramInfoLog(prog))
    return null
  }
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  return prog
}

// ── Synchronous WebGL2 capability check ──────────────────────────────────────
function detectWebGL2() {
  try {
    const probe = document.createElement('canvas')
    return !!probe.getContext('webgl2')
  } catch {
    return false
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function HeroBackground() {
  // Checked once synchronously on first render — no flash, no layout shift
  const [hasWebGL2] = useState(detectWebGL2)
  const canvasRef   = useRef(null)

  useEffect(() => {
    if (!hasWebGL2) return
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      powerPreference: 'low-power',
    })
    if (!gl) return

    const prog = compileProgram(gl, VERT_SRC, buildFrag())
    if (!prog) return

    gl.useProgram(prog)
    gl.clearColor(0, 0, 0, 1)

    const quad = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1])
    const vao  = gl.createVertexArray()
    gl.bindVertexArray(vao)
    const vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPosition')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes  = gl.getUniformLocation(prog, 'uResolution')
    const uTime = gl.getUniformLocation(prog, 'uTime')

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let rafId
    const t0 = performance.now()
    const render = () => {
      const elapsed = (performance.now() - t0) * 0.001
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, elapsed)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      rafId = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      gl.deleteProgram(prog)
      gl.deleteBuffer(vbo)
      gl.deleteVertexArray(vao)
    }
  }, [hasWebGL2])

  if (!hasWebGL2) {
    // CSS fallback: animated background-position drift across a large diagonal
    // gradient — works in all browsers, captures nicely in screenshot tools
    return (
      <>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            backgroundImage: 'linear-gradient(135deg, #060606 0%, #1e1e1e 20%, #0a0a0a 40%, #272727 60%, #0e0e0e 80%, #1a1a1a 100%)',
            backgroundSize: '300% 300%',
            animation: 'heroBgDrift 14s ease-in-out infinite alternate',
          }}
        />
        <style>{`
          @keyframes heroBgDrift {
            0%   { background-position: 0% 0%; }
            33%  { background-position: 65% 35%; }
            66%  { background-position: 25% 85%; }
            100% { background-position: 100% 100%; }
          }
        `}</style>
      </>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        zIndex: 1,
      }}
    />
  )
}
