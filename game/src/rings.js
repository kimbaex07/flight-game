// The glowing delivery rings and the light column that marks the next one.
import * as THREE from 'three';
import { RING_POINTS, RING_RADIUS } from './flight.js';

export class Rings {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'rings';
    this.meshes = [];
    const passedMat = new THREE.MeshBasicMaterial({ color: 0x9aa5ad, transparent: true, opacity: 0.45 });
    RING_POINTS.forEach((p, i) => {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffb020, transparent: true, opacity: 0.95 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(RING_RADIUS, 1.3, 10, 36), mat);
      ring.position.set(p[0], p[1], p[2]);
      // Face along the route: toward the next ring (or back to the runway).
      const next = RING_POINTS[i + 1] ?? [0, 10, 0];
      ring.lookAt(next[0], next[1], next[2]);
      ring.userData.index = i;
      ring.userData.baseMat = mat;
      this.group.add(ring);
      this.meshes.push(ring);
      // A small floating parcel crate hangs in the middle of each ring.
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(3, 3, 3),
        new THREE.MeshLambertMaterial({ color: 0xff7b2f, emissive: 0x331500 }),
      );
      crate.position.set(p[0], p[1], p[2]);
      crate.userData.index = i;
      this.group.add(crate);
      this.meshes.push(crate);
    });
    this.passedMat = passedMat;
    // Beacon column above the next ring so the pilot can find it from afar.
    this.beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 160, 10, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffc040,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.group.add(this.beacon);
    scene.add(this.group);
  }

  update(time, ringsPassed) {
    this.meshes.forEach((m) => {
      const i = m.userData.index;
      if (i < ringsPassed) {
        if (m.material !== this.passedMat && m.geometry.type === 'TorusGeometry') {
          m.material = this.passedMat;
        }
        if (m.geometry.type === 'BoxGeometry') m.visible = false;
      } else if (i === ringsPassed) {
        // The active ring pulses; its crate spins.
        const pulse = 1 + 0.12 * Math.sin(time * 4);
        if (m.geometry.type === 'TorusGeometry') m.scale.setScalar(pulse);
        if (m.geometry.type === 'BoxGeometry') m.rotation.y = time * 1.5;
      }
    });
    const next = RING_POINTS[ringsPassed];
    if (next) {
      this.beacon.visible = true;
      this.beacon.position.set(next[0], next[1] + 80, next[2]);
    } else {
      this.beacon.visible = false;
    }
  }
}
