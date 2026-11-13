/**
 * Áudio 100% sintetizado (decisão da May, 10/11 e 12/11): efeitos e música de fundo gerados
 * na hora com Web Audio, sem arquivos e sem licença para registrar. Nada toca antes do
 * primeiro clique (política de autoplay do Chrome).
 */

export type SfxName =
  | 'click'
  | 'lock'
  | 'error'
  | 'hint'
  | 'pull'
  | 'alarm'
  | 'jail'
  | 'vault'
  | 'victory'
  | 'defeat'
  | 'key'
  | 'static'
  | 'stamp'
  | 'whoosh'
  | 'robot'
  | 'interferencia'
  | 'disfarce'
  | 'planoB'
  | 'ancora'
  | 'escudo'
  | 'bussola';

export type MusicTheme = 'lobby' | 'planning' | 'red' | 'blue' | 'vault' | 'end';

type Graph = { ctx: AudioContext; master: GainNode; music: GainNode; sfx: GainNode };

let graph: Graph | null = null;
let levels = { music: 0.3, sfx: 0.7, muted: false };

function getGraph(): Graph | null {
  if (graph) return graph;
  const Ctor =
    typeof window !== 'undefined'
      ? (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
      : undefined;
  if (!Ctor) return null;
  const ctx = new Ctor();
  const master = ctx.createGain();
  const music = ctx.createGain();
  const sfx = ctx.createGain();
  // Compressor leve: nada estoura no fone das crianças.
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -12;
  comp.ratio.value = 6;
  music.connect(master);
  sfx.connect(master);
  master.connect(comp).connect(ctx.destination);
  graph = { ctx, master, music, sfx };
  applyLevels();
  return graph;
}

function applyLevels() {
  if (!graph) return;
  const t = graph.ctx.currentTime;
  graph.master.gain.setTargetAtTime(levels.muted ? 0 : 1, t, 0.03);
  graph.music.gain.setTargetAtTime(levels.music * 0.6, t, 0.05);
  graph.sfx.gain.setTargetAtTime(levels.sfx, t, 0.02);
}

/** Chamado no primeiro gesto do usuário (clique/tecla). */
export function unlockAudio() {
  const g = getGraph();
  if (g && g.ctx.state === 'suspended') void g.ctx.resume();
  if (pendingTheme !== undefined) startMusic(pendingTheme);
}

export function isAudioUnlocked(): boolean {
  return !!graph && graph.ctx.state === 'running';
}

export function setLevels(next: { music: number; sfx: number; muted: boolean }) {
  levels = next;
  applyLevels();
}

// ---------------------------------------------------------------- primitivas

function tone(
  g: Graph,
  out: AudioNode,
  freq: number,
  start: number,
  dur: number,
  opts: { type?: OscillatorType; gain?: number; slideTo?: number; attack?: number } = {},
) {
  const { type = 'sine', gain = 0.3, slideTo, attack = 0.005 } = opts;
  const osc = g.ctx.createOscillator();
  const env = g.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(env).connect(out);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

let noiseBuf: AudioBuffer | null = null;
function noise(
  g: Graph,
  out: AudioNode,
  start: number,
  dur: number,
  opts: { gain?: number; freq?: number; q?: number; type?: BiquadFilterType } = {},
) {
  const { gain = 0.2, freq = 3000, q = 1, type = 'bandpass' } = opts;
  if (!noiseBuf) {
    noiseBuf = g.ctx.createBuffer(1, g.ctx.sampleRate, g.ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = g.ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = g.ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const env = g.ctx.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(f).connect(env).connect(out);
  src.start(start, Math.random() * 0.5);
  src.stop(start + dur + 0.05);
}

const note = (semitonesFromA4: number) => 440 * 2 ** (semitonesFromA4 / 12);

// ---------------------------------------------------------------- efeitos

export function playSfx(name: SfxName) {
  const g = graph;
  if (!g || g.ctx.state !== 'running' || levels.muted || levels.sfx <= 0) return;
  const o = g.sfx;
  const t = g.ctx.currentTime + 0.01;
  switch (name) {
    case 'click':
      tone(g, o, 1800, t, 0.04, { type: 'square', gain: 0.06 });
      break;
    case 'key':
      noise(g, o, t, 0.025, { gain: 0.08, freq: 2500, q: 4 });
      break;
    case 'lock': // CLICK! do cadeado: dois estalos metálicos + brilho
      noise(g, o, t, 0.04, { gain: 0.35, freq: 4000, q: 6 });
      noise(g, o, t + 0.09, 0.05, { gain: 0.3, freq: 2500, q: 6 });
      [0, 4, 7, 12].forEach((s, i) =>
        tone(g, o, note(s + 3), t + 0.15 + i * 0.06, 0.3, { type: 'triangle', gain: 0.18 }),
      );
      break;
    case 'error': // ERROU!: buzina descendente gentil
      tone(g, o, 300, t, 0.18, { type: 'sawtooth', gain: 0.12, slideTo: 220 });
      tone(g, o, 220, t + 0.2, 0.25, { type: 'sawtooth', gain: 0.12, slideTo: 150 });
      break;
    case 'hint': // envelope lacrado abrindo
      noise(g, o, t, 0.18, { gain: 0.15, freq: 1200, q: 0.7 });
      tone(g, o, note(10), t + 0.12, 0.35, { type: 'sine', gain: 0.15 });
      break;
    case 'pull': // TCHÁ! corda puxada
      noise(g, o, t, 0.12, { gain: 0.3, freq: 800, q: 1, type: 'lowpass' });
      tone(g, o, 120, t, 0.2, { type: 'triangle', gain: 0.35, slideTo: 60 });
      break;
    case 'alarm': // UÓ-UÓ!
      for (let i = 0; i < 3; i++) {
        tone(g, o, 600, t + i * 0.6, 0.3, { type: 'square', gain: 0.1, slideTo: 900 });
        tone(g, o, 900, t + i * 0.6 + 0.3, 0.3, { type: 'square', gain: 0.1, slideTo: 600 });
      }
      break;
    case 'jail': // porta de cela batendo
      noise(g, o, t, 0.4, { gain: 0.45, freq: 200, q: 0.8, type: 'lowpass' });
      tone(g, o, 80, t, 0.5, { type: 'sine', gain: 0.4, slideTo: 40 });
      noise(g, o, t + 0.05, 0.3, { gain: 0.15, freq: 3200, q: 8 });
      break;
    case 'vault': // engrenagens + porta abrindo com brilho dourado
      for (let i = 0; i < 6; i++)
        noise(g, o, t + i * 0.09, 0.04, { gain: 0.25, freq: 1500 + i * 200, q: 5 });
      tone(g, o, 60, t + 0.5, 1.2, { type: 'sawtooth', gain: 0.12, slideTo: 90 });
      [0, 4, 7, 11, 14].forEach((s, i) =>
        tone(g, o, note(s + 3), t + 0.9 + i * 0.08, 1.2, { type: 'triangle', gain: 0.14 }),
      );
      break;
    case 'victory':
      [
        [0, 0],
        [4, 0.15],
        [7, 0.3],
        [12, 0.45],
        [7, 0.65],
        [12, 0.8],
      ].forEach(([s, d]) => tone(g, o, note(s! + 3), t + d!, 0.35, { type: 'square', gain: 0.1 }));
      tone(g, o, note(-9), t + 0.8, 1.2, { type: 'triangle', gain: 0.25 });
      break;
    case 'defeat': // "quase!" – descendente, sem humilhar
      [7, 5, 3, 0].forEach((s, i) =>
        tone(g, o, note(s), t + i * 0.22, 0.3, { type: 'triangle', gain: 0.16 }),
      );
      break;
    case 'static':
      noise(g, o, t, 0.8, { gain: 0.12, freq: 2000, q: 0.4 });
      break;
    case 'stamp':
      noise(g, o, t, 0.15, { gain: 0.5, freq: 300, q: 0.7, type: 'lowpass' });
      break;
    case 'whoosh':
      noise(g, o, t, 0.35, { gain: 0.15, freq: 900, q: 1.5 });
      break;
    case 'robot': // bip-bop do robô
      tone(g, o, 880, t, 0.08, { type: 'square', gain: 0.07 });
      tone(g, o, 660, t + 0.1, 0.08, { type: 'square', gain: 0.07 });
      tone(g, o, 990, t + 0.2, 0.12, { type: 'square', gain: 0.07 });
      break;
    case 'interferencia': // ZZZT!
      noise(g, o, t, 0.6, { gain: 0.25, freq: 3000, q: 0.5 });
      tone(g, o, 50, t, 0.6, { type: 'sawtooth', gain: 0.12 });
      break;
    case 'disfarce':
      noise(g, o, t, 0.4, { gain: 0.15, freq: 700, q: 2 });
      tone(g, o, 500, t + 0.05, 0.3, { type: 'sine', gain: 0.1, slideTo: 250 });
      break;
    case 'planoB':
      tone(g, o, note(3), t, 0.15, { type: 'triangle', gain: 0.15 });
      tone(g, o, note(10), t + 0.15, 0.3, { type: 'triangle', gain: 0.15 });
      break;
    case 'ancora': // CLANK pesado
      noise(g, o, t, 0.3, { gain: 0.35, freq: 250, q: 1, type: 'lowpass' });
      tone(g, o, 110, t, 0.6, { type: 'triangle', gain: 0.3, slideTo: 70 });
      break;
    case 'escudo':
      tone(g, o, 300, t, 0.5, { type: 'sine', gain: 0.2, slideTo: 600 });
      noise(g, o, t, 0.2, { gain: 0.1, freq: 5000, q: 2 });
      break;
    case 'bussola':
      [12, 16, 19, 24].forEach((s, i) =>
        tone(g, o, note(s), t + i * 0.07, 0.4, { type: 'sine', gain: 0.1 }),
      );
      break;
  }
}

// ---------------------------------------------------------------- música

type Pattern = {
  bpm: number;
  /** semitons a partir do Lá 2 (A2 = 110 Hz); null = pausa */
  bass: (number | null)[];
  /** chimbal (1 = toca) */
  hat: number[];
  /** sino/arpejo em semitons a partir do Lá 4; null = pausa */
  bell?: (number | null)[];
  /** tique-taque de relógio em vez de chimbal */
  clock?: boolean;
  bassType?: OscillatorType;
};

const THEMES: Record<MusicTheme, Pattern> = {
  // Museu vazio: grave longo, sinos raros.
  lobby: {
    bpm: 66,
    bass: [
      0,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      -4,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ],
    hat: [0],
    bell: [12, null, null, null, null, null, 7, null, null, null, 10, null, null, null, null, null],
    bassType: 'sine',
  },
  // Planejamento: tique-taque de relógio.
  planning: {
    bpm: 96,
    bass: [0, null, null, null, 0, null, null, null, -2, null, null, null, -4, null, null, null],
    hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    clock: true,
    bassType: 'triangle',
  },
  // Bando: tensão de assalto, ostinato menor.
  red: {
    bpm: 112,
    bass: [0, null, 0, 0, null, 0, 3, null, 0, null, 0, 0, null, -2, 1, null],
    hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1],
    bell: [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      15,
      null,
      13,
      null,
      12,
      null,
      null,
      null,
    ],
    bassType: 'sawtooth',
  },
  // Piratas: aventura no porto, balanço ternário.
  blue: {
    bpm: 104,
    bass: [0, null, null, 7, null, null, 5, null, null, 3, null, null],
    hat: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
    bell: [12, null, 14, 15, null, 14, 12, null, 10, 7, null, null],
    bassType: 'triangle',
  },
  // Cofre: suspense acelerado.
  vault: {
    bpm: 140,
    bass: [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, -1, -1, -1, -1],
    hat: [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1],
    clock: true,
    bassType: 'sawtooth',
  },
  // Fim: calmo, para a revelação.
  end: {
    bpm: 72,
    bass: [0, null, null, null, -4, null, null, null, -7, null, null, null, -5, null, null, null],
    hat: [0],
    bell: [12, null, 16, null, 19, null, 16, null, 12, null, 15, null, 19, null, 15, null],
    bassType: 'sine',
  },
};

let current: MusicTheme | null = null;
let pendingTheme: MusicTheme | null | undefined;
let timer: ReturnType<typeof setInterval> | null = null;
let step = 0;
let nextTime = 0;

/** Troca a música de fundo (null = silêncio). Antes do primeiro clique, só guarda o pedido. */
export function setMusic(theme: MusicTheme | null) {
  if (theme === current && timer) return;
  if (!isAudioUnlocked()) {
    pendingTheme = theme;
    return;
  }
  startMusic(theme);
}

function startMusic(theme: MusicTheme | null) {
  pendingTheme = undefined;
  if (timer) clearInterval(timer);
  timer = null;
  current = theme;
  const g = graph;
  if (!theme || !g) return;
  step = 0;
  nextTime = g.ctx.currentTime + 0.1;
  const p = THEMES[theme];
  const triplet = p.bass.length % 3 === 0 && p.bass.length % 4 !== 0;
  const stepDur = 60 / p.bpm / (triplet ? 3 : 4);
  // Agendador com folga (lookahead): o setInterval não precisa ser preciso.
  timer = setInterval(() => {
    while (nextTime < g.ctx.currentTime + 0.25) {
      if (levels.music > 0 && !levels.muted) scheduleStep(g, p, step, nextTime, stepDur);
      nextTime += stepDur;
      step++;
    }
  }, 80);
}

function scheduleStep(g: Graph, p: Pattern, i: number, t: number, stepDur: number) {
  const o = g.music;
  const b = p.bass[i % p.bass.length];
  if (b !== null && b !== undefined)
    tone(g, o, 110 * 2 ** (b / 12), t, stepDur * (p.bassType === 'sine' ? 6 : 1.6), {
      type: p.bassType ?? 'triangle',
      gain: p.bassType === 'sawtooth' ? 0.12 : 0.28,
      attack: p.bassType === 'sine' ? 0.2 : 0.01,
    });
  if (p.hat[i % p.hat.length]) {
    if (p.clock) tone(g, o, i % 2 ? 1200 : 1600, t, 0.03, { type: 'square', gain: 0.05 });
    else noise(g, o, t, 0.04, { gain: 0.06, freq: 8000, q: 1, type: 'highpass' });
  }
  const bell = p.bell?.[i % p.bell.length];
  if (bell !== null && bell !== undefined)
    tone(g, o, note(bell), t, stepDur * 4, { type: 'sine', gain: 0.07, attack: 0.01 });
}
