import kmeans from 'skmeans';

function maxColor (data) {
  const arr = [];
  for (let k = 0; k < data.length; k += 4) {
    arr.push([data[k + 0], data[k + 1], data[k + 2]]);
  }
  const { idxs, centroids } = kmeans(arr, 6, null, null, distance);
  const tmp = new Array(centroids.length);
  idxs.forEach(v => {
    if (tmp[v]) {
      tmp[v] = tmp[v] + 1;
    } else {
      tmp[v] = 1;
    }
  });
  const i = indexOfMax(tmp);
  return centroids[i];
}

function indexOfMax (arr) {
  if (arr.length === 0) {
    return -1;
  }
  let max = arr[0];
  let index = 0;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      index = i;
      max = arr[i];
    }
  }
  return index;
}

function indexOfMin (arr) {
  if (arr.length === 0) {
    return -1;
  }
  let min = arr[0];
  let index = 0;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < min) {
      index = i;
      min = arr[i];
    }
  }
  return index;
}

function distance (c1, c2) {
  const rmean = (c1[0] + c2[0]) / 2;
  const r = c1[0] - c2[0];
  const g = c1[1] - c2[1];
  const b = c1[2] - c2[2];
  return Math.sqrt(
    (((512 + rmean) * r * r) / 256) +
    (4 * g * g) +
    (((767 - rmean) * b * b) / 256)
  );
}

function compute (centers, data, faces) {
  const list = [];
  for (let i = 0; i < data.length; i++) {
    const arr = centers.map(c => distance(c, data[i]));
    const k = indexOfMin(arr);
    list.push(faces[k]);
  }
  return list.join('');
}

export default function Capture ($) {
  const width = 600;
  let height = 0;
  let streaming = false;
  let video = null;
  let canvas = null;
  let index = 0;
  let colors = {};

  const faces = ['U', 'F', 'D', 'B', 'L', 'R'];
  function setIndex (i) {
    index = i;
    $('#currentFace').text(faces[i]);
  }

  function takepicture () {
    const ctx = canvas.getContext('2d');
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(video, 0, 0, width, height);
      const arr = [];
      let center = null;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const x = 180 + j * 80;
          const y = 100 + i * 80;
          const img = ctx.getImageData(x, y, 80, 80);
          const c = maxColor(img.data);
          arr.push(c);
          if (i === 1 && j === 1) {
            center = c;
          }
        }
      }
      if (index < 3) {
        arr.reverse();
      }
      const face = faces[index];
      colors[face] = { center, arr };
      if (Object.keys(colors).length === 6) {
        $('#detectColors').prop('disabled', false);
      } else {
        $('#detectColors').prop('disabled', true);
      }
      setIndex((index + 1) % 6);
    }
  }

  function init () {
    video = document.getElementById('captureVideo');
    canvas = document.getElementById('captureCanvas');

    video.addEventListener('canplay', (ev) => {
      if (streaming) return;
      height = video.videoHeight * width / video.videoWidth;
      if (isNaN(height)) {
        height = width / (4 / 3);
      }
      video.setAttribute('width', width);
      video.setAttribute('height', height);
      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);
      streaming = true;
    }, false);
  }

  function onKeydown (e) {
    const code = e.keyCode || e.which;
    if (code === 32) {
      takepicture();
      e.preventDefault();
    }
    if (code === 27) {
      setIndex(Math.max(index - 1, 0));
      e.preventDefault();
    }
  }

  function start () {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    }).then((stream) => {
      video.srcObject = stream;
      video.play();
    }).catch((err) => {
      console.log('An error occurred: ' + err);
    });
  }

  function stop () {
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
  }

  init();

  let backdrop = null;
  this.getColors = () => {
    let arr = [];
    const list = [];
    const faces = ['U', 'R', 'F', 'D', 'L', 'B'];
    faces.forEach(k => {
      list.push(colors[k].center);
      arr = arr.concat(colors[k].arr);
    });
    return compute(list, arr, faces);
  };
  this.show = () => {
    setIndex(0);
    colors = {};
    $('#detectColors').prop('disabled', true);
    backdrop = $('<div class="modal-backdrop fade"></div>');
    $(document.body).append(backdrop);
    $('#captureModal').css('display', 'block');
    setTimeout(() => {
      $('#captureModal').addClass('show');
      backdrop.addClass('show');
      $(document).on('keydown', onKeydown);
      start();
    }, 0);
  };
  this.hide = () => {
    stop();
    $(document).off('keydown', onKeydown);
    backdrop.remove();
    $('#captureModal').removeClass('show');
    $('#captureModal').css('display', 'none');
  };
}
