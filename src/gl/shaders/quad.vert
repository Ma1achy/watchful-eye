#version 300 es
// One full-screen quad: uv runs 0..1 across it.
in vec2 a; out vec2 uv; void main(){ uv=a*.5+.5; gl_Position=vec4(a,0.,1.); }
