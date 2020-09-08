export default function RenderUtil () {
  function clearAll (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
  }

  function initShaders (data) {
    const gl = data.gl;
    const fragmentShader = getShader(gl, 'shader-fs');
    const vertexShader = getShader(gl, 'shader-vs');
    // Create the shader program
    data.shaderProgram = gl.createProgram();
    gl.attachShader(data.shaderProgram, vertexShader);
    gl.attachShader(data.shaderProgram, fragmentShader);
    gl.linkProgram(data.shaderProgram);
    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(data.shaderProgram, gl.LINK_STATUS)) {
      alert('Unable to initialize the shader program.');
    }
    gl.useProgram(data.shaderProgram);
    data.vertexPositionAttribute = gl.getAttribLocation(data.shaderProgram, 'aVertexPosition');
    gl.enableVertexAttribArray(data.vertexPositionAttribute);
    data.textureCoordAttribute = gl.getAttribLocation(data.shaderProgram, 'aTextureCoord');
    gl.enableVertexAttribArray(data.textureCoordAttribute);
    data.vertexNormalAttribute = gl.getAttribLocation(data.shaderProgram, 'aVertexNormal');
    gl.enableVertexAttribArray(data.vertexNormalAttribute);
  }

  function getShader (gl, id) {
    const shaderScript = document.getElementById(id);
    // Didn't find an element with the specified ID; abort.
    if (!shaderScript) {
      return null;
    }
    // Walk through the source element's children, building the
    // shader source string.
    let theSource = '';
    let currentChild = shaderScript.firstChild;
    while (currentChild) {
      if (currentChild.nodeType === 3) {
        theSource += currentChild.textContent;
      }
      currentChild = currentChild.nextSibling;
    }
    // Now figure out what type of shader script we have,
    // based on its MIME type.
    let shader;
    if (shaderScript.type === 'x-shader/x-fragment') {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type === 'x-shader/x-vertex') {
      shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
      return null; // Unknown shader type
    }
    // Send the source to the shader object
    gl.shaderSource(shader, theSource);
    // Compile the shader program
    gl.compileShader(shader);
    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  this.clearAll = clearAll;
  this.initShaders = initShaders;
}
