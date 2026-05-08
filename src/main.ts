import { Pane } from "tweakpane";
import type { FolderApi } from "tweakpane";
import { Sequencer } from "./sequencer";
import { Grid, type ColorMode } from "./grid";
import { SETS, trackChars } from "./sets";
import { AudioEngine, type CharParams } from "./audio";
import { VOICES, DEFAULT_VOICE } from "./voices";

const root = document.getElementById("grid") as HTMLPreElement;
const seq = new Sequencer();
const grid = new Grid(root, seq);
const audio = new AudioEngine();

const PARAMS = {
  set: 0,
  bpm: 120,
  steps: 16,
  colorMode: "mono" as ColorMode,
  master: 0.8,
  voice: DEFAULT_VOICE,
};

grid.setColorMode(PARAMS.colorMode);

const pane = new Pane({ title: "chn-char-seq" });

const setOptions: Record<string, number> = {};
SETS.forEach((s, i) => {
  setOptions[`${s.init}  ${s.title}`] = i;
});

pane
  .addBinding(PARAMS, "set", { options: setOptions })
  .on("change", (e) => {
    seq.setSet(e.value);
    rebuildModFolder(e.value);
  });

pane
  .addBinding(PARAMS, "bpm", { min: 40, max: 240, step: 1 })
  .on("change", (e) => seq.setBpm(e.value));

pane
  .addBinding(PARAMS, "steps", { min: 8, max: 32, step: 1 })
  .on("change", (e) => seq.setSteps(e.value));

pane
  .addBinding(PARAMS, "colorMode", {
    label: "color",
    options: { mono: "mono", "per-track-hue": "per-track-hue" },
  })
  .on("change", (e) => grid.setColorMode(e.value as ColorMode));

pane.addButton({ title: "play / pause" }).on("click", async () => {
  await audio.ensureStarted();
  seq.toggleTransport();
});

pane.addButton({ title: "clear" }).on("click", () => seq.clear());

pane
  .addBinding(PARAMS, "master", { min: 0, max: 1.5, step: 0.01 })
  .on("change", (e) => audio.setMasterGain(e.value));
audio.setMasterGain(PARAMS.master);

const voiceOptions: Record<string, string> = {};
for (const v of VOICES) voiceOptions[v.label] = v.shortName;

pane
  .addBinding(PARAMS, "voice", { options: voiceOptions })
  .on("change", async (e) => {
    await audio.setVoice(e.value);
  });

// --- per-character modulation panel -----------------------------------------

const PARAM_KEYS = ["rate", "detune", "cutoff", "delay", "reverb", "gain"] as const;
const RANGES: Record<(typeof PARAM_KEYS)[number], { min: number; max: number; step?: number }> = {
  rate: { min: 0.25, max: 4, step: 0.01 },
  detune: { min: -24, max: 24, step: 1 },
  cutoff: { min: 200, max: 18000, step: 10 },
  delay: { min: 0, max: 1, step: 0.01 },
  reverb: { min: 0, max: 1, step: 0.01 },
  gain: { min: -30, max: 6, step: 0.5 },
};

let modFolder: FolderApi | null = null;

async function rebuildModFolder(setIndex: number) {
  if (modFolder) {
    pane.remove(modFolder);
    modFolder = null;
  }
  const chars = trackChars(SETS[setIndex]!);
  await audio.preload(chars);
  const folder = pane.addFolder({ title: "modulation", expanded: false });
  for (const char of chars) {
    const sub = folder.addFolder({ title: char, expanded: false });
    const params = audio.getParams(char);
    if (!params) continue;
    for (const key of PARAM_KEYS) {
      sub
        .addBinding(params, key, RANGES[key])
        .on("change", (e) =>
          audio.setParam(char, key, e.value as CharParams[typeof key]),
        );
    }
    sub.addButton({ title: "preview" }).on("click", async () => {
      await audio.ensureStarted();
      audio.trigger(char);
    });
  }
  modFolder = folder;
}

rebuildModFolder(PARAMS.set);

// --- transport step → fire column -------------------------------------------

seq.onStep((stepIdx, state) => {
  const chars = trackChars(SETS[state.setIndex]!);
  for (let t = 0; t < state.rows; t++) {
    const level = state.pattern[t]?.[stepIdx] ?? 0;
    if (level > 0) audio.trigger(chars[level - 1]!);
  }
});

// --- preview on cell click --------------------------------------------------

root.addEventListener(
  "click",
  async (e) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains("cell")) return;
    await audio.ensureStarted();
    // run on next microtask so Sequencer.cycle has applied the new level
    queueMicrotask(() => {
      const t = Number(target.dataset.track);
      const s = Number(target.dataset.step);
      const level = seq.state.pattern[t]?.[s] ?? 0;
      if (level <= 0) return;
      const chars = trackChars(SETS[seq.state.setIndex]!);
      audio.trigger(chars[level - 1]!);
    });
  },
  // capture so we run before Grid's bubble-phase handler? Not needed — Grid uses bubble too.
);

// --- spacebar transport -----------------------------------------------------

window.addEventListener("keydown", async (e) => {
  if (e.code === "Space" && e.target === document.body) {
    e.preventDefault();
    await audio.ensureStarted();
    seq.toggleTransport();
  }
});
