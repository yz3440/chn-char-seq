import { SETS, trackChars } from "./sets";

export type Pattern = number[][];

export type State = {
  setIndex: number;
  steps: number;
  rows: number;
  bpm: number;
  pattern: Pattern;
  step: number;
  playing: boolean;
};

type Listener = (s: State) => void;
type StepListener = (stepIdx: number, s: State) => void;

const makePattern = (rows: number, steps: number): Pattern =>
  Array.from({ length: rows }, () => Array.from({ length: steps }, () => 0));

const resize = (prev: Pattern, rows: number, steps: number): Pattern => {
  const next = makePattern(rows, steps);
  for (let t = 0; t < Math.min(prev.length, rows); t++) {
    for (let s = 0; s < Math.min(prev[t]!.length, steps); s++) {
      next[t]![s] = prev[t]![s]!;
    }
  }
  return next;
};

export class Sequencer {
  state: State;
  private listeners = new Set<Listener>();
  private stepListeners = new Set<StepListener>();
  private timer: number | null = null;

  constructor() {
    const setIndex = 0;
    const steps = 16;
    const rows = trackChars(SETS[setIndex]!).length;
    this.state = {
      setIndex,
      steps,
      rows,
      bpm: 120,
      pattern: makePattern(rows, steps),
      step: 0,
      playing: false,
    };
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  onStep(fn: StepListener): () => void {
    this.stepListeners.add(fn);
    return () => this.stepListeners.delete(fn);
  }

  private emit() {
    for (const fn of this.listeners) fn(this.state);
  }

  private emitStep(idx: number) {
    for (const fn of this.stepListeners) fn(idx, this.state);
  }

  setSet(i: number) {
    if (i === this.state.setIndex) return;
    const rows = trackChars(SETS[i]!).length;
    this.state.setIndex = i;
    this.state.rows = rows;
    this.state.pattern = makePattern(rows, this.state.steps);
    this.state.step %= this.state.steps;
    this.emit();
  }

  setSteps(n: number) {
    if (n === this.state.steps) return;
    this.state.steps = n;
    this.state.pattern = resize(this.state.pattern, this.state.rows, n);
    this.state.step %= n;
    this.emit();
  }

  setBpm(b: number) {
    if (b === this.state.bpm) return;
    this.state.bpm = b;
    if (this.state.playing) this.restartClock();
    this.emit();
  }

  cycle(track: number, step: number) {
    const row = this.state.pattern[track];
    if (!row) return;
    const max = trackChars(SETS[this.state.setIndex]!).length;
    row[step] = ((row[step] ?? 0) + 1) % (max + 1);
    this.emit();
  }

  setLevel(track: number, step: number, level: number) {
    const row = this.state.pattern[track];
    if (!row) return;
    if (row[step] === level) return;
    row[step] = level;
    this.emit();
  }

  clear() {
    this.state.pattern = makePattern(this.state.rows, this.state.steps);
    this.emit();
  }

  play() {
    if (this.state.playing) return;
    this.state.playing = true;
    this.restartClock();
    this.emitStep(this.state.step);
    this.emit();
  }

  pause() {
    if (!this.state.playing) return;
    this.state.playing = false;
    this.stopClock();
    this.emit();
  }

  toggleTransport() {
    if (this.state.playing) this.pause();
    else this.play();
  }

  private tick = () => {
    this.state.step = (this.state.step + 1) % this.state.steps;
    this.emitStep(this.state.step);
    this.emit();
  };

  private restartClock() {
    this.stopClock();
    const interval = 60000 / this.state.bpm / 4;
    this.timer = window.setInterval(this.tick, interval);
  }

  private stopClock() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
