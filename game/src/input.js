// Keyboard + mouse. W/S pitch, A/D roll, Shift/Ctrl throttle, Space brake,
// R restart, M mute, C camera, Enter start. Mouse drag orbits the chase camera.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.orbitX = 0; // mouse-drag camera orbit, decays back to zero
    this.orbitY = 0;
    this.dragging = false;
    this._lastX = 0;
    this._lastY = 0;
    this.onKey = null; // (code) => void, for one-shot actions
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (!e.repeat) {
        this.keys.add(e.code);
        if (this.onKey) this.onKey(e.code);
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    canvas.addEventListener('mousedown', (e) => {
      this.dragging = true;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
    });
    window.addEventListener('mousemove', (e) => {
      if (!this.dragging) return;
      this.orbitX += (e.clientX - this._lastX) * 0.004;
      this.orbitY += (e.clientY - this._lastY) * 0.003;
      this.orbitX = Math.max(-0.7, Math.min(0.7, this.orbitX));
      this.orbitY = Math.max(-0.35, Math.min(0.45, this.orbitY));
      this._lastX = e.clientX;
      this._lastY = e.clientY;
    });
    window.addEventListener('mouseup', () => {
      this.dragging = false;
    });
  }

  down(...codes) {
    return codes.some((c) => this.keys.has(c));
  }

  // Continuous control state for the flight model, -1..1.
  read() {
    const pitch = (this.down('KeyW', 'ArrowUp') ? 1 : 0) - (this.down('KeyS', 'ArrowDown') ? 1 : 0);
    const roll = (this.down('KeyD', 'ArrowRight') ? 1 : 0) - (this.down('KeyA', 'ArrowLeft') ? 1 : 0);
    return {
      pitch,
      roll,
      throttleUp: this.down('ShiftLeft', 'ShiftRight', 'Equal', 'NumpadAdd'),
      throttleDown: this.down('ControlLeft', 'ControlRight', 'Minus', 'NumpadSubtract'),
      brake: this.down('Space'),
    };
  }

  decayOrbit(dt) {
    if (!this.dragging) {
      this.orbitX -= this.orbitX * Math.min(1, dt * 1.2);
      this.orbitY -= this.orbitY * Math.min(1, dt * 1.2);
    }
  }
}
