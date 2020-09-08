import { toInt, feq } from './util';
import Cubelets from './Cubelets';
import { $V } from '../webgl/sylvester';

const KEYCODES = {
  up: 38,
  down: 40,
  left: 37,
  right: 39,
  f: 70,
  u: 85,
  d: 68,
  r: 82,
  l: 76,
  b: 66,
  shift: 16,
  two: 50
};

export default function RubiksCube (sce, set, cubr) {
  let cubelets;
  let scene;
  let moveQueue;
  let moves;
  let settings;

  function setVersion (versionID) {
    cubelets.removeAll();
    const sl = versionID;
    const min = -sl + 1;
    const max = sl - 1;
    for (let z = min; z <= max; z += 2) {
      for (let y = min; y <= max; y += 2) {
        for (let x = min; x <= max; x += 2) {
          const colors = [
            (z === max) ? 0 : -1,
            (z === min) ? 1 : -1,
            (y === max) ? 2 : -1,
            (y === min) ? 3 : -1,
            (x === max) ? 4 : -1,
            (x === min) ? 5 : -1
          ];
          cubelets.add(x, y, z, 1.95, [0, 1, 0], [1, 0, 0], colors);
        }
      }
    }
  }

  function checkForMoves (key, keys) {
    for (const i in moves) {
      if (moves.hasOwnProperty(i)) {
        const move = moves[i];
        if (!keys[key] && (move.key === key) &&
          keys[KEYCODES.shift] === move.shiftReq &&
          keys[KEYCODES.two] === move.tReq) {
          moveQueue.push(move);
          break;
        }
      }
    }
  }

  function randomMove () {
    let result;
    let count = 0;
    for (const key in moves) {
      if (moves.hasOwnProperty(key)) {
        count += 1;
        if (Math.random() < 1 / count) {
          result = moves[key];
        }
      }
    }
    return result;
  }

  function makeMoves (moveList) {
    const list = [];
    moveList.forEach(v => {
      if (typeof v === 'string') {
        const move = moves[v.toLowerCase()];
        if (move) {
          list.push(move);
        }
      } else {
        list.push(v);
      }
    });
    enqueueMoves(list, false);
  }

  function enqueueMoves (moves, clearOthers) {
    if (clearOthers) {
      moveQueue = [];
    }
    moveQueue.push.apply(moveQueue, moves);
  }

  function shuffle (startAction, endAction, numMoves) {
    const randomMoves = [];
    const info = {
      moves: randomMoves,
      newMove (i) {
        info.moves.push(randomMove());
        info.moves.push({
          action () {
            cubr.updateProgressBar((1.0 * i) / numMoves);
          }
        });
      }
    };
    randomMoves.push({
      action: startAction
    });
    for (let i = 0; i < numMoves; i++) {
      info.newMove(i);
    }
    randomMoves.push({
      action () {
        cubr.updateProgressBar(0);
      }
    });
    randomMoves.push({
      action: endAction
    });
    enqueueMoves(randomMoves, false);
  }

  function makeMove (move) {
    return cubelets.makeMove(move, toInt(
      settings.speed * Math.sqrt(Math.abs(move.angle))
    ));
  }

  function cycleMoves () {
    let soFar = 0;
    while (moveQueue.length > 0 && soFar < settings.movesPerFrame && !settings.paused) {
      const move = moveQueue[0];
      if (!makeMove(move)) {
        break;
      } else {
        moveQueue.shift();
      }
      soFar++;
    }
  }

  function rotate (dx, dy) {
    const right = $V([1.0, 0.0, 0.0, 0.0]);
    const up = $V([0.0, 1.0, 0.0, 0.0]);

    const inv = scene.data.mvMatrix.inverse();
    const newRight = inv.x(right);
    if (dy !== 0) {
      scene.data.mvRotate(dy, [
        newRight.elements[0],
        newRight.elements[1],
        newRight.elements[2]
      ]);
    }

    const newUp = inv.x(up);
    if (dx !== 0) {
      scene.data.mvRotate(dx, [
        newUp.elements[0],
        newUp.elements[1],
        newUp.elements[2]
      ]);
    }
  }

  function update (keys, momentum) {
    cycleMoves();
    cubelets.updateRotation();
    const r = settings.rotateSpeed;
    let dx = 0;
    let dy = 0;
    if (keys[KEYCODES.up]) {
      dy -= r;
    }
    if (keys[KEYCODES.down]) {
      dy += r;
    }
    if (keys[KEYCODES.left]) {
      dx -= r;
    }
    if (keys[KEYCODES.right]) {
      dx += r;
    }
    rotate(dx + momentum.x, dy + momentum.y);
  }

  function initMoves () {
    moveQueue = [];
    moves = {};
    /* Front */
    moves.f = {
      axis: [0.0, 0.0, 2.0],
      key: KEYCODES.f,
      shiftReq: false,
      tReq: false,
      angle: -Math.PI / 2,
      applies: c => feq(c.ploc.pos[2], 2)
    };
    moves["f'"] = {
      axis: [0.0, 0.0, 2.0],
      key: KEYCODES.f,
      shiftReq: true,
      tReq: false,
      angle: Math.PI / 2,
      applies: c => feq(c.ploc.pos[2], 2)
    };
    moves.f2 = {
      axis: [0.0, 0.0, 2.0],
      key: KEYCODES.f,
      shiftReq: false,
      tReq: true,
      angle: Math.PI,
      applies: c => feq(c.ploc.pos[2], 2)
    };
    /* Back */
    moves.b = {
      axis: [0.0, 0.0, -2.0],
      key: KEYCODES.b,
      shiftReq: false,
      tReq: false,
      angle: -Math.PI / 2,
      applies: c => feq(c.ploc.pos[2], -2)
    };
    moves["b'"] = {
      axis: [0.0, 0.0, -2.0],
      key: KEYCODES.b,
      shiftReq: true,
      tReq: false,
      angle: Math.PI / 2,
      applies: c => feq(c.ploc.pos[2], -2)
    };
    moves.b2 = {
      axis: [0.0, 0.0, -2.0],
      key: KEYCODES.b,
      shiftReq: false,
      tReq: true,
      angle: Math.PI,
      applies: c => feq(c.ploc.pos[2], -2)
    };
    /* Right */
    moves.r = {
      axis: [2.0, 0.0, 0.0],
      key: KEYCODES.r,
      shiftReq: false,
      tReq: false,
      angle: -Math.PI / 2,
      applies: c => feq(c.ploc.pos[0], 2)
    };
    moves["r'"] = {
      axis: [2.0, 0.0, 0.0],
      key: KEYCODES.r,
      shiftReq: true,
      tReq: false,
      angle: Math.PI / 2,
      applies: c => feq(c.ploc.pos[0], 2)
    };
    moves.r2 = {
      axis: [2.0, 0.0, 0.0],
      key: KEYCODES.r,
      shiftReq: false,
      tReq: true,
      angle: Math.PI,
      applies: c => feq(c.ploc.pos[0], 2)
    };
    /* Left */
    moves.l = {
      axis: [-2.0, 0.0, 0.0],
      angle: -Math.PI / 2,
      key: KEYCODES.l,
      shiftReq: false,
      tReq: false,
      applies: c => feq(c.ploc.pos[0], -2)
    };
    moves["l'"] = {
      axis: [-2.0, 0.0, 0.0],
      angle: Math.PI / 2,
      key: KEYCODES.l,
      shiftReq: true,
      tReq: false,
      applies: c => feq(c.ploc.pos[0], -2)
    };
    moves.l2 = {
      axis: [-2.0, 0.0, 0.0],
      angle: Math.PI,
      key: KEYCODES.l,
      shiftReq: false,
      tReq: true,
      applies: c => feq(c.ploc.pos[0], -2)
    };
    /* Up */
    moves.u = {
      axis: [0.0, 2.0, 0.0],
      key: KEYCODES.u,
      shiftReq: false,
      tReq: false,
      angle: -Math.PI / 2,
      applies: c => feq(c.ploc.pos[1], 2)
    };
    moves["u'"] = {
      axis: [0.0, 2.0, 0.0],
      key: KEYCODES.u,
      shiftReq: true,
      tReq: false,
      angle: Math.PI / 2,
      applies: c => feq(c.ploc.pos[1], 2)
    };
    moves.u2 = {
      axis: [0.0, 2.0, 0.0],
      key: KEYCODES.u,
      shiftReq: false,
      tReq: true,
      angle: Math.PI,
      applies: c => feq(c.ploc.pos[1], 2)
    };
    /* Down */
    moves.d = {
      axis: [0.0, -2.0, 0.0],
      key: KEYCODES.d,
      shiftReq: false,
      tReq: false,
      angle: -Math.PI / 2,
      applies: c => feq(c.ploc.pos[1], -2)
    };
    moves["d'"] = {
      axis: [0.0, -2.0, 0.0],
      key: KEYCODES.d,
      shiftReq: true,
      tReq: false,
      angle: Math.PI / 2,
      applies: c => feq(c.ploc.pos[1], -2)
    };
    moves.d2 = {
      axis: [0.0, -2.0, 0.0],
      key: KEYCODES.d,
      shiftReq: false,
      tReq: true,
      angle: Math.PI,
      applies: c => feq(c.ploc.pos[1], -2)
    };
  }

  function setState (state, abort) {
    if (abort) {
      for (let i = 0; i < moveQueue.length; i += 1) {
        const move = moveQueue[i];
        if (move.hasOwnProperty('action')) {
          move.action();
        }
      }
      moveQueue = [];
    }
    cubelets.setState(state);
  }

  function getState () {
    return cubelets.getState(moves);
  };

  function init (sce, set) {
    scene = sce;
    settings = set;
    cubelets = new Cubelets(settings);
    initMoves();
    scene.linkObjects(cubelets);
  }
  init(sce, set);

  this.setVersion = setVersion;
  this.setState = setState;
  this.getState = getState;
  this.update = update;
  this.checkForMoves = checkForMoves;
  this.rotate = rotate;
  this.shuffle = shuffle;
  this.makeMoves = makeMoves;
}
