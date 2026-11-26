// Seeded value noise and the one terrain-height function every system shares:
// the world mesh, the flight physics, the rings and the camera all call it.
const SEED = 7;

function hash2(ix, iz) {
  let h = (ix * 374761393 + iz * 668265263 + SEED * 974634211) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967295;
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

function valueNoise(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = smooth(x - ix);
  const fz = smooth(z - iz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

function fbm(x, z) {
  let total = 0;
  let amp = 1;
  let freq = 1;
  for (let i = 0; i < 4; i++) {
    total += amp * valueNoise(x * freq, z * freq);
    amp *= 0.5;
    freq *= 2.1;
  }
  return total; // 0..~1.875
}

// The river winds along x; riverZ(x) is its centre line. The Gaussian bulge
// swings it north of the airfield so it never crosses the runway.
export function riverZ(x) {
  return (
    170 * Math.sin(x * 0.0021) +
    55 * Math.sin(x * 0.0009 + 1.7) +
    300 * Math.exp(-((x / 150) * (x / 150)))
  );
}

export const RUNWAY = {
  cx: 0,
  cz: 0,
  length: 320,
  width: 26,
  heading: 0, // runway runs along +z
};

function runwayFlatten(x, z) {
  // 1 inside the flat airfield rectangle, fading to 0 outside it.
  const dx = Math.max(0, Math.abs(x - RUNWAY.cx) - 40) / 180;
  const dz = Math.max(0, Math.abs(z - RUNWAY.cz) - 180) / 110;
  const d = Math.max(dx, dz);
  if (d >= 1) return 0;
  return smooth(1 - d);
}

export function terrainHeight(x, z) {
  const hills = (fbm(x * 0.004, z * 0.004) - 0.95) * 42;
  const ridge = (fbm(x * 0.0016 + 40, z * 0.0016 + 40) - 0.9) * 90;
  let h = hills + ridge;
  const dist = Math.hypot(x, z);
  if (dist > 780) h += (dist - 780) * 0.35; // mountain bowl at the map edge
  // Carve the river valley down to the water.
  const riverDist = Math.abs(z - riverZ(x));
  if (riverDist < 60) {
    const t = smooth(1 - riverDist / 60);
    h = h * (1 - t) + -3 * t;
  }
  // Flatten the airfield.
  const flat = runwayFlatten(x, z);
  h = h * (1 - flat) + 0 * flat;
  return h;
}

// Deterministic PRNG for placement (trees, houses, clouds).
export function makeRng(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
