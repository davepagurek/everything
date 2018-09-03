import REGL from 'regl';
import { mat4, vec3, vec4 } from 'gl-matrix';

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

const fieldOfView = Math.PI / 4;
let width = null;
let height = null;
const zNear = 1;
const zFar = 1000;
const projection = mat4.perspective(mat4.create(), fieldOfView, canvas.width / canvas.height, zNear, zFar);

// Used to recreate position info from the depth buffer
const projInfo = vec4.fromValues(
    -2.0 / (canvas.width * projection[0]), // 0,0 -> 0
    -2.0 / (canvas.height * projection[5]), // 1,1 -> 5
    (1.0 - projection[2]) / projection[0], // 0,2 -> 2
    (1.0 + projection[6]) / projection[5]); // 1,2 -> 6

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

export function render({instances, view, sun, ambient, exposure}) {
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

  // First, render color and depth to buffers
  flat(instances.map((instance) => {
    return {
      ...instance,
      view,
      projection,
      sun,
      ambient,
      framebuffer: colorFBO,
    };
  }));

  // Use the depth buffer to generate an ambient occlusion buffer
  occlusion({
    framebuffer: occlusionFBO,
    depth: depthBuf,
    zNear,
    zFar,
    projInfo,
  });

  // Mix the color and ambient occlusion buffers, rendering to the screen
  composite({
    color: colorFBO,
    depth: depthBuf,
    occlusion: occlusionFBO,
    exposure,
  });
}
