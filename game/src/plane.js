// The Sky Courier: a small low-poly cargo plane built from primitives,
// cream fuselage, teal wings, orange cheatline, spinning propeller.
import * as THREE from 'three';

export function buildPlane() {
  const group = new THREE.Group();
  group.name = 'sky-courier';
  const cream = new THREE.MeshLambertMaterial({ color: 0xf2e8d5 });
  const teal = new THREE.MeshLambertMaterial({ color: 0x1f7a6d });
  const orange = new THREE.MeshLambertMaterial({ color: 0xff7b2f });
  const dark = new THREE.MeshLambertMaterial({ color: 0x2b2f36 });
  const glass = new THREE.MeshLambertMaterial({ color: 0x1c3a4a, emissive: 0x0a2a3a });

  // Fuselage: cylinder along z, nose at +z.
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 0.9, 6.4, 10), cream);
  body.rotation.x = Math.PI / 2;
  group.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.6, 10), orange);
  nose.rotation.x = Math.PI / 2;
  nose.position.z = 4.0;
  group.add(nose);
  // Tail cone.
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.8, 10), cream);
  tail.rotation.x = -Math.PI / 2;
  tail.position.z = -4.1;
  group.add(tail);
  // Canopy (glasshouse over the cockpit).
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 8), glass);
  canopy.scale.set(0.9, 0.75, 1.7);
  canopy.position.set(0, 0.85, 1.4);
  group.add(canopy);
  // Orange cheatline stripe along the fuselage.
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.28, 5.6), orange);
  stripe.position.set(0, 0.1, 0.4);
  group.add(stripe);
  // Main wing (low wing) and tailplane.
  const wing = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.28, 2.4), teal);
  wing.position.set(0, -0.35, 0.4);
  group.add(wing);
  const wingTipL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 2.4), orange);
  wingTipL.position.set(-5.75, -0.35, 0.4);
  group.add(wingTipL);
  const wingTipR = wingTipL.clone();
  wingTipR.position.x = 5.75;
  group.add(wingTipR);
  const tailplane = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.22, 1.5), teal);
  tailplane.position.set(0, 0.35, -4.4);
  group.add(tailplane);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.2, 1.8), teal);
  fin.position.set(0, 1.15, -4.5);
  group.add(fin);
  // Cargo pod slung under the belly.
  const pod = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 3.4), orange);
  pod.position.set(0, -1.15, 0.2);
  group.add(pod);
  // Landing gear.
  for (const x of [-1.1, 1.1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.1, 6), dark);
    leg.position.set(x, -1.5, 0.8);
    group.add(leg);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10), dark);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, -2.0, 0.8);
    group.add(wheel);
  }
  // Propeller at the nose.
  const prop = new THREE.Group();
  prop.position.z = 4.85;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.5, 8), dark);
  hub.rotation.x = Math.PI / 2;
  prop.add(hub);
  const bladeMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  for (const angle of [0, Math.PI / 2]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.4, 0.08), bladeMat);
    blade.rotation.z = angle;
    prop.add(blade);
  }
  group.add(prop);
  // Navigation lights: red port, green starboard, white tail.
  const lights = [
    [0xff2a2a, -5.75, -0.3, 0.4],
    [0x2aff5a, 5.75, -0.3, 0.4],
    [0xffffff, 0, 0.6, -5.0],
  ];
  for (const [color, x, y, z] of lights) {
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 6),
      new THREE.MeshBasicMaterial({ color }),
    );
    lamp.position.set(x, y, z);
    group.add(lamp);
  }
  // Instrument glow strip inside the canopy (visible from the chase view).
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.5, 0.1),
    new THREE.MeshBasicMaterial({ color: 0x37e0a0 }),
  );
  panel.position.set(0, 0.75, 2.15);
  group.add(panel);
  return { group, prop };
}
