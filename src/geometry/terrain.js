import { mat4 } from 'gl-matrix';
import { range } from 'lodash';
import { Noise } from 'noisejs';
import qh from 'quickhull3d';

const noise = new Noise(Math.random());
const perlin = (x, y, octaves) => {
  let val = 0;

  for (let octave = 0; octave < octaves; octave++) {
    const scale = Math.pow(2, octave);
    val += noise.perlin2(x * scale, y * scale) / scale;
  }

  return val;
};

export function terrain(numPoints = 2000) {
  const hullPoints = range(numPoints).map(() => {
    const x = Math.random() * 8 - 4;
    const y = Math.random() * 8 - 4;

    return [
      x,
      y,
      -x*x - y*y
    ];
  });

  const positions = hullPoints.map(([a, b, c]) => [
    a,
    perlin(a * 1, b * 1, 3)*5, // - 0.1*(a*a + b*b), // Pull down edges
    b,
  ]);

  hullPoints.push(
    [-2000, 0, -4000000],
    [2000, 2000, -8000000],
    [2000, -2000, -8000000]
  );

  const hullIndices = qh(positions);

  const indices =
    hullIndices.filter(([a, b, c]) => a < positions.length && b < positions.length && c < positions.length);

  return {
    positions,
    indices,
    model: mat4.create()
  };
};
