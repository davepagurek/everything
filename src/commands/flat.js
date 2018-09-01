export function generateFlat(regl) {
  return regl({
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
      uniform float exposure;

      varying vec3 vertexPosition;

      vec3 normalFromWorld(const vec3 position) {
        return normalize(cross(dFdy(position), dFdx(position)));
      }

      vec3 toneMap(vec3 x) {
        float A = 0.15;
        float B = 0.50;
        float C = 0.10;
        float D = 0.20;
        float E = 0.02;
        float F = 0.30;
        return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;
      }

      void main() {
        vec3 sunPosition = (view * vec4(sun, 1.0)).xyz;
        float lambertian = clamp(
          dot(normalize(sunPosition - vertexPosition), normalFromWorld(vertexPosition)),
          0.0,
          1.0
        );

        vec3 unmappedColor = ambient * color + lambertian * color;
        gl_FragColor = vec4(toneMap(exposure * unmappedColor), 1.0);
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
      exposure: regl.prop('exposure'),
    },
    elements: regl.prop('indices'),
  });
}
