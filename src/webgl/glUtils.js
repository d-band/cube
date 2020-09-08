import { $V, $M } from './sylvester';

export function mht (m) {
  let s = '';
  if (m.length === 16) {
    for (let i = 0; i < 4; i++) {
      s += '<span style="font-family: monospace">[' + m[i * 4 + 0].toFixed(4) + ',' + m[i * 4 + 1].toFixed(4) + ',' + m[i * 4 + 2].toFixed(4) + ',' + m[i * 4 + 3].toFixed(4) + ']</span><br>';
    }
  } else if (m.length === 9) {
    for (let i = 0; i < 3; i++) {
      s += '<span style="font-family: monospace">[' + m[i * 3 + 0].toFixed(4) + ',' + m[i * 3 + 1].toFixed(4) + ',' + m[i * 3 + 2].toFixed(4) + ']</font><br>';
    }
  } else {
    return m.toString();
  }
  return s;
}

//
// gluLookAt
//
export function makeLookAt (ex, ey, ez, cx, cy, cz, ux, uy, uz) {
  const eye = $V([ex, ey, ez]);
  const center = $V([cx, cy, cz]);
  const up = $V([ux, uy, uz]);
  const z = eye.subtract(center).toUnitVector();
  const x = up.cross(z).toUnitVector();
  const y = z.cross(x).toUnitVector();

  const m = $M([
    [x.e(1), x.e(2), x.e(3), 0],
    [y.e(1), y.e(2), y.e(3), 0],
    [z.e(1), z.e(2), z.e(3), 0],
    [0, 0, 0, 1]
  ]);

  const t = $M([
    [1, 0, 0, -ex],
    [0, 1, 0, -ey],
    [0, 0, 1, -ez],
    [0, 0, 0, 1]
  ]);
  return m.x(t);
}

//
// glOrtho
//
export function makeOrtho (left, right, bottom, top, znear, zfar) {
  const tx = -(right + left) / (right - left);
  const ty = -(top + bottom) / (top - bottom);
  const tz = -(zfar + znear) / (zfar - znear);

  return $M([
    [2 / (right - left), 0, 0, tx],
    [0, 2 / (top - bottom), 0, ty],
    [0, 0, -2 / (zfar - znear), tz],
    [0, 0, 0, 1]
  ]);
}

//
// gluPerspective
//
export function makePerspective (fovy, aspect, znear, zfar) {
  const ymax = znear * Math.tan(fovy * Math.PI / 360.0);
  const ymin = -ymax;
  const xmin = ymin * aspect;
  const xmax = ymax * aspect;
  return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
}

//
// glFrustum
//
export function makeFrustum (left, right, bottom, top, znear, zfar) {
  const X = 2 * znear / (right - left);
  const Y = 2 * znear / (top - bottom);
  const A = (right + left) / (right - left);
  const B = (top + bottom) / (top - bottom);
  const C = -(zfar + znear) / (zfar - znear);
  const D = -2 * zfar * znear / (zfar - znear);
  return $M([
    [X, 0, A, 0],
    [0, Y, B, 0],
    [0, 0, C, D],
    [0, 0, -1, 0]
  ]);
}
