import REGL from 'regl';
import { mat4, vec3 } from 'gl-matrix';

import { generateFlat } from './commands/flat';

const regl = REGL();
const flat = generateFlat(regl);

const cube = {
  positions: [
    [-0.5, +0.5, +0.5], [+0.5, +0.5, +0.5], [+0.5, -0.5, +0.5], [-0.5, -0.5, +0.5], // positive z face
    [+0.5, +0.5, +0.5], [+0.5, +0.5, -0.5], [+0.5, -0.5, -0.5], [+0.5, -0.5, +0.5], // positive x face
    [+0.5, +0.5, -0.5], [-0.5, +0.5, -0.5], [-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5], // negative z face
    [-0.5, +0.5, -0.5], [-0.5, +0.5, +0.5], [-0.5, -0.5, +0.5], [-0.5, -0.5, -0.5], // negative x face
    [-0.5, +0.5, -0.5], [+0.5, +0.5, -0.5], [+0.5, +0.5, +0.5], [-0.5, +0.5, +0.5], // top face
    [-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5], [+0.5, -0.5, +0.5], [-0.5, -0.5, +0.5],  // bottom face
  ],

  indices: [
    [2, 1, 0], [2, 0, 3],       // positive z face
    [6, 5, 4], [6, 4, 7],       // positive x face
    [10, 9, 8], [10, 8, 11],    // negative z face
    [14, 13, 12], [14, 12, 15], // negative x face
    [18, 17, 16], [18, 16, 19], // top face.
    [20, 21, 22], [23, 20, 22],  // bottom face
  ],
};

const cubeInstance = {
  ...cube,
  model: mat4.fromTranslation(mat4.create(), vec3.fromValues(0, 0, -3)),
};

const view = mat4.create();
const fieldOfView = Math.PI / 4;
let width = null;
let height = null;
const zNear = 1;
const zFar = 1000;
const projection = mat4.create();

regl.frame((context) => {
  if (width !== context.viewportWidth || height !== context.viewportHeight) {
    width = context.viewportWidth;
    height = context.viewportHeight;

    // Update projection matrix with new values
    mat4.perspective(projection, fieldOfView, width / height, zNear, zFar);
  }

  flat({
    ...cubeInstance,
    color: [0.8, 0.15, 0.15],
    view,
    projection,
  });
});
