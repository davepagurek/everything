export function generateOcclusion(regl) {
  return regl({
    framebuffer: regl.prop('framebuffer'),

    vert: `
      precision mediump float;

      attribute vec2 position;

      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `,

    frag: `
      #extension GL_OES_standard_derivatives : enable

      precision mediump float;

      uniform sampler2D color;
      uniform sampler2D depth;
      uniform vec2 screenSize;
      uniform float zNear;
      uniform float zFar;
      uniform vec4 projInfo;

      vec3 normalFromWorld(const vec3 position) {
        return normalize(cross(dFdy(position), dFdx(position)));
      }

      const int NUM_SAMPLES = 11;
      const int NUM_SPIRAL_TURNS = 7;
      const float EPSILON = 0.1;
      const float BIAS = 0.4;
      const float WORLD_SPACE_RADIUS = 50.0; // radius of influence in world space
      const float SCREENSPACE_SCALE = 10.0;
      const float INTENSITY = 150.0;

      const float M_PI = 3.1415926535897932384626433832795;

      // No bitwise AND in webgl :(
      int AND(int n1, int n2){
        float v1 = float(n1);
        float v2 = float(n2);

        int byteVal = 1;
        int result = 0;

        for(int i = 0; i < 32; i++){
          bool keepGoing = v1>0.0 || v2 > 0.0;
          if(keepGoing){

            bool addOn = mod(v1, 2.0) > 0.0 && mod(v2, 2.0) > 0.0;

            if(addOn){
              result += byteVal;
            }

            v1 = floor(v1 / 2.0);
            v2 = floor(v2 / 2.0);
            byteVal *= 2;
          } else {
            return result;
          }
        }
        return result;
      }

      float random(vec3 scale, float seed) {
        return fract(sin(dot(gl_FragCoord.xyz + seed + gl_FragCoord.x, scale)) * (gl_FragCoord.y + 43758.5453) + seed);
      }

      vec3 worldFromScreen(const vec2 screen) {
        float depth = texture2D(depth, screen).x;

        float z = zNear * zFar  / ((zNear - zFar) * depth + zFar);
        return vec3(((screen * vec2(screenSize)) * projInfo.xy + projInfo.zw) * z, z);
      }

      vec3 getOffsetPositionVS(vec2 screenOrigin, vec2 unitOffset, float screenSpaceRadius) {
        // Offset by screenSpaceRadius pixels in the direction of unitOffset
        vec2 screenOffset = screenOrigin +
          screenSpaceRadius * unitOffset * vec2(1.0 / screenSize.x, 1.0 / screenSize.y);

        // Get the world coordinate from the offset screen space coordinate
        return worldFromScreen(screenOffset);
      }

      void main() {
        vec2 screenSpaceOrigin = gl_FragCoord.xy * vec2(1.0/screenSize.x, 1.0/screenSize.y);

        ivec2 pixel = ivec2(gl_FragCoord.xy);

        vec3 worldSpaceOrigin = worldFromScreen(screenSpaceOrigin);
        vec3 normalAtOrigin = normalFromWorld(worldSpaceOrigin);

        vec3 randomScale = vec3(129.898, 782.33, 1517.182);
        vec3 sampleNoise = vec3(
          random(randomScale, 0.0),
          random(randomScale, 1.0),
          random(randomScale, 2.0));

        float initialAngle = 2.0 * M_PI * sampleNoise.x;

        // radius of influence in screen space
        float screenSpaceSampleRadius = SCREENSPACE_SCALE * WORLD_SPACE_RADIUS / worldSpaceOrigin.z;

        float occlusion = 0.0;
        for (int sampleNumber = 0; sampleNumber < NUM_SAMPLES; sampleNumber++) {

          // Step 1:
          // Looking at the 2D image of the scene, sample the points surrounding the current one
          // in a spiral pattern
          float sampleProgress = (float(sampleNumber) + 0.5) * (1.0 / float(NUM_SAMPLES));
          float angle = sampleProgress * (float(NUM_SPIRAL_TURNS) * 2.0 * M_PI) + initialAngle;
          float sampleDistance = sampleProgress * screenSpaceSampleRadius;
          vec2 angleUnitVector = vec2(cos(angle), sin(angle));

          vec2 sampleCoord = screenSpaceOrigin +
            sampleDistance * angleUnitVector * vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
          if (sampleCoord.x < 0.0 || sampleCoord.x > 1.0 ||
              sampleCoord.y < 0.0 || sampleCoord.y > 1.0 ||
              texture2D(depth, sampleCoord).x == 1.0) {
            continue;
          }

          // Step 2:
          // Get the 3d coordinate corresponding to the sample on the spiral
          vec3 worldSpaceSample =
            getOffsetPositionVS(screenSpaceOrigin, angleUnitVector, sampleDistance);

          // Step 3:
          // Approximate occlusion from this sample
          vec3 originToSample = worldSpaceSample - worldSpaceOrigin;
          float squaredDistanceToSample = dot(originToSample, originToSample);

          // vn is proportional to how close the sample point is to the origin point along
          // the normal at the origin
          float vn = dot(originToSample, normalAtOrigin) - BIAS;

          // f is proportional to how close the sample point is to the origin point in the
          // sphere of influence in world space
          float radiusSquared = WORLD_SPACE_RADIUS * WORLD_SPACE_RADIUS;
          float f = max(radiusSquared - squaredDistanceToSample, 0.0) / radiusSquared;
          float sampleOcclusion =  f * f * f * max(vn / (EPSILON + squaredDistanceToSample), 0.0);

          // Accumulate occlusion
          occlusion += sampleOcclusion;
        }

        occlusion = 1.0 - occlusion / (4.0 * float(NUM_SAMPLES));
        occlusion = clamp(pow(occlusion, 1.0 + INTENSITY), 0.0, 1.0);
        //if (abs(dFdx(worldSpaceOrigin.z)) < 0.5) {
          //occlusion -= dFdx(occlusion) * (float(AND(pixel.x, 1)) - 0.5);
        //}
        //if (abs(dFdy(worldSpaceOrigin.z)) < 0.5) {
          //occlusion -= dFdy(occlusion) * (float(AND(pixel.y, 1)) - 0.5);
        //}

        gl_FragColor = vec4(occlusion, occlusion, occlusion, 1.0);
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
      screenSize: ({framebufferWidth, framebufferHeight}) => [framebufferWidth, framebufferHeight],
      color: regl.prop('color'),
      depth: regl.prop('depth'),
      zNear: regl.prop('zNear'),
      zFar: regl.prop('zFar'),
      projInfo: regl.prop('projInfo'),
    },

    primitive: 'triangle strip',
  });
}
