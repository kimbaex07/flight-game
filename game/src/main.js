// SKY COURIER — a small cargo plane flying a delivery route over a valley.
// Bootstrap, game loop, camera, state machine. The flight model lives in
// flight.js, the world in world.js, the plane in plane.js, sound in audio.js.
import * as THREE from 'three';
import { buildWorld } from './world.js';
import { buildPlane } from './plane.js';
import { Flight } from './flight.js';
import { Rings } from './rings.js';
import { SoundBank } from './audio.js';
import { Hud } from './hud.js';
import { Input } from './input.js';
import { applyShot } from './shots.js';
import { terrainHeight } from './noise.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 4000);
    this.clock = new THREE.Clock();
    this.flight = new Flight();
    this.sound = new SoundBank();
    this.hud = new Hud();
    this.input = new Input(this.canvas);
    this.state = 'title'; // title | playing | over
    this.cameraMode = 'chase'; // chase | cockpit
    this.shotMode = false;

    const world = buildWorld(this.scene);
    this.clouds = world.clouds;
    const plane = buildPlane();
    this.plane = plane.group;
    this.prop = plane.prop;
    this.scene.add(this.plane);
    this.rings = new Rings(this.scene);

    this.input.onKey = (code) => this.onKey(code);
    document.getElementById('title').addEventListener('click', () => {
      if (this.state === 'title') this.startFlight();
    });
    document.getElementById('end').addEventListener('click', () => {
      if (this.state === 'over') this.restart();
    });
    window.addEventListener('resize', () => this.resize());
    this.resize();

    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot) {
      this.shotMode = applyShot(this, shot);
      if (this.shotMode) this.hud.setMuted(true);
    }
    if (!this.shotMode) this.hud.showTitle();
    this.hud.update(this.flight);
    this.hud.setMuted(this.sound.muted);
    // Test hook: headless checks read window.__game for live state.
    window.__game = {
      get state() {
        return game.state;
      },
      get flight() {
        return game.flight;
      },
    };
    this.renderer.setAnimationLoop(() => this.frame());
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  onKey(code) {
    this.sound.ensure();
    if (code === 'KeyM') {
      this.hud.setMuted(this.sound.toggleMute());
      return;
    }
    if (code === 'KeyC') {
      this.cameraMode = this.cameraMode === 'chase' ? 'cockpit' : 'chase';
      return;
    }
    if (code === 'KeyR' && (this.state === 'over' || this.state === 'playing')) {
      this.restart();
      return;
    }
    if (this.state === 'title' && (code === 'Enter' || code === 'Space')) {
      this.startFlight();
      return;
    }
    if (this.state === 'over' && code === 'Enter') {
      this.restart();
    }
  }

  startFlight() {
    this.sound.ensure();
    this.flight.reset();
    this.flight.start();
    this.state = 'playing';
    this.hud.hideTitle();
    this.hud.hideEnd();
    this.hud.flash('THROTTLE UP — FLY THROUGH THE GOLD RINGS');
  }

  restart() {
    this.flight.reset();
    this.flight.start();
    this.state = 'playing';
    this.hud.hideEnd();
    this.hud.hideTitle();
  }

  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.elapsedTime;
    if (this.state === 'playing') {
      const input = this.input.read();
      this.flight.update(dt, input);
      this.sound.setFlight(this.flight.throttle, this.flight.speedKmh(), true);
      for (const ev of this.flight.events.splice(0)) this.onFlightEvent(ev);
      if (this.flight.state === 'landed' || this.flight.state === 'crashed' || this.flight.state === 'timeout') {
        this.endFlight();
      }
    } else {
      this.sound.setFlight(0, 0, false);
    }
    // Clouds drift slowly across the valley.
    this.clouds.children.forEach((c, i) => {
      c.position.x += dt * (1.5 + (i % 3));
      if (c.position.x > 1200) c.position.x = -1200;
    });
    this.updatePlaneVisual(time, dt);
    this.rings.update(time, this.flight.ringsPassed);
    this.updateCamera(dt);
    this.hud.update(this.flight);
    this.renderer.render(this.scene, this.camera);
  }

  onFlightEvent(ev) {
    if (ev.type === 'ring') {
      this.sound.ring();
      this.hud.flash(`RING ${ev.index}/8 — +100 · PARCEL SECURED`);
    } else if (ev.type === 'miss') {
      this.sound.miss();
      this.hud.flash(`RING MISSED — PARCEL LOST (${ev.parcels} LEFT)`);
    } else if (ev.type === 'landed') {
      this.sound.landed();
    } else if (ev.type === 'crashed') {
      this.sound.crashed();
    }
  }

  endFlight() {
    this.state = 'over';
    const f = this.flight;
    if (f.state === 'landed') {
      this.hud.showEnd(
        'ROUTE COMPLETE — WELCOME HOME',
        `Rings flown: <b>${f.ringsPassed} / 8</b> · Parcels delivered: <b>${f.parcels} / 5</b><br>` +
          `Fuel left: <b>${Math.round(f.fuel)}%</b> · Time left: <b>${Math.floor(f.timeLeft / 60)}:${String(Math.floor(f.timeLeft % 60)).padStart(2, '0')}</b><br>` +
          `<span class="big">SCORE ${f.score}</span><br>` +
          `Press <b>R</b> to fly the route again.`,
      );
    } else if (f.state === 'timeout') {
      this.hud.showEnd(
        'OUT OF TIME',
        `The delivery window closed with <b>${f.ringsPassed} / 8</b> rings flown.<br>` +
          `<span class="big">SCORE ${f.score}</span><br>` +
          `Press <b>R</b> to try the route again.`,
      );
    } else {
      this.hud.showEnd(
        'CRASHED',
        `The Courier came down ${f.altitudeMetres() === 0 ? 'on the valley floor' : 'in the hills'} ` +
          `with <b>${f.ringsPassed} / 8</b> rings flown.<br>` +
          `<span class="big">SCORE ${f.score}</span><br>` +
          `Press <b>R</b> to fly again.`,
      );
    }
  }

  updatePlaneVisual(time, dt) {
    const f = this.flight;
    this.plane.position.copy(f.pos);
    this.plane.rotation.set(0, 0, 0);
    // Yaw, then pitch, then roll — applied in that order.
    this.plane.rotation.order = 'YXZ';
    this.plane.rotation.y = f.yaw;
    this.plane.rotation.x = -f.pitch;
    this.plane.rotation.z = -f.roll;
    // Propeller spins faster with throttle; idles slowly on the ground.
    const spin = 2 + f.throttle * 38 + f.speed * 0.25;
    this.prop.rotation.z += spin * dt;
    // Gentle bob while parked on the runway.
    if (this.state === 'title') {
      this.plane.position.y = f.pos.y + Math.sin(time * 1.2) * 0.05;
    }
  }

  updateCamera(dt) {
    const f = this.flight;
    this.input.decayOrbit(dt);
    if (this.cameraMode === 'cockpit') {
      // Sit in the cockpit: just behind the canopy, looking forward.
      const forward = new THREE.Vector3(Math.sin(f.yaw), 0, Math.cos(f.yaw));
      const eye = f.pos.clone().addScaledVector(forward, 1.2);
      eye.y += 1.1;
      this.camera.position.copy(eye);
      const look = f.pos.clone().addScaledVector(forward, 40);
      look.y += Math.tan(-f.pitch) * 30;
      this.camera.lookAt(look);
      this.camera.rotation.z = -f.roll * 0.6;
      this.plane.visible = false;
      return;
    }
    this.plane.visible = true;
    if (this.shotMode && this.state === 'over') return; // end shot keeps its fixed camera
    if (this.shotMode && this.state === 'title') return; // title shot keeps its fixed camera
    const forward = new THREE.Vector3(Math.sin(f.yaw), 0, Math.cos(f.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    const orbitYaw = this.input.orbitX;
    const orbitPitch = this.input.orbitY;
    const dist = 15 + f.speed * 0.06;
    const behind = forward.clone().multiplyScalar(-Math.cos(orbitYaw) * dist);
    const side = right.clone().multiplyScalar(Math.sin(orbitYaw) * dist);
    const target = f.pos.clone().add(behind).add(side);
    target.y = f.pos.y + 4.5 + orbitPitch * 14 + f.speed * 0.02;
    const ground = terrainHeight(target.x, target.z) + 2.5;
    if (target.y < ground) target.y = ground;
    this.camera.position.lerp(target, Math.min(1, dt * 5));
    const look = f.pos.clone().addScaledVector(forward, 24);
    look.y += 1.5 - f.pitch * 8;
    this.camera.lookAt(look);
  }
}

const game = new Game();
