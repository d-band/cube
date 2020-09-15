const kociemba = require('kociemba');

const solve = (cube) => new Promise((resolve, reject) => {
  try {
    const result = kociemba.solve(cube);
    resolve(result.trim());
  } catch (e) {
    reject(e);
  }
});

module.exports = async (req, res) => {
  const data = await solve(req.query.cube);
  res.json({ data });
};
