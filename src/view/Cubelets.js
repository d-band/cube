import Cube from './Cube';
import { vec, feq } from './util';

function principal_value (angle) {
  angle = ((angle + Math.PI) % (2 * Math.PI) - Math.PI);
  if (feq(angle, -Math.PI)) {
    angle = Math.PI;
  }
  return angle;
}

export default function Cubelets (set) {
  let cubes;
  let scene;
  let settings;

  function linkRendering (d) {
    scene = d;
  }

  function draw () {
    for (let i = 0; i < cubes.length; i++) {
      cubes[i].draw(scene);
    }
  }

  function removeAll () {
    cubes = [];
  }

  function add (x, y, z, len, up, right, colors) {
    cubes.push(new Cube(scene, x, y, z, len, up, right, colors, settings, true));
  }

  function makeMove (move, moveFrameStart) {
    if (move.hasOwnProperty('action')) {
      move.action();
      return true;
    }
    for (let i = 0; i < cubes.length; i++) {
      const cube = cubes[i];
      if (move.applies(cube)) {
        if (cube.moving.currently) {
          return false;
        }
      }
    }
    for (let i = 0; i < cubes.length; i++) {
      const cube = cubes[i];
      if (move.applies(cube)) {
        cube.rotate(move.axis, move.angle, moveFrameStart);
      }
    }
    return true;
  }

  function makeMoveOnState (cubes, move) {
    for (let i = 0; i < cubes.length; i += 1) {
      const cube = cubes[i];
      if (move.applies(cube)) {
        cube.rotate(move.axis, move.angle, 5);
        cube.moving.stop();
      }
    }
    return cubes;
  }

  function getMove (moves, moveIdx) {
    return moves[moveIdx];
  }

  function getIdx (moves, axis, angle) {
    for (const moveIdx in moves) {
      if (moves.hasOwnProperty(moveIdx)) {
        const move = moves[moveIdx];
        if (vec.parallel(move.axis, axis) &&
          feq(move.angle, angle)) {
          return moveIdx;
        }
      }
    }
    throw new Error('Move not found: (' + vec.str(axis) + ', ' + angle.toString() + ')');
  }

  function setState (state) {
    if (state === 'solved') {
      for (let i = 0; i < cubes.length; i++) {
        const cube = cubes[i];
        cube.returnHome();
      }
    }
  }

  function opposite (move, state) {
    if (move.hasOwnProperty('action')) {
      return move;
    } else {
      const angle = principal_value(-1 * move.angle);
      const axis = move.axis;
      return state.getMoveFromIdx(state.getIdxFromMove(axis, angle));
    }
  }

  function getState (moves) {
    const state = {
      cubes: []
    };
    for (let i = 0; i < cubes.length; i++) {
      const cube = cubes[i];
      state.cubes.push(cube.getState());
    }
    state.makeMove = (move) => {
      return makeMoveOnState(state.cubes, move);
    };
    state.unmakeMove = (move) => {
      return makeMoveOnState(state.cubes, opposite(move, state));
    };
    state.getMoveFromIdx = (moveIdx) => {
      return getMove(moves, moveIdx);
    };
    state.moves = moves;
    state.getIdxFromMove = (axis, angle) => {
      return getIdx(moves, axis, angle);
    };
    state.isSolved = () => {
      for (let k = 0; k < cubes.length; k++) {
        const cube = cubes[k];
        if (!cube.isHome()) return false;
      }
      return true;
    };
    return state;
  }

  function getFaces () {
    const faces = [];
    for (let i = 0; i < cubes.length; i++) {
      const arr = cubes[i].getFaces();
      faces.push(...arr);
    }
    return faces;
  }

  function updateRotation () {
    for (let i = 0; i < cubes.length; i++) {
      const cube = cubes[i];
      if (cube.moving.currently) {
        cube.moving.update();
      }
    }
  }

  function init (set) {
    cubes = [];
    settings = set;
  }
  init(set);

  this.linkRendering = linkRendering;
  this.draw = draw;
  this.removeAll = removeAll;
  this.updateRotation = updateRotation;
  this.makeMove = makeMove;
  this.add = add;
  this.setState = setState;
  this.getState = getState;
  this.getFaces = getFaces;
}
