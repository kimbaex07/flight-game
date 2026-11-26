// Builds the whole visible world: coloured heightmap terrain, the river,
// the airstrip with runway and hangars, the town, pine forests and clouds.
import * as THREE from 'three';
import { terrainHeight, riverZ, RUNWAY, makeRng } from './noise.js';

const WORLD_SIZE = 2400;

function terrainColour(h, x, z) {
  const c = new THREE.Color();
  if (h < 1.5) c.setHex(0x9a8f5a); // sandy riverbank / low ground
  else if (h < 14) c.setHex(0x5d8a3c); // meadow green
  else if (h < 34) c.setHex(0x4a7a33); // darker hillside
  else if (h < 70) c.setHex(0x6d6a55); // rock
  else c.setHex(0xdfe8ee); // snowy peaks
  // Slight variation so the ground never looks flat-shaded.
  const v = 0.92 + 0.16 * Math.sin(x * 0.11 + z * 0.07);
  c.multiplyScalar(v);
  return c;
}

function buildTerrain(scene) {
  const segments = 150;
  const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, segments, segments);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colours = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = terrainHeight(x, z);
    pos.setY(i, h);
    const c = terrainColour(h, x, z);
    colours[i * 3] = c.r;
    colours[i * 3 + 1] = c.g;
    colours[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({ vertexColors: true }),
  );
  mesh.name = 'terrain';
  scene.add(mesh);
}

function buildRiver(scene) {
  // A flat ribbon following the river centre line, just above the carved bed.
  const points = [];
  for (let x = -1150; x <= 1150; x += 25) points.push(new THREE.Vector3(x, 0.7, riverZ(x)));
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, 120, 13, 6, false);
  geo.scale(1, 0.12, 1); // flatten the tube into a ribbon
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({ color: 0x2f7fc4, transparent: true, opacity: 0.9 }),
  );
  mesh.name = 'river';
  scene.add(mesh);
}

function buildRunway(scene) {
  const group = new THREE.Group();
  group.name = 'airstrip';
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(RUNWAY.width, 0.4, RUNWAY.length),
    new THREE.MeshLambertMaterial({ color: 0x3a3d42 }),
  );
  strip.position.set(RUNWAY.cx, 0.2, RUNWAY.cz);
  group.add(strip);
  // Centreline dashes and threshold bars.
  const dashMat = new THREE.MeshLambertMaterial({ color: 0xf2f2e8 });
  for (let z = -140; z <= 140; z += 28) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 12), dashMat);
    dash.position.set(0, 0.45, z);
    group.add(dash);
  }
  for (const z of [-152, 152]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(20, 0.1, 4), dashMat);
    bar.position.set(0, 0.45, z);
    group.add(bar);
  }
  // Edge lights.
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffd34d });
  for (let z = -150; z <= 150; z += 30) {
    for (const x of [-13.5, 13.5]) {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), lightMat);
      lamp.position.set(x, 0.9, z);
      group.add(lamp);
    }
  }
  // Two hangars and a windsock beside the strip.
  const hangarMat = new THREE.MeshLambertMaterial({ color: 0xb8542e });
  for (const x of [-42, 42]) {
    const hangar = new THREE.Mesh(new THREE.BoxGeometry(26, 12, 30), hangarMat);
    hangar.position.set(x, 6, -60);
    group.add(hangar);
    const roof = new THREE.Mesh(
      new THREE.CylinderGeometry(13, 13, 30, 12, 1, false, 0, Math.PI),
      new THREE.MeshLambertMaterial({ color: 0x7a3a20 }),
    );
    roof.rotation.z = Math.PI / 2;
    roof.rotation.y = Math.PI / 2;
    roof.position.set(x, 12, -60);
    group.add(roof);
  }
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.25, 12, 6),
    new THREE.MeshLambertMaterial({ color: 0xdddddd }),
  );
  pole.position.set(30, 6, 40);
  group.add(pole);
  const sock = new THREE.Mesh(
    new THREE.ConeGeometry(1.6, 7, 8),
    new THREE.MeshLambertMaterial({ color: 0xff7b2f }),
  );
  sock.rotation.z = Math.PI / 2;
  sock.position.set(33.5, 11.4, 40);
  group.add(sock);
  scene.add(group);
}

function buildTown(scene) {
  // Millbrook: a small town of flat-roofed houses east of the river.
  const rng = makeRng(1234);
  const group = new THREE.Group();
  group.name = 'town';
  const palette = [0xd8c9a3, 0xc9a06a, 0xa8b6c4, 0xb98a7a, 0x8fa98f];
  for (let i = 0; i < 46; i++) {
    const x = 260 + rng() * 260;
    const z = 300 + rng() * 220;
    const w = 10 + rng() * 12;
    const d = 10 + rng() * 12;
    const h = 8 + rng() * 14;
    const house = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshLambertMaterial({ color: palette[i % palette.length] }),
    );
    house.position.set(x, terrainHeight(x, z) + h / 2, z);
    house.rotation.y = (rng() - 0.5) * 0.6;
    group.add(house);
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(Math.max(w, d) * 0.72, 4 + rng() * 3, 4),
      new THREE.MeshLambertMaterial({ color: 0x8a4a2a }),
    );
    roof.position.set(x, terrainHeight(x, z) + h + 2, z);
    roof.rotation.y = Math.PI / 4 + (rng() - 0.5) * 0.6;
    group.add(roof);
  }
  // Church tower, the town landmark.
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(12, 34, 12),
    new THREE.MeshLambertMaterial({ color: 0xe8e2d0 }),
  );
  tower.position.set(390, terrainHeight(390, 400) + 17, 400);
  group.add(tower);
  const spire = new THREE.Mesh(
    new THREE.ConeGeometry(8, 14, 4),
    new THREE.MeshLambertMaterial({ color: 0x3a5a8a }),
  );
  spire.position.set(390, terrainHeight(390, 400) + 41, 400);
  spire.rotation.y = Math.PI / 4;
  group.add(spire);
  scene.add(group);
}

function buildForest(scene) {
  const rng = makeRng(99);
  const spots = [];
  let guard = 0;
  while (spots.length < 320 && guard++ < 4000) {
    const x = (rng() - 0.5) * 2100;
    const z = (rng() - 0.5) * 2100;
    if (Math.abs(x) < 240 && Math.abs(z) < 300) continue; // keep the airfield clear
    if (Math.abs(z - riverZ(x)) < 26) continue; // not in the river
    if (Math.hypot(x - 390, z - 410) < 190) continue; // not in the town
    const h = terrainHeight(x, z);
    if (h < 2 || h > 55) continue;
    spots.push([x, h, z, 0.7 + rng() * 0.9]);
  }
  const trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 4, 5);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2a });
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, spots.length);
  const coneGeo = new THREE.ConeGeometry(3.2, 11, 6);
  const coneMat = new THREE.MeshLambertMaterial({ color: 0x2e6b2e });
  const cones = new THREE.InstancedMesh(coneGeo, coneMat, spots.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  spots.forEach(([x, h, z, scale], i) => {
    m.compose(new THREE.Vector3(x, h + 2 * scale, z), q, s.set(scale, scale, scale));
    trunks.setMatrixAt(i, m);
    m.compose(new THREE.Vector3(x, h + (4 + 5.5) * scale, z), q, s.set(scale, scale, scale));
    cones.setMatrixAt(i, m);
  });
  trunks.name = 'forest-trunks';
  cones.name = 'forest-canopy';
  scene.add(trunks);
  scene.add(cones);
}

function buildClouds(scene) {
  const rng = makeRng(55);
  const group = new THREE.Group();
  group.name = 'clouds';
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
  for (let i = 0; i < 16; i++) {
    const cloud = new THREE.Group();
    const puffs = 3 + Math.floor(rng() * 3);
    for (let j = 0; j < puffs; j++) {
      const r = 12 + rng() * 16;
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat);
      puff.position.set((rng() - 0.5) * 40, (rng() - 0.5) * 6, (rng() - 0.5) * 18);
      puff.scale.y = 0.45;
      cloud.add(puff);
    }
    cloud.position.set((rng() - 0.5) * 2000, 190 + rng() * 90, (rng() - 0.5) * 2000);
    group.add(cloud);
  }
  scene.add(group);
  return group;
}

export function buildWorld(scene) {
  scene.background = new THREE.Color(0x8ec3e8);
  scene.fog = new THREE.Fog(0x9fc8e8, 420, 2100);
  const hemi = new THREE.HemisphereLight(0xbfd9ff, 0x6a7a4a, 0.95);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d0, 1.6);
  sun.position.set(400, 600, 200);
  scene.add(sun);
  buildTerrain(scene);
  buildRiver(scene);
  buildRunway(scene);
  buildTown(scene);
  buildForest(scene);
  return { clouds: buildClouds(scene) };
}
