# LoopStep

A local-first web app for dance practice: loop any section of a video, slow it down, mirror it, and get a count-in. Nothing leaves your device.

## Features

- **Section loop** — set start/stop points from the current playhead or type them in, with ±0.1 s nudging
- **Playback speed** — 0.25x, 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
- **Mirror mode** — flip the video horizontally to follow along like a studio mirror
- **Count-in** — optional 3 or 5 second countdown before playback starts
- **Per-video memory** — loop range, speed, and mirror setting are remembered per file via `localStorage`
- **Private by design** — videos are played locally in the browser and never uploaded

## Usage

LoopStep is a static site with no build step and no dependencies.

1. Open `index.html` in a modern browser (or serve the folder with any static server, e.g. `npx serve .`).
2. Drop a video onto the page, or choose a file.
3. Set the loop start (`A`) and stop (`B`) points, pick a speed, and practice.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / pause |
| `A` | Set loop start to current position |
| `B` | Set loop stop to current position |
| `L` | Toggle loop |
| `M` | Toggle mirror |
| `←` / `→` | Seek 0.5 s |
| `Shift` + `←` / `→` | Seek 0.1 s |
| `↑` / `↓` | Change playback speed |

## Development

Core logic lives in `lib.js` and is covered by unit tests using Node's built-in test runner:

```sh
node --test lib.test.js
```

## License

[MIT](LICENSE)
