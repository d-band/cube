import $ from 'jquery';
import Cubr from './view/Cubr';
import cubeTpl from './cube.atpl';
import cubesTpl from './cubes.atpl';
import './index.less';

window.ENCODE = (str) => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

const makeFace = (name) => {
  const mat = [];
  for (let i = 0; i < 3; i++) {
    const arr = [];
    for (let j = 0; j < 3; j++) {
      if (i === 1 && j === 1) {
        arr.push(name);
      } else {
        arr.push('X');
      }
    }
    mat.push(arr);
  }
  return mat;
};

function reverse (list) {
  const map = {};
  ['F', 'B', 'L', 'R', 'U', 'D'].forEach(ch => {
    const chr = `${ch}'`;
    map[ch] = chr;
    map[chr] = ch;
  });
  return list.reverse().map(v => {
    return map[v] || v;
  });
}

const main = {
  cur: 'X',
  init () {
    this.data = {
      U: makeFace('U'),
      D: makeFace('D'),
      L: makeFace('L'),
      R: makeFace('R'),
      F: makeFace('F'),
      B: makeFace('B')
    };
    this.bind();
    this.render();
    this.cubr = new Cubr();
    this.cubr.run();
  },
  bind () {
    $('.btn-cube').on('click', (e) => {
      const el = $(e.currentTarget);
      if (el.hasClass('active')) {
        this.cur = 'X';
        el.removeClass('active');
      } else {
        $('.btn-cube.active').removeClass('active');
        el.addClass('active');
        this.cur = el.data('k');
      }
    });
    $('.cubes').on('click', '.cube', (e) => {
      const el = $(e.currentTarget);
      const k = el.data('k');
      const i = el.data('i');
      const j = el.data('j');
      this.setFace(k, i, j);
    });
    $('.output').on('change', (e) => {
      this.setData(e.target.value);
      this.render();
    });
    $(document).keydown(e => {
      const code = e.keyCode || e.which;
      const arr = ['U', 'R', 'F', 'D', 'L', 'B'];
      const index = arr.indexOf(this.cur);
      const last = arr.length - 1;
      if (code === 37 || code === 38) {
        if (index > 0) {
          this.cur = arr[index - 1];
        } else {
          this.cur = arr[last];
        }
      }
      if (code === 39 || code === 40) {
        if (index >= last) {
          this.cur = arr[0];
        } else {
          this.cur = arr[index + 1];
        }
      }
      $('.btn-cube.active').removeClass('active');
      $(`.btn-cube[data-k="${this.cur}"]`).addClass('active');
    });
    $('#shuffle').on('click', () => {
      this.cubr.shuffle();
    });
    $('#solve').on('click', () => {
      $.get('/solve', {
        cube: this.toString()
      }).done(({ data }) => {
        this.moving = false;
        this.index = 0;
        this.resolved = data.split(' ');
        const reversed = reverse(data.split(' '));
        this.cubr.reset();
        this.cubr.makeMoves(reversed, 0);
        this.renderSolve();
      }).fail(() => {
        alert('Unsolvable cube!');
      });
    });
    $('#prev').on('click', () => {
      if (this.moving) return;
      const v = this.resolved[this.index - 1];
      this.moving = true;
      const done = () => {
        this.index = this.index - 1;
        this.renderSolve();
        this.moving = false;
      };
      if (v) {
        const moves = reverse([v]);
        moves.push({ action: done });
        this.cubr.makeMoves(moves);
      } else {
        done();
      }
    });
    $('#next').on('click', () => {
      if (this.moving) return;
      const v = this.resolved[this.index];
      this.moving = true;
      const done = () => {
        this.index = this.index + 1;
        this.renderSolve();
        this.moving = false;
      };
      if (v) {
        const moves = [v];
        moves.push({ action: done });
        this.cubr.makeMoves(moves);
      } else {
        done();
      }
    });
    $('#slowdown').on('click', () => {
      this.cubr.slowdown();
    });
    $('#speedup').on('click', () => {
      this.cubr.speedup();
    });
    $('#pause').on('click', () => {
      this.cubr.togglePause();
    });
    $('#reset').on('click', () => {
      this.cubr.reset();
    });
  },
  setFace (name, i, j) {
    i = Number(i);
    j = Number(j);
    if (i === 1 && j === 1) return;
    this.data[name][i][j] = this.cur;
    this.render();
  },
  render () {
    const map = {};
    Object.keys(this.data).forEach(k => {
      const mat = this.data[k];
      map[k] = cubeTpl({ mat, k });
    });
    $('.cubes').html(cubesTpl(map));
    $('.output').val(this.toString());
  },
  renderSolve () {
    const html = this.resolved.map((v, i) => `
      <span class="${this.index === i ? 'active' : ''}">
        ${v}
      </span>
    `).join('');
    $('.solved-output').html(html);
    const last = this.resolved.length - 1;
    $('#prev').prop('disabled', this.index < 0);
    $('#next').prop('disabled', this.index > last);
  },
  setData (str) {
    // DDBUUFBDDLRUBRDUBRLFFBFDUFBFLLFDLRRFRLDULRUULRLBRBBDUF
    ['U', 'R', 'F', 'D', 'L', 'B'].forEach((k, i) => {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (r === 1 && c === 1) continue;
          this.data[k][r][c] = str[i * 9 + (r * 3 + c)] || 'X';
        }
      }
    });
  },
  toString () {
    return ['U', 'R', 'F', 'D', 'L', 'B'].map(k => {
      return this.data[k]
        .map(arr => arr.join(''))
        .join('');
    }).join('');
  }
};

$(() => {
  main.init();
});
