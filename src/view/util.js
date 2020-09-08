/* Utility library by Chris Barker
 * originally written for Grid
 * http://cbarker.net/grid
 */

/* Miscellaneous */
export function toInt (num) {
  // http://stackoverflow.com/questions/596467
  return ~~num;
}

export function half (num) {
  return toInt(num / 2);
}

export function zfill (number, size) {
  /* convert int to string with leading zeros
   * python equivalent: (("%%0%dd" % size) % number)
   * https://gist.github.com/superjoe30/4382935
   */
  number = number.toString();
  while (number.length < size) number = '0' + number;
  return number;
}

export function max (a, b) {
  /* Return the larger of two values. */
  return (a > b) ? a : b;
}

export function min (a, b) {
  /* Return the smaller of two values. */
  return (a > b) ? b : a;
}

/* Copy */
export function copyArray (A) {
  const arr = [];
  for (let i = 0; i < A.length; i++) {
    arr.push(A[i]);
  }
  return arr;
}

export function copy2DArray (B) {
  const arr = [];
  for (let i = 0; i < B.length; i++) {
    arr.push(copyArray(B[i]));
  }
  return arr;
}

export function copyObject (D) {
  const res = {};
  for (const key in D) {
    res[key] = D[key];
  }
  return res;
}

/* Arrays */
export function all_array (A) {
  for (let i = 0; i < A.length; i++) {
    if (!(A[i])) return false;
  }
  return true;
}

export function any_array (A) {
  for (let i = 0; i < A.length; i++) {
    if (A[i]) return true;
  }
  return false;
}

/* Priority Queue */
export function PriorityQueue () {
  this.Q = [0];
  this.size = 0;
  this.isEmpty = PQ_isEmpty;
  this.insert = PQ_insert;
  this.pop = PQ_pop;
}

export function PQ_isEmpty () {
  return this.size === 0;
}

export function PQ_insert (elem, priority) {
  this.Q.push([elem, priority]);
  this.size++;
  let idx = this.size; // Starting index of new element.
  while (idx > 1 && this.Q[half(idx)][1] > this.Q[idx][1]) {
    // The parent node is "higher" priority. Swap them
    const parent = this.Q[half(idx)];
    this.Q[half(idx)] = this.Q[idx];
    this.Q[idx] = parent;
    idx = half(idx);
  }
}

export function PQ_pop () {
  if (this.isEmpty()) return;
  this.size--;
  const item = this.Q[1][0];
  this.Q[1] = this.Q.pop();
  let idx = 1;
  let child;
  while (idx * 2 < this.size && this.Q[idx * 2][1] < this.Q[idx][1]) {
    child = this.Q[idx * 2];
    this.Q[idx * 2] = this.Q[idx];
    this.Q[idx] = child;
    idx *= 2;
  }
  return item;
}

/* vec is a limited vector library for strictly 3-dimensional vectors */
export const vec = {
  add (A, B) {
    const C = [];
    for (let i = 0; i < A.length; i++) {
      C.push(A[i] + B[i]);
    }
    return C;
  },
  cross (A, B) {
    const C = [];
    C.push(A[1] * B[2] - A[2] * B[1]);
    C.push(A[2] * B[0] - A[0] * B[2]);
    C.push(A[0] * B[1] - A[1] * B[0]);
    return C;
  },
  muls (s, A) {
    const B = [];
    for (let i = 0; i < A.length; i++) {
      B.push(s * A[i]);
    }
    return B;
  },
  sub (A, B) {
    return vec.add(A, vec.muls(-1, B));
  },
  proj (A, B) {
    return vec.muls(vec.dot(A, B) / (vec.mag2(B)), B);
  },
  dot (A, B) {
    return A[0] * B[0] + A[1] * B[1] + A[2] * B[2];
  },
  mag2 (A) {
    return A[0] * A[0] + A[1] * A[1] + A[2] * A[2];
  },
  without (A, B) {
    return vec.sub(A, vec.proj(A, B));
  },
  isZero (A) {
    return (A[0] === 0 && A[1] === 0 && A[2] === 0);
  },
  ints (A) {
    return [Math.round(A[0]), Math.round(A[1]), Math.round(A[2])];
  },
  mag (A) {
    return Math.sqrt(vec.mag2(A));
  },
  zero () {
    return [0, 0, 0];
  },
  unit (A) {
    if (vec.isZero(A)) return vec.zero();
    return vec.muls(1.0 / vec.mag(A), A);
  },
  setMag (m, A) {
    if (m === 0) return vec.zero();
    return vec.muls(m, vec.unit(A));
  },
  eq (A, B) {
    return (feq(A[0], B[0]) && feq(A[1], B[1]) && feq(A[2], B[2]));
  },
  parallel (A, B) {
    return (feq(0, vec.mag(vec.cross(A, B))) && vec.dot(A, B) > 0);
  },
  parallels (A, B) {
    return (feq(0, vec.mag(vec.cross(A, B))) && vec.dot(A, B) !== 0);
  },
  str (A) {
    return ('<' + A[0].toString() + ', ' + A[1].toString() + ', ' + A[2].toString() + '>');
  },
  getPerpendicular (A) {
    const crossed = vec.cross(A, [0, 1, 0]);
    if (vec.isZero(crossed)) return [1, 0, 0];
    return crossed;
  },
  angleBetween (A, B) {
    /* (A dot B) = |A||B|cos(theta) */
    if (vec.isZero(A) || vec.isZero(B)) return 0;
    return Math.acos(vec.dot(A, B) / (vec.mag(A) * vec.mag(B)));
  }
};

export const feq = function (a, b) {
  return Math.abs(a - b) < 0.0001;
};

export function afeq (a, b) {
  return feq(Math.abs(a), Math.abs(b));
}
