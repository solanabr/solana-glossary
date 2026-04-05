/**
 * @arquivo bgm.ts
 * @descricao Musica ambiente sintetizada por tema via Web Audio API — zero mp3
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */
import { getAudioContext, audioManager } from "./audio";

// ─── Tipos ─────────────────────────────────────────────────────────────────

type BgmTheme = "genesis" | "defi" | "lab";

interface NoteSeq {
  freq: number;
  dur: number;
  gap: number;
}

interface BgmPattern {
  sequence: NoteSeq[];
  wave: OscillatorType;
  volume: number;
  loopMs: number;
}

// ─── Padroes musicais por tema ─────────────────────────────────────────────

const PATTERNS: Record<BgmTheme, BgmPattern> = {
  // Genesis: C minor ambient — misterioso, espacial, grave
  genesis: {
    sequence: [
      { freq: 65.4, dur: 0.6, gap: 0.2 },
      { freq: 77.8, dur: 0.5, gap: 0.2 },
      { freq: 98.0, dur: 0.6, gap: 0.2 },
      { freq: 130.8, dur: 0.7, gap: 0.3 },
      { freq: 98.0, dur: 0.5, gap: 0.2 },
      { freq: 77.8, dur: 0.5, gap: 0.3 },
    ],
    wave: "square",
    volume: 0.03,
    loopMs: 5000,
  },
  // DeFi: A minor pentatonic — ritmico, metalico, medio
  defi: {
    sequence: [
      { freq: 110.0, dur: 0.25, gap: 0.15 },
      { freq: 130.8, dur: 0.2, gap: 0.1 },
      { freq: 146.8, dur: 0.25, gap: 0.15 },
      { freq: 164.8, dur: 0.2, gap: 0.1 },
      { freq: 196.0, dur: 0.35, gap: 0.2 },
      { freq: 164.8, dur: 0.2, gap: 0.1 },
      { freq: 146.8, dur: 0.25, gap: 0.15 },
      { freq: 130.8, dur: 0.2, gap: 0.3 },
    ],
    wave: "sawtooth",
    volume: 0.02,
    loopMs: 3500,
  },
  // Lab: E minor — rapido, eletronico, terminal
  lab: {
    sequence: [
      { freq: 164.8, dur: 0.12, gap: 0.08 },
      { freq: 196.0, dur: 0.12, gap: 0.08 },
      { freq: 246.9, dur: 0.12, gap: 0.08 },
      { freq: 329.6, dur: 0.15, gap: 0.1 },
      { freq: 293.7, dur: 0.12, gap: 0.08 },
      { freq: 246.9, dur: 0.12, gap: 0.08 },
      { freq: 196.0, dur: 0.12, gap: 0.08 },
      { freq: 164.8, dur: 0.15, gap: 0.25 },
    ],
    wave: "triangle",
    volume: 0.035,
    loopMs: 2200,
  },
};

// ─── Estado interno ────────────────────────────────────────────────────────

let masterGain: GainNode | null = null;
let loopId: ReturnType<typeof setInterval> | null = null;
let activeTheme: BgmTheme | null = null;

/** Agenda todas as notas de uma sequencia no AudioContext */
function playSequence(theme: BgmTheme): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const p = PATTERNS[theme];
  let t = ctx.currentTime + 0.05;
  for (const note of p.sequence) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = p.wave;
    osc.frequency.value = note.freq;
    gain.gain.setValueAtTime(p.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + note.dur);
    osc.connect(gain);
    if (masterGain) gain.connect(masterGain);
    else gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + note.dur + 0.01);
    t += note.dur + note.gap;
  }
}

// ─── API publica ───────────────────────────────────────────────────────────

/** Inicia BGM para o tema. Para anterior se houver. */
export function startBgm(theme: BgmTheme): void {
  stopBgm();
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    masterGain = ctx.createGain();
    masterGain.gain.value = audioManager.isMuted() ? 0 : 1;
    masterGain.connect(ctx.destination);
    activeTheme = theme;
    playSequence(theme);
    loopId = setInterval(() => {
      if (activeTheme) playSequence(activeTheme);
    }, PATTERNS[theme].loopMs);
  } catch {
    /* AudioContext indisponivel */
  }
}

/** Para a BGM atual com fade-out suave */
export function stopBgm(): void {
  if (loopId) {
    clearInterval(loopId);
    loopId = null;
  }
  if (masterGain) {
    try {
      const ctx = getAudioContext();
      if (ctx) {
        masterGain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + 0.3,
        );
      }
      setTimeout(() => {
        masterGain?.disconnect();
        masterGain = null;
      }, 400);
    } catch {
      masterGain = null;
    }
  }
  activeTheme = null;
}

/** Silencia ou restaura volume da BGM */
export function muteBgm(muted: boolean): void {
  if (!masterGain) return;
  try {
    const ctx = getAudioContext();
    if (ctx) masterGain.gain.setValueAtTime(muted ? 0 : 1, ctx.currentTime);
  } catch {
    /* noop */
  }
}
