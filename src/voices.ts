export type VoiceDef = {
  shortName: string;
  label: string;
  locale: string;
};

export const VOICES: VoiceDef[] = [
  { shortName: "zh-CN-XiaoxiaoNeural", label: "晓晓 Xiaoxiao  · F warm",      locale: "zh-CN" },
  { shortName: "zh-CN-XiaoyiNeural",   label: "晓伊 Xiaoyi   · F lively",     locale: "zh-CN" },
  { shortName: "zh-CN-YunxiNeural",    label: "云希 Yunxi    · M lively",     locale: "zh-CN" },
  { shortName: "zh-CN-YunyangNeural",  label: "云扬 Yunyang  · M news",       locale: "zh-CN" },
  { shortName: "zh-CN-YunjianNeural",  label: "云健 Yunjian  · M sports",     locale: "zh-CN" },
  { shortName: "zh-CN-YunxiaNeural",   label: "云夏 Yunxia   · child",        locale: "zh-CN" },
  { shortName: "zh-CN-liaoning-XiaobeiNeural", label: "晓北 Xiaobei  · 东北话", locale: "zh-CN-liaoning" },
  { shortName: "zh-CN-shaanxi-XiaoniNeural",   label: "晓妮 Xiaoni   · 陕西话", locale: "zh-CN-shaanxi" },
  { shortName: "zh-HK-HiuMaanNeural",  label: "曉曼 HiuMaan  · 粵語 F",       locale: "zh-HK" },
  { shortName: "zh-HK-WanLungNeural",  label: "雲龍 WanLung  · 粵語 M",       locale: "zh-HK" },
  { shortName: "zh-TW-HsiaoChenNeural",label: "曉臻 HsiaoChen· 國語 F",       locale: "zh-TW" },
  { shortName: "zh-TW-YunJheNeural",   label: "雲哲 YunJhe   · 國語 M",       locale: "zh-TW" },
];

export const DEFAULT_VOICE = VOICES[0]!.shortName;
