// A little WebGL 2: full-screen fragment passes, uniforms set by name from plain values.
//
// Programs compile in the background where the browser can (KHR_parallel_shader_compile): prog() returns at once and
// ready() says when the program can be drawn with, so a big shader never blocks the page while it starts up.
import HEAD from './shaders/head.glsl';
import VS from './shaders/quad.vert';

export function MiniGL(canvas) {
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
  if (!gl) return null;
  const par = gl.getExtension('KHR_parallel_shader_compile');
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  function shader(type, src) { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; }

  function prog(body) {
    const p = gl.createProgram();
    const vs = shader(gl.VERTEX_SHADER, VS), fs = shader(gl.FRAGMENT_SHADER, HEAD + body + '\nvoid main(){ fragColor=run(); }');
    gl.attachShader(p, vs); gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, 'a');
    gl.linkProgram(p);
    p.L = {}; p.fs = fs; p.ok = false;
    return p;
  }

  /** Whether a program has finished compiling (and linked). Throws with the compiler's log if it failed. */
  function ready(p) {
    if (p.ok) return true;
    if (par && !gl.getProgramParameter(p, par.COMPLETION_STATUS_KHR)) return false;
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getShaderInfoLog(p.fs) || gl.getProgramInfoLog(p));
    p.ok = true;
    return true;
  }

  function loc(p, k) { if (!(k in p.L)) p.L[k] = gl.getUniformLocation(p, k); return p.L[k]; }

  function pass(p, u) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const w = canvas.width, h = canvas.height;
    gl.viewport(0, 0, w, h); gl.useProgram(p);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(loc(p, 'res'), w, h);
    let unit = 0;
    for (const k in u) {
      const v = u[k], l = loc(p, k); if (l === null) continue;
      if (v instanceof WebGLTexture) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, v); gl.uniform1i(l, unit); unit++; }
      else if (typeof v === 'number') gl.uniform1f(l, v);
      else if (v.length === 2) gl.uniform2f(l, v[0], v[1]);
      else if (v.length === 3) gl.uniform3f(l, v[0], v[1], v[2]);
      else if (v.length === 4) gl.uniform4f(l, v[0], v[1], v[2], v[3]);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  return { gl, prog, ready, loc, pass };
}

/** Size a canvas's drawing buffer to its box at the device's pixel ratio, up to `cap`. True when it changed. */
export function fit(canvas, cap) {
  const d = Math.min(window.devicePixelRatio || 1, cap || 1.25);
  const w = Math.max(2, Math.round(canvas.clientWidth * d)), h = Math.max(2, Math.round(canvas.clientHeight * d));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; return true; }
  return false;
}
