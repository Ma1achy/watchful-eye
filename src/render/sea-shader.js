// The sea's fragment shader, assembled from its parts in the order GLSL needs them (each part only uses what comes
// before it). The common header and the vertex shader are in gl/.
import uniforms from './shaders/uniforms.glsl';
import noise from './shaders/noise.glsl';
import ink from './shaders/ink.glsl';
import cells from './shaders/cells.glsl';
import boards from './shaders/boards.glsl';
import sample_far from './shaders/sample-far.glsl';
import print_near from './shaders/print-near.glsl';
import sample_mid from './shaders/sample-mid.glsl';
import print from './shaders/print.glsl';
import main from './shaders/main.glsl';

export const SEA_SHADER = [uniforms, noise, ink, cells, boards, sample_far, print_near, sample_mid, print, main].join('\n');
