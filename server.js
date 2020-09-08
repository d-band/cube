const fs = require('fs');
const path = require('path');
const Koa = require('koa');
const kociemba = require('kociemba');

const solve = (cube) => new Promise((resolve, reject) => {
  try {
    const result = kociemba.solve(cube);
    resolve(result.trim());
  } catch (e) {
    reject(e);
  }
});

const app = new Koa();

app.use(async ctx => {
  if (ctx.path === '/' || this.path === '') {
    ctx.type = 'html';
    ctx.body = fs.createReadStream('index.html');
    return;
  }
  if (ctx.path !== '/solve') {
    ctx.throw(404);
  }
  ctx.body = {
    data: await solve(ctx.query.cube)
  };
});

app.listen(3000);