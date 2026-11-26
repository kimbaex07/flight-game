# flight-game

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/kimbaex07/flight-game/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/kimbaex07/flight-game/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

Sky Courier is a 3D delivery flight game: fly a small cargo plane through eight golden rings over Millbrook Valley — river, town, hills and airstrip — then land on the runway before the clock runs out. Every ring is a parcel delivered; miss one and the parcel is lost. Fuel, a five-minute delivery window and a stall speed turn each sortie into decisions, and a gentle touchdown on the strip scores parcel, fuel and time bonuses.

Built with three.js (vendored minified build under `game/vendor/`), plain static files, no build step and no network requests at runtime. All sound is synthesised with WebAudio — engine hum, wind, ring chimes, landing fanfare.

## Controls

| Key | Action |
| --- | --- |
| W / S or ↑ / ↓ | Pitch down / up |
| A / D or ← / → | Roll and banked turn |
| Shift / Ctrl (or + / −) | Throttle up / down |
| Space | Airbrake |
| C | Chase / cockpit camera |
| Drag mouse | Look around the plane |
| R | Restart · M mute · Enter start |

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome.

To hand the entry in:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `game/index.html` — page, HUD and overlays
- `game/src/main.js` — bootstrap, game loop, camera, state machine
- `game/src/flight.js` — flight model, rings, landing, scoring
- `game/src/world.js` — terrain, river, airstrip, town, forest, clouds
- `game/src/noise.js` — seeded noise and the shared terrain-height function
- `game/src/plane.js` — the low-poly cargo plane
- `game/src/rings.js` — delivery rings and the next-ring beacon
- `game/src/audio.js` — WebAudio synth sounds
- `game/src/hud.js` — instruments, horizon, title and end screens
- `game/src/input.js` — keyboard and mouse
- `game/src/shots.js` — screenshot presets (`?shot=start|play|end`)

---

<sub>Entered on [make.fun](https://make.fun/?ref=4ey5v3b5&utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>
