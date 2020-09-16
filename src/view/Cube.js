import { copyArray, vec, feq, afeq } from './util';

function transformPortion (portion, expFactor) {
  if (portion > 0.5) {
    return 0.5 + (0.5 * Math.pow(2 * (portion - 0.5), expFactor));
  } else {
    return 0.5 - (0.5 * Math.pow(2 * (0.5 - portion), expFactor));
  }
}

/* Cube is centered at (x, y, z)
 * Each edge has length `len`
 * "Up" indicates the normal to the face with color colors[2]
 * "Right" indicates the normal to the face with color colors[4]
 * Colors are in this order: F B U D R L
 */
export default function Cube (
  sceneData, x, y, z, len, up, right, cols, set, atHome,
  xHome, yHome, zHome, lenHome, upHome, rightHome
) {
  if (atHome) {
    xHome = x;
    yHome = y;
    zHome = z;
    lenHome = len;
    upHome = up;
    rightHome = right;
  }

  let colors;
  let scene;
  let settings;
  let texture;
  const loc = {
    len: len,
    pos: [x, y, z],
    orientation: {
      up: up,
      right: right
    }
  };
  /* Permanent location (updated at the end of a move) */
  const ploc = {
    len: len,
    pos: [x, y, z],
    orientation: {
      up: copyArray(up),
      right: copyArray(right)
    }
  };
  /* Buffers (used for WebGL rendering) */
  const buffers = {
    vertices: null,
    normals: null,
    texture: null,
    indices: null
  };
  /* Starting position and orientation. This is where the solver
   * aims to return the Cube to.
   */
  const home = {
    len: lenHome,
    pos: [xHome, yHome, zHome],
    orientation: {
      up: copyArray(upHome),
      right: copyArray(rightHome)
    }
  };
  /* Data about the movement state. */
  const moving = {
    currently: false,
    update: null,
    stop: null,
    frameStart: null,
    frameCurrent: null
  };

  /* Snap the cube into integer coordinates. Used at move completion
   * to remove rounding errors. It is important that inter-move locations
   * are on integer coordinates, because of this function!
   */
  function getState () {
    return new Cube(sceneData,
      ploc.pos[0], ploc.pos[1], ploc.pos[2],
      ploc.len, copyArray(ploc.orientation.up),
      copyArray(ploc.orientation.right),
      cols, set, false,
      home.pos[0], home.pos[1], home.pos[2],
      home.len, copyArray(home.orientation.up),
      copyArray(home.orientation.right));
  }

  function snap () {
    loc.pos = vec.ints(loc.pos);
    loc.orientation = {
      up: vec.ints(loc.orientation.up),
      right: vec.ints(loc.orientation.right)
    };
    ploc.pos = copyArray(loc.pos);
    ploc.orientation = {
      up: copyArray(loc.orientation.up),
      right: copyArray(loc.orientation.right)
    };
  }

  this.alignedWithAxis = function (axis) {
    return (
      afeq(vec.dot(axis, ploc.orientation.up), vec.dot(axis, home.orientation.up)) &&
      afeq(vec.dot(axis, ploc.orientation.right), vec.dot(axis, home.orientation.right))
    );
  };

  this.palignedWithAxis = function (axis) {
    return (
      feq(vec.dot(axis, this.ploc.orientation.up), vec.dot(axis, this.home.orientation.up)) &&
      feq(vec.dot(axis, this.ploc.orientation.right), vec.dot(axis, this.home.orientation.right))
    );
  };

  this.alignedWithAxes = function (home, current) {
    return (
      afeq(vec.dot(vec.unit(current), vec.unit(this.ploc.orientation.up)), vec.dot(vec.unit(home), vec.unit(this.home.orientation.up))) &&
      afeq(vec.dot(vec.unit(current), vec.unit(this.ploc.orientation.right)), vec.dot(vec.unit(home), vec.unit(this.home.orientation.right)))
    );
  };

  this.isHome = function () {
    if (!(vec.isZero(this.home.pos) && vec.isZero(this.ploc.pos)) &&
      !vec.parallel(this.home.pos, this.ploc.pos)) { return false; }
    if (!vec.parallel(this.home.orientation.up, this.ploc.orientation.up)) return false;
    if (!vec.parallel(this.home.orientation.right, this.ploc.orientation.right)) return false;
    return true;
  };

  function returnHome () {
    moving.currently = false;
    loc.pos = copyArray(home.pos);
    loc.orientation.up = copyArray(home.orientation.up);
    loc.orientation.right = copyArray(home.orientation.right);
    loc.len = home.len;
    snap();
    resetBuffers();
  }

  function rotate (axis, angle, frameStart) {
    const hand = vec.without(loc.pos, axis);
    const perpHand = vec.setMag(vec.mag(hand), vec.cross(axis, hand));
    const getPos = (portion) => vec.add(
      axis,
      vec.add(
        vec.muls(Math.cos(angle * (1 - portion)), hand),
        vec.muls(Math.sin(angle * (1 - portion)), perpHand)
      )
    );
    const upOrig = vec.unit(loc.orientation.up);
    const upPerp = vec.unit(vec.cross(axis, upOrig));
    const rightOrig = vec.unit(loc.orientation.right);
    const rightPerp = vec.unit(vec.cross(axis, rightOrig));
    const getOrientation = (portion) => ({
      up: vec.isZero(upPerp) ? upOrig : vec.add(
        vec.muls(Math.cos(angle * (1 - portion)), upOrig),
        vec.muls(Math.sin(angle * (1 - portion)), upPerp)
      ),
      right: vec.isZero(rightPerp) ? rightOrig : vec.add(
        vec.muls(Math.cos(angle * (1 - portion)), rightOrig),
        vec.muls(Math.sin(angle * (1 - portion)), rightPerp)
      )
    });
    moving.update = () => {
      let portion = moving.frameCurrent / moving.frameStart;
      portion = transformPortion(portion, settings.turnAcceleration);
      loc.pos = getPos(portion);
      loc.orientation = getOrientation(portion);
      resetBuffers();
      moving.frameCurrent -= 1;
      if (moving.frameCurrent <= -1) {
        /* Stop rotating */
        moving.stop();
      }
      return (moving.frameCurrent <= -1);
    };
    moving.stop = () => {
      loc.pos = getPos(0);
      loc.orientation = getOrientation(0);
      snap();
      moving.currently = false;
      resetBuffers();
    };
    moving.currently = true;
    moving.frameStart = frameStart;
    moving.frameCurrent = frameStart;
    moving.update();
  }

  /* Used by resetBuffers */
  function getVertices () {
    const r = loc.len * 0.5;
    let F = vec.unit(vec.cross(loc.orientation.right, loc.orientation.up));
    let U = vec.unit(loc.orientation.up);
    let R = vec.unit(loc.orientation.right);
    F = vec.muls(r, F);
    U = vec.muls(r, U);
    R = vec.muls(r, R);
    const B = vec.muls(-1, F);
    const D = vec.muls(-1, U);
    const L = vec.muls(-1, R);
    const FUL = vec.add(loc.pos, vec.add(F, vec.add(U, L)));
    const FUR = vec.add(loc.pos, vec.add(F, vec.add(U, R)));
    const FDL = vec.add(loc.pos, vec.add(F, vec.add(D, L)));
    const FDR = vec.add(loc.pos, vec.add(F, vec.add(D, R)));
    const BUL = vec.add(loc.pos, vec.add(B, vec.add(U, L)));
    const BUR = vec.add(loc.pos, vec.add(B, vec.add(U, R)));
    const BDL = vec.add(loc.pos, vec.add(B, vec.add(D, L)));
    const BDR = vec.add(loc.pos, vec.add(B, vec.add(D, R)));

    return [
      // Front face
      FUL[0], FUL[1], FUL[2],
      FUR[0], FUR[1], FUR[2],
      FDR[0], FDR[1], FDR[2],
      FDL[0], FDL[1], FDL[2],
      // Back face
      BUL[0], BUL[1], BUL[2],
      BUR[0], BUR[1], BUR[2],
      BDR[0], BDR[1], BDR[2],
      BDL[0], BDL[1], BDL[2],
      // Top face
      FUL[0], FUL[1], FUL[2],
      BUL[0], BUL[1], BUL[2],
      BUR[0], BUR[1], BUR[2],
      FUR[0], FUR[1], FUR[2],
      // Bottom face
      FDL[0], FDL[1], FDL[2],
      BDL[0], BDL[1], BDL[2],
      BDR[0], BDR[1], BDR[2],
      FDR[0], FDR[1], FDR[2],
      // Right face
      FUR[0], FUR[1], FUR[2],
      FDR[0], FDR[1], FDR[2],
      BDR[0], BDR[1], BDR[2],
      BUR[0], BUR[1], BUR[2],
      // Left face
      FUL[0], FUL[1], FUL[2],
      FDL[0], FDL[1], FDL[2],
      BDL[0], BDL[1], BDL[2],
      BUL[0], BUL[1], BUL[2]
    ];
  }

  function getNormals () {
    const F = vec.unit(vec.cross(loc.orientation.right, loc.orientation.up));
    const U = vec.unit(loc.orientation.up);
    const R = vec.unit(loc.orientation.right);
    const B = vec.muls(-1, F);
    const D = vec.muls(-1, U);
    const L = vec.muls(-1, R);

    return [
      // Front
      F[0], F[1], F[2],
      F[0], F[1], F[2],
      F[0], F[1], F[2],
      F[0], F[1], F[2],
      // Back
      B[0], B[1], B[2],
      B[0], B[1], B[2],
      B[0], B[1], B[2],
      B[0], B[1], B[2],
      // Top
      U[0], U[1], U[2],
      U[0], U[1], U[2],
      U[0], U[1], U[2],
      U[0], U[1], U[2],
      // Bottom
      D[0], D[1], D[2],
      D[0], D[1], D[2],
      D[0], D[1], D[2],
      D[0], D[1], D[2],
      // Right
      R[0], R[1], R[2],
      R[0], R[1], R[2],
      R[0], R[1], R[2],
      R[0], R[1], R[2],
      // Left
      L[0], L[1], L[2],
      L[0], L[1], L[2],
      L[0], L[1], L[2],
      L[0], L[1], L[2]
    ];
  }

  function getTextureCoords () {
    return [
      // Front
      0.0, 1.0 - 0.125 * colors[0],
      1.0, 1.0 - 0.125 * colors[0],
      1.0, 1.0 - 0.125 * (1 + colors[0]),
      0.0, 1.0 - 0.125 * (1 + colors[0]),
      // Back
      0.0, 1.0 - 0.125 * colors[1],
      1.0, 1.0 - 0.125 * colors[1],
      1.0, 1.0 - 0.125 * (1 + colors[1]),
      0.0, 1.0 - 0.125 * (1 + colors[1]),
      // Top
      0.0, 1.0 - 0.125 * colors[2],
      1.0, 1.0 - 0.125 * colors[2],
      1.0, 1.0 - 0.125 * (1 + colors[2]),
      0.0, 1.0 - 0.125 * (1 + colors[2]),
      // Bottom
      0.0, 1.0 - 0.125 * colors[3],
      1.0, 1.0 - 0.125 * colors[3],
      1.0, 1.0 - 0.125 * (1 + colors[3]),
      0.0, 1.0 - 0.125 * (1 + colors[3]),
      // Right
      0.0, 1.0 - 0.125 * colors[4],
      1.0, 1.0 - 0.125 * colors[4],
      1.0, 1.0 - 0.125 * (1 + colors[4]),
      0.0, 1.0 - 0.125 * (1 + colors[4]),
      // Left
      0.0, 1.0 - 0.125 * colors[5],
      1.0, 1.0 - 0.125 * colors[5],
      1.0, 1.0 - 0.125 * (1 + colors[5]),
      0.0, 1.0 - 0.125 * (1 + colors[5])
    ];
  }

  function getIndices () {
    return [
      0, 1, 2, 0, 2, 3, // front
      4, 5, 6, 4, 6, 7, // back
      8, 9, 10, 8, 10, 11, // top
      12, 13, 14, 12, 14, 15, // bottom
      16, 17, 18, 16, 18, 19, // right
      20, 21, 22, 20, 22, 23 // left
    ];
  }

  function resetBuffers () {
    const gl = scene.gl;
    const vertices = getVertices();
    const vertexNormals = getNormals();
    const textureCoordinates = getTextureCoords();
    const vertexIndices = getIndices();

    buffers.vertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    buffers.normals = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normals);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);

    buffers.texture = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texture);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

    buffers.indices = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);
  }

  function draw (scene) {
    const gl = scene.gl;
    scene.mvPushMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
    gl.vertexAttribPointer(scene.vertexPositionAttribute, 3,
      gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texture);
    gl.vertexAttribPointer(scene.textureCoordAttribute, 2,
      gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normals);
    gl.vertexAttribPointer(scene.vertexNormalAttribute, 3,
      gl.FLOAT, false, 0, 0);
    // Specify the texture to map onto the faces.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(scene.shaderProgram, 'uSampler'), 0);
    // Draw the cube.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    scene.setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    scene.mvPopMatrix();
  }

  let image = null;

  function createTexture () {
    const gl = scene.gl;
    if (!image) {
      const canvas = document.createElement('canvas');
      canvas.id = 'hiddenCanvas';
      canvas.width = 128;
      canvas.height = 128 * 8;
      canvas.style.display = 'none';
      const body = document.getElementsByTagName('body')[0];
      body.appendChild(canvas);
      // draw texture
      image = document.getElementById('hiddenCanvas');
      const ctx = image.getContext('2d');
      ctx.beginPath();
      ctx.rect(0, 0, ctx.canvas.width / 2, ctx.canvas.height / 2);
      ctx.fillStyle = 'white';
      ctx.fill();

      const W = 128;
      const H = 128;

      for (let f = 0; f < settings.colors.length; f++) {
        ctx.beginPath();
        ctx.rect(0, H * f, W, H);
        ctx.fillStyle = settings.colors[f];
        ctx.fill();
      }
      ctx.restore();
    }
    // create new texture
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_NEAREST);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
      gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return tex;
  }

  function tostring () {
    const outwardColors = [];
    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      if (color !== -1) {
        outwardColors.push(settings.colors[color]);
      }
    }
    switch (outwardColors.length) {
      case 0:
        return 'inner piece';
      case 1:
        return outwardColors[0] + ' center piece';
      case 2:
        return outwardColors[0] + ' and ' + outwardColors[1] + ' edge piece';
      case 3:
        return outwardColors[0] + ', ' + outwardColors[1] + ', and ' + outwardColors[2] + ' corner piece';
      default:
        return 'unknown piece';
    }
  }

  function getFaces () {
    const U = ploc.orientation.up;
    const R = ploc.orientation.right;
    const F = vec.cross(R, U);
    const B = vec.muls(-1, F);
    const D = vec.muls(-1, U);
    const L = vec.muls(-1, R);
    const pos = [F, B, U, D, R, L].map(v => vec.add(ploc.pos, v));
    const faces = [];
    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      if (color !== -1) {
        faces.push({ color, pos: pos[i] });
      }
    }
    return faces;
  }

  function init (sce, set, cols) {
    scene = sce;
    settings = set;
    colors = cols;
    texture = createTexture();
    resetBuffers();
  }
  init(sceneData, set, cols);

  this.draw = draw;
  this.moving = moving;
  this.rotate = rotate;
  this.loc = loc;
  this.ploc = ploc;
  this.home = home;
  this.returnHome = returnHome;
  this.getState = getState;
  this.str = tostring;
  this.getFaces = getFaces;
}
