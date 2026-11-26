// Screenshot presets, driven by ?shot=start|play|end (see shots.json).
// They put the game into a photogenic state so the cover images show the
// real game: title screen, mid-flight through a ring, landed score screen.
import { RING_POINTS } from './flight.js';

export function applyShot(game, shot) {
  if (!shot) return false;
  if (shot === 'start') {
    // Title screen: plane parked on the runway, camera low behind it.
    game.state = 'title';
    game.flight.reset();
    game.cameraMode = 'chase';
    game.camera.position.set(10, 5, -136);
    game.camera.lookAt(0, 10, -108);
    return true;
  }
  if (shot === 'play') {
    // Mid-flight: climbing toward ring 2, throttle open, HUD live.
    game.flight.reset();
    game.flight.start();
    game.flight.pos.set(60, 78, 430);
    game.flight.yaw = 0.59; // aimed straight at ring 2
    game.flight.pitch = 0.08;
    game.flight.roll = -0.18;
    game.flight.speed = 46;
    game.flight.throttle = 0.75;
    game.flight.ringsPassed = 1;
    game.flight.score = 100;
    game.flight.timeLeft = 262;
    game.state = 'playing';
    game.hud.hideTitle();
    return true;
  }
  if (shot === 'end') {
    // Landed: route finished on the runway, score screen up.
    game.flight.reset();
    game.flight.pos.set(0, 2.2, 60);
    game.flight.yaw = 0;
    game.flight.speed = 0;
    game.flight.throttle = 0;
    game.flight.ringsPassed = RING_POINTS.length;
    game.flight.parcels = 4;
    game.flight.fuel = 61;
    game.flight.timeLeft = 148;
    game.flight.score = 8 * 100 + 4 * 150 + 61 * 2 + 148 * 5;
    game.flight.state = 'landed';
    game.state = 'over';
    game.hud.hideTitle();
    game.hud.showEnd(
      'ROUTE COMPLETE — WELCOME HOME',
      `Rings flown: <b>8 / 8</b> · Parcels delivered: <b>4 / 5</b><br>` +
        `Fuel left: <b>61%</b> · Time left: <b>2:28</b><br>` +
        `<span class="big">SCORE ${game.flight.score}</span><br>` +
        `Press <b>R</b> to fly the route again.`,
    );
    game.camera.position.set(14, 5, 44);
    game.camera.lookAt(0, 10, 58);
    return true;
  }
  return false;
}
