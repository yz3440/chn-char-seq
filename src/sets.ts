export type CharSet = {
  title: string;
  init: string;
  guests: string[];
  english: Record<string, string>;
};

export const SETS: CharSet[] = [
  {
    title: "EchoOoOOoooes",
    init: "口",
    guests: ["曰", "回", "吅", "㗊", "响", "昌", "唱"],
    english: {
      口: "mouth",
      曰: "speak",
      回: "return",
      吅: "shout",
      "㗊": "clamor",
      响: "sound",
      昌: "prosper",
      唱: "sing",
    },
  },
  {
    title: "See the forest for the trees",
    init: "人",
    guests: ["木", "从", "丛", "林", "森", "树"],
    english: {
      人: "person",
      木: "tree",
      从: "follow",
      丛: "thicket",
      林: "grove",
      森: "forest",
      树: "tree",
    },
  },
  {
    title: "Let there be light",
    init: "日",
    guests: ["月", "明", "朝", "昌", "晶", "暮"],
    english: {
      日: "sun",
      月: "moon",
      明: "bright",
      朝: "morning",
      昌: "sunlight",
      晶: "crystal",
      暮: "dusk",
    },
  },
  {
    title: "Reduplication",
    init: "又",
    guests: ["双", "叒", "叕", "叠", "缀"],
    english: {
      又: "again",
      双: "pair",
      叒: "thrice",
      叕: "connected",
      叠: "stack",
      缀: "stitch",
    },
  },
];

export function trackChars(set: CharSet): string[] {
  return [set.init, ...set.guests];
}
