import type { State } from "./sequencer";
import type { Sequencer } from "./sequencer";
import { SETS, trackChars } from "./sets";

type Cells = HTMLSpanElement[][];

export type ColorMode = "mono" | "per-track-hue";

export class Grid {
  private root: HTMLPreElement;
  private cells: Cells = [];
  private signature = "";
  private colorMode: ColorMode = "mono";

  constructor(root: HTMLPreElement, seq: Sequencer) {
    this.root = root;
    this.root.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains("cell")) return;
      const t = Number(target.dataset.track);
      const s = Number(target.dataset.step);
      if (Number.isFinite(t) && Number.isFinite(s)) seq.cycle(t, s);
    });
    this.root.addEventListener("contextmenu", (e) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains("cell")) return;
      e.preventDefault();
      const t = Number(target.dataset.track);
      const s = Number(target.dataset.step);
      if (Number.isFinite(t) && Number.isFinite(s)) seq.setLevel(t, s, 0);
    });
    seq.subscribe((s) => this.render(s));
  }

  setColorMode(mode: ColorMode) {
    this.colorMode = mode;
    this.root.dataset.colorMode = mode;
  }

  private rebuild(state: State) {
    this.root.replaceChildren();
    this.cells = [];
    this.root.dataset.colorMode = this.colorMode;
    for (let t = 0; t < state.rows; t++) {
      const row = document.createElement("span");
      row.className = "row";
      row.style.setProperty("--track-hue", String((t * 360) / state.rows));
      const cellsRow: HTMLSpanElement[] = [];
      for (let s = 0; s < state.steps; s++) {
        const cell = document.createElement("span");
        cell.className = "cell";
        cell.dataset.track = String(t);
        cell.dataset.step = String(s);
        row.appendChild(cell);
        cellsRow.push(cell);
      }
      this.root.appendChild(row);
      if (t < state.rows - 1) this.root.appendChild(document.createTextNode("\n"));
      this.cells.push(cellsRow);
    }
  }

  private render(state: State) {
    const sig = `${state.setIndex}:${state.steps}:${state.rows}`;
    if (sig !== this.signature) {
      this.rebuild(state);
      this.signature = sig;
    }
    const chars = trackChars(SETS[state.setIndex]!);
    const head = state.step;
    const showHead = state.playing;
    for (let t = 0; t < this.cells.length; t++) {
      const row = this.cells[t]!;
      const patternRow = state.pattern[t]!;
      for (let s = 0; s < row.length; s++) {
        const cell = row[s]!;
        const level = patternRow[s] ?? 0;
        const on = level > 0;
        const isHead = showHead && s === head;
        const text = on ? chars[level - 1]! : "";
        if (cell.textContent !== text) cell.textContent = text;
        const cls = cell.classList;
        cls.toggle("on", on);
        cls.toggle("head", isHead);
      }
    }
  }
}
