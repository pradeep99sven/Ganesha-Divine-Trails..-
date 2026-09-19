let ac: AudioContext | null = null;

export function initAudio() {
  try {
    if (!ac) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ac = new Ctor();
    }
    if (ac.state === "suspended") void ac.resume();
  } catch {
    ac = null;
  }
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.18,
  slideTo?: number,
  delay = 0,
) {
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur: number, vol = 0.12) {
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  const g = ac.createGain();
  g.gain.value = vol;
  src.buffer = buf;
  src.connect(g).connect(ac.destination);
  src.start();
}

export const sfx = {
  jump: () => tone(420, 0.16, "square", 0.1, 760),
  pickup: () => {
    tone(880, 0.09, "triangle", 0.14);
    tone(1320, 0.12, "triangle", 0.12, undefined, 0.07);
  },
  chime: () => {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.28, "sine", 0.13, undefined, i * 0.08));
  },
  win: () => {
    [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.45, "triangle", 0.16, undefined, i * 0.12));
    tone(130, 1.2, "sine", 0.1);
  },
  lose: () => {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 0.4, "sawtooth", 0.11, undefined, i * 0.14));
  },
  caught: () => {
    tone(220, 0.35, "sawtooth", 0.14, 90);
    noise(0.3, 0.1);
  },
  alert: () => tone(1200, 0.1, "square", 0.07),
  thud: () => {
    tone(90, 0.5, "sine", 0.2, 45);
    noise(0.4, 0.14);
  },
};
