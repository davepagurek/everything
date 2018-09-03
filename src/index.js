import { mat4, vec3, vec4 } from 'gl-matrix';

import { cube } from './geometry/cube';
import { terrain } from './geometry/terrain';

import { render } from './render';

// Set up scene geometry
const terrainInstance = { ...terrain(), color: [0.2, 0.9, 0.2] };
mat4.translate(terrainInstance.model, terrainInstance.model, vec3.fromValues(0, -2, -1));
mat4.scale(terrainInstance.model, terrainInstance.model, vec3.fromValues(0.5, 0.5, 0.5));

const cubeInstance = { ...cube(), color: [0.8, 0.15, 0.15] };
mat4.scale(cubeInstance.model, cubeInstance.model, vec3.fromValues(0.5, 0.5, 0.5));
mat4.translate(cubeInstance.model, cubeInstance.model, vec3.fromValues(0, 1.5, 0));

const sun = vec3.fromValues(0, -20, 20);
const ambient = [0.3, 0.3, 0.3];
const exposure = 20;

const view = mat4.lookAt(
  mat4.create(),
  vec3.fromValues(1, 1.5, 5), // Eye
  vec3.fromValues(0, 0, 0), // Target
  vec3.fromValues(0, 1, 0)); // Up

const yAxis = vec3.fromValues(0, 1, 0);

window.requestAnimationFrame(function onFrame() {
  // Update state
  mat4.rotate(
    terrainInstance.model,
    terrainInstance.model,
    0.01,
    yAxis);

  // Render to screen
  render({
    instances: [cubeInstance, terrainInstance],
    view,
    sun,
    ambient,
    exposure,
  });

  window.requestAnimationFrame(onFrame);
});
