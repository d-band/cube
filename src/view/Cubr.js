import Scene from './Scene';
import RubiksCube from './RubiksCube';
import { min, max } from './util';

function getShuffleLength () {
  const len = document.getElementById('shuffleLength');
  return parseInt(len.options[len.selectedIndex].value);
}

const COLOR = {
  F: '#009b48', // green
  B: '#0045ad', // blue
  U: '#ffffff', // white
  D: '#ffd500', // yellow
  R: '#b90000', // red
  L: '#ff5900' // orange
};
export const FACES = ['F', 'B', 'U', 'D', 'R', 'L'];

export default function Cubr () {
  let scene;
  let cube;
  let keys;
  const mouse = {
    down: false,
    last: [0, 0]
  };
  const momentum = {
    x: 0,
    y: 0
  };
  const settings = {
    timerInterval: 20,
    rotateSpeed: Math.PI / 48,
    defaultSpeed: 12,
    speed: 12,
    movesPerFrame: 3,
    defaultMPF: 3,
    dragSensitivity: 0.003,
    inertia: 0.75,
    colors: [
      ...FACES.map(k => COLOR[k]),
      'pink', '#303030'
    ],
    startMomentum: {
      x: 0.55,
      y: 1.65
    },
    glcanvas: {
      maxWidth: 320,
      widthFraction: 0.5,
      heightFraction: 1.0
    },
    shuffleLength: getShuffleLength,
    progBar: {
      queueMin: 3,
      queueMax: 10,
      color: 'green',
      margin: 10,
      thickness: 20
    },
    turnAcceleration: 2 / 3,
    paused: false
  };

  function resetKeys () {
    keys = [];
    for (let k = 0; k < 256; k++) {
      keys.push(false);
    }
  }

  function timerFired () {
    cube.update(keys, momentum);
    momentum.x *= settings.inertia;
    momentum.y *= settings.inertia;
    scene.draw();
  }

  function onKeyDown (e) {
    const keyCode = e.keyCode;
    if (cube) {
      cube.checkForMoves(keyCode, keys);
    }
    if (keyCode >= 33 && keyCode <= 40) {
      e.preventDefault();
    }
    keys[keyCode] = true;
  }

  function onKeyUp (e) {
    const keyCode = e.keyCode;
    keys[keyCode] = false;
  }

  function onMouseDown (e) {
    if (e.toElement.id === 'glcanvas') {
      e.preventDefault();
      mouse.down = true;
      mouse.last = [e.x, e.y];
    }
  }

  function onMouseUp () {
    mouse.down = false;
  }

  function onMouseMove (e) {
    if (mouse.down) {
      e.preventDefault();
      if (e.toElement.id === 'glcanvas') {
        momentum.x += settings.dragSensitivity * (e.x - mouse.last[0]);
        momentum.y += settings.dragSensitivity * (e.y - mouse.last[1]);
        mouse.last = [e.x, e.y];
      }
    }
  }

  function bindEventListeners () {
    resetKeys();
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mouseup', onMouseUp, false);
    document.addEventListener('mousemove', onMouseMove, false);
    // Timer:
    setInterval(timerFired, settings.timerInterval);
  }

  function reset () {
    cube.setState('solved', true);
    momentum.x = settings.startMomentum.x;
    momentum.y = settings.startMomentum.y;
  }

  const run = () => {
    scene = new Scene('glcanvas');
    cube = new RubiksCube(scene, settings, this);
    cube.setVersion(3);
    bindEventListeners();
    reset();
    updateSpeed();
  };

  function shuffle () {
    const numMoves = settings.shuffleLength();
    cube.shuffle(() => {
      settings.speed = (numMoves < 100) ? 3 : 0;
      settings.movesPerFrame = (numMoves > 500) ? 20 : 3;
    }, () => {
      settings.speed = settings.defaultSpeed;
      settings.movesPerFrame = settings.defaultMPF;
    }, numMoves);
  }

  function makeMoves (list, speed) {
    if (speed !== undefined) {
      const prev = settings.speed;
      const before = {
        action () {
          settings.speed = speed;
        }
      };
      const after = {
        action () {
          settings.speed = prev;
        }
      };
      list.unshift(before);
      list.push(after);
    }
    cube.makeMoves(list);
  }

  function updateProgress (percent) {
    const bar = document.getElementById('progressBar');
    bar.style.width = `${~~(percent * 100)}%`;
  }

  function updateSpeed () {
    document.getElementById('speedInput').value = 30 - settings.speed;
  }

  function getFaces () {
    return cube.getFaces();
  }

  this.run = run;
  this.reset = reset;
  this.shuffle = shuffle;
  this.makeMoves = makeMoves;
  this.updateProgress = updateProgress;
  this.getFaces = getFaces;
  this.slowdown = () => {
    settings.speed = min(settings.speed + 2, 30);
    updateSpeed();
  };
  this.speedup = () => {
    settings.speed = max(settings.speed - 2, 0);
    updateSpeed();
  };
}
