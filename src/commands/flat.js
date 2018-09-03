export function generateFlat(regl) {
  return regl({
    framebuffer: regl.prop('framebuffer'),

    vert: `
      precision mediump float;

      attribute vec3 position;

      uniform mat4 projection;
      uniform mat4 view;
      uniform mat4 model;

      varying vec3 vertexPosition;

      void main() {
        vertexPosition = (view * model * vec4(position, 1.0)).xyz;

        gl_Position = projection * vec4(vertexPosition, 1.0);
      }
    `,

    frag: `
      #extension GL_OES_standard_derivatives : enable

      precision mediump float;

      uniform mat4 view;
      uniform vec3 color;
      uniform vec3 ambient;
      uniform vec3 sun;

      varying vec3 vertexPosition;

      // Instead of passing in normals, I'm just computing them from adjacent pixels
      vec3 normalFromWorld(const vec3 position) {
        return normalize(cross(dFdy(position), dFdx(position)));
      }

      void main() {
        // TODO: this can all be put in the vertex shader
        vec3 sunPosition = (view * vec4(sun, 1.0)).xyz;
        float lambertian = clamp(
          dot(normalize(sunPosition - vertexPosition), normalFromWorld(vertexPosition)),
          0.0,
          1.0
        );

        vec3 unmappedColor = ambient * color + lambertian * color;
        gl_FragColor = vec4(unmappedColor, 1.0);
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
      sun: regl.prop('sun'),
      ambient: regl.prop('ambient'),
    },

    elements: regl.prop('indices'),
  });
}
