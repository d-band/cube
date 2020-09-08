import { Matrix, $V } from '../webgl/sylvester';

export default function MatrixUtil () {
  const loadIdentity = (data) => {
    data.mvMatrix = Matrix.I(4);
  };

  const multMatrix = (data, m) => {
    data.mvMatrix = data.mvMatrix.x(m);
  };

  const mvTranslate = (data, v) => {
    multMatrix(data, Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
  };

  const setMatrixUniforms = (data) => {
    const gl = data.gl;
    const pUniform = gl.getUniformLocation(data.shaderProgram, 'uPMatrix');
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(data.perspectiveMatrix.flatten()));
    const mvUniform = gl.getUniformLocation(data.shaderProgram, 'uMVMatrix');
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(data.mvMatrix.flatten()));
    const normalMatrix = data.mvMatrix.inverse().transpose();
    const nUniform = gl.getUniformLocation(data.shaderProgram, 'uNormalMatrix');
    gl.uniformMatrix4fv(nUniform, false, new Float32Array(normalMatrix.flatten()));
  };

  const mvPushMatrix = (data, m) => {
    if (m) {
      data.mvMatrixStack.push(m.dup());
      data.mvMatrix = m.dup();
    } else {
      data.mvMatrixStack.push(data.mvMatrix.dup());
    }
  };

  const mvPopMatrix = (data) => {
    if (!data.mvMatrixStack.length) {
      throw new Error('Can\'t pop from an empty matrix stack.');
    }
    data.mvMatrix = data.mvMatrixStack.pop();
    return data.mvMatrix;
  };

  const mvRotate = (data, angle, v) => {
    const m = Matrix.Rotation(angle, $V([v[0], v[1], v[2]])).ensure4x4();
    multMatrix(data, m);
  };

  this.loadIdentity = loadIdentity;
  this.mvTranslate = mvTranslate;
  this.mvPushMatrix = mvPushMatrix;
  this.mvPopMatrix = mvPopMatrix;
  this.mvRotate = mvRotate;
  this.setMatrixUniforms = setMatrixUniforms;
}
