// Inputs from the page: the atlas of boards, the tile map, the camera and the pointer.
uniform highp sampler2D sheet; uniform vec2 nb; uniform float NP; uniform vec3 cam; uniform float csd; uniform vec2 anchor;
uniform float now; uniform vec2 ptr; uniform float ptrIn; uniform float inks; uniform vec2 ftile; uniform float fbump; uniform float gap;
uniform highp sampler2D mapT; uniform vec2 mapO; uniform vec2 mapN;
uniform vec2 tO;   // the tile the world is measured from: every position the shader sees is relative to it, so it stays small (and exact enough for a crisp print) however far the camera has gone
uniform vec2 TS;   // the spacing of the matches: set to suit the screen (see the camera)
