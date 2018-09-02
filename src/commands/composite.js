export function generateComposite(regl) {
  return regl({
    vert: `
      precision mediump float;

      attribute vec2 position;

      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `,

    frag: `
      precision mediump float;

      uniform float exposure;
      uniform sampler2D color;
      uniform sampler2D depth;
      uniform sampler2D occlusion;
      uniform vec2 screenSize;

      const float EDGE_SHARPNESS = 1.0;
      const int SCALE = 2;

      float blurAO(vec2 screenSpaceOrigin) {
        float sum = texture2D(occlusion, screenSpaceOrigin).x;
        float originDepth = texture2D(depth, screenSpaceOrigin).x;
        float totalWeight = 1.0;
        sum *= totalWeight;

        for (int x = -4; x <= 4; x++) {
          for (int y = -4; y <= 4; y++) {
            if (x != 0 || y != 0) {
              vec2 samplePosition = screenSpaceOrigin +
                vec2(float(x * SCALE), float(y * SCALE)) * vec2(1.0/screenSize.x, 1.0/screenSize.y);
              float ao = texture2D(occlusion, samplePosition).x;
              float sampleDepth = texture2D(depth, samplePosition).x;
              if (sampleDepth < 1.0) {
                int kx = 4 - (x < 0 ? -x : x);
                int ky = 4 - (y < 0 ? -y : y);
                float weight = 0.3 + (abs(float(x * y)) / (25.0 * 25.0));
                weight *= max(0.0, 1.0 - (EDGE_SHARPNESS * 2000.0) * abs(sampleDepth - originDepth));

                sum += ao * weight;
                totalWeight += weight;
              }
            }
          }
        }

        const float epsilon = 0.0001;
        return sum / (totalWeight + epsilon);
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
        vec2 screenSpaceOrigin = gl_FragCoord.xy * vec2(1.0/screenSize.x, 1.0/screenSize.y);

        vec3 colorAtOrigin = texture2D(color, screenSpaceOrigin).xyz;
        float occlusionAtOrigin = blurAO(screenSpaceOrigin);

        gl_FragColor = vec4(toneMap(exposure * occlusionAtOrigin * colorAtOrigin), 1.0);
        //gl_FragColor = vec4(occlusionAtOrigin, occlusionAtOrigin, occlusionAtOrigin, 1.0);
      }
    `,

    attributes: {
      position: [
        -1.0, -1.0,
        1.0, -1.0,
        -1.0, 1.0,
        1.0, 1.0
      ],
    },

    count: 4,

    uniforms: {
      exposure: regl.prop('exposure'),
      color: regl.prop('color'),
      depth: regl.prop('depth'),
      occlusion: regl.prop('occlusion'),
      screenSize: ({framebufferWidth, framebufferHeight}) => [framebufferWidth, framebufferHeight],
    },

    primitive: 'triangle strip',
  });
}
