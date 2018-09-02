import REGL from 'regl';
import { mat4, vec3, vec4 } from 'gl-matrix';

import { cube } from './geometry/cube';
import { terrain } from './geometry/terrain';

import { generateFlat } from './commands/flat';
import { generateOcclusion } from './commands/occlusion';
import { generateComposite } from './commands/composite';

const canvas = document.getElementById('stage');
const regl = REGL({ 
  extensions: ['OES_standard_derivatives', 'WEBGL_depth_texture'],
  canvas,
});
const flat = generateFlat(regl);
const occlusion = generateOcclusion(regl);
const composite = generateComposite(regl);

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
const fieldOfView = Math.PI / 4;
let width = null;
let height = null;
const zNear = 1;
const zFar = 1000;
const projection = mat4.perspective(mat4.create(), fieldOfView, canvas.width / canvas.height, zNear, zFar);

const projInfo = vec4.fromValues(
    -2.0 / (canvas.width * projection[0]), // 0, 0 -> 0
    -2.0 / (canvas.height * projection[5]), // 1, 1 -> 5
    (1.0 - projection[2]) / projection[0], // 0, 2 -> 2
    (1.0 + projection[6]) / projection[5]); // 1, 2 -> 6

const depthBuf = regl.texture({
  width: canvas.width,
  height: canvas.height,
  format: 'depth stencil', 
  type: 'depth stencil'
});
const colorFBO = regl.framebuffer({
  width: canvas.width,
  height: canvas.height,
  depthStencil: depthBuf,
});
const occlusionFBO = regl.framebuffer({
  width: canvas.width,
  height: canvas.height
});

const yAxis = vec3.fromValues(0, 1, 0);

window.requestAnimationFrame(function onFrame() {
  mat4.rotate(
    terrainInstance.model,
    terrainInstance.model,
    0.01,
    yAxis);

  regl.clear({
    framebuffer: colorFBO,
    color: [10, 10, 10],
    depth: 1,
  });
  regl.clear({
    framebuffer: occlusionFBO,
    color: [0, 0, 0],
    depth: 1,
  });

  flat([cubeInstance, terrainInstance].map((instance) => {
    return {
      ...instance,
      view,
      projection,
      sun,
      ambient,
      framebuffer: colorFBO,
    };
  }));

  occlusion({
    framebuffer: occlusionFBO,
    color: colorFBO,
    depth: depthBuf,
    zNear,
    zFar,
    projInfo,
  });

  composite({
    color: colorFBO,
    depth: depthBuf,
    occlusion: occlusionFBO,
    exposure,
  });

  window.requestAnimationFrame(onFrame);
});
