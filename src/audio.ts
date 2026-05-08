import * as Tone from "tone";
import { DEFAULT_VOICE } from "./voices";

export type CharParams = {
  rate: number;     // playback rate (0.25 .. 4)
  detune: number;   // semitones (-24 .. +24); applied via rate
  cutoff: number;   // lowpass Hz (200 .. 18000)
  delay: number;    // feedback delay wet (0 .. 1)
  reverb: number;   // reverb wet (0 .. 1)
  gain: number;     // dB (-30 .. +6)
};

export const defaultParams = (): CharParams => ({
  rate: 1,
  detune: 0,
  cutoff: 18000,
  delay: 0,
  reverb: 0,
  gain: 0,
});

type Voice = {
  buffer: Tone.ToneAudioBuffer;
  filter: Tone.Filter;
  delay: Tone.FeedbackDelay;
  reverb: Tone.Reverb;
  gain: Tone.Gain;
  params: CharParams;
};

const SILENCE_THRESHOLD_DB = -50;
const PAD_HEAD_MS = 8;
const PAD_TAIL_MS = 30;

const audioUrl = (voice: string, char: string) =>
  `${import.meta.env.BASE_URL}audio/${voice}/${encodeURIComponent(char)}.mp3`;

function trimSilence(buf: Tone.ToneAudioBuffer): Tone.ToneAudioBuffer {
  const ab = buf.get();
  if (!ab) return buf;
  const data = ab.getChannelData(0);
  const sr = ab.sampleRate;
  const threshold = Tone.dbToGain(SILENCE_THRESHOLD_DB);
  let start = 0;
  let end = data.length - 1;
  while (start < end && Math.abs(data[start]!) < threshold) start++;
  while (end > start && Math.abs(data[end]!) < threshold) end--;
  if (end <= start) return buf;
  const padHead = Math.floor((PAD_HEAD_MS / 1000) * sr);
  const padTail = Math.floor((PAD_TAIL_MS / 1000) * sr);
  start = Math.max(0, start - padHead);
  end = Math.min(data.length - 1, end + padTail);
  return buf.slice(start / sr, end / sr);
}

async function loadTrimmedBuffer(url: string): Promise<Tone.ToneAudioBuffer> {
  const buf = new Tone.ToneAudioBuffer();
  await buf.load(url);
  return trimSilence(buf);
}

export class AudioEngine {
  private voices = new Map<string, Voice>();
  private started = false;
  private master: Tone.Gain;
  private currentVoice: string = DEFAULT_VOICE;

  constructor() {
    this.master = new Tone.Gain(1).toDestination();
  }

  async ensureStarted() {
    if (this.started) return;
    await Tone.start();
    this.started = true;
  }

  setMasterGain(linear: number) {
    this.master.gain.value = linear;
  }

  getVoice(): string {
    return this.currentVoice;
  }

  private async loadVoiceForChar(char: string): Promise<Voice> {
    const buffer = await loadTrimmedBuffer(audioUrl(this.currentVoice, char));
    const filter = new Tone.Filter(18000, "lowpass");
    const delay = new Tone.FeedbackDelay({ delayTime: "8n", feedback: 0.4, wet: 0 });
    const reverb = new Tone.Reverb({ decay: 2.4, wet: 0 });
    const gain = new Tone.Gain(1);
    filter.chain(delay, reverb, gain, this.master);
    return { buffer, filter, delay, reverb, gain, params: defaultParams() };
  }

  async ensureVoice(char: string): Promise<Voice> {
    let v = this.voices.get(char);
    if (v) return v;
    v = await this.loadVoiceForChar(char);
    this.voices.set(char, v);
    return v;
  }

  async preload(chars: string[]) {
    await Promise.all(chars.map((c) => this.ensureVoice(c)));
  }

  async setVoice(voice: string) {
    if (voice === this.currentVoice) return;
    this.currentVoice = voice;
    const chars = [...this.voices.keys()];
    await Promise.all(
      chars.map(async (char) => {
        const v = this.voices.get(char);
        if (!v) return;
        const buffer = await loadTrimmedBuffer(audioUrl(voice, char));
        v.buffer.dispose();
        v.buffer = buffer;
      }),
    );
  }

  getParams(char: string): CharParams | undefined {
    return this.voices.get(char)?.params;
  }

  setParam<K extends keyof CharParams>(char: string, key: K, value: CharParams[K]) {
    const v = this.voices.get(char);
    if (!v) return;
    v.params[key] = value;
    this.applyParams(v);
  }

  private applyParams(v: Voice) {
    const p = v.params;
    v.filter.frequency.value = p.cutoff;
    v.delay.wet.value = p.delay;
    v.reverb.wet.value = p.reverb;
    v.gain.gain.value = Tone.dbToGain(p.gain);
  }

  trigger(char: string) {
    const v = this.voices.get(char);
    if (!v || !v.buffer.loaded) return;
    this.applyParams(v);
    const source = new Tone.ToneBufferSource(v.buffer).connect(v.filter);
    source.playbackRate.value = v.params.rate * Math.pow(2, v.params.detune / 12);
    source.onended = () => source.dispose();
    source.start();
  }
}
