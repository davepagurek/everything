import { mat4 } from 'gl-matrix';
import { range } from 'lodash';
import qh from 'quickhull3d';

export function terrain(numPoints = 100) {
  const positions = range(numPoints).map(() => {
    const x = Math.random() * 2 - 1;
    const z = Math.random() * 2 - 1;

    return [
      x,
      Math.random() * 2 - 1 - 10*(x*x + z*z), // Pull down edges
      z,
    ]
  });

  const indices = qh(positions);

  return {
    positions,
    indices,
    model: mat4.create()
  };
};
