// The HUD: lit instrument readouts, throttle bar, artificial horizon,
// ring indicator, title and end screens. All DOM, updated from flight state.
export class Hud {
  constructor() {
    this.el = {};
    for (const id of [
      'alt', 'spd', 'hdg', 'vs', 'thr', 'score', 'parcels', 'fuel', 'timer',
      'ring', 'msg', 'title', 'end', 'end-title', 'end-body', 'hint', 'mute',
    ]) {
      this.el[id] = document.getElementById(id);
    }
    this.horizon = document.getElementById('horizon').getContext('2d');
    this.thrFill = document.getElementById('thr-fill');
    this.fuelFill = document.getElementById('fuel-fill');
  }

  showTitle() {
    this.el.title.classList.remove('hidden');
    this.el.end.classList.add('hidden');
  }

  hideTitle() {
    this.el.title.classList.add('hidden');
  }

  showEnd(title, body) {
    this.el['end-title'].textContent = title;
    this.el['end-body'].innerHTML = body;
    this.el.end.classList.remove('hidden');
  }

  hideEnd() {
    this.el.end.classList.add('hidden');
  }

  flash(message) {
    this.el.msg.textContent = message;
    this.el.msg.classList.remove('hidden');
    clearTimeout(this._msgTimer);
    this._msgTimer = setTimeout(() => this.el.msg.classList.add('hidden'), 2200);
  }

  setMuted(muted) {
    this.el.mute.textContent = muted ? 'SOUND OFF (M)' : 'SOUND ON (M)';
  }

  update(f) {
    this.el.alt.textContent = `${f.altitudeMetres()} m`;
    this.el.spd.textContent = `${f.speedKmh()} km/h`;
    this.el.hdg.textContent = `${String(Math.round(f.headingDegrees())).padStart(3, '0')}°`;
    const vs = Math.round(f.verticalSpeed * 3.6 * 0.277 * 10) / 10; // m/s, 1 decimal
    this.el.vs.textContent = `${vs >= 0 ? '+' : ''}${vs} m/s`;
    this.el.thr.textContent = `${Math.round(f.throttle * 100)}%`;
    this.thrFill.style.width = `${Math.round(f.throttle * 100)}%`;
    this.el.score.textContent = String(f.score);
    this.el.parcels.textContent = `${f.parcels} / 5`;
    this.el.fuel.textContent = `${Math.round(f.fuel)}%`;
    this.fuelFill.style.width = `${Math.round(f.fuel)}%`;
    this.fuelFill.classList.toggle('low', f.fuel < 25);
    const t = Math.max(0, Math.ceil(f.timeLeft));
    this.el.timer.textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    this.el.timer.classList.toggle('low', t < 45);
    const ring = f.nextRing();
    this.el.ring.textContent = ring
      ? `RING ${f.ringsPassed + 1}/8 · ${f.distanceToNextRing()} m`
      : 'ALL RINGS DONE — LAND ON THE RUNWAY';
    this.drawHorizon(f);
  }

  drawHorizon(f) {
    const ctx = this.horizon;
    const w = 132;
    const h = 132;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 62, 0, Math.PI * 2);
    ctx.clip();
    // Sky and ground, rolled with the plane and shifted with pitch.
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-f.roll);
    const pitchPx = THREE_CLAMP(f.pitch, -0.5, 0.5) * 110;
    ctx.fillStyle = '#79b8e8';
    ctx.fillRect(-w, -h + pitchPx, w * 2, h);
    ctx.fillStyle = '#7a5a34';
    ctx.fillRect(-w, pitchPx, w * 2, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-w, pitchPx - 1, w * 2, 2);
    ctx.restore();
    // Fixed wings marker.
    ctx.strokeStyle = '#ffe9a8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 34, h / 2);
    ctx.lineTo(w / 2 - 10, h / 2);
    ctx.moveTo(w / 2 + 10, h / 2);
    ctx.lineTo(w / 2 + 34, h / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 62, 0, Math.PI * 2);
    ctx.strokeStyle = '#e8f4ff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function THREE_CLAMP(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}
