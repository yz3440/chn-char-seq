# chn-char-seq

Chinese character sequencer — a step sequencer where each cell holds a hanzi from one of four reduplication ladders (口 / 人 / 日 / 又). Click cells to advance through the ladder; the playhead sweeps and triggers Edge TTS samples through a per-character Tone.js effect chain.

## Run

```sh
bun install
bun run dev
```

The TTS mp3s (~5MB) are checked into `public/audio/`, so no audio setup is needed. To regenerate them — different voices, tweaked silence trim, or a refreshed sample — run `bun run gen-audio`. It hits Microsoft Edge TTS and is idempotent (skips files that already exist).

## Controls

- **Left click** — advance cell to next character in the ladder
- **Right click** — clear cell
- **Space** — play / pause
- **Tweakpane** — set, voice, BPM, steps, master gain, per-character modulation

## Credits

Inspired by Janet Guo's [reduplication](https://github.com/janetguo/reduplication), which uses the same four character ladders as a click-driven walker / substitution piece.
