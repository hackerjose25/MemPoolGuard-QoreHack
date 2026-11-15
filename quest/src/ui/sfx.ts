// Tiny synthesized sound effects (no assets). Muted state persists per browser.
let ctx: AudioContext | null = null;
let muted = (() => {
  try {
    return localStorage.getItem("mg:muted") === "1";
  } catch {
    return false;
  }
})();

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem("mg:muted", m ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.06, slide = 0) {
  if (muted) return;
  try {
    ctx ??= new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, ctx.currentTime + dur);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch {
    /* audio unavailable */
  }
}

export const sfx = {
  approve: () => tone(660, 0.12, "triangle", 0.05, 1.5),
  reject: () => tone(520, 0.14, "square", 0.035, 0.6),
  wrong: () => tone(140, 0.35, "sawtooth", 0.06, 0.5),
  combo: () => {
    tone(880, 0.1, "triangle", 0.04);
    setTimeout(() => tone(1320, 0.14, "triangle", 0.04), 80);
  },
  level: () => [440, 554, 659, 880].forEach((f, i) => setTimeout(() => tone(f, 0.16, "triangle", 0.04), i * 90)),
  tick: () => tone(1200, 0.03, "square", 0.015),
};
