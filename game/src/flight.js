// Arcade flight model, the delivery route, rings, landing and scoring.
// One job: turn pilot input + the world into a flight state and events.
import * as THREE from 'three';
import { terrainHeight, RUNWAY } from './noise.js';

export const RING_POINTS = [
  [0, 70, 260],
  [120, 85, 520],
  [330, 95, 700],
  [530, 115, 520],
  [610, 120, 200],
  [480, 100, -80],
  [220, 80, -260],
  [0, 65, -430],
];
export const RING_RADIUS = 14;
const STALL_SPEED = 26;
const MAX_ALTITUDE = 350;
const ROUTE_TIME = 300; // seconds to finish the route

export class Flight {
  constructor() {
    this.reset();
  }

  reset() {
    this.pos = new THREE.Vector3(0, 2.2, -120); // parked on the runway
    this.yaw = 0; // facing +z, down the strip
    this.pitch = 0;
    this.roll = 0;
    this.speed = 0;
    this.throttle = 0;
    this.fuel = 100;
    this.score = 0;
    this.parcels = 5;
    this.ringsPassed = 0;
    this.timeLeft = ROUTE_TIME;
    this.state = 'ready'; // ready | flying | landed | crashed | timeout
    this.events = [];
    this.verticalSpeed = 0;
    this.airborne = false;
  }

  start() {
    this.state = 'flying';
  }

  // Next ring the pilot must fly through (null when the route is done).
  nextRing() {
    return this.ringsPassed < RING_POINTS.length ? RING_POINTS[this.ringsPassed] : null;
  }

  onRunway() {
    return (
      Math.abs(this.pos.x - RUNWAY.cx) < RUNWAY.width / 2 + 2 &&
      Math.abs(this.pos.z - RUNWAY.cz) < RUNWAY.length / 2
    );
  }

  update(dt, input) {
    if (this.state !== 'flying') return;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.state = 'timeout';
      this.events.push({ type: 'timeout' });
      return;
    }

    // Throttle: Shift/+ up, Ctrl/- down; Space is the airbrake.
    if (input.throttleUp) this.throttle = Math.min(1, this.throttle + dt * 0.7);
    if (input.throttleDown) this.throttle = Math.max(0, this.throttle - dt * 0.7);
    if (this.fuel <= 0) this.throttle = 0;
    const targetSpeed = 12 + this.throttle * 58;
    const brake = input.brake ? 26 : 0;
    const accel = this.speed < targetSpeed ? 9 : 16 + brake;
    this.speed += THREE.MathUtils.clamp(targetSpeed - this.speed, -accel * dt, accel * dt);
    this.fuel = Math.max(0, this.fuel - this.throttle * 0.22 * dt);

    // Pitch (W/S) and roll (A/D); control authority grows with airspeed,
    // and the plane gently self-levels hands-off.
    const authority = THREE.MathUtils.clamp(this.speed / 30, 0.25, 1);
    const pitchTarget = input.pitch * 0.5 * authority;
    this.pitch += (pitchTarget - this.pitch) * Math.min(1, dt * 2.2);
    const rollTarget = input.roll * 0.95 * authority;
    this.roll += (rollTarget - this.roll) * Math.min(1, dt * 2.6);
    // A banked turn: roll right turns right.
    this.yaw -= this.roll * 0.5 * (this.speed / 50) * dt;

    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    let vy = this.speed * Math.sin(this.pitch);
    const groundNow = terrainHeight(this.pos.x, this.pos.z);
    if (this.speed < STALL_SPEED && this.pos.y > groundNow + 3) {
      vy -= (STALL_SPEED - this.speed) * 0.4; // sinking below stall speed
    }
    this.verticalSpeed = vy;
    this.pos.addScaledVector(forward, this.speed * Math.cos(this.pitch) * dt);
    this.pos.y += vy * dt;
    if (this.pos.y > MAX_ALTITUDE) this.pos.y = MAX_ALTITUDE;
    if (!this.airborne && this.speed > 30 && this.pos.y > terrainHeight(this.pos.x, this.pos.z) + 4) {
      this.airborne = true;
    }

    this.checkRings();
    this.checkGround();
  }

  checkRings() {
    const ring = this.nextRing();
    if (!ring) return;
    const centre = new THREE.Vector3(ring[0], ring[1], ring[2]);
    const d = this.pos.distanceTo(centre);
    if (d < RING_RADIUS) {
      this.ringsPassed++;
      this.score += 100;
      this.timeLeft = Math.min(ROUTE_TIME, this.timeLeft + 12);
      this.events.push({ type: 'ring', index: this.ringsPassed, score: this.score });
      return;
    }
    // Flown past the ring without going through it: the parcel is lost.
    const toRing = centre.clone().sub(this.pos);
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    if (toRing.dot(forward) < -60 && d > RING_RADIUS + 30) {
      this.ringsPassed++;
      this.parcels = Math.max(0, this.parcels - 1);
      this.events.push({ type: 'miss', index: this.ringsPassed, parcels: this.parcels });
    }
  }

  checkGround() {
    const ground = terrainHeight(this.pos.x, this.pos.z);
    if (this.pos.y > ground + 1.8) return;
    // Still rolling on the ground (never left it): taxi, don't crash.
    if (!this.airborne) {
      this.pos.y = ground + 1.8;
      this.verticalSpeed = 0;
      return;
    }
    const gentle =
      this.onRunway() &&
      Math.abs(this.verticalSpeed) < 6 &&
      this.speed < 52 &&
      Math.abs(this.pitch) < 0.28 &&
      Math.abs(this.roll) < 0.45;
    if (gentle) {
      this.state = 'landed';
      this.pos.y = ground + 1.8;
      this.score += this.parcels * 150 + Math.round(this.fuel) * 2 + Math.round(this.timeLeft) * 5;
      this.events.push({ type: 'landed', score: this.score });
    } else {
      this.state = 'crashed';
      this.pos.y = ground + 1.2;
      this.events.push({ type: 'crashed' });
    }
  }

  // Heading in degrees, 0 = north (+z on the map), clockwise.
  headingDegrees() {
    return ((THREE.MathUtils.radToDeg(this.yaw) % 360) + 360) % 360;
  }

  speedKmh() {
    return Math.round(this.speed * 3.6);
  }

  altitudeMetres() {
    return Math.max(0, Math.round(this.pos.y - terrainHeight(this.pos.x, this.pos.z)));
  }

  distanceToNextRing() {
    const ring = this.nextRing();
    if (!ring) return 0;
    return Math.round(this.pos.distanceTo(new THREE.Vector3(ring[0], ring[1], ring[2])));
  }
}
