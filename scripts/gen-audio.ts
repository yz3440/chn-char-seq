import { mkdir, writeFile, access } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { SETS, trackChars } from "../src/sets";
import { VOICES } from "../src/voices";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../public/audio");

const exists = async (p: string) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

const drainToBuffer = (stream: NodeJS.ReadableStream): Promise<Buffer> =>
  new Promise((res, rej) => {
    const chunks: Buffer[] = [];
    stream.on("data", (c) => chunks.push(c as Buffer));
    stream.on("end", () => res(Buffer.concat(chunks)));
    stream.on("error", rej);
  });

const argVoices = process.argv.slice(2);
const targetVoices = argVoices.length
  ? VOICES.filter((v) => argVoices.includes(v.shortName))
  : VOICES;

if (!targetVoices.length) {
  console.error(`No voices matched. Available: ${VOICES.map((v) => v.shortName).join(", ")}`);
  process.exit(1);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const chars = new Set<string>();
  for (const set of SETS) for (const c of trackChars(set)) chars.add(c);

  console.log(`Targeting ${chars.size} chars × ${targetVoices.length} voice(s)`);

  for (const voice of targetVoices) {
    const voiceDir = join(OUT_DIR, voice.shortName);
    await mkdir(voiceDir, { recursive: true });
    console.log(`\n[${voice.shortName}] ${voice.label}`);

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice.shortName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    let made = 0;
    let skipped = 0;
    for (const char of chars) {
      const out = join(voiceDir, `${char}.mp3`);
      if (await exists(out)) {
        skipped++;
        continue;
      }
      try {
        const { audioStream } = tts.toStream(char);
        const buf = await drainToBuffer(audioStream);
        await writeFile(out, buf);
        made++;
        process.stdout.write(`  ✓ ${char}\n`);
      } catch (err) {
        console.error(`  ✗ ${char}: ${(err as Error).message}`);
      }
    }
    tts.close();
    console.log(`  ${made} new, ${skipped} skipped`);
  }
  console.log("\ndone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
