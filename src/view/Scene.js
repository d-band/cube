import RenderUtil from './RenderUtil';
import MatrixUtil from './MatrixUtil';
import { makePerspective } from '../webgl/glUtils';

const renderUtil = new RenderUtil();
const matUtil = new MatrixUtil();

// `canvasID` is the id of the canvas element used for the scene.
export default function Scene (canvasID) {
  const data = {
    canvas: null,
    gl: null,
    rot: [0.0, 0.0, 0.0],
    mvMatrix: null,
    mvMatrixStack: [],
    shaderProgram: null,
    perspectiveMatrix: null,
    vertexPositionAttribute: null,
    textureCoordAttribute: null,
    vertexNormalAttribute: null,
    loadIdentity () {
      return matUtil.loadIdentity(data);
    },
    mvTranslate (v) {
      return matUtil.mvTranslate(data, v);
    },
    mvPushMatrix (m) {
      return matUtil.mvPushMatrix(data, m);
    },
    mvPopMatrix () {
      return matUtil.mvPopMatrix(data);
    },
    mvRotate (a, v) {
      return matUtil.mvRotate(data, a, v);
    },
    setMatrixUniforms () {
      return matUtil.setMatrixUniforms(data);
    }
  };
  const renderHeap = [];

  function linkObjects (sceneObjects) {
    renderHeap.push(sceneObjects);
    sceneObjects.linkRendering(data);
  }

  function drawScene () {
    const gl = data.gl;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Establish the perspective with which we want to view the
    // scene. Our field of view is 45 degrees, with a width/height
    // ratio of 640:480, and we only want to see objects between 0.1 units
    // and 100 units away from the camera.
    data.perspectiveMatrix = makePerspective(45, 640.0 / 480.0, 0.1, 100.0);
    for (let i = 0; i < renderHeap.length; i++) {
      renderHeap[i].draw();
    }
  }

  function init () {
    data.canvas = document.getElementById(canvasID);
    data.gl = data.canvas.getContext('experimental-webgl');
    renderUtil.clearAll(data.gl);
    renderUtil.initShaders(data);
    data.loadIdentity();
    data.mvPushMatrix();
    data.mvTranslate([0, 0, -15.5]);
  }

  init();

  this.draw = drawScene;
  this.linkObjects = linkObjects;
  this.data = data;
}
