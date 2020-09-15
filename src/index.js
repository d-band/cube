import $ from 'jquery';
import Cubr from './view/Cubr';
import surfaceTpl from './surface.atpl';
import surfacesTpl from './surfaces.atpl';
import Capture from './capture';
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
  index: 0,
  resolved: [],
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
    $('.btn-square').on('click', (e) => {
      const el = $(e.currentTarget);
      if (el.hasClass('active')) {
        this.cur = 'X';
        el.removeClass('active');
      } else {
        $('.btn-square.active').removeClass('active');
        el.addClass('active');
        this.cur = el.data('k');
      }
    });
    $('.surfaces').on('click', '.square', (e) => {
      const el = $(e.currentTarget);
      const k = el.data('k');
      const i = el.data('i');
      const j = el.data('j');
      this.setCell(k, i, j);
    });
    $('.output').on('change', (e) => {
      this.setData(e.target.value);
      this.render();
    });
    $('#shuffle').on('click', () => {
      this.cubr.shuffle();
    });
    $('#solve').on('click', () => {
      $.get('/api/solve', {
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
    $('#reset').on('click', () => {
      this.cubr.reset();
    });
  },
  setCell (name, i, j) {
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
      map[k] = surfaceTpl({ mat, k });
    });
    $('.surfaces').html(surfacesTpl(map));
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
  const capture = new Capture($);
  $('#capture').on('click', () => {
    capture.show();
  });
  $('#captureModal .close').on('click', () => {
    capture.hide();
  });
  $('#detectColors').on('click', () => {
    const str = capture.getColors();
    main.setData(str);
    main.render();
    capture.hide();
  });
});
