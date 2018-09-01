import REGL from 'regl';
import { mat4, vec3 } from 'gl-matrix';

import { cube } from './geometry/cube';
import { terrain } from './geometry/terrain';

import { generateFlat } from './commands/flat';

const regl = REGL({ extensions: ['OES_standard_derivatives'] });
const flat = generateFlat(regl);

const terrainInstance = { ...terrain(), color: [0.2, 0.9, 0.2] };
mat4.scale(terrainInstance.model, terrainInstance.model, vec3.fromValues(0.5, 0.5, 0.5));
mat4.translate(terrainInstance.model, terrainInstance.model, vec3.fromValues(0, -4, 0));

const cubeInstance = { ...cube(), color: [0.8, 0.15, 0.15] };
mat4.scale(cubeInstance.model, cubeInstance.model, vec3.fromValues(0.5, 0.5, 0.5));
mat4.translate(cubeInstance.model, cubeInstance.model, vec3.fromValues(0, 1.5, 0));

const sun = vec3.fromValues(0, -20, 20);
const ambient = [0.3, 0.3, 0.3];
const exposure = 20;

const view = mat4.fromTranslation(mat4.create(), vec3.fromValues(0, -0.3, -5));
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

  flat([cubeInstance, terrainInstance].map((instance) => {
    return {
      ...instance,
      view,
      projection,
      sun,
      ambient,
      exposure,
    };
  }));
});
