export function generateFlat(regl) {
  return regl({
    vert: `
      precision mediump float;

      attribute vec3 position;

      uniform mat4 projection;
      uniform mat4 view;
      uniform mat4 model;

      void main() {
        vec4 vertexPosition = view * model * vec4(position, 1.0);

        gl_Position = projection * vertexPosition;
      }
    `,
    frag: `
      precision mediump float;

      uniform vec3 color;

      void main() {
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    attributes: {
      position: regl.prop('positions'),
    },
    uniforms: {
      projection: regl.prop('projection'),
      view: regl.prop('view'),
      model: regl.prop('model'),
      color: regl.prop('color'),
    },
    elements: regl.prop('indices'),
  });
}
